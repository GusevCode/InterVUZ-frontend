import { fetchJson, postJson } from "../../shared/baseApi";
import { buildFloorLinksFromGraphs, getFloorFromMapId } from "./routeGraphLib";

const localMapModules = import.meta.glob("./assets/*.{png,jpg,jpeg,webp,avif,gif,svg}", {
  eager: true,
  import: "default",
});
const localMapVectorModules = import.meta.glob("./assets/*.map.json", {
  eager: true,
  import: "default",
});
const localMapGraphModules = import.meta.glob("./assets/*.graph.json", {
  eager: true,
  import: "default",
});
const localFloorLinksModule = import.meta.glob("./assets/floor-links.json", {
  eager: true,
  import: "default",
});

let cachedMapImagePromise = null;
let cachedMapVectorPromise = null;
let cachedMapVectorsPromise = null;
let cachedMapGraphsPromise = null;
let cachedPlacesPromise = null;

export const ACTIVE_MAP_FLOORS = [2, 3];
export const DEFAULT_MAP_FLOOR = 2;

export function isActiveMapFloor(floorNumber) {
  return ACTIVE_MAP_FLOORS.includes(Number(floorNumber));
}

function isActiveMapAssetPath(filePath = "") {
  const floorNumber = getFloorFromMapId(filePath);
  return floorNumber === null || isActiveMapFloor(floorNumber);
}

function readImageSizeFromSrc(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth || 1,
        height: image.naturalHeight || 1,
      });
    };

    image.onerror = () => {
      reject(new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ СЂР°Р·РјРµСЂС‹ СЃС…РµРјС‹ РєРѕСЂРїСѓСЃР°."));
    };

    image.src = src;
  });
}

function normalizeBuilding(building) {
  const value = String(building ?? "").trim();
  const match = value.match(/^(?:B|\u0411)?\s*(\d+[\p{L}]?)$/iu);

  if (!match) {
    return value;
  }

  return `B${match[1].toUpperCase()}`;
}

function normalizeFloor(floor) {
  const numericFloor = Number(floor);
  return Number.isNaN(numericFloor) ? String(floor ?? "") : numericFloor;
}

function normalizeCoordinates(coordinates = {}) {
  return {
    ...coordinates,
    building: normalizeBuilding(coordinates.building),
    floor: normalizeFloor(coordinates.floor),
    x: Number(coordinates.x) || 0,
    y: Number(coordinates.y) || 0,
  };
}

function normalizePlace(place) {
  return {
    ...place,
    coordinates: normalizeCoordinates(place.coordinates),
  };
}

function normalizeRouteStep(step) {
  return {
    ...step,
    coordinates: normalizeCoordinates(step.coordinates),
  };
}

function compareFloors(left, right) {
  const buildingOrder = String(left.building).localeCompare(String(right.building), "ru", { numeric: true });

  if (buildingOrder !== 0) {
    return buildingOrder;
  }

  const leftNumber = Number(left.label);
  const rightNumber = Number(right.label);

  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber) && leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }

  return String(left.label).localeCompare(String(right.label), "ru", { numeric: true });
}

function getLocalMapSource() {
  const entries = Object.entries(localMapModules)
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath, "ru"))
    .filter(([filePath]) => isActiveMapAssetPath(filePath));
  const svgEntry = entries.find(([filePath]) => filePath.toLowerCase().endsWith(".svg"));
  return svgEntry ?? entries[0] ?? null;
}

function getLocalMapVectorSource() {
  const entries = Object.entries(localMapVectorModules)
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath, "ru"))
    .filter(([filePath]) => isActiveMapAssetPath(filePath));
  return entries.find(([filePath]) => getFloorFromMapId(filePath) === DEFAULT_MAP_FLOOR)
    ?? entries[0]
    ?? null;
}

function getVectorLabel(fileName) {
  const baseName = fileName.replace(/\.map\.json$/i, "");
  const match = baseName.match(/floor[_-]?(\d+)/i);

  if (match) {
    return `\u042D\u0442\u0430\u0436 ${match[1]}`;
  }

  return baseName || "\u0421\u0445\u0435\u043C\u0430";
}

function getGraphLabel(fileName) {
  const baseName = fileName.replace(/\.graph\.json$/i, "");
  const match = baseName.match(/floor[_-]?(\d+)/i);

  if (match) {
    return `\u042D\u0442\u0430\u0436 ${match[1]}`;
  }

  return baseName || "\u041C\u0430\u0440\u0448\u0440\u0443\u0442";
}

