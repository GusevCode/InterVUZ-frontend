import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  buildRoute,
  getAvailableFloors,
  getMapImage,
  getMapVectors,
  getMapGraphs,
  getFloorLinks,
  getPlaces,
  getRoomSchedule,
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

function getMapIdForFloor(mapVectors, floor) {
  const floorNumber = Number(floor);
  const targetBase = `floor_${floorNumber}`;
  const matched = mapVectors.find((item) => getMapBaseName(item.id) === targetBase);
  return matched?.id ?? "";
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function normalizeId(value) {
  return String(value ?? "").trim().toLowerCase();
}

function extractRoomToken(value) {
  const normalized = normalizeId(value).replaceAll("_", "-");
  const roomMatch = normalized.match(/(?:room-)?(\d+[\p{L}]?)/iu);
  return roomMatch?.[1] ?? "";
}

function findMatchingElementId(elements, rawId) {
  const normalizedRaw = normalizeId(rawId);
  if (!normalizedRaw) {
    return "";
  }

  const exact = (elements ?? []).find((item) => normalizeId(item?.id) === normalizedRaw);
  if (exact?.id) {
    return exact.id;
  }

  const roomToken = extractRoomToken(normalizedRaw);
  if (!roomToken) {
    return "";
  }

  const byRoomCode = (elements ?? []).find((item) => {
    const elementId = normalizeId(item?.id);
    return elementId === `room-${roomToken}` || elementId.endsWith(`-${roomToken}`);
  });

  return byRoomCode?.id ?? "";
}

function findMatchingPlaceId(placeItems, rawId) {
  const normalizedRaw = normalizeId(rawId);
  if (!normalizedRaw) {
    return "";
  }

  const exact = (placeItems ?? []).find((item) => normalizeId(item?.id) === normalizedRaw);
  if (exact?.id) {
    return exact.id;
  }

  const roomToken = extractRoomToken(normalizedRaw);
  if (!roomToken) {
    return "";
  }

  const byName = (placeItems ?? []).find((item) => {
    const nameToken = extractRoomToken(item?.name ?? "");
    return nameToken === roomToken;
  });

  return byName?.id ?? "";
}

function findMatchingPoiId(pois, rawId) {
  const normalizedRaw = normalizeId(rawId);
  if (!normalizedRaw) {
    return "";
  }

  const exact = (pois ?? []).find((poi) => normalizeId(poi?.id) === normalizedRaw);
  if (exact?.id) {
    return exact.id;
  }

  const roomToken = extractRoomToken(normalizedRaw);
  if (!roomToken) {
    return "";
  }

  const byRoomToken = (pois ?? []).find((poi) => {
    const poiId = normalizeId(poi?.id);
    const poiTitle = normalizeId(poi?.title);
    return poiId.includes(roomToken) || poiTitle.includes(roomToken);
  });

  return byRoomToken?.id ?? "";
}

function findMatchingMapObjectId(mapVector, rawId) {
  const elementId = findMatchingElementId(mapVector?.elements, rawId);
  if (elementId) {
    return elementId;
  }
  return findMatchingPoiId(mapVector?.pois, rawId);
}

function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [targetVectorId, setTargetVectorId] = useState("");
  const [targetPlaceId, setTargetPlaceId] = useState("");
  const [showLabels, setShowLabels] = useState(true);
  const [localRoutePoints, setLocalRoutePoints] = useState([]);
  const [multiFloorRoute, setMultiFloorRoute] = useState(null);
  const [routeSegmentIndex, setRouteSegmentIndex] = useState(0);
  const [floorConnections, setFloorConnections] = useState([]);
  const [routeError, setRouteError] = useState("");
  const [scheduleDate, setScheduleDate] = useState(getTodayDate());
  const [roomSchedule, setRoomSchedule] = useState(null);
  const [isLoadingRoomSchedule, setIsLoadingRoomSchedule] = useState(false);
  const [roomScheduleError, setRoomScheduleError] = useState("");
  const [isLoadingFloors, setIsLoadingFloors] = useState(true);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [isBuildingRoute, setIsBuildingRoute] = useState(false);
  const [error, setError] = useState("");
  const [mapWarning, setMapWarning] = useState("");
  const assistantMapId = searchParams.get("assistantMapId") ?? "";
  const assistantPlaceId = searchParams.get("assistantPlaceId") ?? "";
  const assistantElementId = searchParams.get("assistantElementId") ?? "";

  useEffect(() => {
    let isMounted = true;

    async function loadMapAssets() {
      setIsLoadingMap(true);
      setMapWarning("");

      try {
        const [image, vectors, graphs, connections] = await Promise.all([
          getMapImage(),
          getMapVectors(),
          getMapGraphs(),
          getFloorLinks(),
        ]);

        if (!isMounted) {
          return;
        }

        setMapImage(image);
        setMapVectors(vectors);
        setMapGraphs(graphs);
        setFloorConnections(connections);

        const fallbackId = vectors[0]?.id || graphs[0]?.id || "";
        const initialMapId = fallbackId;
        const baseName = getMapBaseName(initialMapId);
        const nextVector = vectors.find((item) => getMapBaseName(item.id) === baseName) || null;
        const nextGraph = graphs.find((item) => getMapBaseName(item.id) === baseName) || null;

        setSelectedMapId((currentValue) => currentValue || initialMapId);
        setMapVector(nextVector);
        setMapGraph(nextGraph);
        setLocalRoutePoints([]);
        setMultiFloorRoute(null);

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
        setMultiFloorRoute(null);
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
  }, [selectedMapId, mapVectors, mapGraphs]);

  useEffect(() => {
    if (!selectedMapId || floors.length === 0) {
      return;
    }

    const baseName = getMapBaseName(selectedMapId);
    const floorMatch = baseName.match(/floor[_-]?(\d+)/i);
    if (!floorMatch) {
      return;
    }

    const floorNum = Number(floorMatch[1]);
    const matchedFloor = floors.find((f) => f.floor === floorNum);
    if (matchedFloor && matchedFloor.id !== selectedFloorId) {
      setSelectedFloorId(matchedFloor.id);
    }
  }, [selectedMapId, floors]);

  useEffect(() => {
    if (!assistantMapId || mapVectors.length === 0) {
      return;
    }

    const matched = mapVectors.find((item) => {
      if (item.id === assistantMapId) {
        return true;
      }
      return getMapBaseName(item.id) === getMapBaseName(assistantMapId);
    });

    if (!matched) {
      return;
    }

    setSelectedMapId(matched.id);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("assistantMapId");
    setSearchParams(nextParams, { replace: true });
  }, [assistantMapId, mapVectors, searchParams, setSearchParams]);

  useEffect(() => {
    if (!assistantPlaceId || places.length === 0) {
      return;
    }

    const matchedPlaceId = findMatchingPlaceId(places, assistantPlaceId);
    if (!matchedPlaceId) {
      return;
    }

    setSelectedPlaceId(matchedPlaceId);
    setTargetPlaceId(matchedPlaceId);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("assistantPlaceId");
    setSearchParams(nextParams, { replace: true });
  }, [assistantPlaceId, places, searchParams, setSearchParams]);
  useEffect(() => {
    if (!mapVector) {
      return;
    }

    const matchedByElementId = findMatchingMapObjectId(mapVector, assistantElementId);
    const matchedByPlaceId = matchedByElementId
      ? ""
      : findMatchingMapObjectId(mapVector, assistantPlaceId);
    const matchedElementId = matchedByElementId || matchedByPlaceId;

    if (!matchedElementId) {
      return;
    }

    setSelectedVectorId(matchedElementId);
    setTargetVectorId(matchedElementId);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("assistantElementId");
    if (matchedByPlaceId) {
      nextParams.delete("assistantPlaceId");
    }
    setSearchParams(nextParams, { replace: true });
  }, [assistantElementId, assistantPlaceId, mapVector, searchParams, setSearchParams]);

  useEffect(() => {
    if (!selectedPlaceId || !mapVector) {
      return;
    }

    const place = places.find((p) => p.id === selectedPlaceId);

    if (!place) {
      setSelectedVectorId("");
      return;
    }

    const match = place.name.match(/(\d+[\u0430-\u044f\u0451a-z]*)$/i);

    if (!match) {
      setSelectedVectorId("");
      return;
    }

    const cyrillicToLatin = {
      "\u0430": "a",
      "\u0431": "b",
      "\u0432": "v",
      "\u0433": "g",
      "\u0434": "d",
      "\u0435": "e",
    };
    const roomCode = match[1].toLowerCase().replace(/[\u0430-\u044f\u0451]/g, (ch) => cyrillicToLatin[ch] ?? ch);
    const vectorId = `room-${roomCode}`;
    const elementExists = (mapVector.elements ?? []).some((el) => el.id === vectorId);

    setSelectedVectorId(elementExists ? vectorId : "");
    if (selectedPlaceId === targetPlaceId) {
      setTargetVectorId(elementExists ? vectorId : "");
    }
  }, [selectedPlaceId, places, mapVector, targetPlaceId]);

  useEffect(() => {
    if (!selectedVectorId || places.length === 0) {
      return;
    }

    const cyrillicToLatin = {
      "\u0430": "a",
      "\u0431": "b",
      "\u0432": "v",
      "\u0433": "g",
      "\u0434": "d",
      "\u0435": "e",
    };

    const rawToken = selectedVectorId.replace(/^room-/i, "").toLowerCase();
    if (!rawToken) {
      return;
    }

    const matched = places.find((place) => {
      const match = place.name.match(/(\d+[\u0430-\u044f\u0451a-z]*)$/i);
      if (!match) {
        return false;
      }
      const placeCode = match[1]
        .toLowerCase()
        .replace(/[\u0430-\u044f\u0451]/g, (ch) => cyrillicToLatin[ch] ?? ch);
      return placeCode === rawToken;
    });

    if (matched && matched.id !== selectedPlaceId) {
      setSelectedPlaceId(matched.id);
    }
  }, [selectedVectorId, places]);

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

  useEffect(() => {
    const place = places.find((p) => p.id === selectedPlaceId);
    if (!place || place.type !== "classroom" || !scheduleDate) {
      setRoomSchedule(null);
      setRoomScheduleError("");
      return undefined;
    }

    let isMounted = true;
    setIsLoadingRoomSchedule(true);
    setRoomScheduleError("");

    getRoomSchedule(place.id, scheduleDate)
      .then((response) => {
        if (!isMounted) {
          return;
        }
        setRoomSchedule(response);
      })
      .catch((scheduleError) => {
        if (!isMounted) {
          return;
        }
        setRoomSchedule(null);
        setRoomScheduleError(scheduleError.message || "Не удалось загрузить расписание аудитории.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingRoomSchedule(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [places, selectedPlaceId, scheduleDate]);

  const selectedFloor = floors.find((floor) => floor.id === selectedFloorId) || null;
  const selectedPlace = places.find((place) => place.id === selectedPlaceId) || null;
  const routeFromPlace = places.find((place) => place.id === routeFromPlaceId) || null;
  const routeToPlace = places.find((place) => place.id === routeToPlaceId) || null;
  const isLoading = isLoadingFloors || isLoadingMap;
  const mapWidth = mapVector?.width || mapImage?.width || 100;
  const mapHeight = mapVector?.height || mapImage?.height || 100;
  const mapPois = Array.isArray(mapVector?.pois) ? mapVector.pois : [];
  const hasMapAsset = Boolean(mapImage || mapVector);
  const is3D = Boolean(mapVector);
  const hasMultiFloorRoute = (multiFloorRoute?.segments?.length ?? 0) > 0;
  const routeSegments = multiFloorRoute?.segments ?? [];
  const displayRoutePoints = hasMultiFloorRoute
    ? routeSegments[routeSegmentIndex]?.points ?? []
    : localRoutePoints;
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

  function handleSelectFloor(floorId) {
    setSelectedFloorId(floorId);
    const selectedFloor = floors.find((floor) => floor.id === floorId);
    if (!selectedFloor) {
      return;
    }
    handleSelectMap(getMapIdForFloor(mapVectors, selectedFloor.floor));
  }

  function handleSelectMap(mapId) {
    if (!mapId) {
      return;
    }
    setSelectedMapId(mapId);
    setMultiFloorRoute(null);
    setRouteSegmentIndex(0);
    setLocalRoutePoints([]);

    const floorMatch = getMapBaseName(mapId).match(/floor[_-]?(\d+)/i);
    if (!floorMatch) {
      return;
    }
    const floorNum = Number(floorMatch[1]);
    const matchedFloor = floors.find((floor) => floor.floor === floorNum);
    if (matchedFloor) {
      setSelectedFloorId(matchedFloor.id);
    }
  }

  function handleRouteFloorChange(floor) {
    handleSelectMap(getMapIdForFloor(mapVectors, floor));
  }

  function handleSelectRouteSegment(index) {
    if (!multiFloorRoute?.segments?.length) {
      return;
    }
    const segment = multiFloorRoute.segments[index];
    if (!segment) {
      return;
    }
    setRouteSegmentIndex(index);
    const mapId = getMapIdForFloor(mapVectors, segment.floor);
    if (mapId) {
      setSelectedMapId(mapId);
      const matchedFloor = floors.find((floor) => floor.floor === segment.floor);
      if (matchedFloor) {
        setSelectedFloorId(matchedFloor.id);
      }
    }
    setLocalRoutePoints(segment.points ?? []);
  }

  useEffect(() => {
    if (!multiFloorRoute?.segments?.length) {
      setRouteSegmentIndex(0);
      return;
    }
    setRouteSegmentIndex(0);
    const firstSegment = multiFloorRoute.segments[0];
    const mapId = getMapIdForFloor(mapVectors, firstSegment.floor);
    if (mapId) {
      setSelectedMapId(mapId);
    }
    setLocalRoutePoints(firstSegment.points ?? []);
  }, [multiFloorRoute, mapVectors]);

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
      setTargetPlaceId(routeToPlaceId);
      setTargetVectorId("");
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
      scheduleDate={scheduleDate}
      setScheduleDate={setScheduleDate}
      roomSchedule={roomSchedule}
      isLoadingRoomSchedule={isLoadingRoomSchedule}
      roomScheduleError={roomScheduleError}
      formatPlaceType={formatPlaceType}
      mapImage={mapImage}
      mapVector={mapVector}
      mapPois={mapPois}
      mapVectors={mapVectors}
      selectedMapId={selectedMapId}
      setSelectedMapId={setSelectedMapId}
      mapGraph={mapGraph}
      mapGraphs={mapGraphs}
      floorConnections={floorConnections}
      multiFloorRoute={multiFloorRoute}
      setMultiFloorRoute={setMultiFloorRoute}
      hasMultiFloorRoute={hasMultiFloorRoute}
      routeSegments={routeSegments}
      routeSegmentIndex={routeSegmentIndex}
      onSelectRouteSegment={handleSelectRouteSegment}
      handleSelectMap={handleSelectMap}
      handleSelectFloor={handleSelectFloor}
      handleRouteFloorChange={handleRouteFloorChange}
      displayRoutePoints={displayRoutePoints}
      selectedVectorId={selectedVectorId}
      setSelectedVectorId={setSelectedVectorId}
      targetVectorId={targetVectorId}
      targetPlaceId={targetPlaceId}
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
