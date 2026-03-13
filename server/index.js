require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { DateTime } = require("luxon");

const { saveBooking, hasStoredConflict } = require("./services/bookingStore");
const { createCalendarBooking, getBusyWindows } = require("./services/calendarService");
const { sendCustomConfirmationEmail } = require("./services/emailService");
const { fetchResumeData } = require("./services/resumeService");
const {
  assertTimeZone,
  findAvailableSlots,
  getBookingConfig,
  isValidEmail
} = require("./services/slotService");

const app = express();
const port = Number(process.env.PORT || 3001);
const config = getBookingConfig();
const allowedOrigin = process.env.FRONTEND_ORIGIN || "";

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === "null" || !allowedOrigin || origin === allowedOrigin) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    }
  })
);
app.use(express.json({ limit: "200kb" }));

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Too many booking attempts from this device. Please wait a few minutes and try again."
  }
});

app.use("/api/booking", bookingLimiter);

function parseIsoDateTime(value) {
  const parsed = DateTime.fromISO(String(value || ""), { zone: "utc" });
  return parsed.isValid ? parsed : null;
}

function formatBookingForResponse(booking, timeZone) {
  const start = DateTime.fromISO(booking.startUtc, { zone: "utc" }).setZone(timeZone);
  const end = DateTime.fromISO(booking.endUtc, { zone: "utc" }).setZone(timeZone);

  return {
    bookingId: booking.id,
    eventId: booking.eventId,
    meetLink: booking.meetLink,
    calendarLink: booking.calendarLink,
    name: booking.name,
    email: booking.email,
    reason: booking.reason,
    timeZone,
    dateLabel: start.toFormat("cccc, LLLL d, yyyy"),
    timeLabel: `${start.toFormat("h:mm a")} - ${end.toFormat("h:mm a")}`
  };
}

function validateBookingPayload(body) {
  const errors = [];

  if (!String(body.name || "").trim()) {
    errors.push("Name is required.");
  }

  if (!isValidEmail(body.email)) {
    errors.push("A valid email address is required.");
  }

  if (!String(body.reason || "").trim()) {
    errors.push("Reason for the call is required.");
  }

  if (!assertTimeZone(body.timeZone || config.timeZone)) {
    errors.push("A valid time zone is required.");
  }

  const start = parseIsoDateTime(body.startUtc);
  const end = parseIsoDateTime(body.endUtc);

  if (!start || !end || end <= start) {
    errors.push("A valid booking slot is required.");
  }

  if (start && start <= DateTime.utc()) {
    errors.push("Past time slots cannot be booked.");
  }

  return {
    errors,
    start,
    end
  };
}

app.get("/api/health", function(req, res) {
  res.json({
    ok: true,
    service: "portfolio-booking-api"
  });
});

app.get("/api/resume-data", async function(req, res) {
  try {
    const resumeData = await fetchResumeData(req.query.refresh === "true");
    res.json({
      ok: true,
      resumeData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Unable to load the latest resume data right now."
    });
  }
});

app.get("/api/booking/config", function(req, res) {
  res.json({
    defaultTimeZone: config.timeZone,
    durationMinutes: config.durationMinutes,
    bufferMinutes: config.bufferMinutes,
    workdayStartHour: config.workdayStartHour,
    workdayEndHour: config.workdayEndHour
  });
});

app.post("/api/booking/slots", async function(req, res) {
  try {
    const slotResponse = await findAvailableSlots(req.body || {});
    res.json(slotResponse);
  } catch (error) {
    res.status(400).json({
      error: error.message || "Unable to load available slots."
    });
  }
});

app.post("/api/booking/create", async function(req, res) {
  try {
    const { errors, start, end } = validateBookingPayload(req.body || {});

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(" ") });
    }

    const busyWindows = await getBusyWindows(
      start.minus({ minutes: config.bufferMinutes }).toISO(),
      end.plus({ minutes: config.bufferMinutes }).toISO()
    );
    const conflictingBusyWindow = busyWindows.some(function(windowItem) {
      const busyStart = DateTime.fromISO(windowItem.start, { zone: "utc" });
      const busyEnd = DateTime.fromISO(windowItem.end, { zone: "utc" });

      return (
        start.minus({ minutes: config.bufferMinutes }) < busyEnd &&
        end.plus({ minutes: config.bufferMinutes }) > busyStart
      );
    });

    if (
      conflictingBusyWindow ||
      (await hasStoredConflict(start.toISO(), end.toISO(), config.bufferMinutes))
    ) {
      const slotResponse = await findAvailableSlots({
        preferredDate: start.setZone(req.body.timeZone || config.timeZone).toFormat("yyyy-MM-dd"),
        preferredTime: start.setZone(req.body.timeZone || config.timeZone).toFormat("h:mm a"),
        timeZone: req.body.timeZone || config.timeZone
      });

      return res.status(409).json({
        error: "That time was just taken. Here are some nearby alternatives.",
        alternatives: slotResponse.slots.length > 0 ? slotResponse.slots : slotResponse.alternatives
      });
    }

    const calendarBooking = await createCalendarBooking({
      name: String(req.body.name).trim(),
      email: String(req.body.email).trim(),
      reason: String(req.body.reason).trim(),
      timeZone: String(req.body.timeZone || config.timeZone).trim(),
      startUtc: start.toISO(),
      endUtc: end.toISO()
    });

    const savedBooking = await saveBooking({
      name: String(req.body.name).trim(),
      email: String(req.body.email).trim(),
      reason: String(req.body.reason).trim(),
      timeZone: String(req.body.timeZone || config.timeZone).trim(),
      startUtc: start.toISO(),
      endUtc: end.toISO(),
      eventId: calendarBooking.eventId,
      calendarLink: calendarBooking.htmlLink,
      meetLink: calendarBooking.meetLink
    });

    const responsePayload = formatBookingForResponse(
      {
        ...savedBooking,
        meetLink: calendarBooking.meetLink,
        calendarLink: calendarBooking.htmlLink
      },
      savedBooking.timeZone
    );

    await sendCustomConfirmationEmail({
      ...responsePayload,
      reason: savedBooking.reason
    }).catch(function(error) {
      console.error("Custom email failed:", error.message);
    });

    return res.status(201).json({
      success: true,
      booking: responsePayload,
      emailInvitesSent: true
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error:
        "I couldn't finish the booking just now. Please try again in a moment."
    });
  }
});

app.listen(port, function() {
  console.log(`Portfolio booking API running on http://localhost:${port}`);
});
