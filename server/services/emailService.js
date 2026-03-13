const nodemailer = require("nodemailer");

function canSendCustomEmail() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.MAIL_FROM
  );
}

function getTransporter() {
  if (!canSendCustomEmail()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendCustomConfirmationEmail(booking) {
  const transporter = getTransporter();

  if (!transporter) {
    return { sent: false };
  }

  const adminEmail = process.env.BOOKING_ADMIN_EMAIL;
  const adminName = process.env.BOOKING_ADMIN_NAME || "Siva Uruturi";

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: booking.email,
    cc: adminEmail,
    subject: `Confirmed: Portfolio call with ${adminName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
        <h2 style="margin-bottom:12px;">Your call is confirmed</h2>
        <p>Hi ${booking.name},</p>
        <p>Your call with ${adminName} has been scheduled successfully.</p>
        <p><strong>Date:</strong> ${booking.dateLabel}</p>
        <p><strong>Time:</strong> ${booking.timeLabel}</p>
        <p><strong>Time zone:</strong> ${booking.timeZone}</p>
        <p><strong>Google Meet:</strong> <a href="${booking.meetLink}">${booking.meetLink}</a></p>
        <p><strong>Purpose:</strong> ${booking.reason}</p>
        <p>A calendar invitation has also been sent to both attendees.</p>
      </div>
    `
  });

  return { sent: true };
}

module.exports = {
  canSendCustomEmail,
  sendCustomConfirmationEmail
};
