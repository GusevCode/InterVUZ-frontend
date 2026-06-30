import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { XMLParser } from "fast-xml-parser";

const ROOT = path.resolve(import.meta.dirname, "..");
const BMSTU_MAP_DIR = path.resolve(ROOT, "../BMSTU MAP/BMSTU MAP");
const BMSTU_1_SVG = path.join(BMSTU_MAP_DIR, "bmstu-1.svg");
const BMSTU_2_ROOMS_SVG = path.join(BMSTU_MAP_DIR, "bmstu-2-rooms.svg");
const OUTPUT_PATH = path.join(ROOT, "src/entities/map/assets/floor_1.map.json");
const GRAPH_OUTPUT_PATH = path.join(ROOT, "src/entities/map/assets/floor_1.graph.json");
const RAW_BMSTU_1 = "/tmp/bmstu-1.raw.map.json";

const ROOM_FILL = "#d6c4a8";
const ROOM_FILL_OPACITY = 0.92;

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePoints(value) {
  if (!value) {
    return [];
  }
  const numbers = String(value)
    .trim()
    .split(/[\s,]+/)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
  const points = [];
  for (let index = 0; index < numbers.length; index += 2) {
    const x = numbers[index];
    const y = numbers[index + 1];
    if (x === undefined || y === undefined) {
      break;
    }
    points.push([x, y]);
  }
  return points;
}

function pointsToPath(points, closePath = true) {
  if (!points.length) {
    return null;
  }
  const [firstX, firstY] = points[0];
  const segments = [`M ${firstX} ${firstY}`];
  for (let index = 1; index < points.length; index += 1) {
    const [x, y] = points[index];
    segments.push(`L ${x} ${y}`);
  }
  if (closePath) {
    segments.push("Z");
  }
  return segments.join(" ");
}

function rectToPath(x, y, width, height) {
  return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
}

function getBoundsFromPoints(points) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  points.forEach(([x, y]) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    cx: minX + (maxX - minX) / 2,
    cy: minY + (maxY - minY) / 2,
  };
}

function pointInBounds(x, y, bounds, padding = 2) {
  return (
    x >= bounds.minX - padding
    && x <= bounds.maxX + padding
    && y >= bounds.minY - padding
    && y <= bounds.maxY + padding
  );
}

function normalizeRoomCode(label) {
  return String(label ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[.,]/g, "");
}

function roomIdFromLabel(label) {
  const code = normalizeRoomCode(label);
  return code ? `room-${code}` : null;
}

function readAttributes(node) {
  const attrs = {};
  Object.entries(node[":@"] ?? {}).forEach(([key, value]) => {
    if (key.startsWith("@_")) {
      attrs[key.slice(2)] = value;
    }
  });
  return attrs;
}

function readChildNodes(node, tag) {
  return node[tag] ?? [];
}

function parseTextLabel(textNode) {
  const attrs = readAttributes(textNode);
  const transform = String(attrs.transform ?? "");
  const match = transform.match(/translate\(([^)]+)\)/);
  if (!match) {
    return null;
  }
  const coords = match[1].trim().split(/[\s,]+/).map(Number);
  if (!Number.isFinite(coords[0]) || !Number.isFinite(coords[1])) {
    return null;
  }

  let label = "";
  (textNode.text ?? []).forEach((child) => {
    if (child["#text"]) {
      label += String(child["#text"]);
    }
    const tspan = child.tspan;
    if (!tspan) {
      return;
    }
    const list = Array.isArray(tspan) ? tspan : [tspan];
    list.forEach((item) => {
      if (item?.["#text"]) {
        label += String(item["#text"]);
      }
    });
  });

  label = String(label).trim();
  if (!label) {
    return null;
  }

  return { x: coords[0], y: coords[1], label };
}

function roomShapeFromNode(node) {
  const tag = Object.keys(node).find((key) => key !== ":@");
  if (!tag || tag === "#text") {
    return null;
  }

  const attrs = readAttributes(node);
  const className = String(attrs.class ?? "");

  if (!className.split(/\s+/).includes("st6")) {
    return null;
  }

  let d = null;
  if (tag === "rect") {
    const x = parseNumber(attrs.x) ?? 0;
    const y = parseNumber(attrs.y) ?? 0;
    const width = parseNumber(attrs.width) ?? 0;
    const height = parseNumber(attrs.height) ?? 0;
    if (width <= 0 || height <= 0) {
      return null;
    }
    d = rectToPath(x, y, width, height);
  } else if (tag === "polygon" || tag === "polyline") {
    const points = parsePoints(attrs.points);
    if (points.length < 3) {
      return null;
    }
    d = pointsToPath(points, tag === "polygon");
  } else if (tag === "path") {
    d = attrs.d ?? null;
  }

  if (!d) {
    return null;
  }

  const bounds = getBoundsFromPoints(parsePathPointsFromD(d));
  if (bounds.width < 1 || bounds.height < 1) {
    return null;
  }

  return { d, bounds };
}

