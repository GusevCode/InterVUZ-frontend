import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";

import { FIO_MAX_LENGTH, formatRoomNumber } from "../../shared/bookingForm";
import EmptyTableRow from "../../shared/ui/EmptyTableRow";
import LabeledSelect from "../../shared/ui/LabeledSelect";
import RoomAutocomplete, { ALL_ROOMS_ID } from "../../shared/ui/RoomAutocomplete";
import SectionCard from "../../shared/ui/SectionCard";

const TIME_STEP_MINUTES = 30;

function parseMinutesOfDay(value) {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function minutesToTimeString(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function snapToHalfHour(value, minValue, maxValue) {
  const totalMinutes = parseMinutesOfDay(value);
  const minMinutes = parseMinutesOfDay(minValue);
  const maxMinutes = parseMinutesOfDay(maxValue);

  if (totalMinutes === null) {
    return minValue;
  }

  const rounded = Math.round(totalMinutes / TIME_STEP_MINUTES) * TIME_STEP_MINUTES;
  const clamped = Math.min(Math.max(rounded, minMinutes), maxMinutes);
  return minutesToTimeString(clamped);
}

const tableCompactCell = {
  py: 1.25,
  px: 1.5,
  fontSize: "0.875rem",
  lineHeight: 1.45,
};

const tableColRoom = { ...tableCompactCell, width: 58, pl: 1.25, pr: 2 };
const tableColDate = { ...tableCompactCell, width: 94, px: 1.75 };
const tableColTime = { ...tableCompactCell, width: 108, px: 1.75 };
const tableColWho = { ...tableCompactCell, pl: 1.75, pr: 1.25 };
const tableColAction = {
  ...tableCompactCell,
  width: 100,
  pl: 1.25,
  pr: 2,
};

const roomChipSx = {
  height: 28,
  minWidth: 0,
  maxWidth: 60,
  "& .MuiChip-label": {
    px: 0.75,
    fontSize: "0.8125rem",
    fontWeight: 600,
    lineHeight: 1.35,
  },
};

const M = {
  sectionBg: "linear-gradient(180deg, rgba(24, 40, 66, 0.58) 0%, rgba(18, 31, 53, 0.95) 100%), #121F35",
  sectionBorder: "#253654",
  articleBg: "#172842",
  articleBorder: "#355180",
  inputBg: "#101D31",
  inputBorder: "#355180",
  labelColor: "#AFBFDE",
  headingColor: "#ECF2FF",
  bodyColor: "#96A7C9",
  inputColor: "#E4EDFF",
  primaryBtnBg: "#2A6DF0",
  primaryBtnBorder: "#5F8EE5",
  primaryBtnText: "#F3F7FF",
  ghostBtnBg: "rgba(18, 31, 53, 0.8)",
  ghostBtnBorder: "#334B71",
  ghostBtnText: "#C3D7FF",
  freeBadgeBg: "#8BE8B5",
  freeBadgeText: "#1C2418",
};

function TimeStartInput({ value, min, max, onCommit, sx }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <Box
      component="input"
      type="time"
      step={TIME_STEP_MINUTES * 60}
      min={min}
      max={max}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onCommit(snapToHalfHour(draft, min, max))}
      onWheel={(e) => e.currentTarget.blur()}
      sx={sx}
    />
  );
}

function MobileSelectInput({ label, value, onChange, children }) {
  return (
    <Box>
      <Typography
        sx={{
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 700,
          fontSize: "13.3px",
          lineHeight: "18px",
          letterSpacing: "0.531px",
          textTransform: "uppercase",
          color: M.labelColor,
          mb: "8px",
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          background: M.inputBg,
          border: `1px solid ${M.inputBorder}`,
          borderRadius: "12px",
          height: "46px",
          display: "flex",
          alignItems: "center",
          px: "15px",
        }}
      >
        <Select
          size="small"
          value={value}
          onChange={onChange}
          variant="standard"
          disableUnderline
          fullWidth
          sx={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 400,
            fontSize: "14.7px",
            color: M.inputColor,
            "& .MuiSelect-icon": { color: M.inputColor },
            "& .MuiSelect-select": { p: 0 },
          }}
        >
          {children}
        </Select>
      </Box>
    </Box>
  );
}

