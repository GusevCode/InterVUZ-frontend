import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1f3a5f",
    },
    secondary: {
      main: "#6b7f99",
    },
    text: {
      primary: "#1e2a36",
      secondary: "#4f5f72",
    },
    background: {
      default: "#eef2f6",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: 0.2,
    },
    h6: {
      fontWeight: 600,
      letterSpacing: 0.2,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #d8e0ea",
          boxShadow: "none",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "none",
        },
      },
    },
  },
});