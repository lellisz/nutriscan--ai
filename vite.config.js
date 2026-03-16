import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

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
  },
});
