import { apiRequest } from "../../shared/baseApi";

const BOOKING_DURATION_MINUTES = 90;

export async function fetchRooms() {
  const response = await apiRequest("/places", {
    query: { type: "classroom" },
  });

  return {
    data: (response.items ?? []).map((place) => ({
      id: place.id,
      name: place.name,
      capacity: 0,
      building: place.coordinates?.building ?? "",
      floor: place.coordinates?.floor ?? "",
      tags: place.tags ?? [],
    })),
  };
}

export async function fetchBookings({ roomId, date } = {}) {
  if (!date) {
    return { data: [] };
  }

  if (roomId) {
    const response = await apiRequest(`/rooms/${encodeURIComponent(roomId)}/schedule`, {
      query: { date },
    });

    return {
      data: (response.items ?? [])
        .filter((item) => item.kind === "booking")
        .map((item) => scheduleItemToBooking(response.room, item)),
    };
  }

  const roomsResponse = await fetchRooms();
  const schedules = await Promise.all(
    roomsResponse.data.map(async (room) => {
      try {
        const response = await apiRequest(`/rooms/${encodeURIComponent(room.id)}/schedule`, {
          query: { date },
        });
        return (response.items ?? [])
          .filter((item) => item.kind === "booking")
          .map((item) => scheduleItemToBooking(response.room, item));
      } catch {
        return [];
      }
    })
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

  return {
    data: bookingResponseToBooking(response),
  };
}

export function cancelBooking(id) {
  return apiRequest(`/rooms/bookings/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
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
    room_id: room.roomId,
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
