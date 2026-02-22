import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { enableAnalytics } from "./firebase";
import { initializeTheme } from "./lib/theme";
import "./styles.css";

void enableAnalytics();
initializeTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);

function dismissBootLoader() {
  const loader = document.getElementById("boot-loader");
  if (!loader) {
    return;
  }

  loader.classList.add("boot-loader-hidden");
  window.setTimeout(() => {
    loader.remove();
  }, 280);
}

window.requestAnimationFrame(() => {
  window.requestAnimationFrame(() => {
    dismissBootLoader();
  });
});
