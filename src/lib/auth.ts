// Server-only better-auth instance. Import from server functions / API routes only.
// Lazily initialized so a missing env var fails the request — not the whole SSR bundle.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { dash } from "@better-auth/infra"; // 1. Import the infrastructure dashboard plugin
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any = null;

export function getAuth(): Exclude<typeof _auth, null> {
  if (!_auth) {
    const googleId = process.env.GOOGLE_CLIENT_ID;
    const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
    _auth = betterAuth({
      baseURL:
        process.env.BETTER_AUTH_URL || process.env.PUBLIC_SITE_URL || "http://localhost:8080",
      // Browsing origin varies (localhost, LAN IP for phone testing, tunnel
      // URLs that change on restart). Static list + TRUSTED_ORIGINS env.
      trustedOrigins: [
        "http://localhost:8080",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:3000",
        "http://172.20.10.5:8080",
        "https://kathaleen-moldy-citizenly.ngrok-free.dev",
        "*.ngrok-free.dev",
        "*.ngrok.io",
        ...((process.env.TRUSTED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)),
      ],
      secret: process.env.BETTER_AUTH_SECRET,
      database: drizzleAdapter(getDb(), {
        provider: "pg",
        schema: {
          user: schema.user,
          session: schema.session,
          account: schema.account,
          verification: schema.verification,
        },
      }),
      emailAndPassword: { enabled: true, minPasswordLength: 8 },
      ...(googleId && googleSecret
        ? { socialProviders: { google: { clientId: googleId, clientSecret: googleSecret } } }
        : {}),
      user: {
        additionalFields: { role: { type: "string", defaultValue: "customer", required: false } },
      },
      session: { cookieCache: { enabled: true, maxAge: 60 * 60 * 24 * 7 } },

      // 2. Register the dashboard plugin here
      plugins: [
        dash({
          apiKey: process.env.BETTER_AUTH_API_KEY,
        }),
      ],
    });
  }
  return _auth;
}

export type AuthSession = {
  user: { id: string; email: string; name: string; role?: string };
};
