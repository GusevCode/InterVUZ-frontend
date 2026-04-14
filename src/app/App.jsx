import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import useMediaQuery from "@mui/material/useMediaQuery";

import AppHeader from "../widgets/AppHeader";
import AppRouter from "./providers/AppRouter";
import MobileBottomNav from "../shared/ui/MobileBottomNav";

function App() {
  const isMobile = useMediaQuery("(max-width:600px)");

  if (isMobile) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, rgba(22, 38, 63, 0.72) 0%, rgba(11, 20, 35, 0.94) 100%), #0E182A",
          pb: "80px",
        }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <AppRouter />
        </Box>
        <MobileBottomNav />
      </Box>
    );
  }

  return (
    <>
      <AppHeader />
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
        <AppRouter />
      </Container>
    </>
  );
}

export default App;
