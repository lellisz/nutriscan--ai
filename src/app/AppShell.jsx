import React from "react";
import { Router } from "./router";
import { AppProviders } from "./providers";
import ErrorBoundary from "../components/feedback/ErrorBoundary";

const DESIGN_TOKENS = {
  bg: "#F2F2F7",
  surface: "#FFFFFF",
  surface2: "#F7F7FA",
  border: "#E5E5EA",
  text: "#1C1C1E",
  text2: "#636366",
  text3: "#AEAEB2",
  green: "#34C759",
  blue: "#007AFF",
  orange: "#FF9500",
  red: "#FF3B30",
  teal: "#32ADE6",
  purple: "#AF52DE",
  indigo: "#5856D6",
  shadow: "0 2px 24px rgba(0,0,0,0.07)",
  shadowMd: "0 4px 40px rgba(0,0,0,0.10)",
  r: "18px",
  rSm: "12px",
};

const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
* { 
  box-sizing: border-box; 
  -webkit-tap-highlight-color: transparent; 
}
html, body, #root {
  margin: 0;
  padding: 0;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: ${DESIGN_TOKENS.bg};
  color: ${DESIGN_TOKENS.text};
}
input, select, textarea { 
  font-family: inherit; 
  outline: none; 
}
button { 
  cursor: pointer; 
  font-family: inherit; 
  border: none; 
}
::-webkit-scrollbar { width: 0; height: 0; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes scaleIn { from { opacity: 0; transform: scale(.94) } to { opacity: 1; transform: scale(1) } }
@keyframes spin { to { transform: rotate(360deg) } }
.fu { animation: fadeUp .38s cubic-bezier(.4,0,.2,1) both; }
.fi { animation: fadeIn .3s ease both; }
.si { animation: scaleIn .32s cubic-bezier(.4,0,.2,1) both; }
`;

export function AppShell() {
  return (
    <>
      <style>{globalStyles}</style>
      <ErrorBoundary>
        <AppProviders>
          <Router />
        </AppProviders>
      </ErrorBoundary>
    </>
  );
}

export default AppShell;
