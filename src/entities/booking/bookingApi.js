import { apiRequest } from "../../shared/baseApi";

const BOOKING_DURATION_MINUTES = 90;
const CACHE_TTL_MS = 2 * 60 * 1000;

/** @type {Map<string, { data: unknown, fetchedAt: number }>} */
const scheduleCache = new Map();
/** @type {Map<string, Promise<unknown>>} */
const scheduleInFlight = new Map();
let roomsCache = null;
let roomsInFlight = null;

function cacheKey(date, roomId) {
  return `${date}:${roomId}`;
}

function readCache(map, key) {
  const entry = map.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    map.delete(key);
    return null;
  }
  return entry.data;
}

function writeCache(map, key, data) {
  map.set(key, { data, fetchedAt: Date.now() });
}

export function invalidateBookingsCache({ date, roomId } = {}) {
  if (!date) {
    scheduleCache.clear();
    roomsCache = null;
    return;
  }

  if (roomId) {
    scheduleCache.delete(cacheKey(date, roomId));
    return;
  }

  for (const key of scheduleCache.keys()) {
    if (key.startsWith(`${date}:`)) {
      scheduleCache.delete(key);
    }
  }
}

export function peekBookingsCache({ roomId, date } = {}) {
  if (!date) return null;

  if (roomId) {
    return readCache(scheduleCache, cacheKey(date, roomId));
  }

  const rooms = roomsCache?.data;
  if (!rooms?.length) return null;

  const merged = [];
  for (const room of rooms) {
    const cached = readCache(scheduleCache, cacheKey(date, room.id));
    if (!cached) return null;
    merged.push(...cached);
  }
  return merged;
}

export async function fetchRooms() {
  const cached = roomsCache;
  if (cached && Date.now() - cached.fetchedAt <= CACHE_TTL_MS) {
    return { data: cached.data };
  }

  if (roomsInFlight) {
    return roomsInFlight;
  }

  roomsInFlight = (async () => {
    const response = await apiRequest("/places", {
      query: { type: "classroom" },
    });

    const data = (response.items ?? []).map((place) => ({
      id: place.id,
      name: place.name,
      capacity: 0,
      building: place.coordinates?.building ?? "",
      floor: place.coordinates?.floor ?? "",
      tags: place.tags ?? [],
    }));

    roomsCache = { data, fetchedAt: Date.now() };
    return { data };
  })();

  try {
    return await roomsInFlight;
  } finally {
    roomsInFlight = null;
  }
}

async function fetchRoomBookings(roomId, date, roomMeta) {
  const key = cacheKey(date, roomId);
  const cached = readCache(scheduleCache, key);
  if (cached) return cached;

  const inFlight = scheduleInFlight.get(key);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      const response = await apiRequest(`/rooms/${encodeURIComponent(roomId)}/schedule`, {
        query: { date },
      });
      const meta = response.room ?? roomMeta ?? { roomId };
      const data = (response.items ?? [])
        .filter((item) => item.kind === "booking")
        .map((item) => scheduleItemToBooking(meta, item));
      writeCache(scheduleCache, key, data);
      return data;
    } catch {
      return [];
    } finally {
      scheduleInFlight.delete(key);
    }
  })();

  scheduleInFlight.set(key, promise);
  return promise;
}

export async function fetchBookings({ roomId, date } = {}) {
  if (!date) {
    return { data: [] };
  }

  if (roomId) {
    const data = await fetchRoomBookings(roomId, date);
    return { data };
  }

  const roomsResponse = await fetchRooms();
  const schedules = await Promise.all(
    roomsResponse.data.map((room) =>
      fetchRoomBookings(room.id, date, { roomId: room.id })
    )
  );

  return { data: schedules.flat() };
}

export async function createBooking(data) {
  const response = await apiRequest(`/rooms/${encodeURIComponent(data.room_id)}/bookings`, {
    method: "POST",
    body: {
      startsAt: toLocalRFC3339(data.date, data.time_start),
      bookerName: data.booked_by,
      bookerContact: data.booker_contact || data.purpose,
    },
  });

  invalidateBookingsCache({ date: data.date, roomId: data.room_id });

  return {
    data: bookingResponseToBooking(response),
  };
}

export async function cancelBooking(id, { date, roomId } = {}) {
  const result = await apiRequest(`/rooms/bookings/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (date && roomId) {
    invalidateBookingsCache({ date, roomId });
  } else if (date) {
    invalidateBookingsCache({ date });
  }

  return result;
}

export function toLocalRFC3339(dateValue, timeValue) {
  const value = new Date(`${dateValue}T${timeValue}:00`);
  const offsetMinutes = -value.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const offsetMins = String(absoluteOffset % 60).padStart(2, "0");
  return `${dateValue}T${timeValue}:00${sign}${offsetHours}:${offsetMins}`;
}

export function addBookingDuration(timeValue) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const total = hours * 60 + minutes + BOOKING_DURATION_MINUTES;
  const nextHours = Math.floor(total / 60);
  const nextMinutes = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

function scheduleItemToBooking(room, item) {
  return {
    id: item.id,
    room_id: room?.roomId ?? room?.id,
    date: item.startsAt?.slice(0, 10) ?? "",
    time_start: item.startTime,
    time_end: item.endTime,
    booked_by: item.kind === "booking" ? item.bookerName : item.groups?.join(", "),
    purpose: item.kind === "booking" ? item.bookerContact : item.title,
    type: item.kind,
    title: item.title,
  };
}

function bookingResponseToBooking(item) {
  return {
    id: item.id,
    room_id: item.roomId,
    date: item.startsAt?.slice(0, 10) ?? "",
    time_start: formatTime(item.startsAt),
    time_end: formatTime(item.endsAt),
    booked_by: item.bookerName,
    purpose: item.bookerContact,
    type: "booking",
    title: "Бронь аудитории",
  };
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
