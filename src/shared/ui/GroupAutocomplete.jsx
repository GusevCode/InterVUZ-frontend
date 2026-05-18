import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

function filterGroups(groups, inputValue) {
  const q = inputValue.trim().toLowerCase();
  if (!q) return groups;
  return groups.filter((group) => group.name.toLowerCase().includes(q));
}

function GroupAutocomplete({
  groups,
  value,
  onChange,
  onInputChange,
  placeholder = "Начните вводить группу…",
  noOptionsText = "Группа не найдена",
  variant = "outlined",
  inputSx,
  sx,
  slotProps,
}) {
  const selected = groups.find((group) => group.id === value) ?? null;

  return (
    <Autocomplete
      size="small"
      fullWidth
      options={groups}
      value={selected}
      onChange={(_event, group) => onChange(group?.id ?? "")}
      onInputChange={(_event, inputValue, reason) => {
        if (reason === "input" || reason === "clear") {
          onInputChange?.(inputValue);
        }
      }}
      getOptionLabel={(group) => group.name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(options, state) => filterGroups(options, state.inputValue)}
      noOptionsText={noOptionsText}
      clearOnBlur={false}
      slotProps={slotProps}
      sx={sx}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          variant={variant}
          sx={inputSx}
          slotProps={
            variant === "standard"
              ? { input: { disableUnderline: true } }
              : undefined
          }
        />
      )}
    />
  );
}

export default GroupAutocomplete;
