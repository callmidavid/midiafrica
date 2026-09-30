// Server-only email via Senviok (https://www.senviok.live/docs).
// Never throws — email must not break checkout/webhook fulfillment.
import { Senviok } from "senviok";
import type { OrderItemJson } from "@/db/schema";

let _client: Senviok | null = null;
function client(): Senviok | null {
  const key = process.env.SENVIOK_API_KEY;
  if (!key) return null;
  if (!_client) _client = new Senviok(key);
  return _client;
}

function sender(): { from: string; fromName?: string } {
  const raw = process.env.EMAIL_FROM ?? "Midi Africa <orders@midiafrica.xyz>";
  const m = raw.match(/^(.*)<([^>]+)>\s*$/);
  if (m) return { from: m[2].trim(), fromName: m[1].trim() || undefined };
  return { from: raw.trim() };
}

export type ReceiptOrder = {
  id: string;
  customerName: string;
  customerEmail: string;
  items: OrderItemJson[];
  subtotalNgn: number;
  shippingNgn: number;
  discountNgn: number;
  totalNgn: number;
  address: string;
  city: string;
};

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

export async function sendOrderReceipt(order: ReceiptOrder): Promise<string | null> {
  const svc = client();
  if (!svc) {
    console.warn("[email] SENVIOK_API_KEY not set — skipping receipt for", order.id);
    return null;
  }
  const { from, fromName } = sender();
  const rows = order.items
    .map((it) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${it.name} · Size ${it.size} × ${it.qty}</td><td style="text-align:right;padding:8px 0;border-bottom:1px solid #eee">${naira(it.unitNGN * it.qty)}</td></tr>`)
    .join("");
  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <p style="letter-spacing:.2em;font-size:12px;color:#888">MIDI AFRICA</p>
      <h1 style="font-weight:400">Thank you, ${order.customerName.split(" ")[0] ?? "there"}.</h1>
      <p>Your payment is confirmed. Your pieces are being prepared at our Lagos atelier and dispatch within 48 hours.</p>
      <p style="font-size:12px;color:#888">Order ${order.id}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}</table>
      <p>Subtotal: ${naira(order.subtotalNgn)}${order.discountNgn ? `<br/>Discount: −${naira(order.discountNgn)}` : ""}<br/>Shipping: ${order.shippingNgn === 0 ? "Free" : naira(order.shippingNgn)}<br/><strong>Total paid: ${naira(order.totalNgn)}</strong></p>
      <p style="color:#666">Delivering to: ${order.address}, ${order.city}</p>
      <p style="font-size:12px;color:#888">Track your order anytime in your account. Reply to this email for help.</p>
    </div>`;
  try {
    const { id } = await svc.emails.send({
      from,
      fromName: fromName ?? "Midi Africa",
      to: order.customerEmail,
      subject: `Order confirmed — ${order.id} · Midi Africa`,
      html,
      text: `Thank you ${order.customerName}! Order ${order.id} confirmed. Total paid: ${naira(order.totalNgn)}. Dispatch within 48 hours.`,
    });
    console.log("[email] receipt sent", id, "for", order.id);
    return id ?? null;
  } catch (e) {
    console.error("[email] receipt failed for", order.id, e);
    return null;
  }
}
