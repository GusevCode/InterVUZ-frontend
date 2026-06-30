export function getMapBaseName(fileName = "") {
  return String(fileName)
    .replace(/\.map\.json$/i, "")
    .replace(/\.graph\.json$/i, "")
    .replace(/\.(png|jpg|jpeg|webp|avif|gif|svg)$/i, "");
}

export function getFloorFromMapId(mapId = "") {
  const match = getMapBaseName(mapId).match(/floor[_-]?(\d+)/i);
  return match ? Number(match[1]) : null;
}

const TRANSFER_LABEL_RE = /лестниц|stairs|ladder|лифт|elevator|турникет/i;
const ROUTE_PICKER_HIDDEN_LABEL_RE = /^проход/i;
const ROUTE_PICKER_CORRIDOR_LABEL_RE = /^к\s/i;

export function isRouteNodeVisibleInPicker(node) {
  const label = String(node?.label ?? node?.title ?? "").trim();
  if (!label) {
    return false;
  }
  if (ROUTE_PICKER_HIDDEN_LABEL_RE.test(label)) {
    return false;
  }
  if (ROUTE_PICKER_CORRIDOR_LABEL_RE.test(label)) {
    return false;
  }
  if (/^лифт/i.test(label)) {
    return false;
  }
  return true;
}

function sortRouteNodeLabels(nodes) {
  return [...nodes].sort((left, right) => {
    const leftLabel = String(left?.label ?? left?.title ?? left?.id ?? "");
    const rightLabel = String(right?.label ?? right?.title ?? right?.id ?? "");
    return leftLabel.localeCompare(rightLabel, "ru", { numeric: true, sensitivity: "base" });
  });
}

export function getRouteNodeIdForElement(elementId = "") {
  const raw = String(elementId ?? "").trim();
  if (!raw) {
    return null;
  }

  const roomMatch = raw.match(/^room-(.+)$/i);
  if (!roomMatch) {
    return null;
  }

  return `n_r_${roomMatch[1]}`;
}

export function getElementIdForRouteNode(nodeId = "") {
  const raw = String(nodeId ?? "").trim();
  const roomMatch = raw.match(/^n_r_(.+)$/i);
  if (!roomMatch) {
    return null;
  }

  return `room-${roomMatch[1]}`;
}

export function filterSelectableRouteNodes(nodes) {
  const list = nodes ?? [];
  const auditoriumNodesByPrefix = list.filter((node) => (
    /^n_r_/i.test(String(node.id ?? ""))
    && isRouteNodeVisibleInPicker(node)
  ));

  if (auditoriumNodesByPrefix.length > 0) {
    return sortRouteNodeLabels(auditoriumNodesByPrefix);
  }

  const auditoriumNodesByLabel = list.filter((node) => {
    const label = String(node?.label ?? node?.title ?? "").trim();
    if (!/^ауд/i.test(label)) {
      return false;
    }
    return isRouteNodeVisibleInPicker(node);
  });

  if (auditoriumNodesByLabel.length > 0) {
    return sortRouteNodeLabels(auditoriumNodesByLabel);
  }

  return sortRouteNodeLabels(list.filter(isRouteNodeVisibleInPicker));
}