function parsePathPointsFromD(pathData) {
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

function walkNodes(nodes, visitor) {
  if (!Array.isArray(nodes)) {
    return;
  }

  nodes.forEach((node) => {
    const tag = Object.keys(node).find((key) => key !== ":@");
    if (!tag || tag === "#text") {
      return;
    }

    visitor(node, tag);
    walkNodes(readChildNodes(node, tag), visitor);
  });
}

function findLayer(nodes, layerSuffix) {
  let found = null;
  walkNodes(nodes, (node, tag) => {
    if (tag !== "g" || found) {
      return;
    }
    const attrs = readAttributes(node);
    const id = String(attrs.id ?? attrs["data-name"] ?? "");
    if (id.includes(layerSuffix)) {
      found = node;
    }
  });
  return found;
}

function extractRoomsFromSvg(svgPath) {
  const content = fs.readFileSync(svgPath, "utf8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    preserveOrder: true,
  });
  const parsed = parser.parse(content);
  const svgNode = parsed.find((node) => node.svg);
  const layer9 = findLayer(svgNode?.svg ?? [], "Слой_9");

  const shapes = [];
  const labels = [];

  if (layer9?.g) {
    walkNodes(layer9.g, (node, tag) => {
      if (tag === "text") {
        const label = parseTextLabel(node);
        if (label) {
          labels.push(label);
        }
        return;
      }
      const shape = roomShapeFromNode(node);
      if (shape) {
        shapes.push(shape);
      }
    });
  }

  const usedShapeIndexes = new Set();
  const rooms = [];

  labels.forEach((label) => {
    let bestIndex = -1;
    let bestScore = Number.POSITIVE_INFINITY;

    shapes.forEach((shape, index) => {
      if (usedShapeIndexes.has(index)) {
        return;
      }
      if (!pointInBounds(label.x, label.y, shape.bounds, 4)) {
        return;
      }
      const area = shape.bounds.width * shape.bounds.height;
      if (area < bestScore) {
        bestScore = area;
        bestIndex = index;
      }
    });

    if (bestIndex === -1) {
      shapes.forEach((shape, index) => {
        if (usedShapeIndexes.has(index)) {
          return;
        }
        const dx = label.x - shape.bounds.cx;
        const dy = label.y - shape.bounds.cy;
        const distance = Math.hypot(dx, dy);
        if (distance < bestScore) {
          bestScore = distance;
          bestIndex = index;
        }
      });
    }

    if (bestIndex === -1) {
      return;
    }

    usedShapeIndexes.add(bestIndex);
    const shape = shapes[bestIndex];
    const baseId = roomIdFromLabel(label.label);
    if (!baseId) {
      return;
    }
    const id = rooms.some((room) => room.id === baseId)
      ? `${baseId}-${usedShapeIndexes.size}`
      : baseId;

    rooms.push({
      id,
      title: label.label,
      label: label.label,
      d: shape.d,
      fill: ROOM_FILL,
      fillOpacity: ROOM_FILL_OPACITY,
      stroke: "#5b4b3a",
      strokeWidth: 0.75,
      kind: "room",
      bounds: shape.bounds,
    });
  });

  shapes.forEach((shape, index) => {
    if (usedShapeIndexes.has(index)) {
      return;
    }
    const fallbackIndex = rooms.length + 1;
    rooms.push({
      id: `room-unknown-${String(fallbackIndex).padStart(3, "0")}`,
      title: `Аудитория ${fallbackIndex}`,
      d: shape.d,
      fill: ROOM_FILL,
      fillOpacity: ROOM_FILL_OPACITY * 0.85,
      stroke: "#5b4b3a",
      strokeWidth: 0.75,
      kind: "room",
      bounds: shape.bounds,
    });
  });

  return rooms;
}

function isValidWallGeometry(element) {
  const points = parsePathPointsFromD(element.d);
  return points.length >= 2;
}

function convertBmstu1Raw() {
  execFileSync(
    process.execPath,
    [
      path.join(ROOT, "scripts/convert-svg-to-json.mjs"),
      "--input",
      BMSTU_1_SVG,
      "--output",
      RAW_BMSTU_1,
    ],
    { stdio: "pipe" },
  );
  return JSON.parse(fs.readFileSync(RAW_BMSTU_1, "utf8"));
}

