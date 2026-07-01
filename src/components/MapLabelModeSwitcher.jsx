import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { LABEL_DISPLAY_MODE_OPTIONS } from "../entities/map/roomLabelGroups";

export default function MapLabelModeSwitcher({ value, onChange, dark = false, sx }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, nextValue) => {
        if (nextValue !== null) {
          onChange(nextValue);
        }
      }}
      size="small"
      aria-label={"\u0420\u0435\u0436\u0438\u043c \u043f\u043e\u0434\u043f\u0438\u0441\u0435\u0439 \u0430\u0443\u0434\u0438\u0442\u043e\u0440\u0438\u0439"}
      sx={{
        pointerEvents: "auto",
        bgcolor: dark ? "rgba(15, 23, 42, 0.82)" : "rgba(255, 255, 255, 0.92)",
        border: "1px solid",
        borderColor: dark ? "rgba(148, 163, 184, 0.35)" : "rgba(148, 163, 184, 0.55)",
        borderRadius: "8px !important",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.18)",
        "& .MuiToggleButton-root": {
          px: 1.1,
          py: 0.45,
          minWidth: 40,
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1.2,
          textTransform: "none",
          color: dark ? "#cbd5e1" : "#334155",
          border: 0,
          borderRadius: "6px !important",
          "&.Mui-selected": {
            bgcolor: dark ? "#2F5FA8" : "primary.main",
            color: "#ffffff",
            "&:hover": {
              bgcolor: dark ? "#3A6FBE" : "primary.dark",
            },
          },
        },
        ...sx,
      }}
    >
      {LABEL_DISPLAY_MODE_OPTIONS.map((option) => (
        <ToggleButton key={option.value} value={option.value}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
