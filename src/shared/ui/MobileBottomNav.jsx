import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useLocation, useNavigate } from "react-router-dom";

const C_ACTIVE = "#DEECFF";
const C_INACTIVE = "#8FA4C9";

function MapIcon({ active }) {
  const c = active ? C_ACTIVE : C_INACTIVE;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g opacity="0.9">
        <path
          d="M8 14C8 14 12.6667 11.1 12.6667 7.33329C12.6667 6.72046 12.546 6.11362 12.3114 5.54744C12.0769 4.98125 11.7332 4.4668 11.2998 4.03346C10.8665 3.60012 10.352 3.25638 9.78586 3.02185C9.21967 2.78733 8.61283 2.66663 8 2.66663C7.38716 2.66663 6.78033 2.78733 6.21414 3.02185C5.64796 3.25638 5.13351 3.60012 4.70017 4.03346C4.26683 4.4668 3.92308 4.98125 3.68856 5.54744C3.45404 6.11362 3.33333 6.72046 3.33333 7.33329C3.33333 11.1 8 14 8 14Z"
          stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        />
        <path
          d="M8 8.99996C8.92047 8.99996 9.66667 8.25377 9.66667 7.33329C9.66667 6.41282 8.92047 5.66663 8 5.66663C7.07952 5.66663 6.33333 6.41282 6.33333 7.33329C6.33333 8.25377 7.07952 8.99996 8 8.99996Z"
          stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function ScheduleIcon({ active }) {
  const c = active ? C_ACTIVE : C_INACTIVE;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g opacity="0.9">
        <path
          d="M12.3333 3H3.66667C2.74619 3 2 3.74619 2 4.66667V12C2 12.9205 2.74619 13.6667 3.66667 13.6667H12.3333C13.2538 13.6667 14 12.9205 14 12V4.66667C14 3.74619 13.2538 3 12.3333 3Z"
          stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        />
        <path
          d="M5.33333 2V4M10.6667 2V4M2 6.33333H14"
          stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function ServicesIcon({ active }) {
  const c = active ? C_ACTIVE : C_INACTIVE;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g opacity="0.9">
        <path d="M6.33333 2H3C2.44772 2 2 2.44772 2 3V6.33333C2 6.88562 2.44772 7.33333 3 7.33333H6.33333C6.88562 7.33333 7.33333 6.88562 7.33333 6.33333V3C7.33333 2.44772 6.88562 2 6.33333 2Z" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 2H9.66667C9.11439 2 8.66667 2.44772 8.66667 3V6.33333C8.66667 6.88562 9.11439 7.33333 9.66667 7.33333H13C13.5523 7.33333 14 6.88562 14 6.33333V3C14 2.44772 13.5523 2 13 2Z" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.33333 8.66663H3C2.44772 8.66663 2 9.11434 2 9.66663V13C2 13.5522 2.44772 14 3 14H6.33333C6.88562 14 7.33333 13.5522 7.33333 13V9.66663C7.33333 9.11434 6.88562 8.66663 6.33333 8.66663Z" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 8.66663H9.66667C9.11439 8.66663 8.66667 9.11434 8.66667 9.66663V13C8.66667 13.5522 9.11439 14 9.66667 14H13C13.5523 14 14 13.5522 14 13V9.66663C14 9.11434 13.5523 8.66663 13 8.66663Z" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  );
}

function ProfileIcon({ active }) {
  const c = active ? C_ACTIVE : C_INACTIVE;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g opacity="0.9">
        <path
          d="M8.00001 7.66667C9.28867 7.66667 10.3333 6.622 10.3333 5.33333C10.3333 4.04467 9.28867 3 8.00001 3C6.71134 3 5.66667 4.04467 5.66667 5.33333C5.66667 6.622 6.71134 7.66667 8.00001 7.66667Z"
          stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        />
        <path
          d="M3.33333 13.3333C3.33333 12.0956 3.82499 10.9086 4.70016 10.0335C5.57533 9.15829 6.76232 8.66663 8 8.66663C9.23767 8.66663 10.4247 9.15829 11.2998 10.0335C12.175 10.9086 12.6667 12.0956 12.6667 13.3333"
          stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

const NAV_TABS = [
  { label: "Карта", path: "/map", Icon: MapIcon },
  { label: "Расписание", path: "/schedule", Icon: ScheduleIcon },
  { label: "Сервисы", path: "/booking", Icon: ServicesIcon },
  { label: "Профиль", path: null, Icon: ProfileIcon },
];

function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (!path) return false;
    if (path === "/booking") {
      return location.pathname.startsWith("/booking") || location.pathname.startsWith("/news");
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "72px",
        bgcolor: "rgba(10, 17, 30, 0.95)",
        borderTop: "1px solid #253654",
        display: { xs: "flex", sm: "none" },
        alignItems: "center",
        zIndex: 1200,
        px: "8px",
        gap: "4px",
      }}
    >
      {NAV_TABS.map(({ label, path, Icon }) => {
        const active = isActive(path);
        return (
          <Box
            key={label}
            onClick={() => path && navigate(path)}
            sx={{
              flex: 1,
              height: "50px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              borderRadius: "10px",
              cursor: path ? "pointer" : "default",
              bgcolor: active ? "#1A2D4C" : "transparent",
              border: active ? "1px solid rgba(76, 141, 255, 0.34)" : "1px solid transparent",
              transition: "background-color 150ms ease",
            }}
          >
            <Icon active={active} />
            <Typography
              sx={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700,
                fontSize: "11.5px",
                lineHeight: "12px",
                color: active ? C_ACTIVE : C_INACTIVE,
              }}
            >
              {label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export default MobileBottomNav;