function buildWallElements(rawElements) {
  let wallIndex = 0;
  const walls = [];

  rawElements.forEach((element) => {
    if (!isValidWallGeometry(element)) {
      return;
    }

    const hasStroke = element.stroke && element.stroke !== "none";
    const isStrokeOnly = hasStroke && (!element.fill || element.fill === "none");
    if (!isStrokeOnly) {
      return;
    }

    wallIndex += 1;
    walls.push({
      id: `wall-${String(wallIndex).padStart(4, "0")}`,
      d: element.d,
      stroke: element.stroke,
      strokeWidth: element.strokeWidth ?? 1,
      strokeLinecap: element.strokeLinecap,
      strokeMiterlimit: element.strokeMiterlimit,
      kind: "wall",
    });
  });

  return walls;
}

function buildBaseElements(rawElements) {
  return rawElements.filter((element) => {
    if (!element.fill || element.fill === "none") {
      return false;
    }
    if (element.fill === "#e6e6e6") {
      return false;
    }
    return isValidWallGeometry(element);
  }).map((element) => ({
    ...element,
    id: element.id ?? null,
    kind: "base",
  }));
}

function parsePathSegments(pathData) {
  const points = parsePathPointsFromD(pathData);
  const segments = [];
  for (let index = 1; index < points.length; index += 1) {
    const [x1, y1] = points[index - 1];
    const [x2, y2] = points[index];
    segments.push({ x1, y1, x2, y2 });
  }
  return segments;
}

function snapNode(nodes, x, y, tolerance) {
  for (const node of nodes) {
    if (Math.hypot(node.x - x, node.y - y) <= tolerance) {
      return node;
    }
  }
  return null;
}

