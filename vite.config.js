import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { config } from "dotenv";

// Lê as mesmas env vars que o dev-server.js para garantir porta consistente
config({ path: ".env" });
config({ path: ".env.local", override: true });
config({ path: ".env.claude", override: true });

const API_PORT = process.env.API_DEV_PORT || 3002;

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: false,
      filename: "dist/stats.html",
      title: "NutriScan Bundle Analysis",
    }),
  ],
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
      },
    },
  },
});
