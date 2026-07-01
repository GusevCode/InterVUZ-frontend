import { useMemo } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import Typography from "@mui/material/Typography";
import Map3D from "./Map3D";
import { getMobileLandscapeMapFrameSx, FULLSCREEN_ROTATED_CAMERA_FIT, FULLSCREEN_MOBILE_VIEW_ROTATION_Z, FULLSCREEN_VIEW_ROTATION_Z } from "../entities/map/mapLib";
import { DEFAULT_LABEL_DISPLAY_MODE } from "../entities/map/roomLabelGroups";
import { getFloorFromMapId, getMapBaseName, getVisibleRouteLabelIdsForFloor } from "../entities/map/routeGraphLib";
import FullscreenRotatedMapFrame from "./FullscreenRotatedMapFrame";

const D = {
  labelColor: "#AFBFDE",
  headingColor: "#ECF2FF",
  sectionBorder: "#253654",
  mapBg: "#0a1222",
};

function resolveSegmentMapVector(segment, mapVectors) {
  const baseName = getMapBaseName(segment.graphId);
  const byGraphId = mapVectors.find((item) => getMapBaseName(item.id) === baseName);
  if (byGraphId) {
    return byGraphId;
  }

  return mapVectors.find((item) => getFloorFromMapId(item.id) === segment.floor) ?? null;
}

function buildRouteCaption(segments) {
  if (!segments || segments.length < 2) {
    return null;
  }

  const first = segments[0];
  const last = segments[segments.length - 1];
  const transferLabels = segments
    .slice(0, -1)
    .map((segment) => segment.transferHint)
    .filter(Boolean);
  const transfer = transferLabels.length > 0 ? transferLabels.join(", ") : "лестница";
  const fromLabel = first.label ?? `${first.floor} этаж`;
  const toLabel = last.label ?? `${last.floor} этаж`;

  return `${fromLabel} — ${transfer} — ${toLabel}`;
}

function buildRouteOverviewItems(segments) {
  const items = [];

  segments.forEach((segment, index) => {
    items.push({
      key: `floor-${index}`,
      kind: "floor",
      label: segment.label,
      segmentIndex: index,
    });

    if (segment.transferHint) {
      items.push({
        key: `transfer-${index}`,
        kind: "transfer",
        label: segment.transferHint,
      });
    }
  });

  return items;
}

function FloorMapPanel({
  mapVector,
  routePoints,
  compact = false,
  fullscreen = false,
  labelDisplayMode,
  routeVisibleLabelIds = null,
  dark = false,
  cameraFitPadding,
  labelCssRotation = 0,
  viewRotationZ = 0,
  lockCameraCenter = false,
  fillViewport = false,
}) {
  const mapWidth = mapVector?.width || 100;
  const mapHeight = mapVector?.height || 100;
  const resolvedCameraFit = cameraFitPadding ?? (fullscreen ? 0.94 : 1.04);

  return (
    <Box
      sx={{
        borderRadius: dark ? "12px" : 2,
        border: "1px solid",
        borderColor: dark ? D.sectionBorder : "divider",
        bgcolor: dark ? D.mapBg : "transparent",
        overflow: "hidden",
        ...(fullscreen
          ? {
            position: "absolute",
            inset: 0,
            touchAction: "none",
            overscrollBehavior: "none",
          }
          : compact
            ? getMobileLandscapeMapFrameSx(mapWidth, mapHeight)
            : {
              position: "relative",
              width: "100%",
              minHeight: 260,
              aspectRatio: `${mapWidth} / ${mapHeight}`,
              maxHeight: 420,
            }),
      }}
    >
      <Map3D
        mapVector={mapVector}
        labelDisplayMode={labelDisplayMode ?? DEFAULT_LABEL_DISPLAY_MODE}
        routePoints={routePoints}
        routeVisibleLabelIds={routeVisibleLabelIds}
        cameraFitPadding={resolvedCameraFit}
        labelCssRotation={labelCssRotation}
        viewRotationZ={viewRotationZ}
        lockCameraCenter={lockCameraCenter}
        fillViewport={fillViewport}
      />
    </Box>
  );
}

function RoutePathCaption({ caption, dark = false }) {
  if (!caption) {
    return null;
  }

  return (
    <Typography
      variant="body2"
      sx={{
        fontWeight: 600,
        letterSpacing: 0.1,
        color: dark ? D.headingColor : "text.primary",
        textAlign: { xs: "center", sm: "left" },
      }}
    >
      {caption}
    </Typography>
  );
}

