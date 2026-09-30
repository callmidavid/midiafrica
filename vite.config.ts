// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// PROD: full server build (SSR + server functions + API routes for
// /api/auth/*, /api/webhooks/bachs). Nitro auto-targets the deploy platform
// (Cloudflare on Lovable, Vercel/Netlify/self-hosted elsewhere).
export default defineConfig({
  // Local/self-hosted runs use the node server. Inside a Lovable build the
  // preset is forced to Cloudflare regardless of this setting.
  nitro: { preset: "node-server" },
  tanstackStart: {
    spa: {
      enabled: false,
    },
  },
  // Pass the server settings down to Vite safely here
  vite: {
    server: {
      allowedHosts: ["kathaleen-moldy-citizenly.ngrok-free.dev"],
    },
  },
});
