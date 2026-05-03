import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import path from "path";

// https://vitejs.dev/config/
export default ({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, ".."));

  return defineConfig({
    envDir: path.resolve(__dirname, ".."),
    plugins: [react(), basicSsl()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:5051",
          changeOrigin: true,
        },
        "/uploads": {
          target: env.VITE_API_URL || "http://localhost:5051",
          changeOrigin: true,
        },
      },
    },
  });
}