async function loadMapImage() {
  const mapSource = getLocalMapSource();

  if (!mapSource) {
    return null;
  }

  const [path, src] = mapSource;
  const imageSize = await readImageSizeFromSrc(src);
  const fileName = path.split("/").pop() ?? "map";

  return {
    id: fileName,
    label: "РЎС…РµРјР° РєРѕСЂРїСѓСЃР°",
    width: imageSize.width,
    height: imageSize.height,
    alt: "РЎС…РµРјР° РєРѕСЂРїСѓСЃР°",
    src,
  };
}

function normalizeMapVector(entryPath, data) {
  const fileName = entryPath.split("/").pop() ?? "map.json";
  const viewBox = Array.isArray(data?.viewBox) ? data.viewBox : null;
  const width = Number(data?.width) || (viewBox?.[2] ? Number(viewBox[2]) : 0) || 0;
  const height = Number(data?.height) || (viewBox?.[3] ? Number(viewBox[3]) : 0) || 0;
  const elements = Array.isArray(data?.elements) ? data.elements : [];
  const pois = Array.isArray(data?.pois)
    ? data.pois
      .map((poi) => ({
        ...poi,
        x: Number(poi?.x),
        y: Number(poi?.y),
        id: String(poi?.id ?? "").trim(),
        title: poi?.title ? formatPoiDisplayLabel(String(poi.title)) : "",
        type: poi?.type ? String(poi.type) : "other",
      }))
      .filter((poi) => poi.id && Number.isFinite(poi.x) && Number.isFinite(poi.y))
    : [];

  return {
    ...data,
    id: fileName,
    label: data?.label ?? getVectorLabel(fileName),
    width,
    height,
    elements,
    pois,
  };
}

async function loadMapVectors() {
  const entries = Object.entries(localMapVectorModules)
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath, "ru"))
    .filter(([entryPath]) => isActiveMapAssetPath(entryPath));
  return entries.map(([entryPath, data]) => normalizeMapVector(entryPath, data));
}

async function loadMapVector() {
  const vectors = await loadMapVectors();
  return vectors.find((vector) => getFloorFromMapId(vector.id) === DEFAULT_MAP_FLOOR)
    ?? vectors[0]
    ?? null;
}

function normalizeMapGraph(entryPath, data) {
  const fileName = entryPath.split("/").pop() ?? "graph.json";
  return {
    ...data,
    id: fileName,
    label: data?.label ?? getGraphLabel(fileName),
    nodes: Array.isArray(data?.nodes)
      ? data.nodes.map((node) => ({
        ...node,
        label: node?.label ? formatPoiDisplayLabel(String(node.label)) : "",
      }))
      : [],
    edges: Array.isArray(data?.edges) ? data.edges : [],
  };
}

async function loadMapGraphs() {
  const entries = Object.entries(localMapGraphModules)
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath, "ru"))
    .filter(([entryPath]) => isActiveMapAssetPath(entryPath));
  return entries.map(([entryPath, data]) => normalizeMapGraph(entryPath, data));
}

async function loadAllPlaces() {
  const response = await fetchJson("/places");
  return (response.items ?? []).map(normalizePlace);
}

async function getAllPlaces() {
  if (!cachedPlacesPromise) {
    cachedPlacesPromise = loadAllPlaces();
  }

  return cachedPlacesPromise;
}

function registerFloor(floorsMap, building, floor, placesDelta = 0) {
  if (building === undefined || floor === undefined || building === "") {
    return;
  }

  const key = `${building}:${floor}`;

  if (!floorsMap.has(key)) {
    floorsMap.set(key, {
      id: key,
      label: String(floor),
      building,
      floor,
      placesTotal: 0,
    });
  }

  floorsMap.get(key).placesTotal += placesDelta;
}

const LATIN_AUDITORIUM_SUFFIX = {
  a: "\u0430",
  b: "\u0431",
  v: "\u0432",
  g: "\u0433",
  u: "\u044E",
};

export function localizeAuditoriumRoomSuffix(text) {
  return String(text ?? "").replace(/(\d)([abvgu])/gi, (match, digits, letter) => {
    const mapped = LATIN_AUDITORIUM_SUFFIX[letter.toLowerCase()];
    return mapped ? `${digits}${mapped}` : match;
  });
}