export function buildGraph(graph) {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph?.edges) ? graph.edges : [];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = new Map();
  const edgeMap = new Map();

  nodes.forEach((node) => {
    adjacency.set(node.id, []);
  });

  function getDistance(leftId, rightId) {
    const left = nodeMap.get(leftId);
    const right = nodeMap.get(rightId);
    if (!left || !right) {
      return null;
    }
    const dx = (Number(right.x) || 0) - (Number(left.x) || 0);
    const dy = (Number(right.y) || 0) - (Number(left.y) || 0);
    return Math.hypot(dx, dy);
  }

  function getPointsLength(points) {
    if (!Array.isArray(points) || points.length < 2) {
      return null;
    }
    let length = 0;
    for (let index = 1; index < points.length; index += 1) {
      const prev = points[index - 1];
      const next = points[index];
      const x1 = Number(prev?.x ?? prev?.[0]) || 0;
      const y1 = Number(prev?.y ?? prev?.[1]) || 0;
      const x2 = Number(next?.x ?? next?.[0]) || 0;
      const y2 = Number(next?.y ?? next?.[1]) || 0;
      length += Math.hypot(x2 - x1, y2 - y1);
    }
    return length;
  }

  function normalizePoints(points) {
    if (!Array.isArray(points)) {
      return [];
    }
    return points
      .map((point) => {
        const x = Number(point?.x ?? point?.[0]);
        const y = Number(point?.y ?? point?.[1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          return null;
        }
        return { x, y };
      })
      .filter(Boolean);
  }

  edges.forEach((edge) => {
    if (!edge?.from || !edge?.to) {
      return;
    }
    const edgePoints = normalizePoints(edge.points);
    const length = getPointsLength(edgePoints);
    const weight = Number(edge.weight) || length || getDistance(edge.from, edge.to) || 1;
    if (!adjacency.has(edge.from)) {
      adjacency.set(edge.from, []);
    }
    adjacency.get(edge.from).push({ to: edge.to, weight, points: edgePoints });
    edgeMap.set(`${edge.from}__${edge.to}`, edgePoints);
    if (edge.bidirectional !== false) {
      if (!adjacency.has(edge.to)) {
        adjacency.set(edge.to, []);
      }
      const reversed = [...edgePoints].reverse();
      adjacency.get(edge.to).push({ to: edge.from, weight, points: reversed });
      edgeMap.set(`${edge.to}__${edge.from}`, reversed);
    }
  });

  return { nodes, nodeMap, adjacency, edgeMap };
}

