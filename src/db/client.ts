// Server-only DB client (Neon serverless HTTP — works on Cloudflare/edge + Node).
// Import ONLY from server functions / API routes, never from client components.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Resilience: Neon serverless computes suspend when idle (cold start) and some
// networks drop the first TLS handshake. Retry network-level failures with
// backoff — HTTP 4xx/5xx responses pass through untouched.
let fetchPatched = false;
function patchFetchForNeon() {
  if (fetchPatched) return;
  fetchPatched = true;
  const orig = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = typeof input === "string" ? input : input?.url ?? "";
    if (!url.includes("neon.tech")) return orig(input, init);
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        return await orig(input, init);
      } catch (e) {
        lastErr = e;
        await sleep(400 * 2 ** attempt);
      }
    }
    throw lastErr;
  }) as typeof fetch;
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set — copy .env.example to .env");
  patchFetchForNeon();
  if (!_db) {
    const sql = neon(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}
