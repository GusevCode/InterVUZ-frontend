import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export function getRouteNodeLabel(node) {
  return String(node?.label ?? node?.title ?? node?.id ?? "").trim();
}

function filterRouteNodes(nodes, inputValue) {
  const q = inputValue.trim().toLowerCase();
  if (!q) {
    return nodes;
  }
  return nodes.filter((node) => getRouteNodeLabel(node).toLowerCase().includes(q));
}

function RouteNodeAutocomplete({
  nodes,
  value,
  onChange,
  label = "Точка",
  placeholder = "Начните вводить точку…",
  noOptionsText = "Точка не найдена",
  inputSx,
  sx,
  slotProps,
}) {
  const selected = nodes.find((node) => node.id === value) ?? null;

  return (
    <Autocomplete
      size="small"
      fullWidth
      options={nodes}
      value={selected}
      onChange={(_event, node) => onChange(node?.id ?? "")}
      getOptionLabel={getRouteNodeLabel}
      isOptionEqualToValue={(left, right) => left.id === right.id}
      filterOptions={(options, state) => filterRouteNodes(options, state.inputValue)}
      noOptionsText={noOptionsText}
      clearOnBlur={false}
      slotProps={slotProps}
      sx={sx}
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder={placeholder} sx={inputSx} />
      )}
    />
  );
}

export default RouteNodeAutocomplete;
