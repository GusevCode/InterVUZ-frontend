import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import FloorChipSlider from "../shared/ui/FloorChipSlider";
import Map3D from "./Map3D";
import { getMapBaseName } from "../entities/map/routeGraphLib";

function FloorMapPanel({ mapVector, routePoints, label, transferHint, compact = false, showLabels = true }) {
  const mapWidth = mapVector?.width || 100;
  const mapHeight = mapVector?.height || 100;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minHeight: compact ? 220 : 280,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          {label}
        </Typography>
        {transferHint ? (
          <Chip size="small" label={transferHint} color="warning" variant="outlined" />
        ) : null}
      </Stack>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          flex: 1,
          minHeight: compact ? 200 : 260,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          aspectRatio: `${mapWidth} / ${mapHeight}`,
          maxHeight: compact ? 320 : 420,
        }}
      >
        <Map3D mapVector={mapVector} showLabels={showLabels} routePoints={routePoints} />
      </Box>
    </Box>
  );
}

export default function MapMultiFloorRouteView({
  segments = [],
  mapVectors = [],
  showLabels = true,
  dark = false,
}) {
  const isMobile = useMediaQuery("(max-width:900px)");
  const [activeStep, setActiveStep] = useState(0);

  const resolvedSegments = useMemo(() => {
    return segments
      .map((segment) => {
        const baseName = getMapBaseName(segment.graphId);
        const mapVector = mapVectors.find((item) => getMapBaseName(item.id) === baseName);
        if (!mapVector) {
          return null;
        }
        return { ...segment, mapVector };
      })
      .filter(Boolean);
  }, [segments, mapVectors]);

  if (resolvedSegments.length === 0) {
    return null;
  }

  const safeStep = Math.min(activeStep, resolvedSegments.length - 1);
  const current = resolvedSegments[safeStep];

  const hintColor = dark ? "#AFBFDE" : "text.secondary";

  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "13px",
            lineHeight: 1.45,
            color: hintColor,
          }}
        >
          Переключайте этажи — на карте показан маршрут только для выбранного участка.
        </Typography>
        <FloorChipSlider
          dark={dark}
          items={resolvedSegments.map((segment, index) => ({
            key: String(index),
            label: segment.label,
          }))}
          selectedKey={String(safeStep)}
          onSelect={(key) => setActiveStep(Number(key))}
        />

        <FloorMapPanel
          mapVector={current.mapVector}
          routePoints={current.points}
          label={current.label}
          transferHint={current.transferHint}
          showLabels={showLabels}
          compact
        />

      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {resolvedSegments.map((segment, index) => (
        <FloorMapPanel
          key={`${segment.floor}-${index}`}
          mapVector={segment.mapVector}
          routePoints={segment.points}
          label={segment.label}
          transferHint={segment.transferHint}
          showLabels={showLabels}
        />
      ))}
    </Stack>
  );
}
