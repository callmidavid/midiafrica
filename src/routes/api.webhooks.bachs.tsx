import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { processBachsEvent } from "@/fns/shop";

// POST /api/webhooks/bachs — Bachs event receiver (server-only).
// Register this URL in the Bachs dashboard with events:
// collection.succeeded, collection.failed, collection.underpaid,
// checkout.expired, refund.paid, refund.failed.
function verify(rawBody: string, headerV2: string, secret: string, toleranceSec = 300): boolean {
  try {
    const parts = headerV2.split(",").map((p) => p.trim());
    const t = parts.find((p) => p.startsWith("t="))?.slice(2) ?? "";
    const ts = parseInt(t, 10);
    if (!t || Number.isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > toleranceSec) return false;
    const sigs = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
    if (!sigs.length) return false;
    const expected = createHmac("sha256", secret).update(`${ts}.${rawBody}`, "utf8").digest("hex");
    return sigs.some((s) => {
      try {
        return timingSafeEqual(Buffer.from(expected), Buffer.from(s));
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/webhooks/bachs")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const secret = process.env.BACHS_WEBHOOK_SECRET;
        if (!secret) return new Response("webhook secret not configured", { status: 500 });
        const raw = await request.text();
        const sig = request.headers.get("x-bachs-signature-v2") ?? request.headers.get("x-bachs-signature") ?? "";
        if (!sig || !verify(raw, sig.includes("v1=") ? sig : `t=${request.headers.get("x-bachs-timestamp") ?? ""},v1=${sig}`, secret)) {
          return new Response("bad signature", { status: 401 });
        }
        let evt: { id: string; type: string; data: any };
        try {
          evt = JSON.parse(raw);
        } catch {
          return new Response("bad json", { status: 400 });
        }
        try {
          const result = await processBachsEvent(evt);
          return Response.json({ received: true, result });
        } catch (e) {
          console.error("[bachs-webhook]", e);
          return new Response("processor error", { status: 500 });
        }
      },
    },
  },
});
