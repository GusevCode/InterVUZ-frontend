import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getAvailableFloors, getMapImage, getPlaces } from "../api/mapApi";

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

function MapPage() {
  const [floors, setFloors] = useState([]);
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [mapImage, setMapImage] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [isLoadingFloors, setIsLoadingFloors] = useState(true);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

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

    loadFloors();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedFloorId) {
      return undefined;
    }

    let isMounted = true;

    async function loadMapData() {
      setIsLoadingMap(true);
      setError("");

      try {
        const [image, placesResponse] = await Promise.all([
          getMapImage({ floorId: selectedFloorId }),
          getPlaces({ floorId: selectedFloorId }),
        ]);

        if (!isMounted) {
          return;
        }

        setMapImage(image);
        setPlaces(placesResponse.items);
        setSelectedPlaceId(placesResponse.items[0]?.id || "");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

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
  }, [selectedFloorId]);

  const selectedFloor = floors.find((floor) => floor.id === selectedFloorId) || null;
  const selectedPlace = places.find((place) => place.id === selectedPlaceId) || null;
  const isLoading = isLoadingFloors || isLoadingMap;

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
                <Typography variant="body2" color="text.secondary">
                  У каждого этажа свой JSON-файл в `src/mock`, поэтому координаты точек можно править отдельно от кода страницы.
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

              {isLoading ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CircularProgress size={20} />
                  <Typography variant="body2">Загрузка схемы...</Typography>
                </Stack>
              ) : null}

              {error ? <Alert severity="error">{error}</Alert> : null}

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
                          px: 0,
                          py: 1.25,
                          borderBottom: "1px solid",
                          borderColor: "divider",
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

              {!isLoading && !error && places.length === 0 ? (
                <Alert severity="warning">
                  Для этого этажа точки пока не настроены. Добавьте их в JSON-файл и обновите страницу.
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
        <Card sx={{ borderRadius: 2, overflow: "hidden" }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom>
              Схема этажа
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Переключайте этажи слева. У каждой картинки собственная система координат из соответствующего JSON-файла.
            </Typography>

            <Box
              sx={{
                position: "relative",
                width: "100%",
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "#f4f5f7",
                aspectRatio: mapImage ? `${mapImage.width} / ${mapImage.height}` : "3 / 2",
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
              ) : null}

              {mapImage
                ? places.map((place) => {
                    const isSelected = place.id === selectedPlaceId;
                    const left = `${(place.coordinates.x / mapImage.width) * 100}%`;
                    const top = `${(place.coordinates.y / mapImage.height) * 100}%`;

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
                          width: isSelected ? 22 : 18,
                          height: isSelected ? 22 : 18,
                          borderRadius: "50%",
                          border: "3px solid #ffffff",
                          bgcolor: isSelected ? "#1f3a5f" : "#d14b4b",
                          boxShadow: "0 4px 14px rgba(22, 33, 48, 0.24)",
                          cursor: "pointer",
                          transition: "all 160ms ease",
                        }}
                      />
                    );
                  })
                : null}

              {selectedPlace && mapImage ? (
                <Box
                  sx={{
                    position: "absolute",
                    left: `${(selectedPlace.coordinates.x / mapImage.width) * 100}%`,
                    top: `calc(${(selectedPlace.coordinates.y / mapImage.height) * 100}% - 22px)`,
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