function RouteOverviewBar({ items, activeStep, onSelectStep, dark = false, headerAction = null }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" useFlexGap>
      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        useFlexGap
        sx={{
          flex: 1,
          minWidth: 0,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {items.map((item) => {
          if (item.kind === "transfer") {
            return (
              <Chip
                key={item.key}
                size="small"
                label={item.label}
                variant="outlined"
                color="warning"
                sx={dark ? {
                  flexShrink: 0,
                  color: "#fcd34d",
                  borderColor: "rgba(251, 191, 36, 0.45)",
                } : { flexShrink: 0 }}
              />
            );
          }

          const selected = activeStep === item.segmentIndex;
          return (
            <Chip
              key={item.key}
              size="small"
              label={item.label}
              clickable
              color={selected ? "primary" : "default"}
              variant={selected ? "filled" : "outlined"}
              onClick={() => onSelectStep(item.segmentIndex)}
              sx={dark ? {
                flexShrink: 0,
                color: selected ? "#ffffff" : D.headingColor,
                borderColor: D.sectionBorder,
              } : { flexShrink: 0 }}
            />
          );
        })}
      </Stack>
      {headerAction ? (
        <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
          {headerAction}
        </Box>
      ) : null}
    </Stack>
  );
}

export default function MapMultiFloorRouteView({
  segments = [],
  mapVectors = [],
  labelDisplayMode,
  graphRoute = null,
  activeStep = 0,
  onSelectStep = () => {},
  dark = false,
  fullscreen = false,
  rotateInFullscreen = false,
  cameraFitPadding,
  headerAction = null,
}) {
  const isMobile = useMediaQuery("(max-width:900px)");

  const resolvedSegments = useMemo(() => {
    return segments
      .map((segment) => {
        const mapVector = resolveSegmentMapVector(segment, mapVectors);
        if (!mapVector) {
          return null;
        }
        return { ...segment, mapVector };
      })
      .filter(Boolean);
  }, [segments, mapVectors]);

  const overviewItems = useMemo(
    () => buildRouteOverviewItems(segments),
    [segments],
  );
  const routeCaption = useMemo(
    () => buildRouteCaption(segments),
    [segments],
  );
  const isMultiFloorRoute = segments.length >= 2;

  if (segments.length === 0) {
    return null;
  }

  const safeStep = Math.min(activeStep, segments.length - 1);
  const current = resolvedSegments[safeStep] ?? {
    ...segments[safeStep],
    mapVector: resolveSegmentMapVector(segments[safeStep], mapVectors),
  };

  if (!current?.mapVector) {
    return (
      <Stack spacing={1.25}>
        {isMultiFloorRoute && routeCaption ? (
          <RoutePathCaption caption={routeCaption} dark={dark} />
        ) : null}
        {overviewItems.length > 0 ? (
          <RouteOverviewBar
            items={overviewItems}
            activeStep={safeStep}
            onSelectStep={onSelectStep}
            dark={dark}
            headerAction={headerAction}
          />
        ) : null}
      </Stack>
    );
  }
  const compact = isMobile && !fullscreen;
  const resolvedCameraFit = cameraFitPadding ?? (
    fullscreen && rotateInFullscreen
      ? FULLSCREEN_ROTATED_CAMERA_FIT
      : fullscreen
        ? 0.94
        : undefined
  );
  const lockCameraCenter = fullscreen;
  const resolvedFillViewport = fullscreen && rotateInFullscreen;
  const currentRouteVisibleLabelIds = getVisibleRouteLabelIdsForFloor(graphRoute, current.floor);

  const mapPanel = (
    <FloorMapPanel
      mapVector={current.mapVector}
      routePoints={current.points}
      labelDisplayMode={labelDisplayMode}
      routeVisibleLabelIds={currentRouteVisibleLabelIds}
      compact={compact}
      fullscreen={fullscreen}
      dark={dark}
      cameraFitPadding={resolvedCameraFit}
      viewRotationZ={
        fullscreen
          ? (rotateInFullscreen ? FULLSCREEN_MOBILE_VIEW_ROTATION_Z : FULLSCREEN_VIEW_ROTATION_Z)
          : 0
      }
      lockCameraCenter={lockCameraCenter}
      fillViewport={resolvedFillViewport}
    />
  );

  return (
    <Stack
      spacing={fullscreen && rotateInFullscreen ? 0 : 1.25}
      sx={fullscreen ? { height: "100%", minHeight: 0, display: "flex", position: "relative", overflow: "hidden" } : undefined}
    >
      {isMultiFloorRoute && routeCaption ? (
        <RoutePathCaption caption={routeCaption} dark={dark} />
      ) : null}
      {overviewItems.length > 0 ? (
        <RouteOverviewBar
          items={overviewItems}
          activeStep={safeStep}
          onSelectStep={onSelectStep}
          dark={dark}
          headerAction={headerAction}
        />
      ) : null}

      {fullscreen && rotateInFullscreen ? (
        <Box
          sx={{
            position: "absolute",
            top: (isMultiFloorRoute && routeCaption) || overviewItems.length > 0 ? 56 : 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "hidden",
            touchAction: "none",
          }}
        >
          <FullscreenRotatedMapFrame>
            {mapPanel}
          </FullscreenRotatedMapFrame>
        </Box>
      ) : (
        mapPanel
      )}
    </Stack>
  );
}
