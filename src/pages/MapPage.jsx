import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";

import Box from "@mui/material/Box";

import Button from "@mui/material/Button";

import Card from "@mui/material/Card";

import CardContent from "@mui/material/CardContent";

import Chip from "@mui/material/Chip";

import CircularProgress from "@mui/material/CircularProgress";

import Divider from "@mui/material/Divider";

import FormControlLabel from "@mui/material/FormControlLabel";

import Grid from "@mui/material/Grid";

import List from "@mui/material/List";

import ListItemButton from "@mui/material/ListItemButton";

import ListItemText from "@mui/material/ListItemText";

import MenuItem from "@mui/material/MenuItem";

import Stack from "@mui/material/Stack";

import Switch from "@mui/material/Switch";

import TextField from "@mui/material/TextField";

import Typography from "@mui/material/Typography";
import { buildRoute, getAvailableFloors, getMapImage, getMapVectors, getMapGraphs, getPlaces } from "../api/mapApi";
import Map3D from "../components/Map3D";
import MapRoutePlanner from "../components/MapRoutePlanner";


const placeTypeLabels = {
  classroom: "аудитория",
  office: "кабинет",
  entrance: "вход",
  library: "библиотека",
  cafeteria: "буфет",
  department: "кафедра",
  dean_office: "деканат",
  printer: "принтер",
  restroom: "туалет",
  other: "точка",
};



function formatPlaceType(type) {

  return placeTypeLabels[type] ?? type.replaceAll("_", " ");

}



function getCoordinatePercent(value, imageSideSize) {

  if (value >= 0 && value <= 100) {

    return value;

  }



  if (!imageSideSize) {

    return 0;

  }



  return (value / imageSideSize) * 100;

}



function getRoutePointCoordinates(point, mapWidth, mapHeight) {
  return {
    x: getCoordinatePercent(point.coordinates.x, mapWidth),
    y: getCoordinatePercent(point.coordinates.y, mapHeight),
  };
}

function getMapBaseName(fileName = "") {
  return String(fileName)
    .replace(/\.map\.json$/i, "")
    .replace(/\.graph\.json$/i, "");
}



