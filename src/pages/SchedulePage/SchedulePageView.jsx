import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import useMediaQuery from "@mui/material/useMediaQuery";
import SectionCard from "../../shared/ui/SectionCard";
import LabeledSelect from "../../shared/ui/LabeledSelect";
import EmptyTableRow from "../../shared/ui/EmptyTableRow";

const M = {
  sectionBg: "linear-gradient(180deg, rgba(24, 40, 66, 0.58) 0%, rgba(18, 31, 53, 0.95) 100%), #121F35",
  sectionSimpleBg: "#121F35",
  sectionBorder: "#253654",
  articleBg: "#172842",
  articleBorder: "#355180",
  inputBg: "#101D31",
  inputBorder: "#355180",
  labelColor: "#AFBFDE",
  headingColor: "#ECF2FF",
  bodyColor: "#96A7C9",
  inputColor: "#E4EDFF",
  ghostBtnBg: "rgba(18, 31, 53, 0.8)",
  ghostBtnBorder: "#334B71",
  ghostBtnText: "#C3D7FF",
};

function MobileScheduleView({
  selectedGroupId,
  setSelectedGroupId,
  groups,
  handleShowSchedule,
  loadingSchedule,
  loadingGroups,
  error,
  rows,
  scheduleLoaded,
  selectedDayName,
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Group selector section */}
      <Box
        sx={{
          background: M.sectionSimpleBg,
          border: `1px solid ${M.sectionBorder}`,
          borderRadius: "18px",
          p: "15px",
          boxShadow: "0px 10px 28px rgba(6, 10, 22, 0.33)",
        }}
      >
        <Typography
          sx={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 700,
            fontSize: "13.3px",
            lineHeight: "18px",
            letterSpacing: "0.531px",
            textTransform: "uppercase",
            color: M.labelColor,
            mb: "11px",
          }}
        >
          Группа
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
            value={selectedGroupId}
            displayEmpty
            onChange={(e) => setSelectedGroupId(e.target.value)}
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
            <MenuItem value="">
              <em style={{ color: M.bodyColor }}>Выберите группу</em>
            </MenuItem>
            {groups.map((group) => (
              <MenuItem key={group.id} value={group.id}>
                {group.name}
              </MenuItem>
            ))}
          </Select>
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
      </Box>

      {/* Schedule section */}
      <Box
        sx={{
          background: M.sectionSimpleBg,
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
          {scheduleLoaded ? `Пары — ${selectedDayName}` : "Расписание"}
        </Typography>

        {rows.length === 0 ? (
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 400,
              fontSize: "14px",
              color: M.bodyColor,
              textAlign: "center",
              py: 2,
            }}
          >
            {scheduleLoaded
              ? `На ${selectedDayName} занятий не найдено`
              : "Выберите группу и нажмите «Показать расписание»"}
          </Typography>
        ) : (
          <Stack spacing="9px">
            {rows.map((lesson) => (
              <Box
                key={lesson.id}
                sx={{
                  background: M.articleBg,
                  border: `1px solid ${M.articleBorder}`,
                  borderRadius: "12px",
                  p: "13px",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 700,
                    fontSize: "14.4px",
                    lineHeight: "20px",
                    color: M.bodyColor,
                  }}
                >
                  {lesson.time}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 700,
                    fontSize: "14.4px",
                    lineHeight: "20px",
                    color: M.bodyColor,
                  }}
                >
                  {lesson.title}
                </Typography>
                {lesson.room ? (
                  <Typography
                    sx={{
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 400,
                      fontSize: "12px",
                      lineHeight: "18px",
                      color: M.labelColor,
                      mt: "2px",
                    }}
                  >
                    {lesson.room}
                  </Typography>
                ) : null}
              </Box>
            ))}
          </Stack>
        )}

        <Box
          component="button"
          onClick={handleShowSchedule}
          disabled={loadingSchedule || loadingGroups}
          sx={{
            width: "100%",
            height: "40px",
            mt: "18px",
            background: M.ghostBtnBg,
            border: `1px solid ${M.ghostBtnBorder}`,
            borderRadius: "12px",
            cursor: loadingSchedule || loadingGroups ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: loadingSchedule || loadingGroups ? 0.6 : 1,
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Arial', sans-serif",
              fontWeight: 700,
              fontSize: "14.4px",
              lineHeight: "17px",
              color: M.ghostBtnText,
            }}
          >
            {loadingGroups
              ? "Загрузка групп..."
              : loadingSchedule
                ? "Загрузка..."
                : "Показать расписание группы"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function SchedulePageView({
  selectedGroupId,
  setSelectedGroupId,
  groups,
  handleShowSchedule,
  loadingSchedule,
  loadingGroups,
  error,
  selectedDay,
  setSelectedDay,
  dayNames,
  todayScheduleDay,
  rows,
  scheduleLoaded,
  selectedDayName,
}) {
  const isMobile = useMediaQuery("(max-width:600px)");

  if (isMobile) {
    return (
      <MobileScheduleView
        selectedGroupId={selectedGroupId}
        setSelectedGroupId={setSelectedGroupId}
        groups={groups}
        handleShowSchedule={handleShowSchedule}
        loadingSchedule={loadingSchedule}
        loadingGroups={loadingGroups}
        error={error}
        rows={rows}
        scheduleLoaded={scheduleLoaded}
        selectedDayName={selectedDayName}
      />
    );
  }

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Расписание
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <SectionCard
              title="Синхронизация"
              description="Выберите группу и загрузите ее расписание."
            >
              <Stack spacing={1.2}>
                <Select
                  size="small"
                  value={selectedGroupId}
                  displayEmpty
                  onChange={(event) => setSelectedGroupId(event.target.value)}
                >
                  <MenuItem value="">
                    <em>Выберите группу</em>
                  </MenuItem>
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
                <Button
                  variant="contained"
                  onClick={handleShowSchedule}
                  disabled={loadingSchedule || loadingGroups}
                >
                  {loadingGroups
                    ? "Загрузка групп..."
                    : loadingSchedule
                      ? "Загрузка..."
                      : "Показать расписание"}
                </Button>
              </Stack>
              {error ? (
                <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>
                  {error}
                </Typography>
              ) : null}
            </SectionCard>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <SectionCard title="Расписание по дням">
              <LabeledSelect
                value={selectedDay}
                label="День недели"
                onChange={(event) => setSelectedDay(event.target.value)}
                sx={{ mb: 1.5 }}
              >
                {Object.entries(dayNames).map(([dayNum, dayName]) => (
                  <MenuItem key={dayNum} value={Number(dayNum)}>
                    {dayName} {Number(dayNum) === todayScheduleDay ? "(сегодня)" : ""}
                  </MenuItem>
                ))}
              </LabeledSelect>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Время</TableCell>
                      <TableCell>Дисциплина</TableCell>
                      <TableCell align="right">Аудитория</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <EmptyTableRow
                        colSpan={3}
                        message={
                          scheduleLoaded
                            ? `На ${selectedDayName} занятий не найдено`
                            : 'Нажмите "Показать расписание"'
                        }
                      />
                    ) : (
                      rows.map((lesson) => (
                        <TableRow key={lesson.id} hover>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{lesson.time}</TableCell>
                          <TableCell>{lesson.title}</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                            {lesson.room}
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

export default SchedulePageView;
