import { defaultFloorId, getMockFloorMap, mockFloorMaps } from "../data/mockFloorMaps";

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getAvailableFloors() {
  await sleep(80);

  return mockFloorMaps.map((floor) => ({
    id: floor.id,
    label: floor.label,
    building: floor.building,
    placesTotal: floor.places.length,
    configFile: floor.configFile,
  }));
}

export async function getMapImage(filters = {}) {
  await sleep(120);

  const floor = getMockFloorMap(filters.floorId ?? defaultFloorId);

  if (!floor) {
    throw new Error("Map image is not available for the selected floor.");
  }

  return {
    id: floor.id,
    label: floor.label,
    building: floor.building,
    floor: floor.id,
    width: floor.width,
    height: floor.height,
    alt: floor.alt,
    src: floor.src,
    configFile: floor.configFile,
  };
}

export async function getPlaces(filters = {}) {
  await sleep(120);

  const floor = getMockFloorMap(filters.floorId ?? defaultFloorId);

  if (!floor) {
    return { items: [], total: 0 };
  }

  const items = floor.places.filter((place) => {
    if (filters.search) {
      const query = filters.search.trim().toLowerCase();
      const haystack = `${place.name} ${place.description}`.toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  });

  return {
    items,
    total: items.length,
  };
}
