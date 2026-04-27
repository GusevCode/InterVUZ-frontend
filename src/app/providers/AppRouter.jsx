import { Navigate, Route, Routes } from "react-router-dom";
import MapPage from "../../pages/MapPage/index";
import SchedulePage from "../../pages/SchedulePage/index";
import MapConfigurePage from "../../pages/MapConfigurePage/index";
import NewsPage from "../../pages/NewsPage/index";
import BookingPage from "../../pages/BookingPage/index";
import MapAssistantPage from "../../pages/MapAssistantPage/index";

function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<Navigate replace to="/map" />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/map-configure" element={<MapConfigurePage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/assistant" element={<MapAssistantPage />} />
        </Routes>
    )
}

export default AppRouter;
