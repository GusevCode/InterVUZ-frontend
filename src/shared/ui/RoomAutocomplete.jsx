import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export const ALL_ROOMS_ID = "__all__";

export const ALL_ROOMS_OPTION = {
  id: ALL_ROOMS_ID,
  name: "Все аудитории",
};

function filterRooms(rooms, inputValue) {
  const q = inputValue.trim().toLowerCase();
  const allLabel = ALL_ROOMS_OPTION.name.toLowerCase();
  const showAll = !q || allLabel.includes(q);
  const filtered = q
    ? rooms.filter((room) => room.name.toLowerCase().includes(q))
    : rooms;
  return showAll ? [ALL_ROOMS_OPTION, ...filtered] : filtered;
}

function RoomAutocomplete({
  rooms,
  value,
  onChange,
  label = "Аудитория",
  placeholder = "Начните вводить номер…",
  sx,
  slotProps,
}) {
  const selected =
    value === ALL_ROOMS_ID
      ? ALL_ROOMS_OPTION
      : rooms.find((room) => room.id === value) ?? null;

  return (
    <Autocomplete
      size="small"
      fullWidth
      options={rooms}
      value={selected}
      onChange={(_event, room) => onChange(room?.id ?? "")}
      getOptionLabel={(room) => room.name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(options, state) => filterRooms(options, state.inputValue)}
      noOptionsText="Аудитория не найдена"
      clearOnBlur={false}
      slotProps={slotProps}
      sx={sx}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
        />
      )}
    />
  );
}

export default RoomAutocomplete;
