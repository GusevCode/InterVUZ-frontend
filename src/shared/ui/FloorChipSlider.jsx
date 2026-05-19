import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";

function FloorChipSlider({ items, selectedKey, onSelect, dark = false }) {
  if (!items.length) {
    return null;
  }

  const chipSx = dark
    ? {
        flexShrink: 0,
        scrollSnapAlign: "start",
        fontFamily: "'Manrope', sans-serif",
        fontWeight: 600,
        color: "#E4EDFF",
        borderColor: "#4a6a9a",
        "& .MuiChip-label": { color: "inherit" },
        "&.MuiChip-filled": {
          color: "#ffffff",
          "& .MuiChip-label": { color: "#ffffff" },
        },
      }
    : {
        flexShrink: 0,
        scrollSnapAlign: "start",
        fontFamily: "'Manrope', sans-serif",
        fontWeight: 600,
      };

  return (
    <Box
      role="tablist"
      aria-label="Выбор этажа"
      sx={{
        display: "flex",
        gap: 1,
        overflowX: "auto",
        pb: 0.5,
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {items.map((item) => {
        const selected = item.key === selectedKey;
        return (
          <Chip
            key={item.key}
            size="small"
            label={item.label}
            clickable
            role="tab"
            aria-selected={selected}
            color={selected ? "primary" : "default"}
            variant={selected ? "filled" : "outlined"}
            onClick={() => onSelect(item.key, item)}
            sx={chipSx}
          />
        );
      })}
    </Box>
  );
}

export default FloorChipSlider;