function MobileBookingView({
  rooms,
  timeSlots,
  selectedRoomId,
  setSelectedRoomId,
  selectedDate,
  setSelectedDate,
  timeStart,
  setTimeStart,
  timeEnd,
  setTimeEnd,
  bookedBy,
  setBookedBy,
  purpose,
  setPurpose,
  error,
  fieldErrors = {},
  success,
  handleBook,
  submitting,
  bookingDisabled = false,
  filteredBookings,
  loadingBookings,
  roomMap,
}) {
  const bookButtonDisabled = submitting || bookingDisabled;
  const timeStartMin = timeSlots[0];
  const timeStartMax = timeSlots[timeSlots.length - 2];

  const [timeHighlighted, setTimeHighlighted] = useState(false);

  useEffect(() => {
    if (!timeHighlighted) {
      return undefined;
    }
    const timer = setTimeout(() => setTimeHighlighted(false), 900);
    return () => clearTimeout(timer);
  }, [timeHighlighted]);

  const handleTimeStartCommit = (nextValue) => {
    setTimeStart(nextValue);
    setTimeHighlighted(true);
  };

  const timeBoxSx = {
    flex: 1,
    background: M.inputBg,
    border: `1px solid ${M.inputBorder}`,
    borderRadius: "12px",
    height: "42px",
    display: "flex",
    alignItems: "center",
    px: "11px",
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Search / booking form */}
      <Box
        sx={{
          background: M.sectionBg,
          border: `1px solid ${M.sectionBorder}`,
          borderRadius: "18px",
          p: "14px",
          boxShadow: "0px 10px 28px rgba(6, 10, 22, 0.33)",
        }}
      >
        {/* Date */}
        <Box sx={{ mb: "14px" }}>
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 700,
              fontSize: "13.3px",
              lineHeight: "18px",
              letterSpacing: "0.531px",
              textTransform: "uppercase",
              color: M.labelColor,
              mb: "6px",
            }}
          >
            Дата
          </Typography>
          <Box
            sx={{
              background: M.inputBg,
              border: `1px solid ${M.inputBorder}`,
              borderRadius: "12px",
              height: "42px",
              display: "flex",
              alignItems: "center",
              px: "11px",
            }}
          >
            <Box
              component="input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              sx={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 400,
                fontSize: "14.7px",
                color: M.inputColor,
                colorScheme: "dark",
              }}
            />
          </Box>
        </Box>

        {/* Time */}
        <Box sx={{ mb: "14px" }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: "6px" }}>
            <Typography
              sx={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700,
                fontSize: "13.3px",
                lineHeight: "18px",
                letterSpacing: "0.531px",
                textTransform: "uppercase",
                color: M.labelColor,
              }}
            >
              Время
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 500,
                fontSize: "11px",
                lineHeight: "14px",
                color: M.bodyColor,
              }}
            >
              Шаг 30 минут
            </Typography>
          </Stack>
          <Box sx={{ display: "flex", gap: "8px" }}>
            <Box sx={timeBoxSx}>
              <TimeStartInput
                value={timeStart}
                min={timeStartMin}
                max={timeStartMax}
                onCommit={handleTimeStartCommit}
                sx={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 400,
                  fontSize: "14.7px",
                  color: timeHighlighted ? M.freeBadgeBg : M.inputColor,
                  transition: "color 0.25s ease",
                  colorScheme: "dark",
                }}
              />
            </Box>
            <Box sx={timeBoxSx}>
              <Typography
                sx={{
                  width: "100%",
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 400,
                  fontSize: "14.7px",
                  color: "#fff",
                }}
              >
                {timeEnd}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: "14px" }}>
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 700,
              fontSize: "13.3px",
              lineHeight: "18px",
              letterSpacing: "0.531px",
              textTransform: "uppercase",
              color: M.labelColor,
              mb: "6px",
            }}
          >
            Аудитория
          </Typography>
          <Box
            sx={{
              background: M.inputBg,
              border: `1px solid ${M.inputBorder}`,
              borderRadius: "12px",
              height: "42px",
              display: "flex",
              alignItems: "center",
              px: "11px",
            }}
          >
            <RoomAutocomplete
              rooms={rooms}
              value={selectedRoomId}
              onChange={setSelectedRoomId}
              label={null}
              placeholder="Например, 100"
              sx={{
                width: "100%",
                "& .MuiOutlinedInput-root": {
                  background: "transparent",
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 400,
                  fontSize: "14.7px",
                  color: M.inputColor,
                  p: "0 !important",
                  "& fieldset": { border: "none" },
                  "&:hover fieldset": { border: "none" },
                  "&.Mui-focused fieldset": { border: "none" },
                },
                "& .MuiAutocomplete-input": {
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 400,
                  fontSize: "14.7px",
                  textAlign: "center",
                  p: "0 !important",
                },
                "& .MuiAutocomplete-popupIndicator": { color: M.labelColor },
                "& .MuiAutocomplete-clearIndicator": { color: M.labelColor },
              }}
            />
          </Box>
        </Box>

        <Box>
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 700,
              fontSize: "13.3px",
              lineHeight: "18px",
              letterSpacing: "0.531px",
              textTransform: "uppercase",
              color: M.labelColor,
              mb: "6px",
            }}
          >
            Имя
          </Typography>
          <Box
            sx={{
              background: M.inputBg,
              border: `1px solid ${M.inputBorder}`,
              borderRadius: "12px",
              height: "42px",
              display: "flex",
              alignItems: "center",
              px: "11px",
            }}
          >
            <Box
              component="input"
              value={bookedBy}
              onChange={(e) => setBookedBy(e.target.value)}
              placeholder="Фамилия И.О."
              maxLength={FIO_MAX_LENGTH}
              sx={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 400,
                fontSize: "14.7px",
                color: M.inputColor,
              }}
            />
          </Box>
          {fieldErrors.bookedBy ? (
            <Typography
              sx={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: "12px",
                color: "#ff6b6b",
                mt: "6px",
              }}
            >
              {fieldErrors.bookedBy}
            </Typography>
          ) : null}
        </Box>

        <Box sx={{ mt: "14px" }}>
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 700,
              fontSize: "13.3px",
              lineHeight: "18px",
              letterSpacing: "0.531px",
              textTransform: "uppercase",
              color: M.labelColor,
              mb: "6px",
            }}
          >
            Контакт
          </Typography>
          <Box
            sx={{
              background: M.inputBg,
              border: `1px solid ${fieldErrors.contact ? "#ff6b6b" : M.inputBorder}`,
              borderRadius: "12px",
              height: "42px",
              display: "flex",
              alignItems: "center",
              px: "11px",
            }}
          >
            <Box
              component="input"
              type="tel"
              inputMode="tel"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Телефон"
              sx={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 400,
                fontSize: "14.7px",
                color: M.inputColor,
              }}
            />
          </Box>
          {fieldErrors.contact ? (
            <Typography
              sx={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: "12px",
                color: "#ff6b6b",
                mt: "6px",
              }}
            >
              {fieldErrors.contact}
            </Typography>
          ) : null}
        </Box>

        {error ? (
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "13px",
              color: "#ff6b6b",
              mt: "10px",
            }}
          >
            {error}
          </Typography>
        ) : null}
        {success ? (
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "13px",
              color: M.freeBadgeBg,
              mt: "10px",
            }}
          >
            {success}
          </Typography>
        ) : null}

        {/* Booking button */}
        <Box
          component="button"
          onClick={handleBook}
          disabled={bookButtonDisabled}
          sx={{
            width: "100%",
            height: "40px",
            mt: "16px",
            background: bookButtonDisabled ? "rgba(42, 109, 240, 0.5)" : M.primaryBtnBg,
            border: `1px solid ${M.primaryBtnBorder}`,
            borderRadius: "12px",
            cursor: bookButtonDisabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Arial', sans-serif",
              fontWeight: 700,
              fontSize: "14.4px",
              lineHeight: "17px",
              color: M.primaryBtnText,
            }}
          >
            {submitting ? "Бронирование…" : "Забронировать"}
          </Typography>
        </Box>
      </Box>

      {/* Available bookings list */}
      <Box
        sx={{
          background: M.sectionBg,
          border: `1px solid ${M.sectionBorder}`,
          borderRadius: "18px",
          p: "15px",
          boxShadow: "0px 10px 28px rgba(6, 10, 22, 0.33)",
        }}
      >
        <Typography
          sx={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 800,
            fontSize: "16px",
            lineHeight: "22px",
            color: M.headingColor,
            mb: "15px",
          }}
        >
          Существующие бронирования
        </Typography>

        {loadingBookings ? (
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "14px",
              color: M.bodyColor,
              textAlign: "center",
              py: 2,
            }}
          >
            Загрузка…
          </Typography>
        ) : filteredBookings.length === 0 ? (
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "14px",
              color: M.bodyColor,
              textAlign: "center",
              py: 2,
            }}
          >
            Бронирований не найдено
          </Typography>
        ) : (
          <Stack spacing="9px">
            {filteredBookings.map((b) => (
              <Box
                key={b.id}
                sx={{
                  background: M.articleBg,
                  border: `1px solid ${M.articleBorder}`,
                  borderRadius: "12px",
                  p: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 700,
                      fontSize: "14.4px",
                      lineHeight: "20px",
                      color: M.bodyColor,
                    }}
                  >
                    {formatRoomNumber(
                      roomMap[b.room_id]?.name,
                      b.room_id
                    )}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 400,
                      fontSize: "12px",
                      lineHeight: "18px",
                      color: M.labelColor,
                    }}
                  >
                    {b.date ? `${b.date} · ` : ""}{b.time_start}–{b.time_end}
                  </Typography>
                  {b.booked_by || b.purpose ? (
                    <Typography
                      sx={{
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 400,
                        fontSize: "12px",
                        lineHeight: "16px",
                        color: M.bodyColor,
                        mt: "2px",
                      }}
                    >
                      {[b.booked_by, b.purpose].filter(Boolean).join(" · ")}
                    </Typography>
                  ) : null}
                </Box>
                <Box
                  component="button"
                  onClick={() => {}}
                  sx={{
                    ml: "10px",
                    px: "10px",
                    height: "25px",
                    background: M.freeBadgeBg,
                    border: "none",
                    borderRadius: "999px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 800,
                      fontSize: "11.5px",
                      lineHeight: "16px",
                      color: M.freeBadgeText,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Активно
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

function BookingPageView({
  rooms,
  timeSlots,
  selectedRoomId,
  setSelectedRoomId,
  selectedDate,
  setSelectedDate,
  timeStart,
  setTimeStart,
  timeEnd,
  setTimeEnd,
  bookedBy,
  setBookedBy,
  purpose,
  setPurpose,
  error,
  fieldErrors = {},
  success,
  handleBook,
  submitting,
  bookingDisabled = false,
  handleCancel,
  filteredBookings,
  loadingBookings,
  roomMap,
}) {
  const isMobile = useMediaQuery("(max-width:600px)");
  const bookButtonDisabled = submitting || bookingDisabled;

  const roomFilterLabel =
    selectedRoomId === ALL_ROOMS_ID
      ? "все аудитории"
      : selectedRoomId
        ? roomMap[selectedRoomId]?.name
        : "все аудитории";

  if (isMobile) {
    return (
      <MobileBookingView
        rooms={rooms}
        timeSlots={timeSlots}
        selectedRoomId={selectedRoomId}
        setSelectedRoomId={setSelectedRoomId}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        timeStart={timeStart}
        setTimeStart={setTimeStart}
        timeEnd={timeEnd}
        setTimeEnd={setTimeEnd}
        bookedBy={bookedBy}
        setBookedBy={setBookedBy}
        purpose={purpose}
        setPurpose={setPurpose}
        error={error}
        fieldErrors={fieldErrors}
        success={success}
        handleBook={handleBook}
        submitting={submitting}
        bookingDisabled={bookingDisabled}
        filteredBookings={filteredBookings}
        loadingBookings={loadingBookings}
        roomMap={roomMap}
      />
    );
  }

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Бронирование аудиторий
        </Typography>

        <Grid container spacing={2}>
          {/* Left column — booking form */}
          <Grid size={{ xs: 12, md: 5 }}>
            <SectionCard
              title="Новое бронирование"
              description="Выберите аудиторию, дату и временной диапазон."
            >
              <Stack spacing={1.5}>
                <Alert severity="info" sx={{ py: 0.5 }}>
                  Бронь создаётся на фиксированные 1,5 часа.
                </Alert>

                <RoomAutocomplete
                  rooms={rooms}
                  value={selectedRoomId}
                  onChange={setSelectedRoomId}
                />

                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  label="Дата"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />

                <Box sx={{ display: "flex", gap: 1 }}>
                  <LabeledSelect
                    label="Начало"
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                  >
                    {timeSlots.slice(0, -1).map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </LabeledSelect>

                  <LabeledSelect
                    label="Конец"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    disabled
                  >
                    {timeSlots.slice(1).map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </LabeledSelect>
                </Box>

                <TextField
                  size="small"
                  fullWidth
                  label="Ваши данные"
                  value={bookedBy}
                  onChange={(e) => setBookedBy(e.target.value)}
                  placeholder="Фамилия И.О."
                  error={Boolean(fieldErrors.bookedBy)}
                  helperText={fieldErrors.bookedBy}
                  slotProps={{
                    htmlInput: { maxLength: FIO_MAX_LENGTH },
                  }}
                />

                <TextField
                  size="small"
                  fullWidth
                  label="Контакт"
                  type="tel"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  error={Boolean(fieldErrors.contact)}
                  helperText={fieldErrors.contact}
                  slotProps={{
                    htmlInput: { inputMode: "tel" },
                  }}
                />

                {error ? (
                  <Alert severity="error" sx={{ py: 0.5 }}>
                    {error}
                  </Alert>
                ) : null}

                {success ? (
                  <Alert severity="success" sx={{ py: 0.5 }}>
                    {success}
                  </Alert>
                ) : null}

                <Button
                  variant="contained"
                  onClick={handleBook}
                  size="large"
                  disabled={bookButtonDisabled}
                >
                  {submitting ? "Бронирование…" : "Забронировать"}
                </Button>
              </Stack>
            </SectionCard>
          </Grid>

          {/* Right column — bookings list */}
          <Grid size={{ xs: 12, md: 7 }}>
            <SectionCard
              title="Существующие бронирования"
              description={
                selectedRoomId || selectedDate
                  ? `Фильтр: ${roomFilterLabel} · ${selectedDate ? formatDate(selectedDate) : "все даты"}`
                  : "Все бронирования, выберите аудиторию или дату для фильтрации"
              }
            >
              <TableContainer sx={{ overflowX: "hidden", pr: 1 }}>
                <Table
                  size="small"
                  sx={{ tableLayout: "fixed", width: "100%" }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableColRoom}>№</TableCell>
                      <TableCell sx={tableColDate}>Дата</TableCell>
                      <TableCell sx={tableColTime}>Время</TableCell>
                      <TableCell sx={tableColWho}>Кем</TableCell>
                      <TableCell sx={tableColAction} align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingBookings ? (
                      <EmptyTableRow colSpan={5} message="Загрузка…" />
                    ) : filteredBookings.length === 0 ? (
                      <EmptyTableRow
                        colSpan={5}
                        message="Бронирований не найдено"
                      />
                    ) : (
                      filteredBookings.map((b) => (
                        <TableRow key={b.id} hover>
                          <TableCell sx={tableColRoom}>
                            <Chip
                              label={formatRoomNumber(
                                roomMap[b.room_id]?.name,
                                b.room_id
                              )}
                              size="small"
                              variant="outlined"
                              sx={roomChipSx}
                            />
                          </TableCell>
                          <TableCell sx={tableColDate}>
                            {formatDate(b.date)}
                          </TableCell>
                          <TableCell sx={tableColTime}>
                            {b.time_start}–{b.time_end}
                          </TableCell>
                          <TableCell
                            sx={{
                              ...tableColWho,
                              overflow: "hidden",
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              noWrap
                              display="block"
                              title={b.booked_by}
                            >
                              {b.booked_by}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                              display="block"
                              title={b.purpose}
                            >
                              {b.purpose}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={tableColAction}>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => handleCancel(b.id)}
                              sx={{
                                minWidth: 0,
                                px: 1.25,
                                py: 0.5,
                                fontSize: "0.8125rem",
                                lineHeight: 1.35,
                              }}
                            >
                              Отменить
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </SectionCard>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default BookingPageView;
