// Bachs payments — BROWSER-SAFE surface only (overlay opener).
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
  // Sandbox sessions live on sandbox-checkout.bachs.io, live on checkout.bachs.io.
  // The SDK origin-locks to its baseUrl, so point it at the session's own origin.
  const baseUrl = new URL(checkoutUrl).origin;
  Bachs.Initialize({ baseUrl, onEvent: (e: any) => onEvent?.(e) });
  await Bachs.Checkout.open({ checkoutUrl });
}
