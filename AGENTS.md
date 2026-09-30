# AGENTS.md

Production notes for coding agents working in this repo:

- Stack: TanStack Start (SSR + server functions via Nitro) · Neon Postgres +
  Drizzle · better-auth · Bachs payments · Senviok email.
- Never commit secrets. `.env` is gitignored; `.env.example` is the template.
- Server-only code lives in `src/db/`, `src/lib/auth.ts`, `src/lib/session.ts`.
  Server functions live in `src/fns/` (NOT `src/server/` — the client bundler
  blocks that path). Never import server modules from client components.
- Money is always integer NGN in our DB; Bachs wants decimal strings.
- Webhooks (`collection.succeeded`, …) are the source of truth for payment
  state — never trust client redirects. Admins control fulfilment only.
- Deploy target is Vercel (Nitro auto-detects the `vercel` preset).
  Keep the build green: `tsc --noEmit` + `npm run build`.
