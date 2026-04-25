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

import EmptyTableRow from "../../shared/ui/EmptyTableRow";
import LabeledSelect from "../../shared/ui/LabeledSelect";
import SectionCard from "../../shared/ui/SectionCard";

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
  success,
  handleBook,
  submitting,
  filteredBookings,
  loadingBookings,
  roomMap,
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Search / booking form */}
      <Box
        sx={{
          background: M.sectionBg,
          border: `1px solid ${M.sectionBorder}`,
          borderRadius: "18px",
          p: "15px",
          boxShadow: "0px 10px 28px rgba(6, 10, 22, 0.33)",
        }}
      >
        {/* Date */}
        <Box sx={{ mb: "17px" }}>
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
            Дата
          </Typography>
          <Box
            sx={{
              background: M.inputBg,
              border: `1px solid ${M.inputBorder}`,
              borderRadius: "12px",
              height: "46px",
              display: "flex",
              alignItems: "center",
              px: "13px",
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
        <Box sx={{ mb: "17px" }}>
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
            Время
          </Typography>
          <Box sx={{ display: "flex", gap: "10px" }}>
            <Box
              sx={{
                flex: 1,
                background: M.inputBg,
                border: `1px solid ${M.inputBorder}`,
                borderRadius: "12px",
                height: "46px",
                display: "flex",
                alignItems: "center",
                px: "13px",
              }}
            >
              <Select
                size="small"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
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
                {timeSlots.slice(0, -1).map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </Box>
            <Box
              sx={{
                flex: 1,
                background: M.inputBg,
                border: `1px solid ${M.inputBorder}`,
                borderRadius: "12px",
                height: "46px",
                display: "flex",
                alignItems: "center",
                px: "13px",
              }}
            >
              <Select
                size="small"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                disabled
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
                {timeSlots.slice(1).map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </Box>
          </Box>
        </Box>

        {/* Capacity / Room */}
        <MobileSelectInput
          label="Аудитория"
          value={selectedRoomId}
          onChange={(e) => setSelectedRoomId(e.target.value)}
        >
          <MenuItem value="">
            <em style={{ color: M.bodyColor }}>Выберите аудиторию</em>
          </MenuItem>
          {rooms.map((room) => (
            <MenuItem key={room.id} value={room.id}>
              {room.name}
              {room.capacity ? ` · до ${room.capacity} чел.` : ""}
            </MenuItem>
          ))}
        </MobileSelectInput>

        <Box sx={{ mt: "17px" }}>
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
            Имя
          </Typography>
          <Box
            sx={{
              background: M.inputBg,
              border: `1px solid ${M.inputBorder}`,
              borderRadius: "12px",
              height: "46px",
              display: "flex",
              alignItems: "center",
              px: "13px",
            }}
          >
            <Box
              component="input"
              value={bookedBy}
              onChange={(e) => setBookedBy(e.target.value)}
              placeholder="Фамилия И.О."
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
        </Box>

        <Box sx={{ mt: "17px" }}>
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
            Контакт
          </Typography>
          <Box
            sx={{
              background: M.inputBg,
              border: `1px solid ${M.inputBorder}`,
              borderRadius: "12px",
              height: "46px",
              display: "flex",
              alignItems: "center",
              px: "13px",
            }}
          >
            <Box
              component="input"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Телефон, Telegram или email"
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
        </Box>

        {error ? (
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "13px",
              color: "#ff6b6b",
              mt: "12px",
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
              mt: "12px",
            }}
          >
            {success}
          </Typography>
        ) : null}

        {/* Booking button */}
        <Box
          component="button"
          onClick={handleBook}
          disabled={submitting}
          sx={{
            width: "100%",
            height: "40px",
            mt: "18px",
            background: submitting ? "rgba(42, 109, 240, 0.5)" : M.primaryBtnBg,
            border: `1px solid ${M.primaryBtnBorder}`,
            borderRadius: "12px",
            cursor: submitting ? "not-allowed" : "pointer",
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
                    {roomMap[b.room_id]?.name ?? b.room_id}
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
  success,
  handleBook,
  submitting,
  handleCancel,
  filteredBookings,
  loadingBookings,
  roomMap,
}) {
  const isMobile = useMediaQuery("(max-width:600px)");

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
        success={success}
        handleBook={handleBook}
        submitting={submitting}
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

                <LabeledSelect
                  label="Аудитория"
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Выберите аудиторию</em>
                  </MenuItem>
                  {rooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.name}
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        (до {room.capacity} чел.)
                      </Typography>
                    </MenuItem>
                  ))}
                </LabeledSelect>

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
                  label="Ваше имя"
                  value={bookedBy}
                  onChange={(e) => setBookedBy(e.target.value)}
                  placeholder="Фамилия И.О."
                />

                <TextField
                  size="small"
                  fullWidth
                  label="Контакт"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Телефон, Telegram или email"
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
                  disabled={submitting}
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
                  ? `Фильтр: ${selectedRoomId ? roomMap[selectedRoomId]?.name : "все аудитории"} · ${selectedDate ? formatDate(selectedDate) : "все даты"}`
                  : "Все бронирования. Выберите аудиторию или дату для фильтрации."
              }
            >
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Аудитория</TableCell>
                      <TableCell>Дата</TableCell>
                      <TableCell>Время</TableCell>
                      <TableCell>Кем / Цель</TableCell>
                      <TableCell />
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
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            <Chip
                              label={roomMap[b.room_id]?.name ?? b.room_id}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {formatDate(b.date)}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {b.time_start}–{b.time_end}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {b.booked_by}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {b.purpose}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => handleCancel(b.id)}
                              sx={{ whiteSpace: "nowrap", minWidth: 0, px: 1 }}
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
