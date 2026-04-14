import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";

const M = {
  sectionBg: "linear-gradient(180deg, rgba(24, 40, 66, 0.58) 0%, rgba(18, 31, 53, 0.95) 100%), #121F35",
  sectionBorder: "#253654",
  mapAreaBorder: "#3D5683",
  inputBg: "#101D31",
  inputBorder: "#355180",
  labelColor: "#AFBFDE",
  headingColor: "#ECF2FF",
  bodyColor: "#96A7C9",
  inputColor: "#E4EDFF",
  primaryBtnBg: "#2A6DF0",
  primaryBtnText: "#F3F7FF",
  routeNodeBg: "#3D5683",
  routeFromColor: "#FFD7E0",
  routeArrowColor: "#8FA4C9",
};

function MobileMapView({
  floors,
  selectedFloorId,
  setSelectedFloorId,
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
  mapImage,
  mapWidth,
  mapHeight,
  routePoints,
  routePolylinePoints,
  getCoordinatePercent,
  getRoutePointCoordinates,
  selectedPlaceId,
  setSelectedPlaceId,
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Map area */}
      <Box
        sx={{
          border: "1px dashed #3D5683",
          borderRadius: "18px",
          overflow: "hidden",
          aspectRatio: mapImage ? `${mapWidth} / ${mapHeight}` : "4 / 3",
          position: "relative",
          bgcolor: mapImage ? "#0a1222" : "transparent",
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

      {/* Floor chips */}
      {floors.length > 0 ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {floors.map((floor) => (
            <Chip
              key={floor.id}
              label={floor.label}
              clickable
              size="small"
              color={floor.id === selectedFloorId ? "primary" : "default"}
              variant={floor.id === selectedFloorId ? "filled" : "outlined"}
              onClick={() => setSelectedFloorId(floor.id)}
              sx={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
              }}
            />
          ))}
        </Stack>
      ) : null}

      {/* Route section */}
      <Box
        sx={{
          background: M.sectionBg,
          border: `1px solid ${M.sectionBorder}`,
          borderRadius: "18px",
          p: "15px",
          boxShadow: "0px 10px 28px rgba(6, 10, 22, 0.33)",
        }}
      >
        <Typography
          sx={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 800,
            fontSize: "16px",
            lineHeight: "22px",
            color: M.headingColor,
            mb: "18px",
          }}
        >
          Выбор места
        </Typography>

        {/* From */}
        <Box sx={{ mb: "12px" }}>
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 700,
              fontSize: "13.3px",
              lineHeight: "18px",
              letterSpacing: "0.531px",
              textTransform: "uppercase",
              color: M.labelColor,
              mb: "8px",
            }}
          >
            Откуда
          </Typography>
          <Box
            sx={{
              background: M.inputBg,
              border: `1px solid ${M.inputBorder}`,
              borderRadius: "12px",
              height: "46px",
              display: "flex",
              alignItems: "center",
              px: "15px",
            }}
          >
            <Select
              size="small"
              value={routeFromPlaceId}
              onChange={(e) => setRouteFromPlaceId(e.target.value)}
              variant="standard"
              disableUnderline
              fullWidth
              disabled={places.length === 0}
              sx={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 400,
                fontSize: "14.7px",
                color: M.inputColor,
                "& .MuiSelect-icon": { color: M.inputColor },
                "& .MuiSelect-select": { p: 0 },
              }}
            >
              {places.map((place) => (
                <MenuItem key={place.id} value={place.id}>{place.name}</MenuItem>
              ))}
            </Select>
          </Box>
        </Box>

        {/* To */}
        <Box sx={{ mb: "18px" }}>
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 700,
              fontSize: "13.3px",
              lineHeight: "18px",
              letterSpacing: "0.531px",
              textTransform: "uppercase",
              color: M.labelColor,
              mb: "8px",
            }}
          >
            Куда
          </Typography>
          <Box
            sx={{
              background: M.inputBg,
              border: `1px solid ${M.inputBorder}`,
              borderRadius: "12px",
              height: "46px",
              display: "flex",
              alignItems: "center",
              px: "15px",
            }}
          >
            <Select
              size="small"
              value={routeToPlaceId}
              onChange={(e) => setRouteToPlaceId(e.target.value)}
              variant="standard"
              disableUnderline
              fullWidth
              disabled={places.length === 0}
              sx={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 400,
                fontSize: "14.7px",
                color: M.inputColor,
                "& .MuiSelect-icon": { color: M.inputColor },
                "& .MuiSelect-select": { p: 0 },
              }}
            >
              {places.map((place) => (
                <MenuItem key={place.id} value={place.id}>{place.name}</MenuItem>
              ))}
            </Select>
          </Box>
        </Box>

        {/* Build route button */}
        <Box
          component="button"
          onClick={handleBuildRoute}
          disabled={isRouteDisabled}
          sx={{
            width: "100%",
            height: "40px",
            background: isRouteDisabled ? "rgba(42, 109, 240, 0.4)" : M.primaryBtnBg,
            border: "none",
            borderRadius: "12px",
            cursor: isRouteDisabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Arial', sans-serif",
              fontWeight: 700,
              fontSize: "14.4px",
              lineHeight: "17px",
              color: M.primaryBtnText,
            }}
          >
            {isBuildingRoute ? "Строим маршрут…" : "Построить маршрут"}
          </Typography>
        </Box>

        {routeError ? (
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "13px",
              color: "#ff6b6b",
              mt: "10px",
            }}
          >
            {routeError}
          </Typography>
        ) : null}
      </Box>

      {/* Route result */}
      {route ? (
        <Box
          sx={{
            background: M.sectionBg,
            border: `1px solid ${M.sectionBorder}`,
            borderRadius: "18px",
            p: "15px",
            boxShadow: "0px 10px 28px rgba(6, 10, 22, 0.33)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <Typography
              sx={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
                fontSize: "13.4px",
                lineHeight: "18px",
                color: M.routeFromColor,
              }}
            >
              {routeFromPlace?.name ?? routeFromPlaceId}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 400,
                fontSize: "16px",
                color: M.routeArrowColor,
              }}
            >
              →
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
                fontSize: "13.4px",
                lineHeight: "18px",
                color: M.routeFromColor,
              }}
            >
              {routeToPlace?.name ?? routeToPlaceId}
            </Typography>
          </Box>

          {route.steps.length > 0 ? (
            <Stack spacing={1} sx={{ mt: "12px" }}>
              {route.steps.map((step) => (
                <Box
                  key={`${step.order}-${step.placeId || step.instruction}`}
                  sx={{ display: "flex", alignItems: "flex-start", gap: "10px" }}
                >
                  <Box
                    sx={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      bgcolor: M.routeNodeBg,
                      flexShrink: 0,
                      mt: "2px",
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 600,
                      fontSize: "13.4px",
                      lineHeight: "18px",
                      color: M.routeFromColor,
                    }}
                  >
                    {step.instruction}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : null}
        </Box>
      ) : null}

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
  formatPlaceType,
  mapImage,
  mapWidth,
  mapHeight,
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
        setRouteFromPlaceId={setRouteFromPlaceId}
        routeToPlaceId={routeToPlaceId}
        setRouteToPlaceId={setRouteToPlaceId}
        handleBuildRoute={handleBuildRoute}
        isRouteDisabled={isRouteDisabled}
        isBuildingRoute={isBuildingRoute}
        routeError={routeError}
        route={route}
        routeFromPlace={routeFromPlace}
        routeToPlace={routeToPlace}
        isLoading={isLoading}
        error={error}
        mapWarning={mapWarning}
        mapImage={mapImage}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
        routePoints={routePoints}
        routePolylinePoints={routePolylinePoints}
        getCoordinatePercent={getCoordinatePercent}
        getRoutePointCoordinates={getRoutePointCoordinates}
        selectedPlaceId={selectedPlaceId}
        setSelectedPlaceId={setSelectedPlaceId}
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

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Этажи
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {floors.map((floor) => (
                    <Chip
                      key={floor.id}
                      label={floor.label}
                      clickable
                      color={floor.id === selectedFloorId ? "primary" : "default"}
                      variant={floor.id === selectedFloorId ? "filled" : "outlined"}
                      onClick={() => setSelectedFloorId(floor.id)}
                    />
                  ))}
                </Stack>
              </Box>

              {selectedFloor ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`Корпус ${selectedFloor.building}`} size="small" />
                  <Chip label={`Этаж ${selectedFloor.label}`} size="small" />
                  <Chip label={`Точек: ${places.length}`} size="small" color="primary" variant="outlined" />
                </Stack>
              ) : null}

              <Divider />

              <Stack spacing={1.5}>
                <Typography variant="subtitle2">Маршрут</Typography>
                <TextField
                  select
                  size="small"
                  label="Откуда"
                  value={routeFromPlaceId}
                  onChange={(event) => setRouteFromPlaceId(event.target.value)}
                  disabled={places.length === 0}
                >
                  {places.map((place) => (
                    <MenuItem key={place.id} value={place.id}>
                      {place.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Куда"
                  value={routeToPlaceId}
                  onChange={(event) => setRouteToPlaceId(event.target.value)}
                  disabled={places.length === 0}
                >
                  {places.map((place) => (
                    <MenuItem key={place.id} value={place.id}>
                      {place.name}
                    </MenuItem>
                  ))}
                </TextField>
                <Button variant="contained" onClick={handleBuildRoute} disabled={isRouteDisabled}>
                  {isBuildingRoute ? "Строим маршрут..." : "Построить маршрут"}
                </Button>
                {routeError ? <Alert severity="error">{routeError}</Alert> : null}
                {route ? (
                  <Card variant="outlined">
                    <CardContent sx={{ p: 2 }}>
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Chip label={`От: ${routeFromPlace?.name ?? routeFromPlaceId}`} size="small" />
                          <Chip label={`До: ${routeToPlace?.name ?? routeToPlaceId}`} size="small" />
                        </Stack>
                        {route.steps.length > 0 ? (
                          <List sx={{ p: 0 }}>
                            {route.steps.map((step) => (
                              <ListItemText
                                key={`${step.order}-${step.placeId || step.instruction}`}
                                primary={`${step.order}. ${step.instruction}`}
                                secondary={`x:${step.coordinates.x}, y:${step.coordinates.y}`}
                                sx={{ py: 0.5 }}
                              />
                            ))}
                          </List>
                        ) : null}
                      </Stack>
                    </CardContent>
                  </Card>
                ) : null}
              </Stack>

              <Divider />

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

              {!isLoading && !error && places.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {places.map((place) => {
                    const isSelected = place.id === selectedPlaceId;

                    return (
                      <ListItemButton
                        key={place.id}
                        selected={isSelected}
                        onClick={() => setSelectedPlaceId(place.id)}
                        sx={{
                          px: 1,
                          py: 1.25,
                          borderRadius: 2,
                          mb: 0.5,
                          alignItems: "flex-start",
                        }}
                      >
                        <ListItemText
                          primary={place.name}
                          secondary={`${formatPlaceType(place.type)} - x:${place.coordinates.x}, y:${place.coordinates.y}`}
                          primaryTypographyProps={{ fontWeight: isSelected ? 700 : 500 }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              ) : null}

              {!isLoading && !error && selectedFloor && places.length === 0 ? (
                <Alert severity="warning">Для выбранного этажа бэкенд не вернул точек.</Alert>
              ) : null}

              {selectedPlace ? (
                <Card variant="outlined">
                  <CardContent sx={{ p: 2 }}>
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
                  </CardContent>
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

            <Box
              sx={{
                position: "relative",
                width: "100%",
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: mapImage ? "#f4f5f7" : "#f8fafc",
                aspectRatio: mapImage ? `${mapWidth} / ${mapHeight}` : "16 / 9",
                backgroundImage: mapImage
                  ? "none"
                  : "linear-gradient(135deg, rgba(207, 216, 220, 0.35), rgba(236, 239, 241, 0.9))",
              }}
            >
              {mapImage ? (
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

              {places.map((place) => {
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

              {selectedPlace ? (
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
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default MapPageView;
