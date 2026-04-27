import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const args = process.argv.slice(2);

function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index === -1) {
    return null;
  }
  return args[index + 1] ?? null;
}

function parseNumber(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const match = String(value).match(/-?\d*\.?\d+(?:e[-+]?\d+)?/i);
  return match ? Number(match[0]) : null;
}

function parseViewBox(value) {
  if (!value) {
    return null;
  }
  const parts = String(value)
    .trim()
    .split(/[\s,]+/)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));

  if (parts.length < 4) {
    return null;
  }

  return {
    minX: parts[0],
    minY: parts[1],
    width: parts[2],
    height: parts[3],
  };
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

function extractChildText(nodes, tagName) {
  if (!Array.isArray(nodes)) {
    return null;
  }
  const entry = nodes.find((node) => node[tagName]);
  if (!entry) {
    return null;
  }
  const children = entry[tagName];
  if (!Array.isArray(children)) {
    return null;
  }
  const textNode = children.find((child) => Object.prototype.hasOwnProperty.call(child, "#text"));
  if (!textNode) {
    return null;
  }
  const value = String(textNode["#text"]).trim();
  return value ? value : null;
}

function parseEdgeEndpoints(value) {
  if (!value) {
    return null;
  }
  const raw = String(value).trim();
  if (!raw) {
    return null;
  }
  const arrowMatch = raw.match(/([^-\s]+)\s*[-=]>\s*([^\s]+)/);
  if (arrowMatch) {
    return { from: arrowMatch[1], to: arrowMatch[2] };
  }
  const edgeMatch = raw.match(/^edge[_-]?(.+?)(?:__|_to_)(.+)$/i);
  if (edgeMatch) {
    return { from: edgeMatch[1], to: edgeMatch[2] };
  }
  return null;
}

function parsePathPoints(pathData) {
  if (!pathData) {
    return { points: [], hasUnsupported: false };
  }
  const tokens = String(pathData).match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);
  if (!tokens) {
    return { points: [], hasUnsupported: false };
  }

  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let cmd = null;
  const points = [];
  let hasUnsupported = false;

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
      const nx = isRelative ? x + xVal : xVal;
      const ny = isRelative ? y + yVal : yVal;
      addPoint(nx, ny);
      if (cmdUpper === "M") {
        startX = nx;
        startY = ny;
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
      const nx = isRelative ? x + xVal : xVal;
      addPoint(nx, y);
      index += 1;
      continue;
    }

    if (cmdUpper === "V") {
      const yVal = Number(tokens[index]);
      if (!Number.isFinite(yVal)) {
        break;
      }
      const ny = isRelative ? y + yVal : yVal;
      addPoint(x, ny);
      index += 1;
      continue;
    }

    if (cmdUpper === "Z") {
      addPoint(startX, startY);
      index += 1;
      continue;
    }

    hasUnsupported = true;
    break;
  }

  return { points, hasUnsupported };
}

function densifyPoints(points, step) {
  if (!points.length || !Number.isFinite(step) || step <= 0) {
    return points;
  }

  const result = [points[0]];

  for (let index = 1; index < points.length; index += 1) {
    const [x1, y1] = points[index - 1];
    const [x2, y2] = points[index];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.hypot(dx, dy);
    if (!Number.isFinite(distance) || distance === 0) {
      continue;
    }

    const steps = Math.max(1, Math.ceil(distance / step));
    for (let stepIndex = 1; stepIndex <= steps; stepIndex += 1) {
      const t = stepIndex / steps;
      result.push([x1 + dx * t, y1 + dy * t]);
    }
  }

  return result;
}

function pointsToPath(points, closePath) {
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

function getPointsCenter(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  points.forEach(([x, y]) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }

  return {
    x: minX + (maxX - minX) / 2,
    y: minY + (maxY - minY) / 2,
  };
}

function normalizePaint(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === "none") {
    return null;
  }
  if (trimmed.startsWith("url(")) {
    return null;
  }
  return trimmed;
}

function parseStyleValue(style, key) {
  return style[key] ?? style[key.toLowerCase()] ?? null;
}

