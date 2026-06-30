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
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 8.99996C8.92047 8.99996 9.66667 8.25377 9.66667 7.33329C9.66667 6.41282 8.92047 5.66663 8 5.66663C7.07952 5.66663 6.33333 6.41282 6.33333 7.33329C6.33333 8.25377 7.07952 8.99996 8 8.99996Z"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function AssistantIcon({ active }) {
  const c = active ? C_ACTIVE : C_INACTIVE;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g opacity="0.9">
        <path
          d="M3.33333 3.33337H12.6667C13.219 3.33337 13.6667 3.78109 13.6667 4.33337V9.66671C13.6667 10.219 13.219 10.6667 12.6667 10.6667H7.33333L4.33333 12.6667V10.6667H3.33333C2.78105 10.6667 2.33333 10.219 2.33333 9.66671V4.33337C2.33333 3.78109 2.78105 3.33337 3.33333 3.33337Z"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.33333 6.66663H10.6667M5.33333 8.33329H9.33333"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
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
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.33333 2V4M10.6667 2V4M2 6.33333H14"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function BookingIcon({ active }) {
  const c = active ? C_ACTIVE : C_INACTIVE;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g opacity="0.9">
        <circle cx="5.5" cy="5.5" r="2.5" stroke={c} strokeWidth="1.2" />
        <path
          d="M7.4 7.4L13 13M9.6 10.6L11.2 12.2M11.2 8.8L12.8 10.4"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function NewsIcon({ active }) {
  const c = active ? C_ACTIVE : C_INACTIVE;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g opacity="0.9">
        <rect x="2.33" y="3" width="11.33" height="10" rx="1.5" stroke={c} strokeWidth="1.2" />
        <path
          d="M4.83 6h6.33M4.83 8.5h6.33M4.83 11h3.5"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

const NAV_TABS = [
  { label: "Карта", path: "/map", Icon: MapIcon },
  { label: "Расписание", path: "/schedule", Icon: ScheduleIcon },
  { label: "Брони", path: "/booking", Icon: BookingIcon },
  { label: "Новости", path: "/news", Icon: NewsIcon },
  { label: "Чат", path: "/assistant", Icon: AssistantIcon },
];

function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (!path) {
      return false;
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
        minHeight: "72px",
        bgcolor: "rgba(10, 17, 30, 0.95)",
        borderTop: "1px solid #253654",
        display: { xs: "flex", sm: "none" },
        alignItems: "center",
        zIndex: 1200,
        px: "6px",
        gap: "3px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {NAV_TABS.map(({ label, path, Icon }) => {
        const active = isActive(path);
        return (
          <Box
            key={label}
            onClick={() => navigate(path)}
            sx={{
              flex: 1,
              minWidth: 0,
              height: "50px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              borderRadius: "10px",
              cursor: "pointer",
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
                fontSize: "10.3px",
                lineHeight: "11px",
                color: active ? C_ACTIVE : C_INACTIVE,
                whiteSpace: "nowrap",
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
