import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const ROOT = path.resolve(import.meta.dirname, "..");
const ASSETS_DIR = path.join(ROOT, "src/entities/map/assets");

const FLOOR_CONFIGS = {
  2: {
    hiddenGroupClasses: ["st15"],
    layers: {
      background: "st12",
      wallFill: "st9",
      wallOutline: "st4",
      details: "st5",
    },
    sourceLabel: "guk-2.svg (\u0413\u0423\u041a, 2 \u044d\u0442\u0430\u0436)",
  },
  3: {
    hiddenGroupClasses: ["cls-13"],
    layers: {
      background: "cls-11",
      wallFill: "cls-14",
      wallOutline: "cls-5",
      details: "cls-9",
      corridor: "cls-3",
    },
    sourceLabel: "gz_3.svg (\u0413\u0423\u041a, 3 \u044d\u0442\u0430\u0436)",
  },
};

function resolveFloorNumber() {
  const arg = process.argv.find((value) => value.startsWith("--floor="));
  const parsed = Number(arg?.split("=")[1] ?? process.argv[2] ?? 2);
  if (!FLOOR_CONFIGS[parsed]) {
    throw new Error(`Unsupported floor: ${parsed}. Available: ${Object.keys(FLOOR_CONFIGS).join(", ")}`);
  }
  return parsed;
}

function getFloorPaths(floorNumber) {
  return {
    sourceSvg: path.join(ASSETS_DIR, `floor_${floorNumber}.svg`),
    outputMapPath: path.join(ASSETS_DIR, `floor_${floorNumber}.map.json`),
    outputGraphPath: path.join(ASSETS_DIR, `floor_${floorNumber}.graph.json`),
  };
}