export function formatPoiDisplayLabel(label) {
  const text = String(label ?? "").trim();
  if (!text) {
    return text;
  }

  const auditoriumMatch = text.match(/^Ауд\.\s+(.+)$/u);
  if (auditoriumMatch) {
    return localizeAuditoriumRoomSuffix(auditoriumMatch[1].trim());
  }

  if (/^лестница/i.test(text)) {
    return "лестница";
  }

  if (/^принтер/i.test(text)) {
    return "принтер";
  }

  if (/^туалет/i.test(text)) {
    return "туалет";
  }

  return localizeAuditoriumRoomSuffix(text);
}

export async function getAvailableFloors() {
  const [places, vectors] = await Promise.all([getAllPlaces(), getMapVectors()]);
  const floorsMap = new Map();

  places.forEach((place) => {
    registerFloor(floorsMap, place.coordinates?.building, place.coordinates?.floor, 1);
  });

  vectors.forEach((vector) => {
    const floorNumber = getFloorFromMapId(vector.id);
    if (floorNumber === null) {
      return;
    }
    registerFloor(floorsMap, normalizeBuilding("1"), floorNumber, 0);
  });

  return Array.from(floorsMap.values())
    .filter((floor) => isActiveMapFloor(floor.floor))
    .sort(compareFloors);
}

export async function getMapImage() {
  if (!cachedMapImagePromise) {
    cachedMapImagePromise = loadMapImage();
  }

  return cachedMapImagePromise;
}

export async function getMapVector() {
  if (!cachedMapVectorPromise) {
    cachedMapVectorPromise = loadMapVector();
  }

  return cachedMapVectorPromise;
}

export async function getMapVectors() {
  if (!cachedMapVectorsPromise) {
    cachedMapVectorsPromise = loadMapVectors();
  }

  return cachedMapVectorsPromise;
}

export async function getMapGraphs() {
  if (!cachedMapGraphsPromise) {
    cachedMapGraphsPromise = loadMapGraphs();
  }

  return cachedMapGraphsPromise;
}

export async function getFloorLinks(mapGraphs) {
  const graphs = mapGraphs ?? (await getMapGraphs());
  const autoConnections = buildFloorLinksFromGraphs(graphs, [2, 3]);
  if (autoConnections.length > 0) {
    return autoConnections;
  }

  const entries = Object.values(localFloorLinksModule);
  const data = entries[0];
  return Array.isArray(data?.connections) ? data.connections : [];
}

export async function getPlaces(filters = {}) {
  const places = await getAllPlaces();
  const normalizedBuilding = filters.building ? normalizeBuilding(filters.building) : "";
  const normalizedFloor = filters.floor !== undefined && filters.floor !== null && filters.floor !== ""
    ? normalizeFloor(filters.floor)
    : null;
  const searchQuery = String(filters.search ?? "").trim().toLowerCase();

  const filteredItems = places.filter((place) => {
    if (normalizedBuilding && place.coordinates.building !== normalizedBuilding) {
      return false;
    }

    if (normalizedFloor !== null && place.coordinates.floor !== normalizedFloor) {
      return false;
    }

    if (searchQuery) {
      const searchTarget = `${place.name ?? ""} ${place.description ?? ""}`.toLowerCase();
      return searchTarget.includes(searchQuery);
    }

    return true;
  });

  return {
    items: filteredItems,
    total: filteredItems.length,
  };
}

export async function buildRoute({ fromPlaceId, toPlaceId, accessibleOnly = false }) {
  const response = await postJson("/routes", {
    fromPlaceId,
    toPlaceId,
    accessibleOnly,
  });

  return {
    distanceMeters: Number(response.distanceMeters) || 0,
    estimatedDurationMinutes: Number(response.estimatedDurationMinutes) || 0,
    steps: Array.isArray(response.steps)
      ? response.steps
        .map(normalizeRouteStep)
        .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
      : [],
  };
}

export async function getRoomSchedule(roomId, date) {
  return fetchJson(`/rooms/${encodeURIComponent(roomId)}/schedule`, { date });
}

const CYRILLIC_TO_LATIN = {
  "\u0430": "a",
  "\u0431": "b",
  "\u0432": "v",
  "\u0433": "g",
  "\u0434": "d",
  "\u0435": "e",
};

