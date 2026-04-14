import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

function buildGraph(graph) {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph?.edges) ? graph.edges : [];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = new Map();

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

  edges.forEach((edge) => {
    if (!edge?.from || !edge?.to) {
      return;
    }
    const weight = Number(edge.weight) || getDistance(edge.from, edge.to) || 1;
    if (!adjacency.has(edge.from)) {
      adjacency.set(edge.from, []);
    }
    adjacency.get(edge.from).push({ to: edge.to, weight });
    if (edge.bidirectional !== false) {
      if (!adjacency.has(edge.to)) {
        adjacency.set(edge.to, []);
      }
      adjacency.get(edge.to).push({ to: edge.from, weight });
    }
  });

  return { nodes, nodeMap, adjacency };
}

function findShortestPath(graph, fromId, toId) {
  if (!fromId || !toId || fromId === toId) {
    return [];
  }

  const { adjacency } = graph;
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
    current = previous.get(current) ?? null;
    if (current === fromId) {
      path.unshift(current);
      break;
    }
  }

  if (path[0] !== fromId) {
    return [];
  }

  return path;
}

export default function MapRoutePlanner({ graph, onRouteChange }) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [error, setError] = useState("");

  const graphData = useMemo(() => buildGraph(graph), [graph]);
  const nodes = graphData.nodes;

  useEffect(() => {
    if (nodes.length === 0) {
      setFromId("");
      setToId("");
      if (typeof onRouteChange === "function") {
        onRouteChange([]);
      }
      return;
    }
    const nextFrom = nodes[0]?.id || "";
    const nextTo = nodes.find((node) => node.id !== nextFrom)?.id || nextFrom || "";
    setFromId(nextFrom);
    setToId(nextTo);
    setError("");
    if (typeof onRouteChange === "function") {
      onRouteChange([]);
    }
  }, [nodes, onRouteChange]);

  function handleBuildRoute() {
    setError("");

    if (!fromId || !toId || fromId === toId) {
      setError("Выберите разные точки маршрута.");
      if (typeof onRouteChange === "function") {
        onRouteChange([]);
      }
      return;
    }

    const path = findShortestPath(graphData, fromId, toId);
    if (path.length === 0) {
      setError("Маршрут не найден. Проверьте связи между точками.");
      if (typeof onRouteChange === "function") {
        onRouteChange([]);
      }
      return;
    }

    const points = path
      .map((nodeId) => graphData.nodeMap.get(nodeId))
      .filter(Boolean)
      .map((node) => ({ x: Number(node.x) || 0, y: Number(node.y) || 0 }));

    if (typeof onRouteChange === "function") {
      onRouteChange(points);
    }
  }

  if (!graph || nodes.length === 0) {
    return (
      <Alert severity="warning">
        Нет файла маршрутов (*.graph.json) или он пустой.
      </Alert>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">Маршрут по разметке</Typography>
      <TextField
        select
        size="small"
        label="Откуда"
        value={fromId}
        onChange={(event) => setFromId(event.target.value)}
      >
        {nodes.map((node) => (
          <MenuItem key={node.id} value={node.id}>
            {node.label || node.title || node.id}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Куда"
        value={toId}
        onChange={(event) => setToId(event.target.value)}
      >
        {nodes.map((node) => (
          <MenuItem key={node.id} value={node.id}>
            {node.label || node.title || node.id}
          </MenuItem>
        ))}
      </TextField>
      <Button variant="outlined" onClick={handleBuildRoute}>
        Найти кратчайший путь
      </Button>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box sx={{ color: "text.secondary", fontSize: 12 }}>
        Совет: добавьте узлы в *.graph.json и соедините их рёбрами.
      </Box>
    </Stack>
  );
}
