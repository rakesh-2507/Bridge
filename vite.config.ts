
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 5000,
    strictPort: true,

    proxy: {
      "/api": {
        target: "https://bridge.sidpz.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});