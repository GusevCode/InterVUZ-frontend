import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

function SectionCard({ title, description, children, sx, contentSx }) {
  return (
    <Card variant="outlined" sx={{ height: "100%", ...sx }}>
      <CardContent sx={{ p: 2.5, ...contentSx }}>
        {title ? (
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
        ) : null}

        {title ? <Divider sx={{ mb: 1.5 }} /> : null}

        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {description}
          </Typography>
        ) : null}

        {children}
      </CardContent>
    </Card>
  );
}

export default SectionCard;
