import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Map3D from "../../components/Map3D";
import { buildBookingUrl } from "../../shared/bookingForm";
import MapRoutePlanner from "../../components/MapRoutePlanner";
import MapLabelModeSwitcher from "../../components/MapLabelModeSwitcher";
import MapMultiFloorRouteView from "../../components/MapMultiFloorRouteView";
import FullscreenRotatedMapFrame, {
  FULLSCREEN_MAP_HEIGHT,
  FULLSCREEN_MAP_WIDTH,
} from "../../components/FullscreenRotatedMapFrame";
import { getFloorFromMapId } from "../../entities/map/routeGraphLib";
import {
  FULLSCREEN_ROTATED_CAMERA_FIT,
  FULLSCREEN_MOBILE_VIEW_ROTATION_Z,
  FULLSCREEN_VIEW_ROTATION_Z,
  getMobileLandscapeMapFrameSx,
} from "../../entities/map/mapLib";

const M = {
  sectionSimpleBg: "#121F35",
  sectionBorder: "#253654",
  articleBg: "#172842",
  articleBorder: "#355180",
  labelColor: "#AFBFDE",
  headingColor: "#ECF2FF",
  bodyColor: "#96A7C9",
  mapBg: "#0a1222",
};

function MapFullscreenEnterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3 7V3H7M11 3H15V7M15 11V15H11M7 15H3V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MapFullscreenExitIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M7 3H3V7M11 3H15V7M15 11H11V15M7 15H3V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MapFullscreenButton({ active, onClick, sx }) {
  return (
    <IconButton
      aria-label={active ? "Выйти из полноэкранного режима карты" : "Карта на весь экран"}
      onClick={onClick}
      sx={{
        width: 36,
        height: 36,
        bgcolor: "rgba(15, 23, 42, 0.82)",
        border: "1px solid rgba(148, 163, 184, 0.35)",
        color: "#ffffff",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.28)",
        "&:hover": {
          bgcolor: "rgba(30, 41, 59, 0.92)",
        },
        ...sx,
      }}
    >
      {active ? <MapFullscreenExitIcon /> : <MapFullscreenEnterIcon />}
    </IconButton>
  );
}