export function normalizeRoomCode(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[\u0430-\u044f\u0451]/g, (ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
    .replace(/\//g, "_")
    .replace(/[^a-z0-9._]/g, "");
}

export function extractMapRoomToken(mapObjectId) {
  const normalized = String(mapObjectId ?? "").trim().toLowerCase();
  const match = normalized.match(/^room-(.+)$/i);
  return match?.[1] ?? "";
}

export function buildMapRoomId(roomToken) {
  const normalized = normalizeRoomCode(roomToken);
  return normalized ? `room-${normalized}` : "";
}

export function findClassroomByRoomCode(classrooms, roomToken) {
  const targetCode = normalizeRoomCode(roomToken);
  if (!targetCode) {
    return null;
  }

  return (classrooms ?? []).find((place) => {
    if (place.type !== "classroom") {
      return false;
    }

    const idToken = place.id?.startsWith("place_") ? place.id.slice("place_".length) : "";
    if (idToken && normalizeRoomCode(idToken) === targetCode) {
      return true;
    }

    const nameMatch = String(place.name ?? "").match(/(\d+[\u0430-\u044f\u0451a-z0-9./_]*)/iu);
    return Boolean(nameMatch && normalizeRoomCode(nameMatch[1]) === targetCode);
  }) ?? null;
}

export function buildClassroomPlacesFromMapPois(mapVector, floorMeta) {
  if (!mapVector || !floorMeta) {
    return [];
  }

  const building = floorMeta.building ?? "B1";
  const floor = floorMeta.floor;
  const seen = new Set();

  return (mapVector.pois ?? [])
    .map((poi) => {
      if (poi.type !== "room" && !/^room-/i.test(poi.id)) {
        return null;
      }

      const roomToken = extractMapRoomToken(poi.id)
        || normalizeRoomCode(String(poi.title ?? "").replace(/^Ауд\.\s*/iu, ""));
      if (!roomToken || seen.has(roomToken)) {
        return null;
      }
      seen.add(roomToken);

      const displayLabel = String(poi.title ?? "").trim();
      const roomLabel = roomToken.replace(/_/g, "/");

      return {
        id: `place_${roomToken}`,
        name: displayLabel || `Аудитория ${roomLabel}`,
        type: "classroom",
        description: "Учебная аудитория",
        coordinates: {
          building,
          floor,
          x: Number(poi.x) || 0,
          y: Number(poi.y) || 0,
        },
        tags: ["lecture"],
        isAccessible: true,
      };
    })
    .filter(Boolean);
}

export function createSyntheticClassroomPlace(placeId, floorMeta) {
  if (!placeId?.startsWith("place_") || !floorMeta) {
    return null;
  }

  const token = placeId.slice("place_".length);
  if (!token) {
    return null;
  }

  return {
    id: placeId,
    name: `Аудитория ${token.replace(/_/g, "/")}`,
    type: "classroom",
    description: "Учебная аудитория",
    coordinates: {
      building: floorMeta.building ?? "B1",
      floor: floorMeta.floor,
      x: 0,
      y: 0,
    },
    tags: ["lecture"],
    isAccessible: true,
  };
}

export function mapObjectExistsOnVector(mapVector, objectId) {
  if (!mapVector || !objectId) {
    return false;
  }

  return (mapVector.pois ?? []).some((poi) => poi.id === objectId)
    || (mapVector.elements ?? []).some((element) => element.id === objectId);
}

export function getLandscapeMapAspectRatio(mapWidth, mapHeight) {
  const width = Number(mapWidth) > 0 ? Number(mapWidth) : 1600;
  const height = Number(mapHeight) > 0 ? Number(mapHeight) : 1080;

  if (width >= height) {
    return `${width} / ${height}`;
  }

  return `${height} / ${width}`;
}

export function getMobileLandscapeMapFrameSx(mapWidth, mapHeight) {
  return {
    width: "100%",
    aspectRatio: getLandscapeMapAspectRatio(mapWidth, mapHeight),
    maxHeight: "min(280px, 68vw)",
    minHeight: 0,
    mx: "auto",
    position: "relative",
    overflow: "hidden",
    "@media (orientation: landscape)": {
      maxHeight: "min(360px, 72vh)",
    },
  };
}

export const FULLSCREEN_ROTATED_CAMERA_FIT = 2;
export const FULLSCREEN_FRAME_ROTATION_DEG = 90;
export const FULLSCREEN_MOBILE_VIEW_ROTATION_Z = Math.PI / 2;
export const FULLSCREEN_VIEW_ROTATION_Z = -Math.PI / 2;
