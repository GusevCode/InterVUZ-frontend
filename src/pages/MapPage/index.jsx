import { useEffect, useState } from "react";
import {
  buildRoute,
  getAvailableFloors,
  getMapImage,
  getMapVectors,
  getMapGraphs,
  getPlaces,
} from "../../entities/map/mapLib";
import MapPageView from "./MapPageView";

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
        const initialMapId = fallbackId;
        const baseName = getMapBaseName(initialMapId);
        const nextVector = vectors.find((item) => getMapBaseName(item.id) === baseName) || null;
        const nextGraph = graphs.find((item) => getMapBaseName(item.id) === baseName) || null;

        setSelectedMapId((currentValue) => currentValue || initialMapId);
        setMapVector(nextVector);
        setMapGraph(nextGraph);
        setLocalRoutePoints([]);

        if (!image && !nextVector) {
          setMapWarning("В `src/entities/map/assets` не найден файл схемы. Добавьте туда PNG/JPG/SVG или *.map.json.");
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
    if (!selectedPlaceId || !mapVector) {
      return;
    }

    const place = places.find((p) => p.id === selectedPlaceId);

    if (!place) {
      setSelectedVectorId("");
      return;
    }

    const match = place.name.match(/(\d+[а-яёa-z]*)$/i);

    if (!match) {
      setSelectedVectorId("");
      return;
    }

    const cyrillicToLatin = { "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e" };
    const roomCode = match[1].toLowerCase().replace(/[а-яё]/g, (ch) => cyrillicToLatin[ch] ?? ch);
    const vectorId = `room-${roomCode}`;
    const elementExists = (mapVector.elements ?? []).some((el) => el.id === vectorId);

    setSelectedVectorId(elementExists ? vectorId : "");
  }, [selectedPlaceId, places, mapVector]);

  useEffect(() => {
    if (!selectedFloorId) {
      return undefined;
    }

    let isMounted = true;
    const selectedFloor = floors.find((floor) => floor.id === selectedFloorId);

    if (!selectedFloor) {
      return undefined;
    }

    async function loadPlacesForFloor() {
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

    loadPlacesForFloor();

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
    <MapPageView
      floors={floors}
      selectedFloorId={selectedFloorId}
      setSelectedFloorId={setSelectedFloorId}
      selectedFloor={selectedFloor}
      places={places}
      routeFromPlaceId={routeFromPlaceId}
      setRouteFromPlaceId={setRouteFromPlaceId}
      routeToPlaceId={routeToPlaceId}
      setRouteToPlaceId={setRouteToPlaceId}
      accessibleOnly={accessibleOnly}
      setAccessibleOnly={setAccessibleOnly}
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
      selectedPlaceId={selectedPlaceId}
      setSelectedPlaceId={setSelectedPlaceId}
      selectedPlace={selectedPlace}
      formatPlaceType={formatPlaceType}
      mapImage={mapImage}
      mapVector={mapVector}
      mapVectors={mapVectors}
      selectedMapId={selectedMapId}
      setSelectedMapId={setSelectedMapId}
      mapGraph={mapGraph}
      selectedVectorId={selectedVectorId}
      setSelectedVectorId={setSelectedVectorId}
      showLabels={showLabels}
      setShowLabels={setShowLabels}
      localRoutePoints={localRoutePoints}
      setLocalRoutePoints={setLocalRoutePoints}
      mapWidth={mapWidth}
      mapHeight={mapHeight}
      hasMapAsset={hasMapAsset}
      is3D={is3D}
      routePoints={routePoints}
      routePolylinePoints={routePolylinePoints}
      getCoordinatePercent={getCoordinatePercent}
      getRoutePointCoordinates={getRoutePointCoordinates}
    />
  );
}

export default MapPage;
