const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const storagePath = path.resolve(
  process.cwd(),
  process.env.BOOKING_STORAGE_PATH || "./server/data/bookings.json"
);

async function ensureStore() {
  const dir = path.dirname(storagePath);
  await fs.mkdir(dir, { recursive: true });

  try {
    await fs.access(storagePath);
  } catch (error) {
    await fs.writeFile(storagePath, "[]", "utf8");
  }
}

async function readBookings() {
  await ensureStore();
  const raw = await fs.readFile(storagePath, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function writeBookings(bookings) {
  await ensureStore();
  await fs.writeFile(storagePath, JSON.stringify(bookings, null, 2), "utf8");
}

function overlaps(startIso, endIso, booking, bufferMinutes) {
  if (!booking || booking.status === "cancelled") {
    return false;
  }

  const bufferMs = Number(bufferMinutes || 0) * 60 * 1000;
  const bookingStart = new Date(booking.startUtc).getTime() - bufferMs;
  const bookingEnd = new Date(booking.endUtc).getTime() + bufferMs;
  const candidateStart = new Date(startIso).getTime() - bufferMs;
  const candidateEnd = new Date(endIso).getTime() + bufferMs;

  return candidateStart < bookingEnd && candidateEnd > bookingStart;
}

async function hasStoredConflict(startIso, endIso, bufferMinutes) {
  const bookings = await readBookings();
  return bookings.some((booking) => overlaps(startIso, endIso, booking, bufferMinutes));
}

async function saveBooking(booking) {
  const bookings = await readBookings();
  const saved = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "confirmed",
    ...booking
  };

  bookings.push(saved);
  await writeBookings(bookings);
  return saved;
}

module.exports = {
  hasStoredConflict,
  readBookings,
  saveBooking
};
