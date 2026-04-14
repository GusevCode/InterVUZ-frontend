import { useEffect, useState } from "react";
import {
  buildRoute,
  getAvailableFloors,
  getMapImage,
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

function MapPage() {
  const [floors, setFloors] = useState([]);
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [mapImage, setMapImage] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [routeFromPlaceId, setRouteFromPlaceId] = useState("");
  const [routeToPlaceId, setRouteToPlaceId] = useState("");
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [route, setRoute] = useState(null);
  const [routeError, setRouteError] = useState("");
  const [isLoadingFloors, setIsLoadingFloors] = useState(true);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [isBuildingRoute, setIsBuildingRoute] = useState(false);
  const [error, setError] = useState("");
  const [mapWarning, setMapWarning] = useState("");

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
    const selectedFloor = floors.find((floor) => floor.id === selectedFloorId);

    if (!selectedFloor) {
      return undefined;
    }

    async function loadMapData() {
      setIsLoadingMap(true);
      setError("");
      setMapWarning("");
      setRoute(null);
      setRouteError("");

      try {
        const [placesResponse, image] = await Promise.all([
          getPlaces({
            building: selectedFloor.building,
            floor: selectedFloor.floor,
          }),
          getMapImage(),
        ]);

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
        setMapImage(image);

        if (!image) {
          setMapWarning("В `src/data` не найден файл схемы. Добавьте туда PNG, JPG, WEBP, GIF, AVIF или SVG.");
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setMapImage(null);
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
  const mapWidth = mapImage?.width || 100;
  const mapHeight = mapImage?.height || 100;
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
      mapWidth={mapWidth}
      mapHeight={mapHeight}
      routePoints={routePoints}
      routePolylinePoints={routePolylinePoints}
      getCoordinatePercent={getCoordinatePercent}
      getRoutePointCoordinates={getRoutePointCoordinates}
    />
  );
}

export default MapPage;
