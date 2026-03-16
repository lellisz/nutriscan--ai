 
import React from "react";
import ReactDOM from "react-dom/client";
import AppShell from "./app/AppShell.jsx";
import { initSentry } from "./lib/sentry";

// Initialize Sentry error tracking
initSentry();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>,
);