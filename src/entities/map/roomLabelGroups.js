export const LABEL_DISPLAY_MODE = {
  GROUP_1: "third-1",
  GROUP_2: "third-2",
  GROUP_3: "third-3",
  ALL: "all",
};

export const DEFAULT_LABEL_DISPLAY_MODE = LABEL_DISPLAY_MODE.ALL;

export const LABEL_DISPLAY_MODE_OPTIONS = [
  { value: LABEL_DISPLAY_MODE.GROUP_1, label: "1/3" },
  { value: LABEL_DISPLAY_MODE.GROUP_2, label: "2/3" },
  { value: LABEL_DISPLAY_MODE.GROUP_3, label: "3/3" },
  { value: LABEL_DISPLAY_MODE.ALL, label: "\u0412\u0441\u0435" },
];

const AUDITORIUM_TITLE_PREFIX = "\u0410\u0443\u0434.";
const GROUP_COUNT = 3;

export function isAuditoriumTitle(title) {
  return String(title ?? "").trim().startsWith(AUDITORIUM_TITLE_PREFIX);
}

export function isAlwaysVisiblePoiType(type) {
  return String(type ?? "").toLowerCase() !== "room";
}

function distance(left, right) {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  return Math.hypot(dx, dy);
}

function wouldLabelsOverlap(left, right, mapWidth, mapHeight) {
  const minDistance = Math.max(mapWidth, mapHeight) * 0.035;
  const maxSize = Math.max(left.width || 0, left.height || 0, right.width || 0, right.height || 0);
  const threshold = Math.max(minDistance, maxSize * 0.5);
  return distance(left, right) < threshold;
}

function compareSpatially(left, right) {
  return left.y - right.y || left.x - right.x;
}

function buildAdjacency(labelItems, mapWidth, mapHeight) {
  const adjacency = new Map();
  labelItems.forEach((item) => {
    adjacency.set(item.id, new Set());
  });

  for (let leftIndex = 0; leftIndex < labelItems.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < labelItems.length; rightIndex += 1) {
      const left = labelItems[leftIndex];
      const right = labelItems[rightIndex];
      if (!wouldLabelsOverlap(left, right, mapWidth, mapHeight)) {
        continue;
      }
      adjacency.get(left.id).add(right.id);
      adjacency.get(right.id).add(left.id);
    }
  }

  return adjacency;
}

function pickColor(blockedColors, colorCounts) {
  let bestColor = 0;
  let bestCount = Number.POSITIVE_INFINITY;

  for (let color = 0; color < GROUP_COUNT; color += 1) {
    if (blockedColors.has(color)) {
      continue;
    }
    if (colorCounts[color] < bestCount) {
      bestColor = color;
      bestCount = colorCounts[color];
    }
  }

  if (!blockedColors.has(bestColor)) {
    return bestColor;
  }

  return colorCounts.indexOf(Math.min(...colorCounts));
}

/**
 * Assigns auditorium labels to three groups so that labels that would overlap
 * on the map always land in different groups.
 */
export function buildRoomLabelGroups(labelItems, mapWidth, mapHeight) {
  const groups = new Map();
  if (!Array.isArray(labelItems) || labelItems.length === 0) {
    return groups;
  }

  const adjacency = buildAdjacency(labelItems, mapWidth, mapHeight);
  const colorCounts = Array.from({ length: GROUP_COUNT }, () => 0);
  const sorted = [...labelItems].sort((left, right) => {
    const leftDegree = adjacency.get(left.id)?.size ?? 0;
    const rightDegree = adjacency.get(right.id)?.size ?? 0;
    if (rightDegree !== leftDegree) {
      return rightDegree - leftDegree;
    }
    return compareSpatially(left, right);
  });

  sorted.forEach((item) => {
    const blockedColors = new Set();
    adjacency.get(item.id)?.forEach((neighborId) => {
      if (groups.has(neighborId)) {
        blockedColors.add(groups.get(neighborId));
      }
    });

    const color = pickColor(blockedColors, colorCounts);
    groups.set(item.id, color);
    colorCounts[color] += 1;
  });

  return groups;
}
