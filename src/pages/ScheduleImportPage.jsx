import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
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
import { useEffect, useMemo, useState } from "react";
import {
  fetchGroupSchedule,
  fetchScheduleGroups,
} from "../api/scheduleApi";

const dayNames = {
  1: "Пн",
  2: "Вт",
  3: "Ср",
  4: "Чт",
  5: "Пт",
  6: "Сб",
  7: "Вс",
};

function getTodayScheduleDay() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function ScheduleImportPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [events, setEvents] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [error, setError] = useState("");
  const todayScheduleDay = getTodayScheduleDay();
  const todayName = dayNames[todayScheduleDay] ?? "Сегодня";

  const rows = useMemo(() => {
    return [...events]
      .filter((event) => event.day === todayScheduleDay)
      .sort((a, b) => {
        if (a.startTimeHourNum !== b.startTimeHourNum) {
          return a.startTimeHourNum - b.startTimeHourNum;
        }
        return a.startTimeMinNum - b.startTimeMinNum;
      })
      .map((event, index) => ({
        id: `${event.day}-${event.time}-${event.discipline?.abbr ?? index}-${index}`,
        time: `${event.startTime} - ${event.endTime}`,
        title:
          event.discipline?.fullName ??
          event.discipline?.abbr ??
          "Без названия дисциплины",
        room: event.audiences?.[0]?.name ?? "Не указана",
      }));
  }, [events, todayScheduleDay]);

  const loadGroups = async () => {
    setLoadingGroups(true);
    setError("");
    setScheduleLoaded(false);
    setEvents([]);

    try {
      const response = await fetchScheduleGroups();
      const root = response?.data;
      const collected = [];

      const walk = (node) => {
        if (!node) {
          return;
        }

        if (node.nodeType === "group" && node.uuid) {
          collected.push({
            id: node.uuid,
            name: node.name || node.abbr || node.uuid,
          });
        }

        if (Array.isArray(node.children)) {
          node.children.forEach(walk);
        }
      };

      walk(root);
      setGroups(collected);
      return collected;
    } catch (err) {
      setError(err.message || "Не удалось загрузить список групп");
      return [];
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleShowSchedule = async () => {
    if (!selectedGroupId) {
      const loadedGroups = await loadGroups();
      if (loadedGroups.length > 0) {
        setError("Выберите группу и повторите попытку.");
      } else {
        setError("Список групп недоступен. Повторите попытку позже.");
      }
      return;
    }

    setLoadingSchedule(true);
    setError("");

    try {
      const response = await fetchGroupSchedule(selectedGroupId);
      setEvents(response?.data?.schedule ?? []);
      setScheduleLoaded(true);
    } catch (err) {
      setError(err?.message || "Не удалось загрузить расписание");
      setEvents([]);
      setScheduleLoaded(false);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    void loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Импорт расписания
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
          Загружайте или синхронизируйте расписание, чтобы видеть пары, время и
          аудитории в одном месте.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          После импорта можно сразу перейти к построению маршрута до нужной
          аудитории.
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" gutterBottom>
                  Синхронизация
                </Typography>
                <Divider sx={{ mb: 1.5 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Выберите группу и загрузите ее расписание.
                </Typography>
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
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" gutterBottom>
                  Сегодняшние пары
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  День: {todayName}
                </Typography>
                <Divider sx={{ mb: 1.5 }} />
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
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            {scheduleLoaded
                              ? "На сегодня занятий не найдено"
                              : 'Нажмите "Показать расписание"'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((lesson) => (
                          <TableRow key={lesson.id} hover>
                            <TableCell>{lesson.time}</TableCell>
                            <TableCell>{lesson.title}</TableCell>
                            <TableCell align="right">{lesson.room}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default ScheduleImportPage;
