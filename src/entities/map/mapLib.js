import { fetchJson, postJson } from "../../shared/baseApi";

const localMapModules = import.meta.glob("./assets/*.{png,jpg,jpeg,webp,avif,gif,svg}", {
  eager: true,
  import: "default",
});

let cachedMapImagePromise = null;
let cachedPlacesPromise = null;

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
      reject(new Error("Не удалось определить размеры схемы корпуса."));
    };

    image.src = src;
  });
}

function normalizeBuilding(building) {
  const value = String(building ?? "").trim();
  const match = value.match(/^(?:B|Б)?\s*(\d+[A-Za-zА-Яа-я]?)$/i);

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
  const entries = Object.entries(localMapModules).sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath, "ru"));
  return entries[0] ?? null;
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
    label: "Схема корпуса",
    width: imageSize.width,
    height: imageSize.height,
    alt: "Схема корпуса",
    src,
  };
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

export async function getAvailableFloors() {
  const places = await getAllPlaces();
  const floorsMap = new Map();

  places.forEach((place) => {
    const building = place.coordinates?.building;
    const floor = place.coordinates?.floor;

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

    floorsMap.get(key).placesTotal += 1;
  });

  return Array.from(floorsMap.values()).sort(compareFloors);
}

export async function getMapImage() {
  if (!cachedMapImagePromise) {
    cachedMapImagePromise = loadMapImage();
  }

  return cachedMapImagePromise;
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