function parseStyle(attrs) {
  const style = {};
  const styleText = attrs.style ? String(attrs.style) : "";

  styleText.split(";").forEach((pair) => {
    const [rawKey, rawValue] = pair.split(":");
    if (!rawKey || !rawValue) {
      return;
    }
    style[rawKey.trim()] = rawValue.trim();
  });

  const directAttrs = [
    "fill",
    "stroke",
    "stroke-width",
    "opacity",
    "fill-opacity",
    "stroke-opacity",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-dasharray",
    "fill-rule",
    "display",
    "visibility",
  ];

  directAttrs.forEach((key) => {
    if (attrs[key] !== undefined) {
      style[key] = attrs[key];
    }
  });

  return {
    fill: parseStyleValue(style, "fill"),
    stroke: parseStyleValue(style, "stroke"),
    strokeWidth: parseStyleValue(style, "stroke-width"),
    opacity: parseStyleValue(style, "opacity"),
    fillOpacity: parseStyleValue(style, "fill-opacity"),
    strokeOpacity: parseStyleValue(style, "stroke-opacity"),
    strokeLinecap: parseStyleValue(style, "stroke-linecap"),
    strokeLinejoin: parseStyleValue(style, "stroke-linejoin"),
    strokeMiterlimit: parseStyleValue(style, "stroke-miterlimit"),
    strokeDasharray: parseStyleValue(style, "stroke-dasharray"),
    fillRule: parseStyleValue(style, "fill-rule"),
    display: parseStyleValue(style, "display"),
    visibility: parseStyleValue(style, "visibility"),
  };
}

function mergeStyle(parentStyle, ownStyle) {
  return {
    ...parentStyle,
    ...Object.fromEntries(
      Object.entries(ownStyle).filter(([, value]) => value !== undefined && value !== null),
    ),
  };
}

function normalizeStyle(style) {
  return {
    fill: normalizePaint(style.fill),
    stroke: normalizePaint(style.stroke),
    strokeWidth: parseNumber(style.strokeWidth),
    opacity: parseNumber(style.opacity),
    fillOpacity: parseNumber(style.fillOpacity),
    strokeOpacity: parseNumber(style.strokeOpacity),
    strokeLinecap: style.strokeLinecap || null,
    strokeLinejoin: style.strokeLinejoin || null,
    strokeMiterlimit: parseNumber(style.strokeMiterlimit),
    strokeDasharray: style.strokeDasharray
      ? String(style.strokeDasharray)
        .split(/[\s,]+/)
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item))
      : null,
    fillRule: style.fillRule || null,
    display: style.display || null,
    visibility: style.visibility || null,
  };
}

function rectToPath({ x, y, width, height, rx, ry }) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  const safeX = Number.isFinite(x) ? x : 0;
  const safeY = Number.isFinite(y) ? y : 0;
  const safeRx = Number.isFinite(rx) ? rx : 0;
  const safeRy = Number.isFinite(ry) ? ry : 0;
  const radiusX = Math.min(safeRx || safeRy, width / 2);
  const radiusY = Math.min(safeRy || safeRx, height / 2);

  if (!radiusX && !radiusY) {
    return `M ${safeX} ${safeY} L ${safeX + width} ${safeY} L ${safeX + width} ${safeY + height} L ${safeX} ${safeY + height} Z`;
  }

  const right = safeX + width;
  const bottom = safeY + height;

  return [
    `M ${safeX + radiusX} ${safeY}`,
    `L ${right - radiusX} ${safeY}`,
    `A ${radiusX} ${radiusY} 0 0 1 ${right} ${safeY + radiusY}`,
    `L ${right} ${bottom - radiusY}`,
    `A ${radiusX} ${radiusY} 0 0 1 ${right - radiusX} ${bottom}`,
    `L ${safeX + radiusX} ${bottom}`,
    `A ${radiusX} ${radiusY} 0 0 1 ${safeX} ${bottom - radiusY}`,
    `L ${safeX} ${safeY + radiusY}`,
    `A ${radiusX} ${radiusY} 0 0 1 ${safeX + radiusX} ${safeY}`,
    "Z",
  ].join(" ");
}

function circleToPath(cx, cy, r) {
  if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(r) || r <= 0) {
    return null;
  }
  const startX = cx - r;
  return [
    `M ${startX} ${cy}`,
    `a ${r} ${r} 0 1 0 ${r * 2} 0`,
    `a ${r} ${r} 0 1 0 ${-r * 2} 0`,
  ].join(" ");
}

function ellipseToPath(cx, cy, rx, ry) {
  if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(rx) || !Number.isFinite(ry)) {
    return null;
  }
  const startX = cx - rx;
  return [
    `M ${startX} ${cy}`,
    `a ${rx} ${ry} 0 1 0 ${rx * 2} 0`,
    `a ${rx} ${ry} 0 1 0 ${-rx * 2} 0`,
  ].join(" ");
}

