const { DateTime, Interval } = require("luxon");
const { getBusyWindows } = require("./calendarService");
const { hasStoredConflict } = require("./bookingStore");

const DEFAULT_SLOT_LIMIT = Number(process.env.SLOT_SUGGESTION_LIMIT || 6);

function getBookingConfig() {
  return {
    timeZone: process.env.DEFAULT_TIME_ZONE || "America/Chicago",
    durationMinutes: Number(process.env.MEETING_DURATION_MINUTES || 30),
    bufferMinutes: Number(process.env.BUFFER_MINUTES || 15),
    workdayStartHour: Number(process.env.WORKDAY_START_HOUR || 9),
    workdayEndHour: Number(process.env.WORKDAY_END_HOUR || 18),
    slotSuggestionLimit: DEFAULT_SLOT_LIMIT
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function parsePreferredDate(dateValue, timeZone) {
  const parsed = DateTime.fromISO(String(dateValue || ""), { zone: timeZone });
  return parsed.isValid ? parsed.startOf("day") : null;
}

function parsePreferredTime(timeValue, dateValue, timeZone) {
  const raw = String(timeValue || "").trim().toLowerCase();
  const candidateFormats = ["H:mm", "HH:mm", "h:mm a", "h a"];

  for (const format of candidateFormats) {
    const parsed = DateTime.fromFormat(
      `${dateValue} ${raw.toUpperCase()}`,
      `yyyy-MM-dd ${format}`,
      { zone: timeZone }
    );

    if (parsed.isValid) {
      return parsed;
    }
  }

  return null;
}

function assertTimeZone(timeZone) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch (error) {
    return false;
  }
}

function intersectsBusyWindow(slotStartUtc, slotEndUtc, busyWindows, bufferMinutes) {
  const slotInterval = Interval.fromDateTimes(
    DateTime.fromISO(slotStartUtc).minus({ minutes: bufferMinutes || 0 }),
    DateTime.fromISO(slotEndUtc).plus({ minutes: bufferMinutes || 0 })
  );

  return busyWindows.some((windowItem) => {
    const busyInterval = Interval.fromDateTimes(
      DateTime.fromISO(windowItem.start),
      DateTime.fromISO(windowItem.end)
    );

    return slotInterval.overlaps(busyInterval);
  });
}

function slotToPayload(slotStartAdmin, visitorTimeZone, config) {
  const slotEndAdmin = slotStartAdmin.plus({ minutes: config.durationMinutes });
  const localStart = slotStartAdmin.setZone(visitorTimeZone);
  const localEnd = slotEndAdmin.setZone(visitorTimeZone);

  return {
    slotId: slotStartAdmin.toUTC().toISO(),
    startUtc: slotStartAdmin.toUTC().toISO(),
    endUtc: slotEndAdmin.toUTC().toISO(),
    label: localStart.toFormat("ccc, LLL d · h:mm a"),
    dateLabel: localStart.toFormat("cccc, LLLL d, yyyy"),
    timeLabel: `${localStart.toFormat("h:mm a")} - ${localEnd.toFormat("h:mm a")}`,
    visitorTimeZone
  };
}

async function generateCandidateSlots(preferredDate, visitorTimeZone) {
  const config = getBookingConfig();
  const adminZone = config.timeZone;
  const visitorStart = parsePreferredDate(preferredDate, visitorTimeZone);

  if (!visitorStart) {
    throw new Error("Please provide a valid preferred date in YYYY-MM-DD format.");
  }

  const visitorEnd = visitorStart.endOf("day");
  const adminRangeStart = visitorStart.setZone(adminZone).startOf("day");
  const adminRangeEnd = visitorEnd.setZone(adminZone).endOf("day");
  const candidateSlots = [];
  let cursor = adminRangeStart;

  while (cursor <= adminRangeEnd) {
    if (cursor.weekday <= 5) {
      const workdayStart = cursor.set({
        hour: config.workdayStartHour,
        minute: 0,
        second: 0,
        millisecond: 0
      });
      const workdayEnd = cursor.set({
        hour: config.workdayEndHour,
        minute: 0,
        second: 0,
        millisecond: 0
      });

      for (
        let slotStart = workdayStart;
        slotStart.plus({ minutes: config.durationMinutes }) <= workdayEnd;
        slotStart = slotStart.plus({
          minutes: config.durationMinutes + config.bufferMinutes
        })
      ) {
        const slotAsVisitor = slotStart.setZone(visitorTimeZone);

        if (slotAsVisitor.hasSame(visitorStart, "day")) {
          candidateSlots.push(slotStart);
        }
      }
    }

    cursor = cursor.plus({ days: 1 }).startOf("day");
  }

  return candidateSlots;
}

async function findAvailableSlots(options) {
  const config = getBookingConfig();
  const preferredDate = String(options.preferredDate || "").trim();
  const preferredTime = String(options.preferredTime || "").trim();
  const visitorTimeZone = String(options.timeZone || config.timeZone).trim();
  const limit = Number(options.limit || config.slotSuggestionLimit || DEFAULT_SLOT_LIMIT);

  if (!assertTimeZone(visitorTimeZone)) {
    throw new Error("Please provide a valid IANA time zone like America/Chicago.");
  }

  const preferredDateTime = parsePreferredTime(
    preferredTime,
    preferredDate,
    visitorTimeZone
  );

  if (!preferredDateTime || !preferredDateTime.isValid) {
    throw new Error("Please provide a valid preferred time like 2:30 PM.");
  }

  if (preferredDateTime <= DateTime.now().setZone(visitorTimeZone)) {
    throw new Error("Please choose a future date and time.");
  }

  const candidateSlots = await generateCandidateSlots(preferredDate, visitorTimeZone);
  const calendarRangeStart = DateTime.fromISO(candidateSlots[0]?.toUTC().toISO() || preferredDateTime.toUTC().toISO())
    .minus({ hours: 1 })
    .toISO();
  const calendarRangeEnd = DateTime.fromISO(
    candidateSlots[candidateSlots.length - 1]?.toUTC().toISO() || preferredDateTime.toUTC().toISO()
  )
    .plus({ hours: 2 })
    .toISO();
  const busyWindows = await getBusyWindows(calendarRangeStart, calendarRangeEnd);
  const availableSlots = [];

  for (const slotStartAdmin of candidateSlots) {
    const startUtc = slotStartAdmin.toUTC().toISO();
    const endUtc = slotStartAdmin
      .plus({ minutes: config.durationMinutes })
      .toUTC()
      .toISO();

    if (DateTime.fromISO(startUtc) <= DateTime.utc()) {
      continue;
    }

    if (intersectsBusyWindow(startUtc, endUtc, busyWindows, config.bufferMinutes)) {
      continue;
    }

    if (await hasStoredConflict(startUtc, endUtc, config.bufferMinutes)) {
      continue;
    }

    availableSlots.push(slotToPayload(slotStartAdmin, visitorTimeZone, config));
  }

  const sorted = availableSlots.sort((a, b) => {
    const distanceA = Math.abs(
      DateTime.fromISO(a.startUtc).setZone(visitorTimeZone).toMillis() - preferredDateTime.toMillis()
    );
    const distanceB = Math.abs(
      DateTime.fromISO(b.startUtc).setZone(visitorTimeZone).toMillis() - preferredDateTime.toMillis()
    );

    return distanceA - distanceB;
  });

  if (sorted.length > 0) {
    return {
      requestedDate: preferredDate,
      requestedTime: preferredTime,
      timeZone: visitorTimeZone,
      slots: sorted.slice(0, limit),
      alternatives: []
    };
  }

  const alternatives = [];
  let searchDay = DateTime.fromISO(preferredDate, { zone: visitorTimeZone }).plus({ days: 1 });
  let searchedDays = 0;

  while (alternatives.length < limit && searchedDays < 14) {
    const nextSlots = await generateCandidateSlots(
      searchDay.toFormat("yyyy-MM-dd"),
      visitorTimeZone
    );

    if (nextSlots.length === 0) {
      searchDay = searchDay.plus({ days: 1 });
      continue;
    }

    const rangeStart = nextSlots[0].minus({ hours: 1 }).toUTC().toISO();
    const rangeEnd = nextSlots[nextSlots.length - 1].plus({ hours: 2 }).toUTC().toISO();
    const busyWindows = await getBusyWindows(rangeStart, rangeEnd);

    for (const slotStartAdmin of nextSlots) {
      const startUtc = slotStartAdmin.toUTC().toISO();
      const endUtc = slotStartAdmin
        .plus({ minutes: config.durationMinutes })
        .toUTC()
        .toISO();

      if (intersectsBusyWindow(startUtc, endUtc, busyWindows, config.bufferMinutes)) {
        continue;
      }

      if (await hasStoredConflict(startUtc, endUtc, config.bufferMinutes)) {
        continue;
      }

      alternatives.push(slotToPayload(slotStartAdmin, visitorTimeZone, config));

      if (alternatives.length >= limit) {
        break;
      }
    }

    searchDay = searchDay.plus({ days: 1 });
    searchedDays += 1;
  }

  return {
    requestedDate: preferredDate,
    requestedTime: preferredTime,
    timeZone: visitorTimeZone,
    slots: [],
    alternatives: alternatives.slice(0, limit)
  };
}

module.exports = {
  assertTimeZone,
  findAvailableSlots,
  getBookingConfig,
  isValidEmail,
  parsePreferredDate,
  parsePreferredTime
};