export function findShortestPath(graphData, fromId, toId) {
  if (!fromId || !toId || fromId === toId) {
    return { path: [fromId].filter(Boolean), distance: 0 };
  }

  const { adjacency } = graphData;
  const distances = new Map();
  const previous = new Map();
  const visited = new Set();

  adjacency.forEach((_, nodeId) => {
    distances.set(nodeId, Number.POSITIVE_INFINITY);
  });
  distances.set(fromId, 0);

  while (visited.size < adjacency.size) {
    let currentNode = null;
    let currentDistance = Number.POSITIVE_INFINITY;

    distances.forEach((distance, nodeId) => {
      if (!visited.has(nodeId) && distance < currentDistance) {
        currentNode = nodeId;
        currentDistance = distance;
      }
    });

    if (!currentNode) {
      break;
    }

    if (currentNode === toId) {
      break;
    }

    visited.add(currentNode);
    const neighbors = adjacency.get(currentNode) ?? [];

    neighbors.forEach((neighbor) => {
      const nextDistance = currentDistance + neighbor.weight;
      if (nextDistance < (distances.get(neighbor.to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(neighbor.to, nextDistance);
        previous.set(neighbor.to, currentNode);
      }
    });
  }

  const path = [];
  let current = toId;
  while (current) {
    path.unshift(current);
    const prev = previous.get(current);
    if (!prev) {
      break;
    }
    current = prev;
  }

  if (path[0] !== fromId) {
    return { path: [], distance: Number.POSITIVE_INFINITY };
  }

  return { path, distance: distances.get(toId) ?? Number.POSITIVE_INFINITY };
}

export function simplifyRoutePoints(points, epsilon = 0.75) {
  if (!Array.isArray(points) || points.length <= 2) {
    return points ?? [];
  }

  const simplified = [points[0]];
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = simplified[simplified.length - 1];
    const current = points[index];
    const next = points[index + 1];
    const cross = Math.abs(
      (current.x - previous.x) * (next.y - previous.y)
      - (current.y - previous.y) * (next.x - previous.x),
    );
    if (cross > epsilon) {
      simplified.push(current);
    }
  }
  simplified.push(points[points.length - 1]);
  return simplified;
}

export function pathToPoints(graphData, path) {
  if (!Array.isArray(path) || path.length < 2) {
    const single = graphData.nodeMap.get(path?.[0]);
    return single ? [{ x: Number(single.x) || 0, y: Number(single.y) || 0 }] : [];
  }

  const points = [];
  for (let index = 0; index < path.length - 1; index += 1) {
    const fromNodeId = path[index];
    const toNodeId = path[index + 1];
    const edgePoints = graphData.edgeMap.get(`${fromNodeId}__${toNodeId}`) ?? [];
    const fallback = [graphData.nodeMap.get(fromNodeId), graphData.nodeMap.get(toNodeId)]
      .filter(Boolean)
      .map((node) => ({ x: Number(node.x) || 0, y: Number(node.y) || 0 }));
    const segment = edgePoints.length > 0 ? edgePoints : fallback;
    segment.forEach((point, pointIndex) => {
      if (points.length > 0 && pointIndex === 0) {
        const last = points[points.length - 1];
        if (last.x === point.x && last.y === point.y) {
          return;
        }
      }
      points.push({ x: point.x, y: point.y });
    });
  }

  return simplifyRoutePoints(points);
}

export function isTransferNode(node) {
  const label = String(node?.label ?? node?.title ?? "").trim();
  return TRANSFER_LABEL_RE.test(label);
}

export function findTransferNodes(graph) {
  return (graph?.nodes ?? []).filter(isTransferNode);
}

function buildFloorGraphIndex(mapGraphs) {
  const byFloor = new Map();
  mapGraphs.forEach((graph) => {
    const floor = getFloorFromMapId(graph.id);
    if (floor === null) {
      return;
    }
    byFloor.set(floor, {
      floor,
      graphId: graph.id,
      graph,
      graphData: buildGraph(graph),
    });
  });
  return byFloor;
}

function normalizeConnections(rawConnections) {
  if (!Array.isArray(rawConnections)) {
    return [];
  }

  return rawConnections
    .map((connection) => ({
      id: String(connection?.id ?? "").trim(),
      label: String(connection?.label ?? connection?.id ?? "Переход").trim(),
      points: (connection?.points ?? [])
        .map((point) => ({
          floor: Number(point?.floor),
          nodeId: String(point?.nodeId ?? "").trim(),
        }))
        .filter((point) => Number.isFinite(point.floor) && point.nodeId),
    }))
    .filter((connection) => connection.id && connection.points.length >= 2);
}

function buildFloorAdjacency(connections) {
  const adjacency = new Map();

  connections.forEach((connection) => {
    const floors = [...new Set(connection.points.map((point) => point.floor))];
    for (let fromIndex = 0; fromIndex < floors.length; fromIndex += 1) {
      for (let toIndex = fromIndex + 1; toIndex < floors.length; toIndex += 1) {
        const fromFloor = floors[fromIndex];
        const toFloor = floors[toIndex];
        if (!adjacency.has(fromFloor)) {
          adjacency.set(fromFloor, []);
        }
        if (!adjacency.has(toFloor)) {
          adjacency.set(toFloor, []);
        }
        adjacency.get(fromFloor).push({ floor: toFloor, connection });
        adjacency.get(toFloor).push({ floor: fromFloor, connection });
      }
    }
  });

  return adjacency;
}

function findFloorPath(floorAdjacency, fromFloor, toFloor) {
  if (fromFloor === toFloor) {
    return [fromFloor];
  }

  const queue = [fromFloor];
  const previous = new Map([[fromFloor, null]]);
  const connectionUsed = new Map();

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === toFloor) {
      break;
    }

    const neighbors = floorAdjacency.get(current) ?? [];
    neighbors.forEach(({ floor: nextFloor, connection }) => {
      if (previous.has(nextFloor)) {
        return;
      }
      previous.set(nextFloor, current);
      connectionUsed.set(nextFloor, connection);
      queue.push(nextFloor);
    });
  }

  if (!previous.has(toFloor)) {
    return null;
  }

  const floors = [];
  const connections = [];
  let cursor = toFloor;
  while (cursor !== null) {
    floors.unshift(cursor);
    const link = connectionUsed.get(cursor);
    if (link) {
      connections.unshift(link);
    }
    cursor = previous.get(cursor) ?? null;
  }

  return { floors, connections };
}

function pickNodeOnFloor(connection, floor, graphData, preferTransfer = true) {
  const candidates = connection.points.filter((point) => point.floor === floor);
  if (candidates.length === 0) {
    return null;
  }

  const nodes = candidates
    .map((point) => graphData.nodeMap.get(point.nodeId))
    .filter(Boolean);

  if (nodes.length === 0) {
    return null;
  }

  if (preferTransfer) {
    const transfer = nodes.find(isTransferNode);
    if (transfer) {
      return transfer.id;
    }
  }

  return nodes[0].id;
}

