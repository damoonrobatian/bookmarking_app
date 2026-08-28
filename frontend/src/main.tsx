import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { applyStoredTheme } from "@/theme";
import { App } from "@/app/App";
import "@/index.css";

applyStoredTheme();

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
