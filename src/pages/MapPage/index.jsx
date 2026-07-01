import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  buildRoute,
  buildClassroomPlacesFromMapPois,
  buildMapRoomId,
  createSyntheticClassroomPlace,
  DEFAULT_MAP_FLOOR,
  extractMapRoomToken,
  findClassroomByRoomCode,
  getAvailableFloors,
  getMapImage,
  getMapVectors,
  getMapGraphs,
  getFloorLinks,
  getPlaces,
  getRoomSchedule,
  mapObjectExistsOnVector,
} from "../../entities/map/mapLib";
import { getFloorFromMapId, getVisibleRouteLabelIdsForFloor } from "../../entities/map/routeGraphLib";
import MapPageView from "./MapPageView";
import { DEFAULT_LABEL_DISPLAY_MODE } from "../../entities/map/roomLabelGroups";

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

function getDefaultMapId(vectors, graphs) {
  return vectors.find((item) => getFloorFromMapId(item.id) === DEFAULT_MAP_FLOOR)?.id
    ?? graphs.find((item) => getFloorFromMapId(item.id) === DEFAULT_MAP_FLOOR)?.id
    ?? vectors[0]?.id
    ?? graphs[0]?.id
    ?? "";
}

function getDefaultFloorId(floorItems) {
  return floorItems.find((floor) => floor.floor === DEFAULT_MAP_FLOOR)?.id
    ?? floorItems[0]?.id
    ?? "";
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
  const [allClassroomPlaces, setAllClassroomPlaces] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [routeFromPlaceId, setRouteFromPlaceId] = useState("");
  const [routeToPlaceId, setRouteToPlaceId] = useState("");
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [route, setRoute] = useState(null);
  const [selectedVectorId, setSelectedVectorId] = useState("");
  const [targetVectorId, setTargetVectorId] = useState("");
  const [targetPlaceId, setTargetPlaceId] = useState("");
  const [labelDisplayMode, setLabelDisplayMode] = useState(DEFAULT_LABEL_DISPLAY_MODE);
  const [localRoutePoints, setLocalRoutePoints] = useState([]);
  const [multiFloorRoute, setMultiFloorRoute] = useState(null);
  const [graphRoute, setGraphRoute] = useState(null);
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

  const selectedFloor = floors.find((floor) => floor.id === selectedFloorId) || null;
  const mapRoomPlaces = useMemo(
    () => buildClassroomPlacesFromMapPois(mapVector, selectedFloor),
    [mapVector, selectedFloor],
  );
  const displayPlaces = useMemo(
    () => (places.length > 0 ? places : mapRoomPlaces),
    [places, mapRoomPlaces],
  );
  const selectedPlace = useMemo(() => {
    const fromDisplay = displayPlaces.find((place) => place.id === selectedPlaceId);
    if (fromDisplay) {
      return fromDisplay;
    }

    const fromCatalog = allClassroomPlaces.find((place) => place.id === selectedPlaceId);
    if (fromCatalog) {
      return fromCatalog;
    }

    return createSyntheticClassroomPlace(selectedPlaceId, selectedFloor);
  }, [allClassroomPlaces, displayPlaces, selectedFloor, selectedPlaceId]);

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
        const connections = await getFloorLinks(graphs);

        if (!isMounted) {
          return;
        }

        setMapImage(image);
        setMapVectors(vectors);
        setMapGraphs(graphs);
        setFloorConnections(connections);

        const fallbackId = getDefaultMapId(vectors, graphs);
        const initialMapId = fallbackId;
        const baseName = getMapBaseName(initialMapId);
        const nextVector = vectors.find((item) => getMapBaseName(item.id) === baseName) || null;
        const nextGraph = graphs.find((item) => getMapBaseName(item.id) === baseName) || null;

        setSelectedMapId((currentValue) => currentValue || initialMapId);
        setMapVector(nextVector);
        setMapGraph(nextGraph);
        setLocalRoutePoints([]);
        setMultiFloorRoute(null);
        setGraphRoute(null);

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
        setGraphRoute(null);
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
        setSelectedFloorId((currentValue) => {
          if (currentValue && floorItems.some((floor) => floor.id === currentValue)) {
            return currentValue;
          }
          return getDefaultFloorId(floorItems);
        });
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

    let classroomsMounted = true;
    getPlaces({})
      .then((response) => {
        if (!classroomsMounted) {
          return;
        }
        setAllClassroomPlaces((response.items ?? []).filter((place) => place.type === "classroom"));
      })
      .catch(() => {
        if (classroomsMounted) {
          setAllClassroomPlaces([]);
        }
      });

    return () => {
      isMounted = false;
      classroomsMounted = false;
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

    const place = selectedPlace;
    if (!place) {
      setSelectedVectorId("");
      return;
    }

    const roomToken = place.id?.startsWith("place_")
      ? place.id.slice("place_".length)
      : String(place.name ?? "").match(/(\d+[\u0430-\u044f\u0451a-z0-9./_]*)/iu)?.[1];
    if (!roomToken) {
      setSelectedVectorId("");
      return;
    }

    const vectorId = buildMapRoomId(roomToken);
    const objectExists = mapObjectExistsOnVector(mapVector, vectorId);

    setSelectedVectorId(objectExists ? vectorId : "");
    if (selectedPlaceId === targetPlaceId) {
      setTargetVectorId(objectExists ? vectorId : "");
    }
  }, [selectedPlace, selectedPlaceId, mapVector, targetPlaceId]);

  useEffect(() => {
    if (!selectedVectorId) {
      return;
    }

    const roomToken = extractMapRoomToken(selectedVectorId);
    if (!roomToken) {
      return;
    }

    const matched = findClassroomByRoomCode(allClassroomPlaces, roomToken)
      || findClassroomByRoomCode(mapRoomPlaces, roomToken)
      || findClassroomByRoomCode(displayPlaces, roomToken);
    const nextPlaceId = matched?.id ?? `place_${roomToken}`;

    if (nextPlaceId !== selectedPlaceId) {
      setSelectedPlaceId(nextPlaceId);
    }
  }, [allClassroomPlaces, displayPlaces, mapRoomPlaces, selectedPlaceId, selectedVectorId]);

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
    if (!selectedPlace || selectedPlace.type !== "classroom" || !scheduleDate) {
      setRoomSchedule(null);
      setRoomScheduleError("");
      return undefined;
    }

    let isMounted = true;
    setIsLoadingRoomSchedule(true);
    setRoomScheduleError("");

    getRoomSchedule(selectedPlace.id, scheduleDate)
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
  }, [scheduleDate, selectedPlace]);

  const routeFromPlace = places.find((place) => place.id === routeFromPlaceId) || null;
  const routeToPlace = places.find((place) => place.id === routeToPlaceId) || null;
  const isLoading = isLoadingFloors || isLoadingMap;
  const mapWidth = mapVector?.width || mapImage?.width || 100;
  const mapHeight = mapVector?.height || mapImage?.height || 100;
  const mapPois = Array.isArray(mapVector?.pois) ? mapVector.pois : [];
  const hasMapAsset = Boolean(mapImage || mapVector);
  const is3D = Boolean(mapVector);
  const hasMultiFloorRoute = (multiFloorRoute?.segments?.length ?? 0) >= 2;
  const routeSegments = multiFloorRoute?.segments ?? [];
  const displayRoutePoints = hasMultiFloorRoute
    ? routeSegments[routeSegmentIndex]?.points ?? []
    : localRoutePoints;
  const routeVisibleLabelIds = useMemo(() => {
    if (!graphRoute || (localRoutePoints.length < 2 && !hasMultiFloorRoute)) {
      return null;
    }
    return getVisibleRouteLabelIdsForFloor(graphRoute, getFloorFromMapId(selectedMapId));
  }, [graphRoute, selectedMapId, localRoutePoints, hasMultiFloorRoute]);
  const isRouteDisabled = !routeFromPlaceId || !routeToPlaceId || routeFromPlaceId === routeToPlaceId || isBuildingRoute;
  const routeLocked = Boolean(graphRoute);
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

  function clearBuiltRoute() {
    setMultiFloorRoute(null);
    setRouteSegmentIndex(0);
    setLocalRoutePoints([]);
    setGraphRoute(null);
  }

  function handleLabelDisplayModeChange(mode) {
    clearBuiltRoute();
    setLabelDisplayMode(mode);
  }

  function handleSelectFloor(floorId) {
    setSelectedFloorId(floorId);
    const selectedFloor = floors.find((floor) => floor.id === floorId);
    if (!selectedFloor) {
      return;
    }
    handleSelectMap(getMapIdForFloor(mapVectors, selectedFloor.floor));
  }

  function handleSelectMap(mapId, { preserveRoute = false } = {}) {
    if (!mapId) {
      return;
    }
    setSelectedMapId(mapId);
    if (!preserveRoute) {
      clearBuiltRoute();
    }

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
    handleSelectMap(getMapIdForFloor(mapVectors, floor), { preserveRoute: true });
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
      handleSelectMap(mapId, { preserveRoute: true });
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
      handleSelectMap(mapId, { preserveRoute: true });
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
      places={displayPlaces}
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
      labelDisplayMode={labelDisplayMode}
      onLabelDisplayModeChange={handleLabelDisplayModeChange}
      localRoutePoints={localRoutePoints}
      setLocalRoutePoints={setLocalRoutePoints}
      setGraphRoute={setGraphRoute}
      graphRoute={graphRoute}
      routeLocked={routeLocked}
      routeVisibleLabelIds={routeVisibleLabelIds}
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
