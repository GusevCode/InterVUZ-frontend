import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useLocation } from "react-router-dom";

const SECTION_BY_PATH = [
  { match: "/map", title: "Карта корпуса", hint: "Навигация и маршруты" },
  { match: "/schedule", title: "Расписание", hint: "Пары и группы" },
  { match: "/booking", title: "Бронирование", hint: "Свободные аудитории" },
  { match: "/news", title: "Новости", hint: "События университета" },
  { match: "/assistant", title: "ИИ-ассистент", hint: "Помощь в навигации" },
];

function resolveSection(pathname) {
  return (
    SECTION_BY_PATH.find((section) => pathname.startsWith(section.match)) ||
    SECTION_BY_PATH[0]
  );
}

function CompassMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.2" stroke="#DEECFF" strokeWidth="1.3" />
      <path
        d="M13.2 6.8L11 11L6.8 13.2L9 9L13.2 6.8Z"
        fill="#DEECFF"
        stroke="#DEECFF"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MobileAppHeader() {
  const location = useLocation();
  const section = resolveSection(location.pathname);

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        gap: "11px",
        px: 2,
        pt: "calc(env(safe-area-inset-top, 0px) + 12px)",
        pb: "12px",
        background:
          "linear-gradient(180deg, rgba(9, 15, 28, 0.97) 0%, rgba(9, 15, 28, 0.9) 100%)",
        borderBottom: "1px solid #1C2A42",
        backdropFilter: "blur(10px)",
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          flexShrink: 0,
          borderRadius: "11px",
          background: "linear-gradient(135deg, #2A6DF0 0%, #5F8EE5 100%)",
          border: "1px solid #5F8EE5",
          boxShadow: "0 6px 16px rgba(42, 109, 240, 0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CompassMark />
      </Box>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 800,
            fontSize: "15px",
            lineHeight: "18px",
            color: "#ECF2FF",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {section.title}
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 500,
            fontSize: "11.5px",
            lineHeight: "15px",
            color: "#7E92BB",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {section.hint}
        </Typography>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          px: "9px",
          py: "5px",
          borderRadius: "999px",
          border: "1px solid #2E4470",
          background: "rgba(42, 109, 240, 0.12)",
        }}
      >
        <Typography
          sx={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 800,
            fontSize: "10.5px",
            lineHeight: "13px",
            letterSpacing: "0.4px",
            color: "#9DC0FF",
          }}
        >
          МГТУ
        </Typography>
      </Box>
    </Box>
  );
}

export default MobileAppHeader;