function MapPage() {

  const [floors, setFloors] = useState([]);

  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [mapImage, setMapImage] = useState(null);
  const [mapVector, setMapVector] = useState(null);
  const [mapVectors, setMapVectors] = useState([]);
  const [selectedMapId, setSelectedMapId] = useState("");
  const [mapGraphs, setMapGraphs] = useState([]);
  const [mapGraph, setMapGraph] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");

  const [routeFromPlaceId, setRouteFromPlaceId] = useState("");

  const [routeToPlaceId, setRouteToPlaceId] = useState("");

  const [accessibleOnly, setAccessibleOnly] = useState(false);

  const [route, setRoute] = useState(null);

  const [selectedVectorId, setSelectedVectorId] = useState("");
  const [showLabels, setShowLabels] = useState(true);
  const [localRoutePoints, setLocalRoutePoints] = useState([]);

  const [routeError, setRouteError] = useState("");

  const [isLoadingFloors, setIsLoadingFloors] = useState(true);

  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [isBuildingRoute, setIsBuildingRoute] = useState(false);
  const [error, setError] = useState("");
  const [mapWarning, setMapWarning] = useState("");


  useEffect(() => {
    let isMounted = true;

    async function loadMapAssets() {
      setIsLoadingMap(true);
      setMapWarning("");

      try {
        const [image, vectors, graphs] = await Promise.all([
          getMapImage(),
          getMapVectors(),
          getMapGraphs(),
        ]);

        if (!isMounted) {
          return;
        }

        setMapImage(image);
        setMapVectors(vectors);
        setMapGraphs(graphs);

        const fallbackId = vectors[0]?.id || graphs[0]?.id || "";
        const initialMapId = selectedMapId || fallbackId;
        const baseName = getMapBaseName(initialMapId);
        const nextVector = vectors.find((item) => getMapBaseName(item.id) === baseName) || null;
        const nextGraph = graphs.find((item) => getMapBaseName(item.id) === baseName) || null;

        setSelectedMapId((currentValue) => currentValue || initialMapId);
        setMapVector(nextVector);
        setMapGraph(nextGraph);
        setLocalRoutePoints([]);

        if (!image && !nextVector) {
          setMapWarning("В `src/data` не найден файл схемы. Добавьте туда PNG/JPG/SVG или *.map.json.");
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setMapImage(null);
        setMapVector(null);
        setMapVectors([]);
        setMapGraphs([]);
        setSelectedMapId("");
        setMapGraph(null);
        setMapWarning(loadError.message || "Не удалось загрузить схему.");
        setLocalRoutePoints([]);
      } finally {
        if (isMounted) {
          setIsLoadingMap(false);
        }
      }
    }

    async function loadFloors() {
      setIsLoadingFloors(true);
      setError("");


      try {

        const floorItems = await getAvailableFloors();



        if (!isMounted) {

          return;

        }



        setFloors(floorItems);

        setSelectedFloorId((currentValue) => currentValue || floorItems[0]?.id || "");

      } catch (loadError) {

        if (!isMounted) {

          return;

        }



        setError(loadError.message || "Не удалось загрузить список этажей.");

      } finally {

        if (isMounted) {

          setIsLoadingFloors(false);

        }

      }

    }


    loadMapAssets();
    loadFloors();


    return () => {

      isMounted = false;

    };

  }, []);

  useEffect(() => {
    if (!selectedMapId) {
      return;
    }

    const baseName = getMapBaseName(selectedMapId);
    const nextVector = mapVectors.find((item) => getMapBaseName(item.id) === baseName) || null;
    const nextGraph = mapGraphs.find((item) => getMapBaseName(item.id) === baseName) || null;

    setMapVector(nextVector);
    setMapGraph(nextGraph);
    setSelectedVectorId("");
    setLocalRoutePoints([]);
  }, [selectedMapId, mapVectors, mapGraphs]);



  useEffect(() => {

    if (!selectedFloorId) {

      return undefined;

    }



    let isMounted = true;

    const selectedFloor = floors.find((floor) => floor.id === selectedFloorId);



    if (!selectedFloor) {

      return undefined;

    }


    async function loadMapData() {
      setIsLoadingMap(true);
      setError("");
      setRoute(null);
      setRouteError("");

      try {
        const placesResponse = await getPlaces({
          building: selectedFloor.building,
          floor: selectedFloor.floor,
        });

        if (!isMounted) {
          return;
        }

        const nextPlaces = placesResponse.items;
        const nextFromPlaceId = nextPlaces[0]?.id || "";
        const nextToPlaceId = nextPlaces[1]?.id || nextPlaces[0]?.id || "";

        setPlaces(nextPlaces);
        setSelectedPlaceId(nextPlaces[0]?.id || "");
        setRouteFromPlaceId(nextFromPlaceId);
        setRouteToPlaceId(nextToPlaceId);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setPlaces([]);
        setSelectedPlaceId("");
        setRouteFromPlaceId("");
        setRouteToPlaceId("");
        setError(loadError.message || "Не удалось загрузить схему этажа.");
      } finally {
        if (isMounted) {
          setIsLoadingMap(false);
        }
      }
    }

    loadMapData();



    return () => {

      isMounted = false;

    };

  }, [floors, selectedFloorId]);

  const selectedFloor = floors.find((floor) => floor.id === selectedFloorId) || null;
  const selectedPlace = places.find((place) => place.id === selectedPlaceId) || null;

  const routeFromPlace = places.find((place) => place.id === routeFromPlaceId) || null;

  const routeToPlace = places.find((place) => place.id === routeToPlaceId) || null;

  const isLoading = isLoadingFloors || isLoadingMap;

  const mapWidth = mapVector?.width || mapImage?.width || 100;
  const mapHeight = mapVector?.height || mapImage?.height || 100;
  const hasMapAsset = Boolean(mapImage || mapVector);
  const is3D = Boolean(mapVector);
  const isRouteDisabled = !routeFromPlaceId || !routeToPlaceId || routeFromPlaceId === routeToPlaceId || isBuildingRoute;

  const routePoints = (route?.steps ?? []).filter((step) => {

    if (!selectedFloor) {

      return false;

    }



    return step.coordinates.building === selectedFloor.building && step.coordinates.floor === selectedFloor.floor;

  });

  const routePolylinePoints = routePoints

    .map((step) => {

      const point = getRoutePointCoordinates(step, mapWidth, mapHeight);

      return `${point.x},${point.y}`;

    })

    .join(" ");



  async function handleBuildRoute() {

    if (isRouteDisabled) {

      return;

    }



    setIsBuildingRoute(true);

    setRouteError("");



    try {

      const nextRoute = await buildRoute({

        fromPlaceId: routeFromPlaceId,

        toPlaceId: routeToPlaceId,

        accessibleOnly,

      });



      setRoute(nextRoute);

      setSelectedPlaceId(routeToPlaceId);

    } catch (buildError) {

      setRoute(null);

      setRouteError(buildError.message || "Не удалось построить маршрут.");

    } finally {

      setIsBuildingRoute(false);

    }

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
                        onClick={() => setSelectedMapId(vector.id)}
                      />
                    ))}
                  </Stack>
                </Box>
              ) : null}



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

                <Typography variant="subtitle2">

                  Маршрут

                </Typography>

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

                <Button

                  variant="contained"

                  onClick={handleBuildRoute}

                  disabled={isRouteDisabled}

                >

                  {isBuildingRoute ? "Строим маршрут..." : "Построить маршрут"}

                </Button>

                {is3D ? (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showLabels}
                        onChange={(event) => setShowLabels(event.target.checked)}
                        size="small"
                      />
                    }
                    label="Подписи на карте"
                  />
                ) : null}

                {routeError ? <Alert severity="error">{routeError}</Alert> : null}

                <MapRoutePlanner
                  graph={mapGraph}
                  onRouteChange={setLocalRoutePoints}
                />

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

                <Alert severity="warning">

                  Бэкенд не вернул доступные этажи через `/places`.

                </Alert>

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

                <Alert severity="warning">

                  Для выбранного этажа бэкенд не вернул точек.

                </Alert>

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
                    onSelect={setSelectedVectorId}
                    showLabels={showLabels}
                    routePoints={localRoutePoints}
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

          </CardContent>

        </Card>

      </Grid>

    </Grid>

  );

}



export default MapPage;





