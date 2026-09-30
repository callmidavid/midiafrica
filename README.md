# Midi Africa — full-stack e-commerce (prod)

TanStack Start (SSR + server functions) · Neon Postgres + Drizzle · better-auth
(email/password + Google, `admin`/`customer` roles) · Bachs payments (NGN settle).

## 1. Env

```bash
cp .env.example .env
```

Fill in `.env` (never committed — gitignored):

| Key | What |
|---|---|
| `DATABASE_URL` | Neon Postgres connection (project `midiafrica` already created) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` / `PUBLIC_SITE_URL` | Public origin, e.g. `https://midiafrica.com` (auth + Bachs redirect URLs) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional — Google login appears when both are set |
| `ADMIN_EMAIL` | Your email — sign up, then promote (below) |
| `BACHS_SANDBOX` / `BACHS_API_KEY` | `true` + `sk_sandbox_…` to test; `false` + `sk_live_…` to go live |
| `BACHS_WEBHOOK_SECRET` | From Bachs dashboard webhook endpoint |
| `FX_RATE_NGN_PER_USD`, `SHIPPING_*`, `FREE_SHIPPING_ABOVE_NGN` | Pricing defaults (also editable in Admin → Settings) |

## 2. Database

```bash
npm run db:generate   # create migration from schema (drizzle/)
npm run db:migrate    # apply (or apply drizzle/*.sql via Neon SQL editor)
npm run db:seed       # 8 products + WELCOME10 coupon + shipping/FX config
```

Schema: `src/db/schema.ts` — better-auth tables (`user` incl. `role`,
`session`, `account`, `verification`) + `products`, `orders`, `coupons`,
`settings` (KV), `webhook_events` (idempotency).

## 3. Make yourself admin

```bash
# 1. sign up at /signup with ADMIN_EMAIL
ADMIN_EMAIL=you@example.com npm run admin:promote
```

Then `/admin/login` → full panel (role-guarded client + server: `requireAdmin`).

## 4. Run

```bash
npm run dev          # dev server
npm run build        # prod build (Nitro; node-server locally, Cloudflare on Lovable)
node --env-file=.env .output/server/index.mjs   # serve local prod build
```

## 5. Payments (Bachs)

- Checkout (`/checkout`) calls server fn `createCheckout` (`src/fns/shop.ts`):
  re-prices the cart from Postgres, validates coupon/stock, creates the
  `orders` row, then `POST /v1/checkout-sessions` with the secret key
  (key never touches the browser). Money = decimal strings (`"75000.00"`).
- Shopper pays in the Bachs overlay (`@bachs/js`, stays on-site).
- Webhook `POST /api/webhooks/bachs` verifies `X-Bachs-Signature-V2`
  (HMAC-SHA256), dedupes via `webhook_events`, and on
  `collection.succeeded` marks the order `paid` + decrements stock.
  Register the URL in the Bachs dashboard with events:
  `collection.*`, `checkout.expired`, `refund.*`.
- Admin → Orders → one-click `Refund via Bachs` (server-side, uses payment id
  stored by the webhook).

## 6. Auth & roles

- better-auth, Drizzle adapter, sessions in Postgres (`src/lib/auth.ts` lazy init).
- `/login`, `/signup` (email + Google when configured), `/account`
  (my orders + guest lookup), header shows account/admin link by role.
- Admin routes render a 403 page for non-admins; every admin server fn
  enforces `requireAdmin` (403) independently of the UI.

## Notes

- `src/db/` + `src/lib/auth.ts` are server-only (import-protection enforced);
  server functions live in `src/fns/` (NOT `src/server/`, which the client
  bundler blocks).
- `src/db/client.ts` retries network-level Neon failures (cold-start friendly).
- Product images: bundled legacy assets resolve via `src/lib/local-images.ts`;
  admin uploads should be full URLs (plug in Cloudinary/S3 when ready).
