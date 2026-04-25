import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addBookingDuration,
  cancelBooking,
  createBooking,
  fetchBookings,
  fetchRooms,
} from "../../entities/booking/bookingApi";
import BookingPageView from "./BookingPageView";


function generateTimeSlots() {
  const slots = [];
  for (let h = 8; h <= 21; h++) {
    for (let m = 0; m < 60; m += 30) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  slots.push("22:00");
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function BookingPage() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [timeStart, setTimeStart] = useState("09:00");
  const [timeEnd, setTimeEnd] = useState("10:30");
  const [bookedBy, setBookedBy] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchRooms()
      .then((res) => {
        if (Array.isArray(res?.data)) setRooms(res.data);
      })
      .catch(() => {});
  }, []);

  // Reload bookings whenever filter changes
  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await fetchBookings({
        roomId: selectedRoomId || undefined,
        date: selectedDate || undefined,
      });
      setBookings(res?.data ?? []);
    } catch {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [selectedRoomId, selectedDate]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    setTimeEnd(addBookingDuration(timeStart));
  }, [timeStart]);

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort((a, b) => {
        const dateCmp = (a.date ?? "").localeCompare(b.date ?? "");
        return dateCmp !== 0
          ? dateCmp
          : (a.time_start ?? "").localeCompare(b.time_start ?? "");
      }),
    [bookings]
  );

  const roomMap = useMemo(
    () => Object.fromEntries(rooms.map((r) => [r.id, r])),
    [rooms]
  );

  const handleBook = async () => {
    setError("");
    setSuccess("");

    if (!selectedRoomId) { setError("Выберите аудиторию."); return; }
    if (!selectedDate)   { setError("Укажите дату."); return; }
    if (!timeStart) { setError("Укажите время начала."); return; }
    if (!bookedBy.trim()) { setError("Укажите имя."); return; }
    if (!purpose.trim()) { setError("Укажите контакт."); return; }

    setSubmitting(true);
    try {
      const fixedTimeEnd = addBookingDuration(timeStart);
      await createBooking({
        room_id: selectedRoomId,
        date: selectedDate,
        time_start: timeStart,
        time_end: fixedTimeEnd,
        booked_by: bookedBy.trim(),
        booker_contact: purpose.trim(),
      });
      setSuccess(`Аудитория успешно забронирована на ${timeStart}–${fixedTimeEnd}!`);
      setBookedBy("");
      setPurpose("");
      await loadBookings();
    } catch (err) {
      setError(err.message || "Не удалось создать бронирование.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelBooking(id);
      await loadBookings();
    } catch (err) {
      setError(err.message || "Не удалось отменить бронирование.");
    }
  };

  return (
    <BookingPageView
      rooms={rooms}
      timeSlots={TIME_SLOTS}
      selectedRoomId={selectedRoomId}
      setSelectedRoomId={(v) => { setSelectedRoomId(v); setError(""); setSuccess(""); }}
      selectedDate={selectedDate}
      setSelectedDate={(v) => { setSelectedDate(v); setError(""); setSuccess(""); }}
      timeStart={timeStart}
      setTimeStart={setTimeStart}
      timeEnd={timeEnd}
      setTimeEnd={() => {}}
      bookedBy={bookedBy}
      setBookedBy={setBookedBy}
      purpose={purpose}
      setPurpose={setPurpose}
      error={error}
      success={success}
      handleBook={handleBook}
      submitting={submitting}
      handleCancel={handleCancel}
      filteredBookings={sortedBookings}
      loadingBookings={loadingBookings}
      roomMap={roomMap}
    />
  );
}

export default BookingPage;
