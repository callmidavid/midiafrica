// Bachs payments — BROWSER-SAFE surface only (overlay opener + webhook verify).
// Secret-key calls (create checkout, refunds) live server-side in src/fns/shop.ts
// and src/routes/api.webhooks.bachs.tsx. Docs: https://docs.bachs.io/introduction
export const BACHS_SANDBOX_URL = "https://sandbox-api.bachs.io";
export const BACHS_LIVE_URL = "https://api.bachs.io";

export function bachsBase(sandbox: boolean): string {
  return sandbox ? BACHS_SANDBOX_URL : BACHS_LIVE_URL;
}

/** Open Bachs overlay (keeps shopper on-site). Dynamically loads @bachs/js. */
export async function openBachsOverlay(checkoutUrl: string, onEvent?: (e: { type: string; data?: any }) => void) {
  const { loadBachs } = await import("@bachs/js");
  const Bachs: any = await loadBachs();
  Bachs.Initialize({ onEvent: (e: any) => onEvent?.(e) });
  await Bachs.Checkout.open({ checkoutUrl });
}

// ---- Server-side webhook verification (use in API route with raw body) ----
// HMAC-SHA256 hex of "{timestamp}.{rawBody}", compare to X-Bachs-Signature(-V2).
export async function verifyBachsSignatureRaw(rawBody: string, timestamp: string, signatureV2OrV1: string, secret: string, toleranceSec = 300): Promise<boolean> {
  try {
    const ts = parseInt(signatureV2OrV1.includes("t=") ? signatureV2OrV1.split(",").find((p) => p.trim().startsWith("t="))!.split("=")[1] : timestamp, 10);
    if (Math.abs(Date.now() / 1000 - ts) > toleranceSec) return false;
    const sigs: string[] = signatureV2OrV1.includes("v1=")
      ? signatureV2OrV1.split(",").filter((p) => p.trim().startsWith("v1=")).map((p) => p.trim().slice(3))
      : [signatureV2OrV1.trim()];
    const msg = `${ts}.${rawBody}`;
    // Node (API route) — use node:crypto when available
    try {
      const { createHmac, timingSafeEqual } = await import("node:crypto");
      const expected = createHmac("sha256", secret).update(msg, "utf8").digest("hex");
      return sigs.some((s) => { try { return timingSafeEqual(Buffer.from(expected), Buffer.from(s)); } catch { return false; } });
    } catch {
      // Browser fallback via WebCrypto
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const buf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
      const expected = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
      return sigs.includes(expected);
    }
  } catch {
    return false;
  }
}