function lineToPath(x1, y1, x2, y2) {
  if (![x1, y1, x2, y2].every((value) => Number.isFinite(value))) {
    return null;
  }
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

const inputPath = getArgValue("--input") ?? args[0];

if (!inputPath) {
  console.error("Usage: node scripts/convert-svg-to-json.mjs --input path/to/file.svg --output path/to/file.map.json");
  process.exit(1);
}

const outputPath = getArgValue("--output")
  ?? inputPath.replace(/\.svg$/i, ".map.json")
  ?? "map.json";
const graphOutputPath = getArgValue("--graph")
  ?? inputPath.replace(/\.svg$/i, ".graph.json");
const edgeStep = parseNumber(getArgValue("--edge-step")) ?? 24;

const svgContent = fs.readFileSync(inputPath, "utf8");

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  preserveOrder: true,
});

const parsed = parser.parse(svgContent);
const svgNode = parsed.find((node) => node.svg);

if (!svgNode) {
  console.error("SVG root element not found.");
  process.exit(1);
}

const svgChildren = svgNode.svg ?? [];

function readAttributes(nodes, nodeAttributes = {}) {
  const accumulator = {};

  Object.entries(nodeAttributes).forEach(([key, value]) => {
    if (key && key.startsWith("@_")) {
      accumulator[key.slice(2)] = value;
    }
  });

  if (!Array.isArray(nodes)) {
    return accumulator;
  }

  nodes.forEach((node) => {
    const key = Object.keys(node)[0];
    if (key && key.startsWith("@_")) {
      accumulator[key.slice(2)] = node[key];
    }
  });

  return accumulator;
}

const rootAttributes = readAttributes(svgChildren, svgNode[":@"] ?? {});
const rootViewBox = parseViewBox(rootAttributes.viewBox);
const rootWidth = parseNumber(rootAttributes.width);
const rootHeight = parseNumber(rootAttributes.height);

const width = rootViewBox?.width ?? rootWidth ?? 1000;
const height = rootViewBox?.height ?? rootHeight ?? 1000;

const elements = [];
const warnings = [];
const graphNodes = [];
const graphEdges = [];
const poiItems = [];
let graphEnabled = false;

function shouldSkip(style) {
  if (style.display === "none" || style.visibility === "hidden") {
    return true;
  }
  return false;
}

function addElement({ id, d, style, title }) {
  if (!d) {
    return;
  }

  const normalizedStyle = normalizeStyle(style);

  if (shouldSkip(normalizedStyle)) {
    return;
  }

  elements.push({
    id: id || null,
    title: title || undefined,
    d,
    ...Object.fromEntries(
      Object.entries(normalizedStyle).filter(([, value]) => value !== null && value !== undefined),
    ),
  });
}

function getLayerKind(attrs, currentKind) {
  const label = String(
    attrs["inkscape:label"]
    ?? attrs.label
    ?? attrs.id
    ?? "",
  ).toLowerCase();

  if (!label) {
    return currentKind;
  }

  if (label.includes("graph") && label.includes("node")) {
    return "nodes";
  }
  if (label.includes("graph") && (label.includes("edge") || label.includes("route") || label.includes("path"))) {
    return "edges";
  }
  if (label === "nodes" || label.includes("nodes")) {
    return "nodes";
  }
  if (label === "edges" || label.includes("edges") || label.includes("routes")) {
    return "edges";
  }
  if (label === "poi" || label === "pois" || label.includes("poi") || label.includes("interest")) {
    return "pois";
  }

  return currentKind;
}

function parsePoiType(id, title) {
  const source = String(id || title || "").toLowerCase();
  const match = source.match(/^poi[-_]?([a-z0-9]+)/i) || source.match(/(?:poi[-_])([a-z0-9]+)/i);
  return match?.[1] || "other";
}

function addPoi({ id, x, y, title }) {
  if (!id) {
    warnings.push("POI without id was ignored.");
    return;
  }

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    warnings.push(`POI ${id} has invalid coordinates.`);
    return;
  }

  poiItems.push({
    id,
    title: title || id,
    type: parsePoiType(id, title),
    x,
    y,
  });
}

function addGraphNode({ id, x, y, title }) {
  if (!id) {
    warnings.push("Graph node without id was ignored.");
    return;
  }

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    warnings.push(`Graph node ${id} has invalid координаты.`);
    return;
  }

  graphNodes.push({
    id,
    x,
    y,
    label: title || undefined,
  });
}