function FloorMapCanvas({
  is3D,
  mapVector,
  mapImage,
  hasMapAsset,
  mapWidth,
  mapHeight,
  selectedVectorId,
  targetVectorId,
  setSelectedVectorId,
  displayRoutePoints,
  routePoints,
  routePolylinePoints,
  getRoutePointCoordinates,
  getCoordinatePercent,
  mapPois,
  places,
  selectedPlaceId,
  setSelectedPlaceId,
  routeFromPlaceId,
  routeToPlaceId,
  targetPlaceId,
  selectedPlace,
  cameraFitPadding = 1.04,
  viewRotationZ = 0,
  labelCssRotation = 0,
  lockCameraCenter = false,
  labelDisplayMode,
  routeVisibleLabelIds = null,
  fillViewport = false,
}) {
  return (
    <>
      {is3D ? (
        <Box sx={{ position: "absolute", inset: 0 }}>
          <Map3D
            mapVector={mapVector}
            selectedId={selectedVectorId}
            targetId={targetVectorId}
            onSelect={setSelectedVectorId}
            routePoints={displayRoutePoints}
            cameraFitPadding={cameraFitPadding}
            viewRotationZ={viewRotationZ}
            labelCssRotation={labelCssRotation}
            lockCameraCenter={lockCameraCenter}
            labelDisplayMode={labelDisplayMode}
            routeVisibleLabelIds={routeVisibleLabelIds}
            fillViewport={fillViewport}
          />
        </Box>
      ) : mapImage ? (
        <Box
          component="img"
          src={mapImage.src}
          alt={mapImage.alt}
          sx={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            userSelect: "none",
          }}
        />
      ) : (
        <Stack
          spacing={1}
          alignItems="center"
          justifyContent="center"
          sx={{
            position: "absolute",
            inset: 0,
            px: 2,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          <Typography variant="subtitle1">загрузка схемы</Typography>
        </Stack>
      )}

      {!is3D && routePoints.length >= 2 ? (
        <Box
          component="svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "visible",
            zIndex: 10,
          }}
        >
          <polyline
            points={routePolylinePoints}
            fill="none"
            stroke="#0f766e"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {routePoints.map((point, index) => {
            const coordinates = getRoutePointCoordinates(point, mapWidth, mapHeight);
            const isEdgePoint = index === 0 || index === routePoints.length - 1;

            return (
              <circle
                key={`${point.order}-${point.placeId || point.instruction}`}
                cx={coordinates.x}
                cy={coordinates.y}
                r={isEdgePoint ? 1.8 : 1.3}
                fill={isEdgePoint ? "#0f766e" : "#ffffff"}
                stroke="#0f766e"
                strokeWidth="0.7"
              />
            );
          })}
        </Box>
      ) : null}

      {!is3D && mapPois.map((poi) => {
        const isSelectedPoi = selectedVectorId === poi.id;
        const isTargetPoi = targetVectorId === poi.id;
        return (
          <Box
            key={poi.id}
            onClick={() => setSelectedVectorId(poi.id)}
            title={poi.title || poi.id}
            sx={{
              position: "absolute",
              left: `${getCoordinatePercent(poi.x, mapWidth)}%`,
              top: `${getCoordinatePercent(poi.y, mapHeight)}%`,
              transform: "translate(-50%, -50%)",
              width: isSelectedPoi || isTargetPoi ? 18 : 14,
              height: isSelectedPoi || isTargetPoi ? 18 : 14,
              borderRadius: "50%",
              border: "2px solid #ffffff",
              bgcolor: "#f59e0b",
              boxShadow: "0 4px 14px rgba(22, 33, 48, 0.34)",
              cursor: "pointer",
              transition: "all 160ms ease",
              zIndex: 3,
            }}
          />
        );
      })}

      {!is3D && places.map((place) => {
        const isSelected = place.id === selectedPlaceId;
        const isRouteFrom = place.id === routeFromPlaceId;
        const isRouteTo = place.id === routeToPlaceId;
        const left = `${getCoordinatePercent(place.coordinates.x, mapWidth)}%`;
        const top = `${getCoordinatePercent(place.coordinates.y, mapHeight)}%`;
        const backgroundColor = isRouteFrom
          ? "#0f766e"
          : isRouteTo
            ? "#2563eb"
            : isSelected
              ? "#1f3a5f"
              : "#d14b4b";

        return (
          <Box
            key={place.id}
            onClick={() => setSelectedPlaceId(place.id)}
            title={place.name}
            sx={{
              position: "absolute",
              left,
              top,
              transform: "translate(-50%, -50%)",
              width: isSelected || isRouteFrom || isRouteTo ? 22 : 18,
              height: isSelected || isRouteFrom || isRouteTo ? 22 : 18,
              borderRadius: "50%",
              border: "3px solid #ffffff",
              bgcolor: backgroundColor,
              boxShadow: "0 4px 14px rgba(22, 33, 48, 0.24)",
              cursor: "pointer",
              transition: "all 160ms ease",
            }}
          />
        );
      })}

      {!is3D && targetPlaceId ? places.filter((place) => place.id === targetPlaceId).map((place) => (
        <Box
          key={`target-${place.id}`}
          sx={{
            position: "absolute",
            left: `${getCoordinatePercent(place.coordinates.x, mapWidth)}%`,
            top: `${getCoordinatePercent(place.coordinates.y, mapHeight)}%`,
            transform: "translate(-50%, -50%)",
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "2px solid rgba(248, 113, 113, 0.95)",
            boxShadow: "0 0 0 6px rgba(248, 113, 113, 0.20)",
            pointerEvents: "none",
          }}
        />
      )) : null}

      {!is3D && targetVectorId ? mapPois.filter((poi) => poi.id === targetVectorId).map((poi) => (
        <Box
          key={`target-poi-${poi.id}`}
          sx={{
            position: "absolute",
            left: `${getCoordinatePercent(poi.x, mapWidth)}%`,
            top: `${getCoordinatePercent(poi.y, mapHeight)}%`,
            transform: "translate(-50%, -50%)",
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "2px solid rgba(245, 158, 11, 0.95)",
            boxShadow: "0 0 0 6px rgba(245, 158, 11, 0.20)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      )) : null}

      {!is3D && selectedPlace ? (
        <Box
          sx={{
            position: "absolute",
            left: `${getCoordinatePercent(selectedPlace.coordinates.x, mapWidth)}%`,
            top: `calc(${getCoordinatePercent(selectedPlace.coordinates.y, mapHeight)}% - 22px)`,
            transform: "translate(-50%, -100%)",
            px: 1.25,
            py: 0.5,
            borderRadius: 1.5,
            bgcolor: "rgba(31, 58, 95, 0.92)",
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {selectedPlace.name}
        </Box>
      ) : null}
    </>
  );
}

function MapPageView({
  floors,
  selectedFloorId,
  setSelectedFloorId,
  selectedFloor,
  places,
  routeFromPlaceId,
  setRouteFromPlaceId,
  routeToPlaceId,
  setRouteToPlaceId,
  handleBuildRoute,
  isRouteDisabled,
  isBuildingRoute,
  routeError,
  route,
  routeFromPlace,
  routeToPlace,
  isLoading,
  error,
  mapWarning,
  selectedPlaceId,
  setSelectedPlaceId,
  selectedPlace,
  scheduleDate,
  setScheduleDate,
  roomSchedule,
  isLoadingRoomSchedule,
  roomScheduleError,
  mapImage,
  mapVector,
  mapPois,
  mapVectors,
  selectedMapId,
  setSelectedMapId,
  mapGraph,
  mapGraphs,
  floorConnections,
  multiFloorRoute,
  setMultiFloorRoute,
  hasMultiFloorRoute,
  routeSegments,
  routeSegmentIndex,
  onSelectRouteSegment,
  handleSelectMap,
  handleSelectFloor,
  handleRouteFloorChange,
  displayRoutePoints,
  selectedVectorId,
  targetVectorId,
  targetPlaceId,
  setSelectedVectorId,
  labelDisplayMode,
  onLabelDisplayModeChange,
  localRoutePoints,
  setLocalRoutePoints,
  setGraphRoute,
  graphRoute,
  routeLocked = false,
  routeVisibleLabelIds,
  mapWidth,
  mapHeight,
  hasMapAsset,
  is3D,
  routePoints,
  routePolylinePoints,
  getCoordinatePercent,
  getRoutePointCoordinates,
}) {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [lockedViewport, setLockedViewport] = useState(null);
  const fullscreenOverlayRef = useRef(null);
  const fullscreenScrollYRef = useRef(0);
  const activeMapFloor = getFloorFromMapId(selectedMapId);
  const dark = isMobile;

  useEffect(() => {
    if (!isMapFullscreen || !isMobile) {
      setLockedViewport(null);
      return undefined;
    }

    const updateViewport = () => {
      setLockedViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();

    window.addEventListener("orientationchange", updateViewport);
    window.addEventListener("resize", updateViewport);
    return () => {
      window.removeEventListener("orientationchange", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, [isMapFullscreen, isMobile]);

  useEffect(() => {
    if (!isMapFullscreen) {
      return undefined;
    }

    fullscreenScrollYRef.current = window.scrollY;
    const { style: htmlStyle } = document.documentElement;
    const { style: bodyStyle } = document.body;
    const previousHtmlOverflow = htmlStyle.overflow;
    const previousBodyOverflow = bodyStyle.overflow;
    const previousHtmlOverscroll = htmlStyle.overscrollBehavior;
    const previousBodyOverscroll = bodyStyle.overscrollBehavior;
    const previousBodyTouchAction = bodyStyle.touchAction;
    const previousBodyPosition = bodyStyle.position;
    const previousBodyTop = bodyStyle.top;
    const previousBodyLeft = bodyStyle.left;
    const previousBodyRight = bodyStyle.right;
    const previousBodyWidth = bodyStyle.width;

    htmlStyle.overflow = "hidden";
    bodyStyle.overflow = "hidden";
    htmlStyle.overscrollBehavior = "none";
    bodyStyle.overscrollBehavior = "none";
    bodyStyle.touchAction = "none";
    bodyStyle.position = "fixed";
    bodyStyle.top = `-${fullscreenScrollYRef.current}px`;
    bodyStyle.left = "0";
    bodyStyle.right = "0";
    bodyStyle.width = "100%";

    const preventTouchMove = (event) => {
      event.preventDefault();
    };
    const preventViewportShift = () => {
      window.scrollTo(0, fullscreenScrollYRef.current);
    };

    document.addEventListener("touchmove", preventTouchMove, { passive: false });
    window.visualViewport?.addEventListener("scroll", preventViewportShift);
    window.visualViewport?.addEventListener("resize", preventViewportShift);

    return () => {
      htmlStyle.overflow = previousHtmlOverflow;
      bodyStyle.overflow = previousBodyOverflow;
      htmlStyle.overscrollBehavior = previousHtmlOverscroll;
      bodyStyle.overscrollBehavior = previousBodyOverscroll;
      bodyStyle.touchAction = previousBodyTouchAction;
      bodyStyle.position = previousBodyPosition;
      bodyStyle.top = previousBodyTop;
      bodyStyle.left = previousBodyLeft;
      bodyStyle.right = previousBodyRight;
      bodyStyle.width = previousBodyWidth;
      document.removeEventListener("touchmove", preventTouchMove);
      window.visualViewport?.removeEventListener("scroll", preventViewportShift);
      window.visualViewport?.removeEventListener("resize", preventViewportShift);
      window.scrollTo(0, fullscreenScrollYRef.current);
    };
  }, [isMapFullscreen]);

  const panelCardSx = dark
    ? {
        borderRadius: "18px",
        bgcolor: M.sectionSimpleBg,
        border: `1px solid ${M.sectionBorder}`,
        boxShadow: "0px 10px 28px rgba(6, 10, 22, 0.33)",
        backgroundImage: "none",
      }
    : { borderRadius: 2 };

  const panelCardContentSx = dark
    ? { p: 1.5, "&:last-child": { pb: 1.5 } }
    : { p: { xs: 2, sm: 3 } };

  const mapCardContentSx = dark
    ? { p: 1, pt: 1, "&:last-child": { pb: 1 } }
    : { p: { xs: 2, sm: 3 } };

  const mapCanvasProps = {
    is3D,
    mapVector,
    mapImage,
    hasMapAsset,
    mapWidth,
    mapHeight,
    selectedVectorId,
    targetVectorId,
    setSelectedVectorId,
    displayRoutePoints,
    routePoints,
    routePolylinePoints,
    getRoutePointCoordinates,
    getCoordinatePercent,
    mapPois,
    places,
    selectedPlaceId,
    setSelectedPlaceId,
    routeFromPlaceId,
    routeToPlaceId,
    targetPlaceId,
    selectedPlace,
    labelDisplayMode,
    routeVisibleLabelIds,
  };

  const multiFloorRouteProps = {
    segments: routeSegments,
    mapVectors,
    labelDisplayMode,
    graphRoute,
    activeStep: routeSegmentIndex,
    onSelectStep: onSelectRouteSegment,
    dark,
  };

  const multiFloorFullscreenAction = isMobile ? (
    <MapFullscreenButton
      active={isMapFullscreen}
      onClick={() => setIsMapFullscreen((value) => !value)}
    />
  ) : null;

  const mapLabelSwitcher = is3D ? (
    <MapLabelModeSwitcher
      value={labelDisplayMode}
      onChange={onLabelDisplayModeChange}
      dark={dark}
    />
  ) : null;

  return (
    <>
      {isMapFullscreen ? (
        <Box
          ref={fullscreenOverlayRef}
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 2000,
            bgcolor: "#0E182A",
            display: "flex",
            flexDirection: "column",
            touchAction: "none",
            overscrollBehavior: "none",
            ...(lockedViewport
              ? {
                width: `${lockedViewport.width}px`,
                height: `${lockedViewport.height}px`,
                maxWidth: `${lockedViewport.width}px`,
                maxHeight: `${lockedViewport.height}px`,
              }
              : {
                inset: 0,
                width: "100%",
                height: "100%",
              }),
          }}
        >
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              position: "relative",
              overflow: "hidden",
              touchAction: "none",
              overscrollBehavior: "none",
            }}
          >
            {hasMultiFloorRoute ? (
              <MapMultiFloorRouteView
                {...multiFloorRouteProps}
                fullscreen
                rotateInFullscreen={isMobile}
                cameraFitPadding={isMobile ? FULLSCREEN_ROTATED_CAMERA_FIT : 0.94}
                headerAction={multiFloorFullscreenAction}
              />
            ) : isMobile ? (
              <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", touchAction: "none" }}>
                <FullscreenRotatedMapFrame>
                  <FloorMapCanvas
                    key="map-fullscreen"
                    {...mapCanvasProps}
                    cameraFitPadding={FULLSCREEN_ROTATED_CAMERA_FIT}
                    viewRotationZ={FULLSCREEN_MOBILE_VIEW_ROTATION_Z}
                    lockCameraCenter
                    fillViewport
                  />
                </FullscreenRotatedMapFrame>
              </Box>
            ) : (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: FULLSCREEN_MAP_WIDTH,
                    height: FULLSCREEN_MAP_HEIGHT,
                    maxWidth: FULLSCREEN_MAP_WIDTH,
                    maxHeight: FULLSCREEN_MAP_HEIGHT,
                  }}
                >
                  <FloorMapCanvas
                    {...mapCanvasProps}
                    cameraFitPadding={FULLSCREEN_ROTATED_CAMERA_FIT}
                    viewRotationZ={FULLSCREEN_VIEW_ROTATION_Z}
                    lockCameraCenter
                  />
                </Box>
              </Box>
            )}
          </Box>
          {!hasMultiFloorRoute ? (
            <MapFullscreenButton
              active
              onClick={() => setIsMapFullscreen(false)}
              sx={{
                position: "absolute",
                top: "max(12px, env(safe-area-inset-top, 0px))",
                right: "max(12px, env(safe-area-inset-right, 0px))",
                zIndex: 5,
              }}
            />
          ) : null}
        </Box>
      ) : null}

    <Grid container spacing={dark ? 1.5 : 2}>
      <Grid size={{ xs: 12, md: 4 }} sx={{ order: { xs: 2, md: 1 } }}>
        <Card sx={{ height: "100%", ...panelCardSx }}>
          <CardContent sx={panelCardContentSx}>
            <Stack spacing={dark ? 1.5 : 2}>
              {mapVectors.length > 0 ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {mapVectors.map((vector) => (
                    <Chip
                      key={vector.id}
                      label={vector.label}
                      clickable
                      color={vector.id === selectedMapId ? "primary" : "default"}
                      variant={vector.id === selectedMapId ? "filled" : "outlined"}
                      onClick={() => handleSelectMap(vector.id)}
                      sx={dark ? {
                        color: vector.id === selectedMapId ? "#ffffff" : M.headingColor,
                        borderColor: M.articleBorder,
                      } : undefined}
                    />
                  ))}
                </Stack>
              ) : null}

              {mapGraphs.length > 0 ? (
                <>
                  {dark ? null : <Divider />}
                  <MapRoutePlanner
                    mapGraphs={mapGraphs}
                    floorConnections={floorConnections}
                    onSingleFloorRouteChange={setLocalRoutePoints}
                    onMultiFloorRouteChange={setMultiFloorRoute}
                    onGraphRouteChange={setGraphRoute}
                    onRouteFloorChange={handleRouteFloorChange}
                    activeFloor={activeMapFloor}
                    selectedElementId={selectedVectorId}
                    routeLocked={routeLocked}
                    dark={dark}
                  />
                  {dark ? null : <Divider />}
                </>
              ) : null}

              {isLoading ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CircularProgress size={20} sx={dark ? { color: M.labelColor } : undefined} />
                  <Typography variant="body2" sx={dark ? { color: M.bodyColor } : undefined}>
                    Загрузка схемы...
                  </Typography>
                </Stack>
              ) : null}

              {error ? <Alert severity="error">{error}</Alert> : null}
              {mapWarning ? <Alert severity="warning">{mapWarning}</Alert> : null}

              {!isLoading && !error && floors.length === 0 ? (
                <Alert severity="warning">Бэкенд не вернул доступные этажи через `/places`.</Alert>
              ) : null}


              {selectedPlace ? (
                <Card
                  variant="outlined"
                  sx={{
                    position: "relative",
                    ...(dark ? {
                      bgcolor: M.articleBg,
                      borderColor: M.articleBorder,
                      backgroundImage: "none",
                    } : {}),
                  }}
                >
                  <CardContent sx={{ p: 2, pb: selectedPlace.type === "classroom" ? 6.5 : 2 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mb: 1.5 }}
                    >
                      <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap" useFlexGap>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={dark ? { color: M.bodyColor } : {}}
                        >
                          {selectedPlace.description}
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          sx={dark ? { color: M.headingColor } : undefined}
                        >
                          {selectedPlace.name}
                        </Typography>
                      </Stack>
                      <Chip
                        label={selectedPlace.isAccessible ? "доступно" : "только по лестнице"}
                        size="small"
                        color={selectedPlace.isAccessible ? "success" : "default"}
                        variant="outlined"
                        sx={dark && !selectedPlace.isAccessible ? {
                          color: M.headingColor,
                          borderColor: M.articleBorder,
                          "& .MuiChip-label": { color: M.headingColor },
                        } : undefined}
                      />
                    </Stack>
                    {selectedPlace.type === "classroom" ? (
                      <RoomSchedulePanel
                        selectedPlace={selectedPlace}
                        scheduleDate={scheduleDate}
                        setScheduleDate={setScheduleDate}
                        roomSchedule={roomSchedule}
                        isLoadingRoomSchedule={isLoadingRoomSchedule}
                        roomScheduleError={roomScheduleError}
                        dark={dark}
                      />
                    ) : null}
                  </CardContent>
                  {selectedPlace.type === "classroom" ? (
                    <BookingNavigateButton
                      placeId={selectedPlace.id}
                      scheduleDate={scheduleDate}
                      dark={dark}
                    />
                  ) : null}
                </Card>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }} sx={{ order: { xs: 1, md: 2 } }}>
        <Card sx={{ ...panelCardSx, overflow: "hidden" }}>
          <CardContent sx={mapCardContentSx}>
            {isMapFullscreen && isMobile ? (
              <Box
                sx={{
                  ...(hasMultiFloorRoute
                    ? { minHeight: 220, width: "100%" }
                    : getMobileLandscapeMapFrameSx(mapWidth, mapHeight)),
                  borderRadius: dark ? "12px" : 2,
                  bgcolor: M.mapBg,
                  border: "1px solid",
                  borderColor: dark ? M.sectionBorder : "divider",
                }}
                aria-hidden
              />
            ) : hasMultiFloorRoute ? (
              <MapMultiFloorRouteView
                {...multiFloorRouteProps}
                headerAction={multiFloorFullscreenAction}
              />
            ) : (
            <Box sx={{ position: "relative" }}>
              {isMobile ? (
                <MapFullscreenButton
                  active={false}
                  onClick={() => setIsMapFullscreen(true)}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 5,
                  }}
                />
              ) : null}
              <Box
                sx={{
                  ...(isMobile
                    ? getMobileLandscapeMapFrameSx(mapWidth, mapHeight)
                    : {
                        position: "relative",
                        width: "100%",
                        aspectRatio: hasMapAsset ? `${mapWidth} / ${mapHeight}` : "16 / 9",
                      }),
                  borderRadius: dark ? "12px" : 2,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: dark ? M.sectionBorder : "divider",
                  bgcolor: dark || is3D ? M.mapBg : hasMapAsset ? "#f4f5f7" : "#f8fafc",
                  backgroundImage: dark || hasMapAsset
                    ? "none"
                    : "linear-gradient(135deg, rgba(207, 216, 220, 0.35), rgba(236, 239, 241, 0.9))",
                }}
              >
                <FloorMapCanvas {...mapCanvasProps} />
              </Box>
              {mapLabelSwitcher ? (
                <Box sx={{ mt: 1 }}>
                  {mapLabelSwitcher}
                </Box>
              ) : null}
            </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
    </>
  );
}

function BookingNavigateButton({ placeId, scheduleDate, dark = false }) {
  const navigate = useNavigate();

  return (
    <Button
      size="small"
      variant="contained"
      onClick={() => navigate(buildBookingUrl({ roomId: placeId, date: scheduleDate }))}
      sx={{
        position: "absolute",
        right: 12,
        bottom: 12,
        textTransform: "none",
        fontWeight: 600,
        ...(dark
          ? {
              bgcolor: "#2F5FA8",
              "&:hover": { bgcolor: "#3A6FBE" },
            }
          : {}),
      }}
    >
      Забронировать
    </Button>
  );
}

function RoomSchedulePanel({
  selectedPlace,
  scheduleDate,
  setScheduleDate,
  roomSchedule,
  isLoadingRoomSchedule,
  roomScheduleError,
  dark = false,
}) {
  const textColor = dark ? "#ECF2FF" : "text.primary";
  const mutedColor = dark ? "#AFBFDE" : "text.secondary";

  return (
    <Box sx={{ mt: 2 }}>
      <Stack spacing={1.25}>
        <TextField
          label="Дата расписания"
          type="date"
          size="small"
          value={scheduleDate}
          onChange={(event) => setScheduleDate(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={dark ? {
            input: { color: "#E4EDFF", colorScheme: "dark" },
            label: { color: mutedColor },
            fieldset: { borderColor: "#355180" },
          } : undefined}
        />

        {isLoadingRoomSchedule ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" sx={{ color: mutedColor }}>
              Загрузка расписания…
            </Typography>
          </Stack>
        ) : null}

        {roomScheduleError ? (
          <Alert severity="error">{roomScheduleError}</Alert>
        ) : null}

        {!isLoadingRoomSchedule && !roomScheduleError && (roomSchedule?.items?.length ?? 0) === 0 ? (
          <Typography variant="body2" sx={{ color: mutedColor }}>
            Для {selectedPlace.name} на выбранную дату событий нет.
          </Typography>
        ) : null}

        {!isLoadingRoomSchedule && !roomScheduleError ? (
          <Stack spacing={1}>
            {(roomSchedule?.items ?? []).map((item) => (
              <Box
                key={`${item.kind}-${item.id}`}
                sx={{
                  border: "1px solid",
                  borderColor: dark ? "#355180" : "divider",
                  borderRadius: 1,
                  p: 1,
                  bgcolor: dark ? "#172842" : "background.paper",
                }}
              >
                <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" sx={{ color: textColor }}>
                    {item.title}
                  </Typography>
                  <Chip
                    size="small"
                    label={item.kind === "booking" ? "Бронь" : weekLabel(item.week)}
                    color={item.kind === "booking" ? "secondary" : "primary"}
                    variant={dark ? "filled" : "outlined"}
                  />
                </Stack>
                <Typography variant="body2" sx={{ color: mutedColor }}>
                  {item.startTime}–{item.endTime}
                </Typography>
                {item.groups?.length > 0 ? (
                  <Typography variant="caption" sx={{ color: mutedColor }} display="block">
                    {item.groups.join(", ")}
                  </Typography>
                ) : null}
                {item.teachers?.length > 0 ? (
                  <Typography variant="caption" sx={{ color: mutedColor }} display="block">
                    {item.teachers.join(", ")}
                  </Typography>
                ) : null}
                {item.bookerName ? (
                  <Typography variant="caption" sx={{ color: mutedColor }} display="block">
                    {item.bookerName}
                  </Typography>
                ) : null}
              </Box>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}

function weekLabel(week) {
  if (week === "ch") return "Числ.";
  if (week === "zn") return "Знам.";
  return "Каждую";
}

export default MapPageView;
