import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import CampusNavigationPage from "./pages/CampusNavigationPage";
import MapConfigurePage from "./pages/MapConfigurePage";
import MapPage from "./pages/MapPage";
import ScheduleImportPage from "./pages/ScheduleImportPage";

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  let currentTab = false;

  if (location.pathname.startsWith("/map-configure")) {
    currentTab = false;
  } else if (location.pathname.startsWith("/map")) {
    currentTab = "/map";
  } else if (location.pathname.startsWith("/navigation")) {
    currentTab = "/navigation";
  } else if (location.pathname.startsWith("/schedule")) {
    currentTab = "/schedule";
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" color="primary">
        <Toolbar
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 1, sm: 2 },
            py: { xs: 1.5, sm: 1 },
          }}
        >
          <Box sx={{ mr: 2 }}>
            <Typography variant="h6">InterVUZ</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Сервис навигации и расписания
            </Typography>
          </Box>
          <Tabs
            value={currentTab}
            textColor="inherit"
            indicatorColor="secondary"
            onChange={(_, value) => navigate(value)}
            sx={{
              minHeight: 44,
              ".MuiTab-root": { minHeight: 44, fontSize: 14, px: 2 },
              ".MuiTabs-indicator": { height: 3 },
            }}
          >
            <Tab value="/navigation" label="Навигация" />
            <Tab value="/map" label="Карта" />
            <Tab value="/schedule" label="Расписание" />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Divider />

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
        <Routes>
          <Route path="/" element={<Navigate to="/navigation" replace />} />
          <Route path="/navigation" element={<CampusNavigationPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/map-configure" element={<MapConfigurePage />} />
          <Route path="/schedule" element={<ScheduleImportPage />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;
