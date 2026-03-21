import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { syncScheduleReport } from "../api/scheduleApi";

function AdminSheduleReportPage() {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleSync = async () => {
    setLoading(true);
    try {
      await syncScheduleReport();
      setNotification({
        severity: "success",
        message: "Синхронизация расписания запущена.",
      });
    } catch (error) {
      setNotification({
        severity: "error",
        message: error?.message || "Не удалось выполнить синхронизацию.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = (_, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setNotification(null);
  };

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h4" component="h1">
            Отчет по расписанию
          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={handleSync}
            disabled={loading}
            sx={{ width: "fit-content" }}
          >
            {loading ? "Синхронизация..." : "Синхронизация расписания"}
          </Button>
        </Stack>
      </CardContent>
      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification?.severity ?? "info"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification?.message ?? ""}
        </Alert>
      </Snackbar>
    </Card>
  );
}

export default AdminSheduleReportPage;
