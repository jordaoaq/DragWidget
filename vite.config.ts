import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/n8n-proxy": {
        target: "https://weblinker.vya.digital",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/n8n-proxy/, ""),
      },
    },
  },
});
