import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";

function EmptyTableRow({ colSpan, message, align = "center" }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align={align}>
        {message}
      </TableCell>
    </TableRow>
  );
}

export default EmptyTableRow;
