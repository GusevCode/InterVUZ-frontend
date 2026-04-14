import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";

function LabeledSelect({
  label,
  value,
  onChange,
  size = "small",
  fullWidth = true,
  sx,
  children,
  ...rest
}) {
  return (
    <FormControl fullWidth={fullWidth} size={size} sx={sx}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} label={label} onChange={onChange} {...rest}>
        {children}
      </Select>
    </FormControl>
  );
}

export default LabeledSelect;
