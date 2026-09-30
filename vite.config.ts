import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Full server build (SSR + server functions + API routes).
// Nitro preset: NITRO_PRESET env wins; otherwise auto-detect
// (Vercel → vercel, local → node-server default).
export default defineConfig({
  plugins: [tailwindcss(), tanstackStart(), viteReact()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 8080,
    strictPort: true,
  },
});