function normalizeGraphPoints(points) {
  return (points ?? [])
    .map((point) => ({
      x: Number(point?.x ?? point?.[0]),
      y: Number(point?.y ?? point?.[1]),
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function buildAdjacencyMap(nodeList, edgeList) {
  const adjacency = new Map();
  nodeList.forEach((node) => adjacency.set(node.id, new Set()));
  edgeList.forEach((edge) => {
    if (!edge?.from || !edge?.to) {
      return;
    }
    adjacency.get(edge.from)?.add(edge.to);
    if (edge.bidirectional !== false) {
      adjacency.get(edge.to)?.add(edge.from);
    }
  });
  return adjacency;
}

function collectComponents(nodeIds, adjacency) {
  const allowed = new Set(nodeIds);
  const visited = new Set();
  const components = [];

  allowed.forEach((startId) => {
    if (visited.has(startId)) {
      return;
    }

    const component = new Set();
    const queue = [startId];
    visited.add(startId);

    while (queue.length > 0) {
      const currentId = queue.shift();
      component.add(currentId);
      for (const neighborId of adjacency.get(currentId) ?? []) {
        if (!allowed.has(neighborId) || visited.has(neighborId)) {
          continue;
        }
        visited.add(neighborId);
        queue.push(neighborId);
      }
    }

    components.push(component);
  });

  return components;
}

function bridgeDisconnectedComponents({
  nodes: nodeList,
  edges: edgeList,
  addEdge,
  nodeFilter,
  maxDistance,
  maxBridges = 48,
}) {
  const routableNodes = nodeList.filter(nodeFilter);
  const nodeById = new Map(routableNodes.map((node) => [node.id, node]));
  const routableIds = routableNodes.map((node) => node.id);
  let bridgesAdded = 0;

  while (bridgesAdded < maxBridges) {
    const adjacency = buildAdjacencyMap(nodeList, edgeList);
    const components = collectComponents(routableIds, adjacency);
    if (components.length <= 1) {
      break;
    }

    let bestBridge = null;
    for (let leftIndex = 0; leftIndex < components.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < components.length; rightIndex += 1) {
        components[leftIndex].forEach((leftId) => {
          components[rightIndex].forEach((rightId) => {
            const left = nodeById.get(leftId);
            const right = nodeById.get(rightId);
            if (!left || !right) {
              return;
            }
            const distance = Math.hypot(left.x - right.x, left.y - right.y);
            if (distance > maxDistance) {
              return;
            }
            if (!bestBridge || distance < bestBridge.distance) {
              bestBridge = { left, right, distance };
            }
          });
        });
      }
    }

    if (!bestBridge) {
      break;
    }

    addEdge(bestBridge.left.id, bestBridge.right.id, [
      { x: bestBridge.left.x, y: bestBridge.left.y },
      { x: bestBridge.right.x, y: bestBridge.right.y },
    ]);
    bridgesAdded += 1;
  }
}

function findEntranceNode(nodes, roomCode) {
  const normalizedCode = normalizeRoomCode(roomCode);
  if (!normalizedCode) {
    return null;
  }

  const pattern = new RegExp(`(?:аудиторию|ауд\\.?)\\s*${normalizedCode}\\b`, "i");
  return nodes.find((node) => (
    /^n_f1_/i.test(String(node.id ?? ""))
    && pattern.test(String(node.label ?? ""))
  )) ?? null;
}

function buildRouteGraph(wallElements, rooms, legacyGraph) {
  const nodes = [];
  const edges = [];
  const edgeKeys = new Set();
  const nodeById = new Map();

  function registerNode(node) {
    const existing = nodeById.get(node.id);
    if (existing) {
      return existing;
    }
    const nextNode = {
      id: node.id,
      x: Number(node.x),
      y: Number(node.y),
      label: node.label ?? "",
    };
    nodes.push(nextNode);
    nodeById.set(nextNode.id, nextNode);
    return nextNode;
  }

  function addEdge(fromId, toId, points) {
    if (!fromId || !toId || fromId === toId) {
      return;
    }
    const key = `${fromId}__${toId}`;
    const reverseKey = `${toId}__${fromId}`;
    if (edgeKeys.has(key) || edgeKeys.has(reverseKey)) {
      return;
    }
    edgeKeys.add(key);
    const normalized = normalizeGraphPoints(points);
    edges.push({
      id: `${fromId}-${toId}`,
      from: fromId,
      to: toId,
      points: normalized.map((point) => [point.x, point.y]),
      bidirectional: true,
    });
  }

  (legacyGraph?.nodes ?? []).forEach((node) => registerNode(node));
  (legacyGraph?.edges ?? []).forEach((edge) => {
    addEdge(edge.from, edge.to, edge.points);
  });

  const corridorNodes = nodes.filter((node) => !String(node.id).startsWith("n_r_"));
  let corridorCounter = corridorNodes.length;

  function getCorridorNode(x, y) {
    const snapped = snapNode(corridorNodes, x, y, 16);
    if (snapped) {
      return snapped;
    }
    corridorCounter += 1;
    const node = registerNode({
      id: `n_c_${String(corridorCounter).padStart(4, "0")}`,
      x,
      y,
      label: "",
    });
    corridorNodes.push(node);
    return node;
  }

  wallElements
    .filter((wall) => wall.stroke === "#88d4ff")
    .flatMap((wall) => parsePathSegments(wall.d))
    .forEach((segment) => {
      const from = getCorridorNode(segment.x1, segment.y1);
      const to = getCorridorNode(segment.x2, segment.y2);
      addEdge(from.id, to.id, [
        { x: segment.x1, y: segment.y1 },
        { x: segment.x2, y: segment.y2 },
      ]);
    });

  for (let leftIndex = 0; leftIndex < corridorNodes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < corridorNodes.length; rightIndex += 1) {
      const left = corridorNodes[leftIndex];
      const right = corridorNodes[rightIndex];
      const distance = Math.hypot(left.x - right.x, left.y - right.y);
      if (distance > 0 && distance <= 50) {
        addEdge(left.id, right.id, [
          { x: left.x, y: left.y },
          { x: right.x, y: right.y },
        ]);
      }
    }
  }

  nodes
    .filter((node) => /^n_f1_/i.test(String(node.id ?? "")))
    .forEach((infraNode) => {
      let nearest = null;
      let minDistance = 110;
      corridorNodes.forEach((candidate) => {
        const distance = Math.hypot(candidate.x - infraNode.x, candidate.y - infraNode.y);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = candidate;
        }
      });
      if (nearest) {
        addEdge(infraNode.id, nearest.id, [
          { x: infraNode.x, y: infraNode.y },
          { x: nearest.x, y: nearest.y },
        ]);
      }
    });

  bridgeDisconnectedComponents({
    nodes,
    edges,
    addEdge,
    nodeFilter: (node) => /^n_[fc]/.test(String(node.id ?? "")),
    maxDistance: 65,
    maxBridges: 64,
  });

  const waypointNodes = nodes.filter((node) => !String(node.id).startsWith("n_r_"));

  rooms.forEach((room) => {
    const code = room.title || room.label || "";
    const roomNodeId = `n_r_${normalizeRoomCode(code)}`;
    const roomNode = registerNode({
      id: roomNodeId,
      x: room.bounds.cx,
      y: room.bounds.cy,
      label: `Аудитория ${code}`,
    });

    const entrance = findEntranceNode(nodes, code);
    if (entrance) {
      addEdge(roomNodeId, entrance.id, [
        { x: roomNode.x, y: roomNode.y },
        { x: entrance.x, y: entrance.y },
      ]);
    }

    let nearest = null;
    let minDistance = 200;
    waypointNodes.forEach((candidate) => {
      const distance = Math.hypot(candidate.x - roomNode.x, candidate.y - roomNode.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = candidate;
      }
    });

    if (nearest) {
      addEdge(roomNodeId, nearest.id, [
        { x: roomNode.x, y: roomNode.y },
        { x: nearest.x, y: nearest.y },
      ]);
    }
  });

  const adjacency = buildAdjacencyMap(nodes, edges);
  const components = collectComponents(nodes.map((node) => node.id), adjacency);
  const sortedComponents = [...components].sort((left, right) => right.size - left.size);
  const mainComponent = sortedComponents[0] ?? new Set();

  sortedComponents.slice(1).forEach((component) => {
    let bestBridge = null;
    component.forEach((leftId) => {
      mainComponent.forEach((rightId) => {
        const left = nodeById.get(leftId);
        const right = nodeById.get(rightId);
        if (!left || !right) {
          return;
        }
        const distance = Math.hypot(left.x - right.x, left.y - right.y);
        if (distance > 240) {
          return;
        }
        if (!bestBridge || distance < bestBridge.distance) {
          bestBridge = { left, right, distance };
        }
      });
    });

    if (!bestBridge) {
      return;
    }

    addEdge(bestBridge.left.id, bestBridge.right.id, [
      { x: bestBridge.left.x, y: bestBridge.left.y },
      { x: bestBridge.right.x, y: bestBridge.right.y },
    ]);
    component.forEach((nodeId) => mainComponent.add(nodeId));
  });

  return {
    version: 1,
    nodes,
    edges,
    meta: {
      source: "legacy floor_1.graph + bmstu corridor markers + bmstu-2-rooms.svg",
      generatedAt: new Date().toISOString(),
      roomNodeCount: rooms.length,
      corridorNodeCount: corridorNodes.length,
      edgeCount: edges.length,
    },
  };
}

function loadLegacyGraphSeed() {
  if (!fs.existsSync(GRAPH_OUTPUT_PATH)) {
    return { nodes: [], edges: [] };
  }

  const data = JSON.parse(fs.readFileSync(GRAPH_OUTPUT_PATH, "utf8"));
  const seedNodes = (data.nodes ?? []).filter((node) => /^n_f1_/i.test(String(node.id ?? "")));
  const seedNodeIds = new Set(seedNodes.map((node) => node.id));
  const seedEdges = (data.edges ?? []).filter(
    (edge) => seedNodeIds.has(edge.from) && seedNodeIds.has(edge.to),
  );

  return { nodes: seedNodes, edges: seedEdges };
}

function main() {
  const legacyGraph = loadLegacyGraphSeed();

  const rooms = extractRoomsFromSvg(BMSTU_2_ROOMS_SVG);
  const raw = convertBmstu1Raw();
  const baseElements = buildBaseElements(raw.elements ?? []);
  const wallElements = buildWallElements(raw.elements ?? []);
  const graph = buildRouteGraph(wallElements, rooms, legacyGraph);

  const output = {
    version: 1,
    width: raw.width,
    height: raw.height,
    viewBox: raw.viewBox,
    elements: [...baseElements, ...wallElements, ...rooms.map(({ bounds, ...room }) => room)],
    pois: [],
    rooms: rooms.map(({ id, title, label, bounds }) => ({
      id,
      title,
      label: label ?? title,
      x: bounds.cx,
      y: bounds.cy,
    })),
    meta: {
      source: "bmstu-1.svg + bmstu-2-rooms.svg",
      generatedAt: new Date().toISOString(),
      roomCount: rooms.length,
      wallCount: wallElements.length,
      baseCount: baseElements.length,
    },
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  fs.writeFileSync(GRAPH_OUTPUT_PATH, `${JSON.stringify(graph, null, 2)}\n`, "utf8");

  console.log(
    `Saved floor map: ${output.elements.length} elements `
    + `(${rooms.length} rooms, ${wallElements.length} walls, ${baseElements.length} base)`,
  );
  console.log(
    `Saved route graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`,
  );
}

main();
