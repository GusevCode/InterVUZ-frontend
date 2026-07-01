import { useEffect, useMemo, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import RouteNodeAutocomplete from "../shared/ui/RouteNodeAutocomplete";
import {
  buildGraph,
  buildMultiFloorRoute,
  collectTransferNodesOnPath,
  filterSelectableRouteNodes,
  findShortestPath,
  getGraphForFloor,
  getRouteNodeIdForElement,
  listRoutableFloors,
  pathToPoints,
} from "../entities/map/routeGraphLib";

const D = {
  inputBg: "#101D31",
  inputBorder: "#355180",
  labelColor: "#AFBFDE",
  inputColor: "#E4EDFF",
  btnBg: "rgba(18, 31, 53, 0.8)",
  btnBorder: "#334B71",
  btnText: "#C3D7FF",
};

export default function MapRoutePlanner({
  mapGraphs = [],
  floorConnections = [],
  onSingleFloorRouteChange,
  onMultiFloorRouteChange,
  onGraphRouteChange,
  onRouteFloorChange,
  activeFloor = null,
  selectedElementId = "",
  routeLocked = false,
  dark = false,
  compact = false,
  landscape = false,
}) {
  const routableFloors = useMemo(() => listRoutableFloors(mapGraphs), [mapGraphs]);

  const [fromFloor, setFromFloor] = useState(null);
  const [toFloor, setToFloor] = useState(null);
  const [fromNodeId, setFromNodeId] = useState("");
  const [toNodeId, setToNodeId] = useState("");
  const [error, setError] = useState("");
  const prevSelectedRouteNodeIdRef = useRef("");

  const fromFloorData = routableFloors.find((item) => item.floor === fromFloor) ?? null;
  const toFloorData = routableFloors.find((item) => item.floor === toFloor) ?? null;
  const fromNodes = fromFloorData?.nodes ?? [];
  const toNodes = toFloorData?.nodes ?? [];
  const fromSelectableNodes = useMemo(() => filterSelectableRouteNodes(fromNodes), [fromNodes]);
  const toSelectableNodes = useMemo(() => filterSelectableRouteNodes(toNodes), [toNodes]);
  const selectedRouteNodeId = useMemo(() => {
    const routeNodeId = getRouteNodeIdForElement(selectedElementId);
    if (!routeNodeId) {
      return "";
    }

    const activeFloorNumber = Number(activeFloor);
    if (Number.isFinite(activeFloorNumber) && activeFloorNumber !== fromFloor) {
      return "";
    }

    const existsOnFloor = fromNodes.some((node) => node.id === routeNodeId);
    return existsOnFloor ? routeNodeId : "";
  }, [selectedElementId, activeFloor, fromFloor, fromNodes]);
  const usesAuditoriumNodes = fromSelectableNodes.some((node) => /^n_r_/i.test(String(node.id ?? "")))
    || fromSelectableNodes.some((node) => /^ауд/i.test(String(node.label ?? "")));
  const nodePlaceholder = usesAuditoriumNodes ? "Номер аудитории, например 208" : "Начните вводить точку…";

  function clearBuiltRoute() {
    setError("");
    if (typeof onSingleFloorRouteChange === "function") {
      onSingleFloorRouteChange([]);
    }
    if (typeof onMultiFloorRouteChange === "function") {
      onMultiFloorRouteChange(null);
    }
    if (typeof onGraphRouteChange === "function") {
      onGraphRouteChange(null);
    }
  }

  function handleFromFloorChange(nextFloor) {
    clearBuiltRoute();
    setFromFloor(nextFloor);
  }

  function handleToFloorChange(nextFloor) {
    clearBuiltRoute();
    setToFloor(nextFloor);
  }

  function handleFromNodeChange(nextNodeId) {
    clearBuiltRoute();
    setFromNodeId(nextNodeId);
  }

  function handleToNodeChange(nextNodeId) {
    clearBuiltRoute();
    setToNodeId(nextNodeId);
  }

  useEffect(() => {
    if (routableFloors.length === 0) {
      setFromFloor(null);
      setToFloor(null);
      setFromNodeId("");
      setToNodeId("");
      if (typeof onSingleFloorRouteChange === "function") {
        onSingleFloorRouteChange([]);
      }
      if (typeof onMultiFloorRouteChange === "function") {
        onMultiFloorRouteChange(null);
      }
      if (typeof onGraphRouteChange === "function") {
        onGraphRouteChange(null);
      }
      return;
    }

    if (routeLocked) {
      return;
    }

    const preferredFloor = Number.isFinite(Number(activeFloor))
      ? routableFloors.find((item) => item.floor === Number(activeFloor))?.floor
      : null;
    const nextFromFloor = preferredFloor ?? routableFloors[0].floor;
    const nextToFloor = preferredFloor ?? routableFloors[0].floor;
    setFromFloor(nextFromFloor);
    setToFloor(nextToFloor);
    setError("");
  }, [routableFloors, activeFloor, routeLocked]);

  useEffect(() => {
    if (routeLocked || !Number.isFinite(Number(activeFloor))) {
      return;
    }

    const nextFloor = Number(activeFloor);
    if (!routableFloors.some((item) => item.floor === nextFloor)) {
      return;
    }

    setFromFloor(nextFloor);
  }, [activeFloor, routableFloors, routeLocked]);

  useEffect(() => {
    if (!fromFloorData) {
      return;
    }
    const nextFrom = fromSelectableNodes[0]?.id || "";
    setFromNodeId(nextFrom);
  }, [fromFloor, fromFloorData?.graphId, fromSelectableNodes]);

  useEffect(() => {
    if (!toFloorData) {
      return;
    }
    const nextTo =
      toSelectableNodes.find((node) => node.id !== fromNodeId)?.id || toSelectableNodes[0]?.id || "";
    setToNodeId(nextTo);
  }, [toFloor, toFloorData?.graphId, fromNodeId, toSelectableNodes]);

  // Clicking a room marker on the map selects it as the "Откуда" point,
  // so its label is substituted into the route's source autocomplete input.
  useEffect(() => {
    if (!selectedRouteNodeId) {
      prevSelectedRouteNodeIdRef.current = "";
      return;
    }
    if (selectedRouteNodeId === prevSelectedRouteNodeIdRef.current) {
      return;
    }
    prevSelectedRouteNodeIdRef.current = selectedRouteNodeId;
    clearBuiltRoute();
    setFromNodeId(selectedRouteNodeId);
    if (Number.isFinite(Number(activeFloor))) {
      setFromFloor(Number(activeFloor));
    }
  }, [selectedRouteNodeId, activeFloor]);

  function handleBuildRoute() {
    setError("");

    if (!fromNodeId || !toNodeId) {
      setError("Выберите точки маршрута.");
      return;
    }

    if (fromFloor === toFloor && fromNodeId === toNodeId) {
      setError("Выберите разные точки маршрута.");
      return;
    }

    if (Number(fromFloor) === Number(toFloor)) {
      const graph = fromFloorData?.graph ?? getGraphForFloor(mapGraphs, fromFloor);
      if (!graph) {
        setError(`Граф для этажа ${fromFloor} не найден. Добавьте floor_${fromFloor}.graph.json в assets.`);
        return;
      }
      const graphData = buildGraph(graph);
      const { path } = findShortestPath(graphData, fromNodeId, toNodeId);
      if (path.length === 0) {
        setError("Маршрут не найден. Проверьте связи между точками.");
        if (typeof onSingleFloorRouteChange === "function") {
          onSingleFloorRouteChange([]);
        }
        if (typeof onMultiFloorRouteChange === "function") {
          onMultiFloorRouteChange(null);
        }
        if (typeof onGraphRouteChange === "function") {
          onGraphRouteChange(null);
        }
        return;
      }

      if (typeof onRouteFloorChange === "function") {
        onRouteFloorChange(fromFloor);
      }
      if (typeof onSingleFloorRouteChange === "function") {
        onSingleFloorRouteChange(pathToPoints(graphData, path));
      }
      if (typeof onMultiFloorRouteChange === "function") {
        onMultiFloorRouteChange(null);
      }
      if (typeof onGraphRouteChange === "function") {
        onGraphRouteChange({
          fromNodeId,
          toNodeId,
          fromFloor,
          toFloor,
          segments: [{
            floor: fromFloor,
            graphId: fromFloorData?.graphId ?? graph.id,
            path,
            points: pathToPoints(graphData, path),
            label: `Этаж ${fromFloor}`,
          }],
          transferNodes: collectTransferNodesOnPath(path, fromFloor, graphData),
        });
      }
      return;
    }

    const result = buildMultiFloorRoute({
      fromFloor,
      fromNodeId,
      toFloor,
      toNodeId,
      mapGraphs,
      floorConnections,
    });

    if (!result) {
      setError(
        "Межэтажный маршрут не найден. Добавьте связи в floor-links.json или граф для промежуточного этажа.",
      );
      if (typeof onSingleFloorRouteChange === "function") {
        onSingleFloorRouteChange([]);
      }
      if (typeof onMultiFloorRouteChange === "function") {
        onMultiFloorRouteChange(null);
      }
      if (typeof onGraphRouteChange === "function") {
        onGraphRouteChange(null);
      }
      return;
    }

    if (typeof onSingleFloorRouteChange === "function") {
      onSingleFloorRouteChange([]);
    }
    if (typeof onMultiFloorRouteChange === "function") {
      onMultiFloorRouteChange(result);
    }
    if (typeof onGraphRouteChange === "function") {
      onGraphRouteChange(result);
    }
  }

  if (routableFloors.length === 0) {
    return null;
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
        "& .MuiAutocomplete-popupIndicator": { color: D.labelColor },
        "& .MuiAutocomplete-clearIndicator": { color: D.labelColor },
      }
    : {};

  return (
    <Stack spacing={landscape ? 0.75 : compact ? 1 : 1.5} sx={landscape ? { minWidth: 220, width: "100%" } : undefined}>
      <Stack direction={landscape ? "row" : "column"} spacing={landscape ? 1 : 0} sx={landscape ? { alignItems: "flex-start" } : undefined}>
      <Box sx={landscape ? { minWidth: 150 } : undefined}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: landscape ? 0.5 : 1.25, ...(dark ? { color: D.labelColor } : {}) }}
        >
          Откуда
        </Typography>
        <Stack direction={landscape ? "column" : compact ? "column" : "row"} spacing={1} sx={{ mt: landscape ? 0 : 0.5 }}>
          <TextField
            select
            size="small"
            label="Этаж"
            value={fromFloor ?? ""}
            onChange={(event) => handleFromFloorChange(Number(event.target.value))}
            sx={{ ...inputSx, minWidth: compact ? 0 : 88, width: compact ? "100%" : undefined }}
          >
            {routableFloors.map((item) => (
              <MenuItem key={`from-floor-${item.floor}`} value={item.floor}>
                {item.floor}
              </MenuItem>
            ))}
          </TextField>
          <RouteNodeAutocomplete
            nodes={fromSelectableNodes}
            value={fromNodeId}
            onChange={handleFromNodeChange}
            placeholder={nodePlaceholder}
            inputSx={{ ...inputSx, flex: 1 }}
            sx={{ flex: 1 }}
          />
        </Stack>
      </Box>

      <Box sx={landscape ? { minWidth: 150 } : undefined}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: landscape ? 0.5 : 1.25, ...(dark ? { color: D.labelColor } : {}) }}
        >
          Куда
        </Typography>
        <Stack direction={landscape ? "column" : compact ? "column" : "row"} spacing={1} sx={{ mt: landscape ? 0 : 0.5 }}>
          <TextField
            select
            size="small"
            label="Этаж"
            value={toFloor ?? ""}
            onChange={(event) => handleToFloorChange(Number(event.target.value))}
            sx={{ ...inputSx, minWidth: compact ? 0 : 88, width: compact ? "100%" : undefined }}
          >
            {routableFloors.map((item) => (
              <MenuItem key={`to-floor-${item.floor}`} value={item.floor}>
                {item.floor}
              </MenuItem>
            ))}
          </TextField>
          <RouteNodeAutocomplete
            nodes={toSelectableNodes}
            value={toNodeId}
            onChange={handleToNodeChange}
            placeholder={nodePlaceholder}
            inputSx={{ ...inputSx, flex: 1 }}
            sx={{ flex: 1 }}
          />
        </Stack>
      </Box>
      </Stack>

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
                fontSize: landscape ? "11px" : compact ? "12px" : "14px",
                borderRadius: "12px",
                height: landscape ? "34px" : compact ? "36px" : "40px",
                px: landscape ? 1.25 : compact ? 1 : 2,
                alignSelf: landscape ? "flex-start" : undefined,
                whiteSpace: "nowrap",
                "&:hover": { background: "rgba(28, 48, 82, 0.9)", borderColor: "#4d75b0" },
              }
            : {}
        }
      >
        Построить маршрут
      </Button>
      {error ? <Alert severity="error">{error}</Alert> : null}
    </Stack>
  );
}
