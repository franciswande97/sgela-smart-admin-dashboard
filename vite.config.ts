import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],

  server: {
    port: 3344,
    allowedHosts: true,
    hmr: {
      //clientPort: 443, // Client-facing port (through tunnel)
      //protocol: 'wss' // Client uses HTTPS → WSS
    },
  },

  resolve: {
    tsconfigPaths: true,
  },
});
