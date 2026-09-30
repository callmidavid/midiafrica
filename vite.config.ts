import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Full server build (SSR + server functions + API routes).
// Nitro preset: NITRO_PRESET wins; Vercel builds → "vercel" (.vercel/output);
// local → "node-server" (.output, run with node --env-file=.env).
export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({
      preset:
        process.env.NITRO_PRESET ??
        (process.env.VERCEL ? "vercel" : "node-server"),
      compatibilityDate: "2026-09-30",
    }),
    viteReact(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 8080,
    strictPort: true,
  },
});
