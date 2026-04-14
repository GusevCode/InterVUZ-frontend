import { useEffect, useMemo, useRef, useState } from "react";
import MapConfigurePageView from "./MapConfigurePageView";

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
    <MapConfigurePageView
      fileInputRef={fileInputRef}
      handleFileChange={handleFileChange}
      handleCopyJson={handleCopyJson}
      mapFile={mapFile}
      building={building}
      setBuilding={setBuilding}
      floorId={floorId}
      setFloorId={setFloorId}
      floorLabel={floorLabel}
      setFloorLabel={setFloorLabel}
      alt={alt}
      setAlt={setAlt}
      mode={mode}
      setMode={setMode}
      selectedPoint={selectedPoint}
      handleDeleteSelectedPoint={handleDeleteSelectedPoint}
      lastClick={lastClick}
      updateSelectedPoint={updateSelectedPoint}
      pointTypeOptions={pointTypeOptions}
      copyStatus={copyStatus}
      handleMapClick={handleMapClick}
      points={points}
      selectedPointId={selectedPointId}
      setSelectedPointId={setSelectedPointId}
      outputJson={outputJson}
    />
  );
}

export default MapConfigurePage;
