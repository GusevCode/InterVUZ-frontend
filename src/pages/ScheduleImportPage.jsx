import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

const lessons = [
  { time: "09:00 - 10:30", title: "Высшая математика", room: "Б-214" },
  { time: "10:45 - 12:15", title: "Программирование", room: "А-312" },
  { time: "13:00 - 14:30", title: "Физика", room: "Л-107" },
];

function ScheduleImportPage() {
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
                  Подключите файл или внешний источник расписания. После импорта
                  занятия автоматически появятся в приложении.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button variant="contained">Загрузить файл</Button>
                  <Button variant="outlined">Синхронизировать</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" gutterBottom>
                  Сегодняшние пары
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
                      {lessons.map((lesson) => (
                        <TableRow key={`${lesson.time}-${lesson.title}`} hover>
                          <TableCell>{lesson.time}</TableCell>
                          <TableCell>{lesson.title}</TableCell>
                          <TableCell align="right">{lesson.room}</TableCell>
                        </TableRow>
                      ))}
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
