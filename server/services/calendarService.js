const crypto = require("crypto");
const { google } = require("googleapis");

function getAuthClient() {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN
  } = process.env;

  if (
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !GOOGLE_REDIRECT_URI ||
    !GOOGLE_REFRESH_TOKEN
  ) {
    throw new Error("Missing Google OAuth environment variables.");
  }

  const auth = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  auth.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN
  });

  return auth;
}

function getCalendar() {
  return google.calendar({
    version: "v3",
    auth: getAuthClient()
  });
}

async function getBusyWindows(timeMin, timeMax) {
  const calendar = getCalendar();
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: [
        {
          id: process.env.GOOGLE_CALENDAR_ID || "primary"
        }
      ]
    }
  });

  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  return response.data.calendars[calendarId]?.busy || [];
}

async function createCalendarBooking(details) {
  const calendar = getCalendar();
  const adminEmail = process.env.BOOKING_ADMIN_EMAIL;
  const adminName = process.env.BOOKING_ADMIN_NAME || "Siva Uruturi";
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  const response = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    sendUpdates: "all",
    requestBody: {
      summary: `Portfolio call with ${details.name}`,
      description: [
        `Reason for call: ${details.reason}`,
        `Booked via Siva Uruturi's portfolio chatbot.`,
        `Visitor email: ${details.email}`,
        `Visitor timezone: ${details.timeZone}`
      ].join("\n"),
      start: {
        dateTime: details.startUtc,
        timeZone: "UTC"
      },
      end: {
        dateTime: details.endUtc,
        timeZone: "UTC"
      },
      attendees: [
        {
          email: adminEmail,
          displayName: adminName
        },
        {
          email: details.email,
          displayName: details.name
        }
      ],
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: true,
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: {
            type: "hangoutsMeet"
          }
        }
      }
    }
  });

  const event = response.data;
  const meetEntry = event.conferenceData?.entryPoints?.find(function(entry) {
    return entry.entryPointType === "video";
  });

  return {
    eventId: event.id,
    htmlLink: event.htmlLink,
    meetLink: meetEntry?.uri || event.hangoutLink || ""
  };
}

module.exports = {
  createCalendarBooking,
  getBusyWindows
};
