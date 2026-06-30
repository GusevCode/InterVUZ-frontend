import { useEffect, useMemo, useState } from "react";
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
  onRouteFloorChange,
  activeFloor = null,
  selectedElementId = "",
  dark = false,
}) {
  const routableFloors = useMemo(() => listRoutableFloors(mapGraphs), [mapGraphs]);

  const [fromFloor, setFromFloor] = useState(null);
  const [toFloor, setToFloor] = useState(null);
  const [fromNodeId, setFromNodeId] = useState("");
  const [toNodeId, setToNodeId] = useState("");
  const [error, setError] = useState("");

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
    if (typeof onSingleFloorRouteChange === "function") {
      onSingleFloorRouteChange([]);
    }
    if (typeof onMultiFloorRouteChange === "function") {
      onMultiFloorRouteChange(null);
    }
  }, [routableFloors, activeFloor, onSingleFloorRouteChange, onMultiFloorRouteChange]);

  useEffect(() => {
    if (!Number.isFinite(Number(activeFloor))) {
      return;
    }

    const nextFloor = Number(activeFloor);
    if (!routableFloors.some((item) => item.floor === nextFloor)) {
      return;
    }

    setFromFloor(nextFloor);
  }, [activeFloor, routableFloors]);

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
      return;
    }

    if (typeof onSingleFloorRouteChange === "function") {
      onSingleFloorRouteChange([]);
    }
    if (typeof onMultiFloorRouteChange === "function") {
      onMultiFloorRouteChange(result);
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
    <Stack spacing={1.5}>
      <Typography
        variant="subtitle2"
        sx={
          dark
            ? {
                color: D.labelColor,
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                fontSize: "13px",
              }
            : {}
        }
      >
        {usesAuditoriumNodes ? "Маршрут между аудиториями" : "Маршрут по разметке"}
      </Typography>

      {selectedRouteNodeId ? (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="caption" color="text.secondary" sx={dark ? { color: D.labelColor } : {}}>
            Выбрана аудитория на карте
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setFromNodeId(selectedRouteNodeId);
              if (Number.isFinite(Number(activeFloor))) {
                setFromFloor(Number(activeFloor));
              }
            }}
            sx={dark ? { color: D.btnText, borderColor: D.btnBorder } : {}}
          >
            Откуда
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setToNodeId(selectedRouteNodeId);
              if (Number.isFinite(Number(activeFloor))) {
                setToFloor(Number(activeFloor));
              }
            }}
            sx={dark ? { color: D.btnText, borderColor: D.btnBorder } : {}}
          >
            Куда
          </Button>
        </Stack>
      ) : null}

      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 1.25, ...(dark ? { color: D.labelColor } : {}) }}
        >
          Откуда
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          <TextField
            select
            size="small"
            label="Этаж"
            value={fromFloor ?? ""}
            onChange={(event) => setFromFloor(Number(event.target.value))}
            sx={{ ...inputSx, minWidth: 88 }}
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
            onChange={setFromNodeId}
            placeholder={nodePlaceholder}
            inputSx={{ ...inputSx, flex: 1 }}
            sx={{ flex: 1 }}
          />
        </Stack>
      </Box>

      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 1.25, ...(dark ? { color: D.labelColor } : {}) }}
        >
          Куда
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          <TextField
            select
            size="small"
            label="Этаж"
            value={toFloor ?? ""}
            onChange={(event) => setToFloor(Number(event.target.value))}
            sx={{ ...inputSx, minWidth: 88 }}
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
            onChange={setToNodeId}
            placeholder={nodePlaceholder}
            inputSx={{ ...inputSx, flex: 1 }}
            sx={{ flex: 1 }}
          />
        </Stack>
      </Box>

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
        Построить маршрут
      </Button>
      {error ? <Alert severity="error">{error}</Alert> : null}
    </Stack>
  );
}
