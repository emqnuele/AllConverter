import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    // Split large vendor bundles to improve Largest Contentful Paint / TTI
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-motion": ["framer-motion"],
          "vendor-icons": ["lucide-react"],
          "vendor-http": ["axios"],
        },
      },
    },
    // Warn when a chunk exceeds 500 kB (default is 500 kB; set explicitly for clarity)
    chunkSizeWarningLimit: 500,
  },
});
