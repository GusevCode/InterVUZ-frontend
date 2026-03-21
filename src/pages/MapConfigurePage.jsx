import { useEffect, useMemo, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

const pointTypeOptions = [
  { value: "classroom", label: "Аудитория" },
  { value: "office", label: "Кабинет" },
  { value: "entrance", label: "Вход" },
  { value: "library", label: "Библиотека" },
  { value: "cafeteria", label: "Буфет" },
  { value: "department", label: "Кафедра" },
  { value: "dean_office", label: "Деканат" },
  { value: "printer", label: "Принтер" },
  { value: "restroom", label: "Туалет" },
  { value: "other", label: "Другое" },
];

function createDefaultPoint(index, x, y, building, floorId) {
  return {
    id: `place_${index}`,
    name: `Точка ${index}`,
    type: "classroom",
    description: "",
    tags: [],
    isAccessible: true,
    coordinates: {
      building,
      floor: floorId,
      x,
      y,
    },
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function MapConfigurePage() {
  const fileInputRef = useRef(null);

  const [mapFile, setMapFile] = useState(null);
  const [building, setBuilding] = useState("B1");
  const [floorId, setFloorId] = useState("1");
  const [floorLabel, setFloorLabel] = useState("1");
  const [alt, setAlt] = useState("Карта 1 этажа");
  const [points, setPoints] = useState([]);
  const [selectedPointId, setSelectedPointId] = useState("");
  const [mode, setMode] = useState("add");
  const [lastClick, setLastClick] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    return () => {
      if (mapFile?.src) {
        URL.revokeObjectURL(mapFile.src);
      }
    };
  }, [mapFile]);

  const selectedPoint = points.find((point) => point.id === selectedPointId) || null;

  const outputJson = useMemo(() => {
    return JSON.stringify(
      {
        id: floorId,
        places: points.map((point) => ({
          ...point,
          coordinates: {
            ...point.coordinates,
            building,
            floor: floorId,
          },
        })),
        width: mapFile?.width ?? 0,
        alt,
        height: mapFile?.height ?? 0,
        building,
        label: floorLabel,
        image: mapFile?.name ?? "",
      },
      null,
      2
    );
  }, [alt, building, floorId, floorLabel, mapFile, points]);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (mapFile?.src) {
      URL.revokeObjectURL(mapFile.src);
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      setMapFile({
        name: file.name,
        src: objectUrl,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.src = objectUrl;
    setCopyStatus("");
  }

  function handleMapClick(event) {
    if (!mapFile) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(clamp(((event.clientX - rect.left) / rect.width) * mapFile.width, 0, mapFile.width));
    const y = Math.round(clamp(((event.clientY - rect.top) / rect.height) * mapFile.height, 0, mapFile.height));

    setLastClick({ x, y });
    setCopyStatus("");

    if (mode === "add") {
      const nextPoint = createDefaultPoint(points.length + 1, x, y, building, floorId);

      setPoints((currentPoints) => [...currentPoints, nextPoint]);
      setSelectedPointId(nextPoint.id);
      return;
    }

    if (mode === "move" && selectedPointId) {
      setPoints((currentPoints) =>
        currentPoints.map((point) =>
          point.id === selectedPointId
            ? {
                ...point,
                coordinates: {
                  ...point.coordinates,
                  x,
                  y,
                },
              }
            : point
        )
      );
    }
  }

  function updateSelectedPoint(updater) {
    if (!selectedPointId) {
      return;
    }

    setPoints((currentPoints) =>
      currentPoints.map((point) => (point.id === selectedPointId ? updater(point) : point))
    );
  }

  async function handleCopyJson() {
    try {
      await navigator.clipboard.writeText(outputJson);
      setCopyStatus("JSON скопирован в буфер обмена.");
    } catch {
      setCopyStatus("Не удалось скопировать JSON. Скопируйте его вручную из поля ниже.");
    }
  }

  function handleDeleteSelectedPoint() {
    if (!selectedPointId) {
      return;
    }

    setPoints((currentPoints) => currentPoints.filter((point) => point.id !== selectedPointId));
    setSelectedPointId("");
    setCopyStatus("");
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ height: "100%", borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Конфигуратор карты
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Загрузите изображение этажа, расставьте точки кликом по карте и получите готовый JSON-файл.
                </Typography>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant="contained" onClick={() => fileInputRef.current?.click()}>
                  Загрузить карту
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCopyJson}
                  disabled={!mapFile}
                >
                  Скопировать JSON
                </Button>
              </Stack>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                onChange={handleFileChange}
              />

              <TextField
                label="Корпус"
                value={building}
                onChange={(event) => setBuilding(event.target.value)}
                size="small"
              />
              <TextField
                label="ID этажа"
                value={floorId}
                onChange={(event) => setFloorId(event.target.value)}
                size="small"
              />
              <TextField
                label="Подпись этажа"
                value={floorLabel}
                onChange={(event) => setFloorLabel(event.target.value)}
                size="small"
              />
              <TextField
                label="Alt-текст"
                value={alt}
                onChange={(event) => setAlt(event.target.value)}
                size="small"
              />

              {mapFile ? (
                <Alert severity="info">
                  Загружен файл: <strong>{mapFile.name}</strong> ({mapFile.width} x {mapFile.height})
                </Alert>
              ) : (
                <Alert severity="warning">Сначала загрузите изображение этажа.</Alert>
              )}

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  variant={mode === "add" ? "contained" : "outlined"}
                  onClick={() => setMode("add")}
                  disabled={!mapFile}
                >
                  Добавить точку
                </Button>
                <Button
                  variant={mode === "move" ? "contained" : "outlined"}
                  onClick={() => setMode("move")}
                  disabled={!mapFile || !selectedPoint}
                >
                  Переместить точку
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDeleteSelectedPoint}
                  disabled={!selectedPoint}
                >
                  Удалить точку
                </Button>
              </Stack>

              {lastClick ? (
                <Typography variant="body2" color="text.secondary">
                  Последний клик: x={lastClick.x}, y={lastClick.y}
                </Typography>
              ) : null}

              {selectedPoint ? (
                <>
                  <Divider />
                  <Typography variant="subtitle1">Выбранная точка</Typography>
                  <TextField
                    label="ID"
                    value={selectedPoint.id}
                    onChange={(event) =>
                      updateSelectedPoint((point) => ({
                        ...point,
                        id: event.target.value,
                      }))
                    }
                    size="small"
                  />
                  <TextField
                    label="Название"
                    value={selectedPoint.name}
                    onChange={(event) =>
                      updateSelectedPoint((point) => ({
                        ...point,
                        name: event.target.value,
                      }))
                    }
                    size="small"
                  />
                  <TextField
                    label="Тип"
                    value={selectedPoint.type}
                    onChange={(event) =>
                      updateSelectedPoint((point) => ({
                        ...point,
                        type: event.target.value,
                      }))
                    }
                    select
                    size="small"
                  >
                    {pointTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Описание"
                    value={selectedPoint.description}
                    onChange={(event) =>
                      updateSelectedPoint((point) => ({
                        ...point,
                        description: event.target.value,
                      }))
                    }
                    multiline
                    minRows={2}
                    size="small"
                  />
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="X"
                      type="number"
                      value={selectedPoint.coordinates.x}
                      onChange={(event) =>
                        updateSelectedPoint((point) => ({
                          ...point,
                          coordinates: {
                            ...point.coordinates,
                            x: Number(event.target.value),
                          },
                        }))
                      }
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Y"
                      type="number"
                      value={selectedPoint.coordinates.y}
                      onChange={(event) =>
                        updateSelectedPoint((point) => ({
                          ...point,
                          coordinates: {
                            ...point.coordinates,
                            y: Number(event.target.value),
                          },
                        }))
                      }
                      size="small"
                      fullWidth
                    />
                  </Stack>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedPoint.isAccessible}
                        onChange={(event) =>
                          updateSelectedPoint((point) => ({
                            ...point,
                            isAccessible: event.target.checked,
                          }))
                        }
                      />
                    }
                    label="Доступно без ограничений"
                  />
                </>
              ) : null}

              {copyStatus ? <Alert severity="success">{copyStatus}</Alert> : null}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Stack spacing={2}>
          <Card sx={{ borderRadius: 2, overflow: "hidden" }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom>
                Поле расстановки точек
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                В режиме добавления клик создаёт новую точку. В режиме перемещения клик переносит выбранную точку.
              </Typography>

              <Box
                onClick={handleMapClick}
                sx={{
                  position: "relative",
                  width: "100%",
                  minHeight: 360,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#f4f5f7",
                  aspectRatio: mapFile ? `${mapFile.width} / ${mapFile.height}` : "3 / 2",
                  cursor: mapFile ? "crosshair" : "default",
                }}
              >
                {mapFile ? (
                  <Box
                    component="img"
                    src={mapFile.src}
                    alt={alt}
                    sx={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      userSelect: "none",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "text.secondary",
                      px: 3,
                      textAlign: "center",
                    }}
                  >
                    Загрузите файл карты, чтобы начать расстановку точек.
                  </Box>
                )}

                {mapFile
                  ? points.map((point) => {
                      const isSelected = point.id === selectedPointId;
                      const left = `${(point.coordinates.x / mapFile.width) * 100}%`;
                      const top = `${(point.coordinates.y / mapFile.height) * 100}%`;

                      return (
                        <Box
                          key={point.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedPointId(point.id);
                          }}
                          title={point.name}
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
                          }}
                        />
                      );
                    })
                  : null}
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom>
                Готовый JSON
              </Typography>
              <TextField
                value={outputJson}
                multiline
                minRows={16}
                fullWidth
                InputProps={{
                  readOnly: true,
                  sx: {
                    fontFamily: "Consolas, Monaco, monospace",
                    alignItems: "flex-start",
                  },
                }}
              />
            </CardContent>
          </Card>
        </Stack>
      </Grid>
    </Grid>
  );
}

export default MapConfigurePage;
