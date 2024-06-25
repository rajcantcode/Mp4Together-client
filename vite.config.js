import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { visualizer } from "rollup-plugin-visualizer";
import { dependencies } from "./package.json";

function renderChunks(deps) {
  let chunks = {};
  Object.keys(deps).forEach((key) => {
    if (
      [
        "react",
        "react-router-dom",
        "react-dom",
        "@chatscope/chat-ui-kit-styles",
        "axios",
      ].includes(key)
    )
      return;
    chunks[key] = [key];
  });
  return chunks;
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true, filename: "bundle-analysis.html" }),
  ],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-router-dom", "react-dom", "axios"],
          ...renderChunks(dependencies),
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
