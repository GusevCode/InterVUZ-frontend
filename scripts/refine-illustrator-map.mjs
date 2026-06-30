import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);

function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index === -1) {
    return null;
  }
  return args[index + 1] ?? null;
}

function parsePathPoints(pathData) {
  if (!pathData) {
    return [];
  }

  const tokens = String(pathData).match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);
  if (!tokens) {
    return [];
  }

  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let cmd = null;
  const points = [];

  function addPoint(nx, ny) {
    x = nx;
    y = ny;
    points.push([x, y]);
  }

  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index];
    if (/^[a-zA-Z]$/.test(token)) {
      cmd = token;
      index += 1;
      continue;
    }

    if (!cmd) {
      index += 1;
      continue;
    }

    const isRelative = cmd === cmd.toLowerCase();
    const cmdUpper = cmd.toUpperCase();

    if (cmdUpper === "M" || cmdUpper === "L") {
      const xVal = Number(tokens[index]);
      const yVal = Number(tokens[index + 1]);
      if (!Number.isFinite(xVal) || !Number.isFinite(yVal)) {
        break;
      }
      addPoint(isRelative ? x + xVal : xVal, isRelative ? y + yVal : yVal);
      if (cmdUpper === "M") {
        startX = x;
        startY = y;
        cmd = isRelative ? "l" : "L";
      }
      index += 2;
      continue;
    }

    if (cmdUpper === "H") {
      const xVal = Number(tokens[index]);
      if (!Number.isFinite(xVal)) {
        break;
      }
      addPoint(isRelative ? x + xVal : xVal, y);
      index += 1;
      continue;
    }

    if (cmdUpper === "V") {
      const yVal = Number(tokens[index]);
      if (!Number.isFinite(yVal)) {
        break;
      }
      addPoint(x, isRelative ? y + yVal : yVal);
      index += 1;
      continue;
    }

    if (cmdUpper === "Z") {
      addPoint(startX, startY);
      index += 1;
      continue;
    }

    break;
  }

  return points;
}

function getCentroid(points) {
  if (!points.length) {
    return { x: 0, y: 0, area: 0, width: 0, height: 0 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let area = 0;

  points.forEach((point, pointIndex) => {
    const next = points[(pointIndex + 1) % points.length];
    area += point[0] * next[1] - next[0] * point[1];
    minX = Math.min(minX, point[0]);
    maxX = Math.max(maxX, point[0]);
    minY = Math.min(minY, point[1]);
    maxY = Math.max(maxY, point[1]);
  });

  const sum = points.reduce(
    (acc, point) => {
      acc.x += point[0];
      acc.y += point[1];
      return acc;
    },
    { x: 0, y: 0 },
  );

  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
    area: Math.abs(area / 2),
    width: maxX - minX,
    height: maxY - minY,
  };
}

function isValidGeometry(element) {
  const points = parsePathPoints(element.d);
  if (points.length < 2) {
    return false;
  }

  const { width, height } = getCentroid(points);
  const hasFill = element.fill && element.fill !== "none";
  if (hasFill && width < 0.5 && height < 0.5) {
    return false;
  }

  return true;
}

const inputPath = getArgValue("--input") ?? args[0];
const outputPath = getArgValue("--output") ?? args[1];

if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/refine-illustrator-map.mjs --input raw.map.json --output floor_1.map.json");
  process.exit(1);
}

const source = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const roomFill = "#e6e6e6";

const roomCandidates = [];
const lineElements = [];
let lineIndex = 0;

for (const element of source.elements ?? []) {
  if (!isValidGeometry(element)) {
    continue;
  }

  if (element.fill === roomFill) {
    roomCandidates.push({ element, metrics: getCentroid(parsePathPoints(element.d)) });
    continue;
  }

  const hasStroke = element.stroke && element.stroke !== "none";
  const isStrokeOnly = hasStroke && (!element.fill || element.fill === "none");

  if (isStrokeOnly) {
    lineIndex += 1;
    lineElements.push({
      ...element,
      id: `room-line-${String(lineIndex).padStart(4, "0")}`,
      title: `room-line-${String(lineIndex).padStart(4, "0")}`,
    });
    continue;
  }

  lineElements.push(element);
}

roomCandidates.sort((left, right) => {
  const dy = left.metrics.y - right.metrics.y;
  if (Math.abs(dy) > 24) {
    return dy;
  }
  return left.metrics.x - right.metrics.x;
});

const roomElements = roomCandidates.map(({ element }, index) => ({
  ...element,
  id: `room-${String(index + 1).padStart(3, "0")}`,
  title: `room-${String(index + 1).padStart(3, "0")}`,
}));

const output = {
  version: 1,
  width: source.width,
  height: source.height,
  viewBox: source.viewBox,
  elements: [...lineElements, ...roomElements],
  pois: Array.isArray(source.pois) ? source.pois : [],
  meta: {
    source: "bmstu-1.svg",
    generatedAt: new Date().toISOString(),
    refinedFrom: path.basename(inputPath),
    roomFillCount: roomElements.length,
    lineCount: lineElements.filter((element) => element.id?.startsWith("room-line-")).length,
    totalElements: lineElements.length + roomElements.length,
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(
  `Saved ${output.elements.length} elements `
  + `(${output.meta.lineCount} lines, ${roomElements.length} filled zones) to ${outputPath}`,
);
