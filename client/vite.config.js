import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5051",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5051",
        changeOrigin: true,
      },
    },
  },
});
