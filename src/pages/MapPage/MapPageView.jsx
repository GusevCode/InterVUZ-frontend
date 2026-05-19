import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useNavigate } from "react-router-dom";
import Map3D from "../../components/Map3D";
import { buildBookingUrl } from "../../shared/bookingForm";
import MapRoutePlanner from "../../components/MapRoutePlanner";
import MapMultiFloorRouteView from "../../components/MapMultiFloorRouteView";
import FloorChipSlider from "../../shared/ui/FloorChipSlider";

const M = {
  labelColor: "#AFBFDE",
};

function MobileMapView({
  floors,
  selectedFloorId,
  setSelectedFloorId,
  places,
  isLoading,
  error,
  mapWarning,
  mapImage,
  mapVector,
  mapVectors,
  mapPois,
  is3D,
  hasMapAsset,
  selectedVectorId,
  targetVectorId,
  targetPlaceId,
  setSelectedVectorId,
  showLabels,
  displayRoutePoints,
  mapWidth,
  mapHeight,
  routePoints,
  routePolylinePoints,
  getCoordinatePercent,
  getRoutePointCoordinates,
  selectedPlaceId,
  setSelectedPlaceId,
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
  setLocalRoutePoints,
  routeFromPlaceId,
  routeToPlaceId,
  selectedPlace,
  scheduleDate,
  setScheduleDate,
  roomSchedule,
  isLoadingRoomSchedule,
  roomScheduleError,
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Map area */}
      <Box
        sx={{
          border: "1px dashed #3D5683",
          borderRadius: "18px",
          overflow: "hidden",
          aspectRatio: hasMultiFloorRoute ? "auto" : hasMapAsset ? `${mapWidth} / ${mapHeight}` : "4 / 3",
          position: "relative",
          bgcolor: is3D ? "transparent" : mapImage ? "#0a1222" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "200px",
        }}
      >
        {isLoading ? (
          <Stack spacing={1} alignItems="center">
            <CircularProgress size={24} sx={{ color: M.labelColor }} />
            <Typography
              sx={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                color: M.labelColor,
              }}
            >
              Загрузка карты…
            </Typography>
          </Stack>
        ) : is3D ? (
          <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
            <Map3D
              mapVector={mapVector}
              selectedId={selectedVectorId}
              targetId={targetVectorId}
              onSelect={setSelectedVectorId}
              showLabels={showLabels}
              routePoints={displayRoutePoints}
            />
            {showLabels && selectedVectorId ? (
              <Box
                sx={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: "rgba(15, 23, 42, 0.75)",
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {`Выбрано: ${selectedVectorId}`}
              </Box>
            ) : null}
          </Box>
        ) : mapImage ? (
          <>
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
            {routePoints.length >= 2 ? (
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
                  const coords = getRoutePointCoordinates(point, mapWidth, mapHeight);
                  const isEdge = index === 0 || index === routePoints.length - 1;
                  return (
                    <circle
                      key={`${point.order}-${point.placeId || point.instruction}`}
                      cx={coords.x}
                      cy={coords.y}
                      r={isEdge ? 1.8 : 1.3}
                      fill={isEdge ? "#0f766e" : "#ffffff"}
                      stroke="#0f766e"
                      strokeWidth="0.7"
                    />
                  );
                })}
              </Box>
            ) : null}
            {mapPois.map((poi) => {
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
                    width: isSelectedPoi || isTargetPoi ? 16 : 12,
                    height: isSelectedPoi || isTargetPoi ? 16 : 12,
                    borderRadius: "50%",
                    border: "2px solid #ffffff",
                    bgcolor: "#f59e0b",
                    boxShadow: "0 3px 10px rgba(0,0,0,0.45)",
                    cursor: "pointer",
                    transition: "all 160ms ease",
                    zIndex: 3,
                  }}
                />
              );
            })}
            {places.map((place) => {
              const isSelected = place.id === selectedPlaceId;
              const isFrom = place.id === routeFromPlaceId;
              const isTo = place.id === routeToPlaceId;
              return (
                <Box
                  key={place.id}
                  onClick={() => setSelectedPlaceId(place.id)}
                  title={place.name}
                  sx={{
                    position: "absolute",
                    left: `${getCoordinatePercent(place.coordinates.x, mapWidth)}%`,
                    top: `${getCoordinatePercent(place.coordinates.y, mapHeight)}%`,
                    transform: "translate(-50%, -50%)",
                    width: isSelected || isFrom || isTo ? 18 : 14,
                    height: isSelected || isFrom || isTo ? 18 : 14,
                    borderRadius: "50%",
                    border: "2px solid #ffffff",
                    bgcolor: isFrom ? "#0f766e" : isTo ? "#2563eb" : isSelected ? "#1f3a5f" : "#d14b4b",
                    boxShadow: "0 3px 10px rgba(0,0,0,0.4)",
                    cursor: "pointer",
                    transition: "all 160ms ease",
                  }}
                />
              );
            })}
            {targetPlaceId ? places.filter((place) => place.id === targetPlaceId).map((place) => (
              <Box
                key={`target-${place.id}`}
                sx={{
                  position: "absolute",
                  left: `${getCoordinatePercent(place.coordinates.x, mapWidth)}%`,
                  top: `${getCoordinatePercent(place.coordinates.y, mapHeight)}%`,
                  transform: "translate(-50%, -50%)",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "2px solid rgba(248, 113, 113, 0.95)",
                  boxShadow: "0 0 0 4px rgba(248, 113, 113, 0.22)",
                  pointerEvents: "none",
                }}
              />
            )) : null}
            {targetVectorId ? mapPois.filter((poi) => poi.id === targetVectorId).map((poi) => (
              <Box
                key={`target-poi-${poi.id}`}
                sx={{
                  position: "absolute",
                  left: `${getCoordinatePercent(poi.x, mapWidth)}%`,
                  top: `${getCoordinatePercent(poi.y, mapHeight)}%`,
                  transform: "translate(-50%, -50%)",
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  border: "2px solid rgba(245, 158, 11, 0.95)",
                  boxShadow: "0 0 0 4px rgba(245, 158, 11, 0.22)",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />
            )) : null}
          </>
        ) : (
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 400,
              fontSize: "14.1px",
              lineHeight: "19px",
              color: M.labelColor,
              textAlign: "center",
              px: 2,
            }}
          >
            {error
              ? "Не удалось загрузить карту"
              : floors.length === 0
                ? "Выберите этаж для отображения карты"
                : "Загрузка схемы этажа…"}
          </Typography>
        )}
      </Box>

      {hasMultiFloorRoute ? (
        <Stack spacing={1}>
          <Typography
            variant="body2"
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "13px",
              lineHeight: 1.45,
              color: M.labelColor,
            }}
          >
            Переключайте этажи — на карте показан маршрут только для выбранного участка.
          </Typography>
          <FloorChipSlider
            dark
            items={routeSegments.map((segment, index) => ({
              key: String(index),
              label: segment.label,
            }))}
            selectedKey={String(routeSegmentIndex)}
            onSelect={(key) => onSelectRouteSegment(Number(key))}
          />
        </Stack>
      ) : floors.length > 0 ? (
        <FloorChipSlider
          dark
          items={floors.map((floor) => ({
            key: floor.id,
            label: `Этаж ${floor.label}`,
          }))}
          selectedKey={selectedFloorId}
          onSelect={(key) => handleSelectFloor(key)}
        />
      ) : null}

      {/* Route section */}
      <Box
        sx={{
          background: "linear-gradient(180deg, rgba(24, 40, 66, 0.58) 0%, rgba(18, 31, 53, 0.95) 100%), #121F35",
          border: "1px solid #253654",
          borderRadius: "18px",
          p: "15px",
          boxShadow: "0px 10px 28px rgba(6, 10, 22, 0.33)",
        }}
      >
        <MapRoutePlanner
          mapGraphs={mapGraphs}
          floorConnections={floorConnections}
          onSingleFloorRouteChange={setLocalRoutePoints}
          onMultiFloorRouteChange={setMultiFloorRoute}
          onRouteFloorChange={handleRouteFloorChange}
          dark
        />
      </Box>

      {mapWarning ? (
        <Typography
          sx={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "13px",
            color: "#f5a623",
            textAlign: "center",
          }}
        >
          {mapWarning}
        </Typography>
      ) : null}

      {selectedPlace?.type === "classroom" ? (
        <Box sx={{ position: "relative", pb: 5 }}>
          <RoomSchedulePanel
            selectedPlace={selectedPlace}
            scheduleDate={scheduleDate}
            setScheduleDate={setScheduleDate}
            roomSchedule={roomSchedule}
            isLoadingRoomSchedule={isLoadingRoomSchedule}
            roomScheduleError={roomScheduleError}
            dark
          />
          <BookingNavigateButton
            placeId={selectedPlace.id}
            scheduleDate={scheduleDate}
            dark
          />
        </Box>
      ) : null}
    </Box>
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
  formatPlaceType,
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
  showLabels,
  setShowLabels,
  localRoutePoints,
  setLocalRoutePoints,
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

  if (isMobile) {
    return (
      <MobileMapView
        floors={floors}
        selectedFloorId={selectedFloorId}
        setSelectedFloorId={setSelectedFloorId}
        places={places}
        routeFromPlaceId={routeFromPlaceId}
        routeToPlaceId={routeToPlaceId}
        isLoading={isLoading}
        error={error}
        mapWarning={mapWarning}
        mapImage={mapImage}
        mapVector={mapVector}
        mapPois={mapPois}
        is3D={is3D}
        hasMapAsset={hasMapAsset}
        selectedVectorId={selectedVectorId}
        targetVectorId={targetVectorId}
        targetPlaceId={targetPlaceId}
        setSelectedVectorId={setSelectedVectorId}
        showLabels={showLabels}
        displayRoutePoints={displayRoutePoints}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
        routePoints={routePoints}
        routePolylinePoints={routePolylinePoints}
        getCoordinatePercent={getCoordinatePercent}
        getRoutePointCoordinates={getRoutePointCoordinates}
        selectedPlaceId={selectedPlaceId}
        setSelectedPlaceId={setSelectedPlaceId}
        mapGraph={mapGraph}
        mapGraphs={mapGraphs}
        floorConnections={floorConnections}
        multiFloorRoute={multiFloorRoute}
        setMultiFloorRoute={setMultiFloorRoute}
        hasMultiFloorRoute={hasMultiFloorRoute}
        routeSegments={routeSegments}
        routeSegmentIndex={routeSegmentIndex}
        onSelectRouteSegment={onSelectRouteSegment}
        handleSelectMap={handleSelectMap}
        handleSelectFloor={handleSelectFloor}
        handleRouteFloorChange={handleRouteFloorChange}
        mapVectors={mapVectors}
        setLocalRoutePoints={setLocalRoutePoints}
        selectedPlace={selectedPlace}
        scheduleDate={scheduleDate}
        setScheduleDate={setScheduleDate}
        roomSchedule={roomSchedule}
        isLoadingRoomSchedule={isLoadingRoomSchedule}
        roomScheduleError={roomScheduleError}
      />
    );
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ height: "100%", borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Карта корпуса
                </Typography>
              </Box>

              {mapVectors.length > 0 ? (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Схемы этажей
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {mapVectors.map((vector) => (
                      <Chip
                        key={vector.id}
                        label={vector.label}
                        clickable
                        color={vector.id === selectedMapId ? "primary" : "default"}
                        variant={vector.id === selectedMapId ? "filled" : "outlined"}
                        onClick={() => handleSelectMap(vector.id)}
                      />
                    ))}
                  </Stack>
                </Box>
              ) : null}


              {mapGraphs.length > 0 ? (
                <>
                  <Divider />
                  <MapRoutePlanner
                    mapGraphs={mapGraphs}
                    floorConnections={floorConnections}
                    onSingleFloorRouteChange={setLocalRoutePoints}
                    onMultiFloorRouteChange={setMultiFloorRoute}
                    onRouteFloorChange={handleRouteFloorChange}
                  />
                  <Divider />
                </>
              ) : null}

              {isLoading ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CircularProgress size={20} />
                  <Typography variant="body2">Загрузка схемы...</Typography>
                </Stack>
              ) : null}

              {error ? <Alert severity="error">{error}</Alert> : null}
              {mapWarning ? <Alert severity="warning">{mapWarning}</Alert> : null}

              {!isLoading && !error && floors.length === 0 ? (
                <Alert severity="warning">Бэкенд не вернул доступные этажи через `/places`.</Alert>
              ) : null}


              {!isLoading && !error && selectedFloor && places.length === 0 ? (
                <Alert severity="warning">Расписание для этого этажа пока не подгружается.</Alert>
              ) : null}

              {selectedPlace ? (
                <Card variant="outlined" sx={{ position: "relative" }}>
                  <CardContent sx={{ p: 2, pb: selectedPlace.type === "classroom" ? 6.5 : 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {selectedPlace.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {selectedPlace.description}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label={formatPlaceType(selectedPlace.type)} size="small" />
                      <Chip
                        label={selectedPlace.isAccessible ? "доступно" : "только по лестнице"}
                        size="small"
                        color={selectedPlace.isAccessible ? "success" : "default"}
                        variant="outlined"
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
                      />
                    ) : null}
                  </CardContent>
                  {selectedPlace.type === "classroom" ? (
                    <BookingNavigateButton
                      placeId={selectedPlace.id}
                      scheduleDate={scheduleDate}
                    />
                  ) : null}
                </Card>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Card sx={{ borderRadius: "2", overflow: "hidden" }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom>
              Схема этажа
            </Typography>

            {hasMultiFloorRoute ? (
              <MapMultiFloorRouteView
                segments={routeSegments}
                mapVectors={mapVectors}
                showLabels={showLabels}
              />
            ) : (
            <Box
              sx={{
                position: "relative",
                width: "100%",
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: is3D ? "transparent" : hasMapAsset ? "#f4f5f7" : "#f8fafc",
                aspectRatio: hasMapAsset ? `${mapWidth} / ${mapHeight}` : "16 / 9",
                backgroundImage: hasMapAsset
                  ? "none"
                  : "linear-gradient(135deg, rgba(207, 216, 220, 0.35), rgba(236, 239, 241, 0.9))",
              }}
            >
              {is3D ? (
                <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
                  <Map3D
                    mapVector={mapVector}
                    selectedId={selectedVectorId}
                    targetId={targetVectorId}
                    onSelect={setSelectedVectorId}
                    showLabels={showLabels}
                    routePoints={displayRoutePoints}
                  />
                  {showLabels && selectedVectorId ? (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: "rgba(15, 23, 42, 0.75)",
                        color: "#ffffff",
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: 0.3,
                      }}
                    >
                      {`Выбрано: ${selectedVectorId}`}
                    </Box>
                  ) : null}
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
            </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
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
