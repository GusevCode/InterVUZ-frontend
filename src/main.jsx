import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import AppTheme from "./app/providers/AppTheme";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppTheme>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppTheme>
  </React.StrictMode>
);
