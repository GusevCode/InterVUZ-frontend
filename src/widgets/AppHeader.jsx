import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import {useLocation, useNavigate } from "react-router-dom";


function AppHeader() {

    const location = useLocation();
    const navigate = useNavigate();
  
    let currentTab = false;
  
    if (location.pathname.startsWith("/map-configure")) {
      currentTab = false;
    } else if (location.pathname.startsWith("/map")) {
      currentTab = "/map";
    } else if (location.pathname.startsWith("/schedule")) {
      currentTab = "/schedule";
    } else if (location.pathname.startsWith("/news")) {
      currentTab = "/news";
    } else if (location.pathname.startsWith("/booking")) {
      currentTab = "/booking";
    } else if (location.pathname.startsWith("/assistant")) {
      currentTab = "/assistant";
    } else if (location.pathname.startsWith("/booking")) {
      currentTab = "/booking";
    }

    return ( 
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
          <Box sx={{ mr: 1, lineHeight: 1 }}>
            <Typography variant="h6" sx={{ lineHeight: 1.1 }}>InterVUZ</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, lineHeight: 1 }}>
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
            <Tab value="/map" label="Карта" />
            <Tab value="/assistant" label="AI" />
            <Tab value="/schedule" label="Расписание" />
            <Tab value="/booking" label="Бронирование" />
            <Tab value="/news" label="Новости" />
          </Tabs>
        </Toolbar>
      </AppBar>
    
    )

}

export default AppHeader;
