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

const D = {
  bg: "linear-gradient(180deg, rgba(24, 40, 66, 0.58) 0%, rgba(18, 31, 53, 0.95) 100%), #121F35",
  border: "#253654",
  inputBg: "#101D31",
  inputBorder: "#355180",
  labelColor: "#AFBFDE",
  inputColor: "#E4EDFF",
  btnBg: "rgba(18, 31, 53, 0.8)",
  btnBorder: "#334B71",
  btnText: "#C3D7FF",
};

export default function MapRoutePlanner({ graph, onRouteChange, dark = false }) {
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

    const points = [];
    for (let index = 0; index < path.length - 1; index += 1) {
      const fromId = path[index];
      const toId = path[index + 1];
      const edgePoints = graphData.edgeMap.get(`${fromId}__${toId}`) ?? [];
      const fallback = [
        graphData.nodeMap.get(fromId),
        graphData.nodeMap.get(toId),
      ]
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

  const inputSx = dark
    ? {
        "& .MuiOutlinedInput-root": {
          background: D.inputBg,
          "& fieldset": { borderColor: D.inputBorder },
          "&:hover fieldset": { borderColor: "#4d75b0" },
          "&.Mui-focused fieldset": { borderColor: "#5a8fd4" },
        },
        "& .MuiInputBase-input": { color: D.inputColor },
        "& .MuiInputLabel-root": { color: D.labelColor },
        "& .MuiInputLabel-root.Mui-focused": { color: "#7ab0f0" },
        "& .MuiSelect-icon": { color: D.labelColor },
      }
    : {};

  return (
    <Stack spacing={1.5}>
      <Typography
        variant="subtitle2"
        sx={dark ? { color: D.labelColor, fontFamily: "'Manrope', sans-serif", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", fontSize: "13px" } : {}}
      >
        Маршрут по разметке
      </Typography>
      <TextField
        select
        size="small"
        label="Откуда"
        value={fromId}
        onChange={(event) => setFromId(event.target.value)}
        sx={inputSx}
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
        sx={inputSx}
      >
        {nodes.map((node) => (
          <MenuItem key={node.id} value={node.id}>
            {node.label || node.title || node.id}
          </MenuItem>
        ))}
      </TextField>
      <Button
        variant="outlined"
        onClick={handleBuildRoute}
        sx={
          dark
            ? {
                background: D.btnBg,
                border: `1px solid ${D.btnBorder}`,
                color: D.btnText,
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                borderRadius: "12px",
                height: "40px",
                "&:hover": { background: "rgba(28, 48, 82, 0.9)", borderColor: "#4d75b0" },
              }
            : {}
        }
      >
        Найти кратчайший путь
      </Button>
      {error ? <Alert severity="error">{error}</Alert> : null}
    </Stack>
  );
}
