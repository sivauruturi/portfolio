# Portfolio Chatbot Booking Setup

This project keeps your existing HTML/CSS/JS portfolio and adds only the scheduling backend plus chatbot booking flow.

## 1. Project structure

- `package.json`
- `.env.example`
- `server/index.js`
- `server/services/calendarService.js`
- `server/services/slotService.js`
- `server/services/bookingStore.js`
- `server/services/emailService.js`
- `server/data/bookings.json`

## 2. Existing frontend files updated

- `index.html`
- `assets/js/functions.js`
- `assets/css/theme.css`

## 3. What the backend does

1. Validates booking details.
2. Checks business hours and prevents past bookings.
3. Queries Google Calendar busy times.
4. Prevents double-booking with both Google Calendar and local JSON storage.
5. Creates a brand-new Google Calendar event with a new Google Meet link.
6. Sends Google attendee invitations to both the visitor and the admin via `sendUpdates: "all"`.
7. Optionally sends a custom confirmation email if SMTP credentials are configured.

## 4. Google API setup

1. Create a Google Cloud project.
2. Enable the Google Calendar API.
3. Create OAuth client credentials.
4. Generate a refresh token for the Google account that owns the calendar.
5. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `GOOGLE_REFRESH_TOKEN` in `.env`.
6. Keep `GOOGLE_CALENDAR_ID=primary` unless you want to use a separate calendar.
7. If you want custom emails in addition to Google Calendar invites, add SMTP credentials too.

## 5. Environment variables

Copy `.env.example` to `.env` and update at least:

- `BOOKING_ADMIN_EMAIL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_REFRESH_TOKEN`
- `FRONTEND_ORIGIN`
- `OLLAMA_MODEL`

Optional email settings:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`

## 6. How to run locally

1. Run `npm install`
2. Copy `.env.example` to `.env`
3. Fill in the Google, Ollama, and admin values
4. Make sure Ollama is already running locally and that the configured model is pulled
5. Start the full local site and API together with `npm run dev`
6. Open `http://localhost:3001` in the browser
7. The assistant will use same-origin API routes:
   - `/api/health`
   - `/api/resume-data`
   - `/api/recruiter-chat`
   - `/api/booking/*`

## 7. Exact integration points

### `index.html`

- Updated the existing `#portfolio-assistant-root` element to include same-origin API attributes for booking, resume, and recruiter chat
- Added scheduling quick-reply buttons
- Updated the chatbot input placeholder to mention scheduling

### `assets/js/functions.js`

- Replaced the existing portfolio assistant logic block with:
  - booking intent detection
  - one-question-at-a-time booking flow
  - slot lookup calls to the Express API
  - confirmation buttons inside the current chat UI
  - booking success and error states

### `assets/css/theme.css`

- Added styles for:
  - inline booking action buttons
  - booking summary cards
  - success and error status badges

## Important note

Set `BOOKING_ADMIN_EMAIL` in `.env` before creating bookings. The placeholder value `[PUT_MY_EMAIL_HERE]` must be replaced with your real email address.