// Adobe Illustrator escapes characters that are unsafe in SVG ids as literal
// "_xHH_" sequences (hex code of the character). Decode them back.
function decodeIllustratorId(value) {
  return String(value ?? "").replace(/_x([0-9a-fA-F]{2})_/g, (_, hex) => (
    String.fromCharCode(parseInt(hex, 16))
  ));
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function matMul(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

function applyMatrix(matrix, x, y) {
  return [
    matrix[0] * x + matrix[2] * y + matrix[4],
    matrix[1] * x + matrix[3] * y + matrix[5],
  ];
}

const IDENTITY = [1, 0, 0, 1, 0, 0];

function parseTransform(value) {
  if (!value) {
    return IDENTITY;
  }

  let matrix = IDENTITY;
  const re = /([a-zA-Z]+)\(([^)]*)\)/g;
  let match = re.exec(value);

  while (match) {
    const fn = match[1];
    const args = match[2].trim().split(/[\s,]+/).filter(Boolean).map(Number);
    let next = IDENTITY;

    if (fn === "translate") {
      next = [1, 0, 0, 1, args[0] ?? 0, args[1] ?? 0];
    } else if (fn === "scale") {
      const sx = args[0] ?? 1;
      const sy = args.length > 1 ? args[1] : sx;
      next = [sx, 0, 0, sy, 0, 0];
    } else if (fn === "rotate") {
      const angle = ((args[0] ?? 0) * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      if (args.length >= 3) {
        const [, cx, cy] = args;
        const toOrigin = [1, 0, 0, 1, -cx, -cy];
        const rotate = [cos, sin, -sin, cos, 0, 0];
        const back = [1, 0, 0, 1, cx, cy];
        next = matMul(back, matMul(rotate, toOrigin));
      } else {
        next = [cos, sin, -sin, cos, 0, 0];
      }
    } else if (fn === "matrix" && args.length === 6) {
      next = args;
    }

    matrix = matMul(matrix, next);
    match = re.exec(value);
  }

  return matrix;
}

function lineToPath(x1, y1, x2, y2, matrix) {
  const [px1, py1] = applyMatrix(matrix, x1, y1);
  const [px2, py2] = applyMatrix(matrix, x2, y2);
  return `M ${px1} ${py1} L ${px2} ${py2}`;
}

function rectToPath(x, y, width, height, matrix) {
  if (!(width > 0) || !(height > 0)) {
    return null;
  }
  const corners = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ].map(([px, py]) => applyMatrix(matrix, px, py));
  return `M ${corners[0][0]} ${corners[0][1]} `
    + corners.slice(1).map(([px, py]) => `L ${px} ${py}`).join(" ")
    + " Z";
}

function polygonToPath(pointsValue, close) {
  const numbers = String(pointsValue ?? "")
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((value) => Number.isFinite(value));
  const points = [];
  for (let index = 0; index < numbers.length; index += 2) {
    if (numbers[index + 1] === undefined) {
      break;
    }
    points.push([numbers[index], numbers[index + 1]]);
  }
  if (points.length < 2) {
    return null;
  }
  const segments = [`M ${points[0][0]} ${points[0][1]}`];
  for (let index = 1; index < points.length; index += 1) {
    segments.push(`L ${points[index][0]} ${points[index][1]}`);
  }
  if (close) {
    segments.push("Z");
  }
  return segments.join(" ");
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

function tagOf(node) {
  return Object.keys(node).find((key) => key !== ":@");
}

function childrenOf(node, tag) {
  return node[tag] ?? [];
}

function findChildByAttr(nodes, predicate) {
  for (const node of nodes ?? []) {
    const tag = tagOf(node);
    if (!tag || tag === "#text") {
      continue;
    }
    if (predicate(tag, readAttributes(node))) {
      return node;
    }
  }
  return null;
}

function collectShapeNodes(nodes, collected = []) {
  (nodes ?? []).forEach((node) => {
    const tag = tagOf(node);
    if (!tag || tag === "#text") {
      return;
    }
    if (tag === "g") {
      collectShapeNodes(childrenOf(node, "g"), collected);
      return;
    }
    collected.push({ tag, attrs: readAttributes(node) });
  });
  return collected;
}

function findFirstDescendant(nodes, wantedTag) {
  for (const node of nodes ?? []) {
    const tag = tagOf(node);
    if (!tag || tag === "#text") {
      continue;
    }
    if (tag === wantedTag) {
      return { tag, attrs: readAttributes(node) };
    }
    const nested = findFirstDescendant(childrenOf(node, tag), wantedTag);
    if (nested) {
      return nested;
    }
  }
  return null;
}

function buildElementsFromLayer(layerNode, { idPrefix, fill, stroke, strokeWidth, strokeOpacity, kind }) {
  const tag = tagOf(layerNode);
  const shapes = collectShapeNodes(childrenOf(layerNode, tag));
  const elements = [];
  let index = 0;

  shapes.forEach((shape) => {
    const matrix = parseTransform(shape.attrs.transform);
    let d = null;

    if (shape.tag === "line") {
      d = lineToPath(
        parseNumber(shape.attrs.x1) ?? 0,
        parseNumber(shape.attrs.y1) ?? 0,
        parseNumber(shape.attrs.x2) ?? 0,
        parseNumber(shape.attrs.y2) ?? 0,
        matrix,
      );
    } else if (shape.tag === "rect") {
      d = rectToPath(
        parseNumber(shape.attrs.x) ?? 0,
        parseNumber(shape.attrs.y) ?? 0,
        parseNumber(shape.attrs.width) ?? 0,
        parseNumber(shape.attrs.height) ?? 0,
        matrix,
      );
    } else if (shape.tag === "polygon") {
      d = polygonToPath(shape.attrs.points, true);
    } else if (shape.tag === "polyline") {
      d = polygonToPath(shape.attrs.points, false);
    } else if (shape.tag === "path") {
      d = shape.attrs.d ?? null;
    }

    if (!d) {
      return;
    }

    index += 1;
    const element = {
      id: `${idPrefix}-${String(index).padStart(4, "0")}`,
      d,
      kind,
    };
    if (fill) {
      element.fill = fill;
    }
    if (stroke) {
      element.stroke = stroke;
      element.strokeWidth = strokeWidth ?? 1;
      if (Number.isFinite(strokeOpacity)) {
        element.strokeOpacity = strokeOpacity;
      }
    }
    elements.push(element);
  });

  return elements;
}

function formatRoomCode(code) {
  return String(code ?? "")
    .split("_")
    .filter(Boolean)
    .join("/");
}

function sanitizeNodeId(value) {
  return String(value ?? "").replace(/[^a-zA-Z0-9_.]/g, "_");
}

// Point naming convention (see project rules):
// 1) Auditoriums: "a_<room>" or "a_<room1>_<room2>_..." when one point serves several rooms.
// 2) Plain navigation waypoints: "<floor>_<3-digit seq>", e.g. "2_001".
// 3) Other places use a letter prefix + floor + "_" + 3-digit seq:
//    f = food, t = toilet (restroom), p = printers.
// 4) Stairs: "s<floor>_<3-digit seq>", e.g. "s2_001".
const LABEL = {
  room: "\u0410\u0443\u0434.", // "???."
  stairs: "\u041b\u0435\u0441\u0442\u043d\u0438\u0446\u0430", // "????????"
  food: "\u0411\u0443\u0444\u0435\u0442", // "?????"
  toilet: "\u0422\u0443\u0430\u043b\u0435\u0442", // "??????"
  printer: "\u041f\u0440\u0438\u043d\u0442\u0435\u0440", // "???????"
};

function classifyDecodedId(decodedId) {
  const roomMatch = decodedId.match(/^a_(.+)$/i);
  if (roomMatch) {
    return { kind: "room", code: roomMatch[1] };
  }
  const stairsMatch = decodedId.match(/^s(\d+)_(\d{3})$/i);
  if (stairsMatch) {
    return { kind: "stairs" };
  }
  const foodMatch = decodedId.match(/^f(\d+)_(\d{3})$/i);
  if (foodMatch) {
    return { kind: "food" };
  }
  const toiletMatch = decodedId.match(/^t(\d+)_(\d{3})$/i);
  if (toiletMatch) {
    return { kind: "toilet" };
  }
  const printerMatch = decodedId.match(/^p(\d+)_(\d{3})$/i);
  if (printerMatch) {
    return { kind: "printer" };
  }
  return { kind: "waypoint" };
}

function buildGraphNodes(nodesLayer) {
  const tag = tagOf(nodesLayer);
  const groups = childrenOf(nodesLayer, tag);
  const result = [];

  groups.forEach((group) => {
    const groupTag = tagOf(group);
    if (groupTag !== "g") {
      return;
    }
    const rawId = readAttributes(group).id;
    if (!rawId) {
      return;
    }
    const circle = findFirstDescendant(childrenOf(group, groupTag), "circle");
    if (!circle) {
      return;
    }
    const x = parseNumber(circle.attrs.cx);
    const y = parseNumber(circle.attrs.cy);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }

    const decodedId = decodeIllustratorId(rawId);
    const classification = classifyDecodedId(decodedId);
    const isRoom = classification.kind === "room";
    const finalId = isRoom
      ? `n_r_${sanitizeNodeId(classification.code)}`
      : `n_c_${sanitizeNodeId(decodedId)}`;

    let label = "";
    if (isRoom) {
      label = `${LABEL.room} ${formatRoomCode(classification.code)}`;
    } else if (classification.kind !== "waypoint") {
      label = `${LABEL[classification.kind]} ${decodedId}`;
    }

    result.push({ rawId, decodedId, finalId, label, x, y, kind: classification.kind });
  });

  return result;
}

function nearestNode(nodes, x, y) {
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  nodes.forEach((node) => {
    const distance = Math.hypot(node.x - x, node.y - y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = node;
    }
  });
  return best;
}

function collectLines(nodesList, collected = []) {
  (nodesList ?? []).forEach((node) => {
    const tag = tagOf(node);
    if (!tag || tag === "#text") {
      return;
    }
    if (tag === "line") {
      collected.push(readAttributes(node));
      return;
    }
    collectLines(childrenOf(node, tag), collected);
  });
  return collected;
}

function buildGraphEdges(edgesLayer, nodes) {
  const tag = tagOf(edgesLayer);
  const lines = collectLines(childrenOf(edgesLayer, tag));
  const edges = [];
  const seenKeys = new Set();

  lines.forEach((line) => {
    const x1 = parseNumber(line.x1);
    const y1 = parseNumber(line.y1);
    const x2 = parseNumber(line.x2);
    const y2 = parseNumber(line.y2);
    if (![x1, y1, x2, y2].every(Number.isFinite)) {
      return;
    }

    const from = nearestNode(nodes, x1, y1);
    const to = nearestNode(nodes, x2, y2);
    if (!from || !to || from.finalId === to.finalId) {
      return;
    }

    const key = [from.finalId, to.finalId].sort().join("__");
    if (seenKeys.has(key)) {
      return;
    }
    seenKeys.add(key);

    edges.push({
      id: `${from.finalId}-${to.finalId}`,
      from: from.finalId,
      to: to.finalId,
      points: [[from.x, from.y], [to.x, to.y]],
      bidirectional: true,
    });
  });

  return edges;
}

function findLayerById(nodes, id) {
  for (const node of nodes ?? []) {
    const tag = tagOf(node);
    if (!tag || tag === "#text") {
      continue;
    }
    const attrs = readAttributes(node);
    if (tag === "g" && attrs.id === id) {
      return node;
    }
    const nested = findLayerById(childrenOf(node, tag), id);
    if (nested) {
      return nested;
    }
  }
  return null;
}

function getMapGroups(svgChildren) {
  const groups = (svgChildren ?? []).filter((node) => tagOf(node) === "g");
  if (groups.length === 1 && !readAttributes(groups[0]).id) {
    return childrenOf(groups[0], "g").filter((node) => tagOf(node) === "g");
  }
  return groups;
}

function isHiddenGroup(attrs, hiddenGroupClasses) {
  const groupClasses = String(attrs.class ?? "").split(/\s+/);
  return hiddenGroupClasses.some((hiddenClass) => groupClasses.includes(hiddenClass));
}

const SHAPE_TAGS = new Set(["path", "rect", "line", "polygon", "polyline", "circle", "ellipse"]);

// Layer names in the source SVG are Cyrillic ("Layer_N" in Russian), which is brittle
// to match literally across tools/encodings. Classify layers by the CSS class of their
// first descendant shape instead, since those class names are plain ASCII.
function findFirstShapeClass(nodes) {
  for (const node of nodes ?? []) {
    const tag = tagOf(node);
    if (!tag || tag === "#text") {
      continue;
    }
    if (SHAPE_TAGS.has(tag)) {
      return readAttributes(node).class ?? "";
    }
    const nested = findFirstShapeClass(childrenOf(node, tag));
    if (nested) {
      return nested;
    }
  }
  return "";
}

function classifyTopLevelLayers(svgChildren, hiddenGroupClasses) {
  const layersByClass = {};

  getMapGroups(svgChildren).forEach((node) => {
    const tag = tagOf(node);
    if (tag !== "g") {
      return;
    }
    const attrs = readAttributes(node);
    if (attrs.id === "nodes" || attrs.id === "edges") {
      return;
    }
    if (isHiddenGroup(attrs, hiddenGroupClasses)) {
      return;
    }

    const firstClass = findFirstShapeClass(childrenOf(node, tag));
    if (firstClass && !layersByClass[firstClass]) {
      layersByClass[firstClass] = node;
    }
  });

  return layersByClass;
}

function main() {
  const floorNumber = resolveFloorNumber();
  const floorConfig = FLOOR_CONFIGS[floorNumber];
  const { sourceSvg, outputMapPath, outputGraphPath } = getFloorPaths(floorNumber);
  const svgContent = fs.readFileSync(sourceSvg, "utf8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    preserveOrder: true,
  });
  const parsed = parser.parse(svgContent);
  const svgNode = parsed.find((node) => node.svg);
  if (!svgNode) {
    throw new Error("SVG root element not found.");
  }
  const svgChildren = svgNode.svg ?? [];
  const rootAttrs = readAttributes({ ":@": svgNode[":@"] ?? {} });
  const viewBoxParts = String(rootAttrs.viewBox ?? "0 0 1601 1081")
    .trim()
    .split(/\s+/)
    .map(Number);
  const [, , width, height] = viewBoxParts;

  const layersByClass = classifyTopLevelLayers(svgChildren, floorConfig.hiddenGroupClasses);
  const { background: backgroundClass, wallFill: wallFillClass, wallOutline: wallOutlineClass, details: detailsClass, corridor: corridorClass } = floorConfig.layers;
  const background = layersByClass[backgroundClass] ?? null;
  const wallFill = layersByClass[wallFillClass] ?? null;
  const wallOutline = layersByClass[wallOutlineClass] ?? null;
  const details = layersByClass[detailsClass] ?? null;
  const corridor = corridorClass ? (layersByClass[corridorClass] ?? null) : null;
  const nodesLayer = findLayerById(svgChildren, "nodes");
  const edgesLayer = findLayerById(svgChildren, "edges");

  if (!nodesLayer || !edgesLayer) {
    throw new Error("nodes/edges layers not found in source SVG.");
  }
  if (!background || !wallFill || !wallOutline || !details) {
    throw new Error(`Expected visual layers not found in source SVG for floor ${floorNumber}.`);
  }

  const elements = [
    ...(background ? buildElementsFromLayer(background, {
      idPrefix: "base-bg",
      fill: "#ffffff",
      kind: "base",
    }) : []),
    ...(wallFill ? buildElementsFromLayer(wallFill, {
      idPrefix: "base-wall",
      fill: "#e6e6e6",
      kind: "base",
    }) : []),
    ...(wallOutline ? buildElementsFromLayer(wallOutline, {
      idPrefix: "wall-outline",
      stroke: "#4d4d4d",
      strokeWidth: 2,
      kind: "wall",
    }) : []),
    ...(details ? buildElementsFromLayer(details, {
      idPrefix: "wall-detail",
      stroke: "#4d4d4d",
      strokeWidth: 0.75,
      kind: "wall",
    }) : []),
    ...(corridor ? buildElementsFromLayer(corridor, {
      idPrefix: "wall-corridor",
      stroke: "#88d4ff",
      strokeWidth: 2,
      kind: "wall",
    }) : []),
  ];

  const graphNodes = buildGraphNodes(nodesLayer);
  const graphEdges = buildGraphEdges(edgesLayer, graphNodes);

  // Surface every non-waypoint node (rooms, stairs, food, toilets, printers)
  // as a visible marker on the map, since this floor's SVG has no separate
  // filled room polygons to render via `kind: "room"` elements.
  // Room markers use the `room-<code>` id convention (see
  // getRouteNodeIdForElement/getElementIdForRouteNode in routeGraphLib.js) so
  // clicking them on the map can resolve back to their `n_r_<code>` graph node.
  const pois = graphNodes
    .filter((node) => node.kind !== "waypoint")
    .map((node) => ({
      id: node.kind === "room" ? node.finalId.replace(/^n_r_/, "room-") : node.finalId,
      title: node.label,
      type: node.kind,
      x: node.x,
      y: node.y,
    }));

  const mapOutput = {
    version: 1,
    width,
    height,
    viewBox: viewBoxParts,
    elements,
    pois,
    meta: {
      source: floorConfig.sourceLabel,
      generatedAt: new Date().toISOString(),
      elementCount: elements.length,
    },
  };

  const graphOutput = {
    version: 1,
    nodes: graphNodes.map(({ finalId, x, y, label }) => ({ id: finalId, x, y, label })),
    edges: graphEdges,
    meta: {
      source: floorConfig.sourceLabel,
      generatedAt: new Date().toISOString(),
      nodeCount: graphNodes.length,
      edgeCount: graphEdges.length,
    },
  };

  fs.writeFileSync(outputMapPath, `${JSON.stringify(mapOutput, null, 2)}\n`, "utf8");
  fs.writeFileSync(outputGraphPath, `${JSON.stringify(graphOutput, null, 2)}\n`, "utf8");

  console.log(`Saved floor ${floorNumber} map: ${elements.length} elements to ${path.relative(ROOT, outputMapPath)}`);
  console.log(
    `Saved floor ${floorNumber} route graph: ${graphNodes.length} nodes, ${graphEdges.length} edges to `
    + `${path.relative(ROOT, outputGraphPath)}`,
  );
}

main();
