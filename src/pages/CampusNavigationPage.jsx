import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const spots = [
  "Аудитории",
  "Кафедры",
  "Столовые",
  "Деканат",
  "Принтеры",
  "Библиотека",
];

function CampusNavigationPage() {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Навигация по вузу
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
          Приложение помогает быстро находить аудитории, кафедры, столовые,
          деканат, принтеры и другие важные точки в вузе.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Выберите точку назначения и получите последовательный маршрут по
          этажам и переходам.
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" gutterBottom>
                  Куда нужно попасть?
                </Typography>
                <Divider sx={{ mb: 1.5 }} />
                <List sx={{ p: 0 }}>
                  {spots.map((spot) => (
                    <ListItem
                      key={spot}
                      sx={{
                        px: 0,
                        py: 1,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <ListItemText
                        primary={spot}
                        primaryTypographyProps={{ variant: "body1" }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" gutterBottom>
                  Маршрут по корпусу
                </Typography>
                <Divider sx={{ mb: 1.5 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Пример рекомендуемого маршрута:
                </Typography>

                <Stack spacing={1.2} sx={{ mb: 2 }}>
                  {[
                    "Старт: Главный вход",
                    "1-й этаж - Коридор А",
                    "Лестница в блок Б",
                    "2-й этаж - Аудитория Б-214",
                  ].map((step, index) => (
                    <Box
                      key={step}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "24px 1fr",
                        gap: 1.5,
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          bgcolor: "primary.main",
                          color: "common.white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography variant="body2">{step}</Typography>
                    </Box>
                  ))}
                </Stack>

                <Button variant="contained">Построить маршрут</Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default CampusNavigationPage;
