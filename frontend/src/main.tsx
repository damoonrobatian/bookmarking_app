import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { applyStoredTheme } from "@/theme";
import { App } from "@/app/App";
import "@/index.css";

applyStoredTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
