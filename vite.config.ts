import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    sourcemap: false,
    outDir: "out",
    emptyOutDir: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react":    ["react", "react-dom", "react-router-dom"],
          "vendor-i18n":     ["i18next", "react-i18next", "i18next-browser-languagedetector"],
          "vendor-firebase": ["firebase/app", "firebase/auth"],
        },
      },
    },
  },
  resolve: { alias: { "@": resolve(__dirname, "./src") } },
  server: { port: 3000, host: "0.0.0.0" },
});