function addGraphEdge({ id, from, to, points }) {
  if (!from || !to) {
    warnings.push(`Graph edge ${id || "unknown"} missing endpoints.`);
    return;
  }

  graphEdges.push({
    id: id || undefined,
    from,
    to,
    points: points?.length ? points : undefined,
  });
}

function collect(nodes, inheritedStyle, layerKind) {
  if (!Array.isArray(nodes)) {
    return;
  }

  nodes.forEach((node) => {
    const tag = Object.keys(node)[0];
    if (!tag || tag === "#text") {
      return;
    }
    if (tag.startsWith("@_")) {
      return;
    }

    const childNodes = node[tag] ?? [];
    const attrs = readAttributes(childNodes, node[":@"] ?? {});
    const style = mergeStyle(inheritedStyle, parseStyle(attrs));
    const nextLayerKind = tag === "g" ? getLayerKind(attrs, layerKind) : layerKind;
    const title = extractChildText(childNodes, "title");

    if (attrs.transform) {
      warnings.push(`Transform ignored on <${tag}>${attrs.id ? `#${attrs.id}` : ""}: ${attrs.transform}`);
    }

    if (tag === "path") {
      if (nextLayerKind === "pois") {
        const { points } = parsePathPoints(attrs.d);
        const center = getPointsCenter(points);
        addPoi({
          id: attrs.id,
          x: center?.x,
          y: center?.y,
          title,
        });
        return;
      }

      if (nextLayerKind === "edges") {
        const { points, hasUnsupported } = parsePathPoints(attrs.d);
        const endpoints = parseEdgeEndpoints(attrs["inkscape:label"] ?? attrs.label ?? attrs.id ?? title);
        if (hasUnsupported) {
          warnings.push(`Graph edge ${attrs.id || "path"} содержит кривые. Используйте прямые сегменты.`);
        }
        graphEnabled = true;
        addGraphEdge({
          id: attrs.id,
          from: endpoints?.from ?? null,
          to: endpoints?.to ?? null,
          points: densifyPoints(points, edgeStep),
        });
        return;
      }

      addElement({
        id: attrs.id,
        d: attrs.d ?? null,
        style,
        title,
      });
      return;
    }

    if (tag === "rect") {
      if (nextLayerKind === "pois") {
        const x = parseNumber(attrs.x) ?? 0;
        const y = parseNumber(attrs.y) ?? 0;
        const width = parseNumber(attrs.width) ?? 0;
        const height = parseNumber(attrs.height) ?? 0;
        addPoi({
          id: attrs.id,
          x: x + width / 2,
          y: y + height / 2,
          title,
        });
        return;
      }

      if (nextLayerKind === "nodes") {
        const x = parseNumber(attrs.x) ?? 0;
        const y = parseNumber(attrs.y) ?? 0;
        const width = parseNumber(attrs.width) ?? 0;
        const height = parseNumber(attrs.height) ?? 0;
        graphEnabled = true;
        addGraphNode({
          id: attrs.id,
          x: x + width / 2,
          y: y + height / 2,
          title,
        });
        return;
      }

      addElement({
        id: attrs.id,
        d: rectToPath({
          x: parseNumber(attrs.x) ?? 0,
          y: parseNumber(attrs.y) ?? 0,
          width: parseNumber(attrs.width) ?? 0,
          height: parseNumber(attrs.height) ?? 0,
          rx: parseNumber(attrs.rx),
          ry: parseNumber(attrs.ry),
        }),
        style,
        title,
      });
      return;
    }

    if (tag === "circle") {
      if (nextLayerKind === "pois") {
        addPoi({
          id: attrs.id,
          x: parseNumber(attrs.cx),
          y: parseNumber(attrs.cy),
          title,
        });
        return;
      }

      if (nextLayerKind === "nodes") {
        graphEnabled = true;
        addGraphNode({
          id: attrs.id,
          x: parseNumber(attrs.cx),
          y: parseNumber(attrs.cy),
          title,
        });
        return;
      }

      addElement({
        id: attrs.id,
        d: circleToPath(parseNumber(attrs.cx), parseNumber(attrs.cy), parseNumber(attrs.r)),
        style,
        title,
      });
      return;
    }

    if (tag === "ellipse") {
      if (nextLayerKind === "pois") {
        addPoi({
          id: attrs.id,
          x: parseNumber(attrs.cx),
          y: parseNumber(attrs.cy),
          title,
        });
        return;
      }

      if (nextLayerKind === "nodes") {
        graphEnabled = true;
        addGraphNode({
          id: attrs.id,
          x: parseNumber(attrs.cx),
          y: parseNumber(attrs.cy),
          title,
        });
        return;
      }

      addElement({
        id: attrs.id,
        d: ellipseToPath(parseNumber(attrs.cx), parseNumber(attrs.cy), parseNumber(attrs.rx), parseNumber(attrs.ry)),
        style,
        title,
      });
      return;
    }

    if (tag === "line") {
      if (nextLayerKind === "pois") {
        const x1 = parseNumber(attrs.x1);
        const y1 = parseNumber(attrs.y1);
        const x2 = parseNumber(attrs.x2);
        const y2 = parseNumber(attrs.y2);
        addPoi({
          id: attrs.id,
          x: Number.isFinite(x1) && Number.isFinite(x2) ? (x1 + x2) / 2 : null,
          y: Number.isFinite(y1) && Number.isFinite(y2) ? (y1 + y2) / 2 : null,
          title,
        });
        return;
      }

      if (nextLayerKind === "edges") {
        const points = [
          [parseNumber(attrs.x1), parseNumber(attrs.y1)],
          [parseNumber(attrs.x2), parseNumber(attrs.y2)],
        ].filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
        const endpoints = parseEdgeEndpoints(attrs["inkscape:label"] ?? attrs.label ?? attrs.id ?? title);
        graphEnabled = true;
        addGraphEdge({
          id: attrs.id,
          from: endpoints?.from ?? null,
          to: endpoints?.to ?? null,
          points: densifyPoints(points, edgeStep),
        });
        return;
      }

      addElement({
        id: attrs.id,
        d: lineToPath(
          parseNumber(attrs.x1),
          parseNumber(attrs.y1),
          parseNumber(attrs.x2),
          parseNumber(attrs.y2),
        ),
        style,
        title,
      });
      return;
    }

    if (tag === "polyline") {
      if (nextLayerKind === "pois") {
        const center = getPointsCenter(parsePoints(attrs.points));
        addPoi({
          id: attrs.id,
          x: center?.x,
          y: center?.y,
          title,
        });
        return;
      }

      if (nextLayerKind === "edges") {
        const endpoints = parseEdgeEndpoints(attrs["inkscape:label"] ?? attrs.label ?? attrs.id ?? title);
        graphEnabled = true;
        addGraphEdge({
          id: attrs.id,
          from: endpoints?.from ?? null,
          to: endpoints?.to ?? null,
          points: densifyPoints(parsePoints(attrs.points), edgeStep),
        });
        return;
      }

      addElement({
        id: attrs.id,
        d: pointsToPath(parsePoints(attrs.points), false),
        style,
        title,
      });
      return;
    }

    if (tag === "polygon") {
      if (nextLayerKind === "pois") {
        const center = getPointsCenter(parsePoints(attrs.points));
        addPoi({
          id: attrs.id,
          x: center?.x,
          y: center?.y,
          title,
        });
        return;
      }

      if (nextLayerKind === "edges") {
        const endpoints = parseEdgeEndpoints(attrs["inkscape:label"] ?? attrs.label ?? attrs.id ?? title);
        graphEnabled = true;
        addGraphEdge({
          id: attrs.id,
          from: endpoints?.from ?? null,
          to: endpoints?.to ?? null,
          points: densifyPoints(parsePoints(attrs.points), edgeStep),
        });
        return;
      }

      addElement({
        id: attrs.id,
        d: pointsToPath(parsePoints(attrs.points), true),
        style,
        title,
      });
      return;
    }

    if (tag === "g" || tag === "svg") {
      collect(childNodes, style, nextLayerKind);
    }
  });
}

collect(svgChildren, {}, null);

const output = {
  version: 1,
  width,
  height,
  viewBox: rootViewBox ? [rootViewBox.minX, rootViewBox.minY, rootViewBox.width, rootViewBox.height] : null,
  elements,
  pois: poiItems,
  meta: {
    source: path.basename(inputPath),
    generatedAt: new Date().toISOString(),
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(`Saved ${elements.length} elements and ${poiItems.length} POIs to ${outputPath}`);
if (graphEnabled) {
  const graphOutput = {
    version: 1,
    nodes: graphNodes,
    edges: graphEdges,
    meta: {
      source: path.basename(inputPath),
      generatedAt: new Date().toISOString(),
    },
  };
  fs.writeFileSync(graphOutputPath, `${JSON.stringify(graphOutput, null, 2)}\n`, "utf8");
  console.log(`Saved ${graphNodes.length} nodes and ${graphEdges.length} edges to ${graphOutputPath}`);
}
if (warnings.length > 0) {
  console.warn("Warnings:");
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}
