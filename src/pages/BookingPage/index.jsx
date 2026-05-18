import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addBookingDuration,
  cancelBooking,
  createBooking,
  fetchBookings,
  fetchRooms,
  peekBookingsCache,
} from "../../entities/booking/bookingApi";
import {
  filterFioInput,
  formatPhoneInput,
  isValidFio,
  isValidPhone,
} from "../../shared/bookingForm";
import { ALL_ROOMS_ID } from "../../shared/ui/RoomAutocomplete";
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
  const requestIdRef = useRef(0);
  const [submitting, setSubmitting] = useState(false);

  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [timeStart, setTimeStart] = useState("09:00");
  const [timeEnd, setTimeEnd] = useState("10:30");
  const [bookedBy, setBookedBy] = useState(() =>
    filterFioInput(localStorage.getItem("booking_bookedBy") ?? "")
  );
  const [purpose, setPurpose] = useState(() => {
    const stored = localStorage.getItem("booking_purpose") ?? "";
    return stored ? formatPhoneInput(stored) : "";
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ bookedBy: "", contact: "" });
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchRooms()
      .then((res) => {
        if (Array.isArray(res?.data)) setRooms(res.data);
      })
      .catch(() => {});
  }, []);

  const handleSetBookedBy = useCallback((v) => {
    const next = filterFioInput(v);
    setBookedBy(next);
    localStorage.setItem("booking_bookedBy", next);
    setFieldErrors((prev) => (prev.bookedBy ? { ...prev, bookedBy: "" } : prev));
  }, []);

  const handleSetPurpose = useCallback((v) => {
    const next = formatPhoneInput(v);
    setPurpose(next);
    localStorage.setItem("booking_purpose", next);
    setFieldErrors((prev) => (prev.contact ? { ...prev, contact: "" } : prev));
  }, []);

  // Reload bookings whenever filter changes
  const isAllRooms = selectedRoomId === ALL_ROOMS_ID;

  const loadBookings = useCallback(async () => {
    const params = {
      roomId:
        selectedRoomId && !isAllRooms ? selectedRoomId : undefined,
      date: selectedDate || undefined,
    };

    const cached = peekBookingsCache(params);
    if (cached) {
      setBookings(cached);
    }

    const id = ++requestIdRef.current;
    if (!cached) {
      setLoadingBookings(true);
    }

    try {
      const res = await fetchBookings(params);
      if (id !== requestIdRef.current) return;
      setBookings(res?.data ?? []);
    } catch {
      if (id !== requestIdRef.current) return;
      if (!cached) setBookings([]);
    } finally {
      if (id === requestIdRef.current) setLoadingBookings(false);
    }
  }, [selectedRoomId, selectedDate, isAllRooms]);

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
    setFieldErrors({ bookedBy: "", contact: "" });
    setSuccess("");

    if (!selectedRoomId || isAllRooms) {
      setError("Выберите конкретную аудиторию");
      return;
    }
    if (!selectedDate)   { setError("Укажите дату"); return; }
    if (!timeStart) { setError("Укажите время начала"); return; }

    const nextFieldErrors = {};
    if (!isValidFio(bookedBy)) {
      nextFieldErrors.bookedBy =
        "Укажите ФИО (до 30 символов, только буквы, точки и дефис)";
    }
    if (!purpose.trim()) {
      nextFieldErrors.contact = "Укажите номер телефона";
    } else if (!isValidPhone(purpose)) {
      nextFieldErrors.contact = "Введите номер в формате +7 (999) 123-45-67";
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

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
      await loadBookings();
    } catch (err) {
      setError(err.message || "Не удалось создать бронирование.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    const booking = bookings.find((b) => b.id === id);
    try {
      await cancelBooking(id, {
        date: booking?.date ?? selectedDate,
        roomId: booking?.room_id,
      });
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
      setSelectedRoomId={(v) => {
        setSelectedRoomId(v);
        setError("");
        setFieldErrors({ bookedBy: "", contact: "" });
        setSuccess("");
      }}
      selectedDate={selectedDate}
      setSelectedDate={(v) => {
        setSelectedDate(v);
        setError("");
        setFieldErrors({ bookedBy: "", contact: "" });
        setSuccess("");
      }}
      timeStart={timeStart}
      setTimeStart={setTimeStart}
      timeEnd={timeEnd}
      setTimeEnd={() => {}}
      bookedBy={bookedBy}
      setBookedBy={handleSetBookedBy}
      purpose={purpose}
      setPurpose={handleSetPurpose}
      error={error}
      fieldErrors={fieldErrors}
      success={success}
      handleBook={handleBook}
      submitting={submitting}
      handleCancel={handleCancel}
      bookingDisabled={isAllRooms}
      filteredBookings={sortedBookings}
      loadingBookings={loadingBookings}
      roomMap={roomMap}
    />
  );
}

export default BookingPage;