function segmentRoute(graphData, fromNodeId, toNodeId) {
  const { path, distance } = findShortestPath(graphData, fromNodeId, toNodeId);
  if (path.length === 0) {
    return null;
  }
  return {
    path,
    distance,
    points: pathToPoints(graphData, path),
  };
}

/**
 * @returns {{
 *   segments: Array<{ floor: number, graphId: string, points: Array<{x,y}>, label: string, transferHint?: string }>,
 *   totalDistance: number,
 * } | null}
 */
export function buildMultiFloorRoute({
  fromFloor,
  fromNodeId,
  toFloor,
  toNodeId,
  mapGraphs,
  floorConnections = [],
}) {
  const floorGraphs = buildFloorGraphIndex(mapGraphs);
  const fromGraph = floorGraphs.get(fromFloor);
  const toGraph = floorGraphs.get(toFloor);

  if (!fromGraph || !toGraph) {
    return null;
  }

  if (!fromGraph.graphData.nodeMap.has(fromNodeId) || !toGraph.graphData.nodeMap.has(toNodeId)) {
    return null;
  }

  if (fromFloor === toFloor) {
    const segment = segmentRoute(fromGraph.graphData, fromNodeId, toNodeId);
    if (!segment) {
      return null;
    }
    return {
      segments: [
        {
          floor: fromFloor,
          graphId: fromGraph.graphId,
          points: segment.points,
          label: `Этаж ${fromFloor}`,
        },
      ],
      totalDistance: segment.distance,
    };
  }

  const connections = normalizeConnections(floorConnections);
  const floorAdjacency = buildFloorAdjacency(connections);
  const floorPathResult = findFloorPath(floorAdjacency, fromFloor, toFloor);

  if (!floorPathResult) {
    return null;
  }

  const { floors, connections: pathConnections } = floorPathResult;
  const segments = [];
  let totalDistance = 0;

  for (let index = 0; index < floors.length; index += 1) {
    const floor = floors[index];
    const floorGraph = floorGraphs.get(floor);
    if (!floorGraph) {
      return null;
    }

    const isFirst = index === 0;
    const isLast = index === floors.length - 1;
    let startNodeId;
    let endNodeId;
    let transferHint;

    if (isFirst) {
      startNodeId = fromNodeId;
      const connection = pathConnections[0];
      endNodeId = pickNodeOnFloor(connection, floor, floorGraph.graphData);
      transferHint = connection?.label;
    } else if (isLast) {
      const connection = pathConnections[pathConnections.length - 1];
      startNodeId = pickNodeOnFloor(connection, floor, floorGraph.graphData);
      endNodeId = toNodeId;
      if (index > 0) {
        transferHint = `Поднимитесь / спуститесь: ${connection?.label ?? "переход"}`;
      }
    } else {
      const enterConnection = pathConnections[index - 1];
      const exitConnection = pathConnections[index];
      startNodeId = pickNodeOnFloor(enterConnection, floor, floorGraph.graphData);
      endNodeId = pickNodeOnFloor(exitConnection, floor, floorGraph.graphData);
      transferHint = `Через ${enterConnection?.label ?? "переход"}`;
    }

    if (!startNodeId || !endNodeId) {
      return null;
    }

    const segment = segmentRoute(floorGraph.graphData, startNodeId, endNodeId);
    if (!segment) {
      return null;
    }

    totalDistance += segment.distance;
    segments.push({
      floor,
      graphId: floorGraph.graphId,
      points: segment.points,
      label: `Этаж ${floor}`,
      transferHint: isLast ? undefined : transferHint,
    });
  }

  return { segments, totalDistance };
}

export function getGraphForFloor(mapGraphs, floor) {
  const floorNumber = Number(floor);
  if (!Number.isFinite(floorNumber)) {
    return null;
  }
  return mapGraphs.find((graph) => getFloorFromMapId(graph.id) === floorNumber) ?? null;
}

export function listRoutableFloors(mapGraphs) {
  return mapGraphs
    .map((graph) => ({
      floor: getFloorFromMapId(graph.id),
      graphId: graph.id,
      label: graph.label ?? `Этаж ${getFloorFromMapId(graph.id)}`,
      graph,
      nodes: graph.nodes ?? [],
    }))
    .filter((item) => item.floor !== null)
    .sort((left, right) => left.floor - right.floor);
}
