// TODO: заменить на реальные запросы когда бэкенд реализует:
//   GET  /bookings/rooms
//   GET  /bookings
//   POST /bookings
//   DELETE /bookings/:id
//
// import { apiRequest } from "../../shared/baseApi";
// export function fetchRooms()             { return apiRequest("/bookings/rooms"); }
// export function fetchBookings({ roomId, date } = {}) {
//   return apiRequest("/bookings", { query: { room_id: roomId, date } });
// }
// export function createBooking(data)      { return apiRequest("/bookings", { method: "POST", body: data }); }
// export function cancelBooking(id)        { return apiRequest(`/bookings/${id}`, { method: "DELETE" }); }

// ─── In-memory mock ───────────────────────────────────────────────────────────

const MOCK_ROOMS = [
  { id: "101", name: "Аудитория 101", capacity: 30 },
  { id: "102", name: "Аудитория 102", capacity: 25 },
  { id: "103", name: "Аудитория 103", capacity: 40 },
  { id: "201", name: "Аудитория 201", capacity: 35 },
  { id: "202", name: "Аудитория 202", capacity: 20 },
  { id: "203", name: "Аудитория 203", capacity: 50 },
  { id: "301", name: "Аудитория 301", capacity: 30 },
  { id: "302", name: "Аудитория 302", capacity: 30 },
  { id: "lab401", name: "Лаборатория 401", capacity: 15 },
  { id: "lab402", name: "Лаборатория 402", capacity: 15 },
  { id: "conf1", name: "Конференц-зал", capacity: 100 },
];

let _bookings = [];
let _nextId = 1;

/**
 * GET /bookings/rooms — mock
 * Response: { data: Room[] }
 */
export function fetchRooms() {
  return Promise.resolve({ data: MOCK_ROOMS });
}

/**
 * GET /bookings — mock
 * Response: { data: Booking[] }
 */
export function fetchBookings({ roomId, date } = {}) {
  const result = _bookings.filter((b) => {
    if (roomId && b.room_id !== roomId) return false;
    if (date && b.date !== date) return false;
    return true;
  });
  return Promise.resolve({ data: result });
}

/**
 * POST /bookings — mock
 * Body: { room_id, date, time_start, time_end, booked_by?, purpose? }
 * Response: { data: Booking }
 * Throws 409-like error if time slot is already taken.
 */
export function createBooking(data) {
  const conflict = _bookings.find(
    (b) =>
      b.room_id === data.room_id &&
      b.date === data.date &&
      b.time_start < data.time_end &&
      b.time_end > data.time_start
  );

  if (conflict) {
    return Promise.reject(
      Object.assign(new Error("Временной слот уже занят"), { status: 409 })
    );
  }

  const booking = { ...data, id: String(_nextId++) };
  _bookings.push(booking);
  return Promise.resolve({ data: booking });
}

/**
 * DELETE /bookings/:id — mock
 * Response: { success: true }
 */
export function cancelBooking(id) {
  const idx = _bookings.findIndex((b) => b.id === String(id));
  if (idx === -1) {
    return Promise.reject(new Error("Бронирование не найдено"));
  }
  _bookings.splice(idx, 1);
  return Promise.resolve({ success: true });
}
