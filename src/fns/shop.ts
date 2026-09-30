// Server functions — the ONLY place secrets + DB are touched.
// Prices are always re-read from Postgres; the client cart is never trusted.
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, desc, and, lt, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { products, orders, coupons, settings as settingsTable, webhookEvents, checkoutProfiles } from "@/db/schema";
import { getSessionUser, requireAdmin } from "@/lib/session";
import { toDecimalString, ngnToUsd } from "@/lib/currency";
import { sendOrderReceipt } from "./email";

// ---------- helpers (server) ----------
function bachsBase() {
  return process.env.BACHS_SANDBOX === "false" ? "https://api.bachs.io" : "https://sandbox-api.bachs.io";
}

async function getSetting(key: string, fallback: string): Promise<string> {
  try {
    const rows = await getDb().select().from(settingsTable).where(eq(settingsTable.key, key));
    return rows[0]?.value ?? fallback;
  } catch {
    return fallback;
  }
}

async function storeConfig() {
  const [fx, lagos, nationwide, global, freeAbove] = await Promise.all([
    getSetting("fx_rate", process.env.FX_RATE_NGN_PER_USD ?? "1500"),
    getSetting("shipping_lagos", process.env.SHIPPING_LAGOS_NGN ?? "5000"),
    getSetting("shipping_nationwide", process.env.SHIPPING_NATIONWIDE_NGN ?? "12000"),
    getSetting("shipping_global", process.env.SHIPPING_GLOBAL_NGN ?? "45000"),
    getSetting("free_above", process.env.FREE_SHIPPING_ABOVE_NGN ?? "500000"),
  ]);
  return { fx: Number(fx), lagos: Number(lagos), nationwide: Number(nationwide), global: Number(global), freeAbove: Number(freeAbove) };
}

// ---------- Products (public) ----------
export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const db = getDb();
  return db.select().from(products).where(eq(products.published, true));
});

export const adminListProducts = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin(getRequest());
  const db = getDb();
  return db.select().from(products);
});

export type ProductInput = {
  id?: string; name: string; category: string; priceNGN: number;
  image: string; hover: string; fabric: string; color: string;
  sizes: string[]; stock: number; description: string; featured: boolean; published: boolean;
};

export const upsertProduct = createServerFn({ method: "POST" }).validator((d: any) => d).handler(
  async ({ data }: { data: ProductInput }) => {
  await requireAdmin(getRequest());
  const db = getDb();
  const id = data.id || `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
  const row = {
    id,
    name: data.name, category: data.category, priceNgn: Math.round(Number(data.priceNGN)),
    image: data.image || "/placeholder.jpg", hover: data.hover || data.image || "/placeholder.jpg",
    fabric: data.fabric ?? "", color: data.color ?? "", sizes: data.sizes?.length ? data.sizes : ["XS", "S", "M", "L", "XL"],
    stock: Math.max(0, Math.round(Number(data.stock))), description: data.description ?? "",
    featured: !!data.featured, published: data.published !== false, updatedAt: new Date(),
  };
  const existing = await db.select().from(products).where(eq(products.id, id));
  if (existing.length) await db.update(products).set(row).where(eq(products.id, id));
  else await db.insert(products).values(row);
  return { id };
});

export const deleteProduct = createServerFn({ method: "POST" }).validator((d: any) => d).handler(
  async ({ data }: { data: { id: string } }) => {
  await requireAdmin(getRequest());
  await getDb().delete(products).where(eq(products.id, data.id));
  return { ok: true };
});

// ---------- Cursor pagination (keyset on createdAt desc, id desc) ----------
const PAGE_SIZE = 20;

function parseCursor(cursor: string | null | undefined): { time: Date; id: string } | null {
  if (!cursor) return null;
  const sep = cursor.lastIndexOf("|");
  if (sep < 0) return null;
  const time = new Date(cursor.slice(0, sep));
  const id = cursor.slice(sep + 1);
  if (Number.isNaN(time.getTime()) || !id) return null;
  return { time, id };
}

export const pageProducts = createServerFn({ method: "GET" }).validator((d: any) => d).handler(
  async ({ data }: { data: { cursor?: string | null; limit?: number } }) => {
    await requireAdmin(getRequest());
    const limit = Math.min(Math.max(data.limit ?? PAGE_SIZE, 1), 50);
    const c = parseCursor(data.cursor);
    const rows = await getDb()
      .select()
      .from(products)
      .where(c ? or(lt(products.createdAt, c.time), and(eq(products.createdAt, c.time), lt(products.id, c.id))) : undefined)
      .orderBy(desc(products.createdAt), desc(products.id))
      .limit(limit + 1);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    return { items, nextCursor: hasMore && last ? `${new Date(last.createdAt).toISOString()}|${last.id}` : null };
  }
);

export const pageOrders = createServerFn({ method: "GET" }).validator((d: any) => d).handler(
  async ({ data }: { data: { cursor?: string | null; limit?: number; status?: string | null } }) => {
    await requireAdmin(getRequest());
    const limit = Math.min(Math.max(data.limit ?? PAGE_SIZE, 1), 50);
    const c = parseCursor(data.cursor);
    const cursorCond = c ? or(lt(orders.createdAt, c.time), and(eq(orders.createdAt, c.time), lt(orders.id, c.id))) : undefined;
    const statusCond = data.status && data.status !== "all" ? eq(orders.status, data.status) : undefined;
    const rows = await getDb()
      .select()
      .from(orders)
      .where(cursorCond && statusCond ? and(cursorCond, statusCond) : (cursorCond ?? statusCond))
      .orderBy(desc(orders.createdAt), desc(orders.id))
      .limit(limit + 1);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    return { items, nextCursor: hasMore && last ? `${new Date(last.createdAt).toISOString()}|${last.id}` : null };
  }
);

// Lean order rows for the customers aggregate (no heavy items JSON).
export const listOrdersLean = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin(getRequest());
  return getDb().select({
    id: orders.id,
    userId: orders.userId,
    customerName: orders.customerName,
    customerEmail: orders.customerEmail,
    totalNgn: orders.totalNgn,
    status: orders.status,
    createdAt: orders.createdAt,
  }).from(orders).orderBy(desc(orders.createdAt));
});

// ---------- Saved checkout profile (per account; guests use localStorage) ----------
export const getMyProfile = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getSessionUser(getRequest());
  if (!user) return null;
  const rows = await getDb().select().from(checkoutProfiles).where(eq(checkoutProfiles.userId, user.id));
  return rows[0] ?? null;
});

export const saveMyProfile = createServerFn({ method: "POST" }).validator((d: any) => d).handler(
  async ({ data }: { data: { name: string; phone: string; address: string; city: string; state: string; country: string } }) => {
    const user = await getSessionUser(getRequest());
    if (!user) throw new Response("Sign in to save details", { status: 401 });
    const db = getDb();
    const row = {
      userId: user.id,
      name: data.name ?? "", phone: data.phone ?? "", address: data.address ?? "",
      city: data.city ?? "", state: data.state ?? "", country: data.country || "Nigeria",
      updatedAt: new Date(),
    };
    const existing = await db.select().from(checkoutProfiles).where(eq(checkoutProfiles.userId, user.id));
    if (existing.length) await db.update(checkoutProfiles).set(row).where(eq(checkoutProfiles.userId, user.id));
    else await db.insert(checkoutProfiles).values(row);
    return { ok: true };
  }
);

// ---------- Coupons ----------
export const listCoupons = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin(getRequest());
  return getDb().select().from(coupons);
});

export const upsertCoupon = createServerFn({ method: "POST" }).validator((d: any) => d).handler(
  async ({ data }: { data: { code: string; kind: string; value: number; active: boolean; minTotalNgn: number } }) => {
    await requireAdmin(getRequest());
    const db = getDb();
    const code = data.code.trim().toUpperCase();
    const existing = await db.select().from(coupons).where(eq(coupons.code, code));
    if (existing.length) await db.update(coupons).set({ ...data, code }).where(eq(coupons.code, code));
    else await db.insert(coupons).values({ ...data, code });
    return { code };
  }
);

export const deleteCoupon = createServerFn({ method: "POST" }).validator((d: any) => d).handler(
  async ({ data }: { data: { code: string } }) => {
  await requireAdmin(getRequest());
  await getDb().delete(coupons).where(eq(coupons.code, data.code));
  return { ok: true };
});

// ---------- Checkout (secret key NEVER leaves server) ----------
export type CheckoutItem = { productId: string; size: string; qty: number };
export type CheckoutCustomer = { name: string; email: string; phone: string; address: string; city: string; state: string; country: string; notes: string };

export const createCheckout = createServerFn({ method: "POST" }).validator((d: any) => d).handler(
  async ({ data }: { data: { items: CheckoutItem[]; customer: CheckoutCustomer; zone: "lagos" | "nationwide" | "global"; couponCode: string | null } }) => {
    const req = getRequest();
    const user = await getSessionUser(req).catch(() => null);
    const db = getDb();
    const cfg = await storeConfig();

    if (!data.items.length) throw new Error("Bag is empty");
    if (!data.customer.name || !data.customer.email || !data.customer.address) throw new Error("Name, email and address are required");

    // Re-price from DB
    const lines: { productId: string; name: string; image: string; size: string; qty: number; unitNGN: number }[] = [];
    for (const it of data.items) {
      const rows = await db.select().from(products).where(eq(products.id, it.productId));
      const p = rows[0];
      if (!p || !p.published) throw new Error(`Product unavailable: ${it.productId}`);
      const qty = Math.max(1, Math.min(99, Math.floor(it.qty)));
      if (p.stock < qty) throw new Error(`Only ${p.stock} left of ${p.name}`);
      lines.push({ productId: p.id, name: p.name, image: p.image, size: it.size, qty, unitNGN: p.priceNgn });
    }
    const subtotal = lines.reduce((s, l) => s + l.unitNGN * l.qty, 0);
    let discount = 0;
    let couponCode: string | null = null;
    if (data.couponCode) {
      const found = await db.select().from(coupons).where(eq(coupons.code, data.couponCode.trim().toUpperCase()));
      const c = found[0];
      if (c?.active && subtotal >= c.minTotalNgn) {
        discount = c.kind === "percent" ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);
        couponCode = c.code;
      }
    }
    const shipBase = data.zone === "lagos" ? cfg.lagos : data.zone === "nationwide" ? cfg.nationwide : cfg.global;
    const shipping = subtotal - discount >= cfg.freeAbove || subtotal === 0 ? 0 : shipBase;
    const total = Math.max(0, subtotal - discount + shipping);

    const key = process.env.BACHS_API_KEY;
    if (!key || key.includes("replace-me")) throw new Error("Payments not configured yet (BACHS_API_KEY missing on server)");

    const orderId = `order_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
    await db.insert(orders).values({
      id: orderId,
      userId: user?.id ?? null,
      customerName: data.customer.name, customerEmail: data.customer.email, customerPhone: data.customer.phone,
      address: data.customer.address, city: data.customer.city, state: data.customer.state, country: data.customer.country || "Nigeria", notes: data.customer.notes || "",
      items: lines, subtotalNgn: subtotal, shippingNgn: shipping, discountNgn: discount, totalNgn: total,
      currency: "NGN", status: "pending", couponCode,
    });

    // Remember details for next checkout (signed-in shoppers)
    if (user?.id) {
      const profile = {
        userId: user.id, name: data.customer.name, phone: data.customer.phone,
        address: data.customer.address, city: data.customer.city,
        state: data.customer.state, country: data.customer.country || "Nigeria", updatedAt: new Date(),
      };
      const existing = await db.select().from(checkoutProfiles).where(eq(checkoutProfiles.userId, user.id));
      if (existing.length) await db.update(checkoutProfiles).set(profile).where(eq(checkoutProfiles.userId, user.id));
      else await db.insert(checkoutProfiles).values(profile);
    }

    const origin = (process.env.PUBLIC_SITE_URL ?? "").replace(/\/$/, "") || new URL(req.url).origin;
    // Bachs rejects non-public redirect URLs (localhost). They're optional and
    // only used by the hosted-page flow — the overlay doesn't need them.
    const isPublicOrigin = !/localhost|127\.0\.0\.1|\.local|\.test/.test(origin);
    const res = await fetch(`${bachsBase()}/v1/checkout-sessions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        pricing: { currency: "NGN", amount: toDecimalString(total), currency_options: { USD: toDecimalString(ngnToUsd(total, cfg.fx)) } },
        customer: { email: data.customer.email, name: data.customer.name },
        reference: orderId,
        metadata: { order_id: orderId },
        ...(isPublicOrigin
          ? {
              success_url: `${origin}/order/${orderId}`,
              cancel_url: `${origin}/checkout?cancelled=${orderId}`,
            }
          : {}),
        customer_creation: "always",
        expires_in_minutes: 60,
      }),
    });
    if (!res.ok) {
      await db.update(orders).set({ status: "failed" }).where(eq(orders.id, orderId));
      throw new Error(`Bachs error (${res.status}): ${(await res.text()).slice(0, 200)}`);
    }
    const chk = (await res.json()) as { checkout_id: string; checkout_url: string };
    await db.update(orders).set({ bachsCheckoutId: chk.checkout_id, bachsCheckoutUrl: chk.checkout_url }).where(eq(orders.id, orderId));
    return { orderId, checkoutUrl: chk.checkout_url, checkoutId: chk.checkout_id, totalNGN: total };
  }
);

// ---------- Orders ----------
export const getOrder = createServerFn({ method: "GET" }).validator((d: any) => d).handler(
  async ({ data }: { data: { id: string } }) => {
  const req = getRequest();
  const user = await getSessionUser(req).catch(() => null);
  const rows = await getDb().select().from(orders).where(eq(orders.id, data.id));
  const o = rows[0];
  if (!o) throw new Error("Order not found");
  const isAdmin = (user as { role?: string } | null)?.role === "admin";
  if (!isAdmin && o.userId && o.userId !== user?.id) throw new Response("Forbidden", { status: 403 });
  return o; // guest orders: id is unguessable; owner-only via link
});

export const myOrders = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getSessionUser(getRequest());
  if (!user) return [];
  return getDb().select().from(orders).where(eq(orders.userId, user.id));
});

export const adminListOrders = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin(getRequest());
  return getDb().select().from(orders).orderBy(desc(orders.createdAt));
});

export const setOrderStatus = createServerFn({ method: "POST" }).validator((d: any) => d).handler(
  async ({ data }: { data: { id: string; status: string } }) => {
    await requireAdmin(getRequest());
    // Payment states (pending/paid/failed) are webhook-only — admins drive fulfilment.
    const allowed = ["processing", "in_transit", "delivered", "cancelled", "refunded"];
    if (!allowed.includes(data.status)) throw new Error(`Status is automatic — admins can only set: ${allowed.join(", ")}`);
    await getDb().update(orders).set({ status: data.status, updatedAt: new Date() }).where(eq(orders.id, data.id));
    return { ok: true };
  }
);

export const refundOrder = createServerFn({ method: "POST" }).validator((d: any) => d).handler(
  async ({ data }: { data: { id: string } }) => {
    await requireAdmin(getRequest());
    const db = getDb();
    const rows = await db.select().from(orders).where(eq(orders.id, data.id));
    const o = rows[0];
    if (!o) throw new Error("Order not found");
    const key = process.env.BACHS_API_KEY;
    if (!key || key.includes("replace-me")) throw new Error("BACHS_API_KEY missing on server");
    const paymentId = o.bachsPaymentId;
    if (!paymentId) throw new Error("No Bachs payment id on this order yet — refund from the Bachs dashboard");
    const res = await fetch(`${bachsBase()}/v1/refunds`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: paymentId }),
    });
    if (!res.ok) throw new Error(`Bachs refund failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    await db.update(orders).set({ status: "refunded", updatedAt: new Date() }).where(eq(orders.id, data.id));
    return { ok: true };
  }
);

export const getStoreConfig = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin(getRequest());
  const cfg = await storeConfig();
  return { ...cfg, bachsSandbox: process.env.BACHS_SANDBOX !== "false", bachsKeySet: !!process.env.BACHS_API_KEY && !process.env.BACHS_API_KEY.includes("replace-me") };
});

export const saveStoreConfig = createServerFn({ method: "POST" }).validator((d: any) => d).handler(
  async ({ data }: { data: Record<string, string> }) => {
    await requireAdmin(getRequest());
    const db = getDb();
    for (const [key, value] of Object.entries(data)) {
      const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
      if (existing.length) await db.update(settingsTable).set({ value }).where(eq(settingsTable.key, key));
      else await db.insert(settingsTable).values({ key, value });
    }
    return { ok: true };
  }
);

// ---------- Webhook processor (called by the webhook API route) ----------
export async function processBachsEvent(evt: { id: string; type: string; data: any }): Promise<string> {
  const db = getDb();
  const seen = await db.select().from(webhookEvents).where(eq(webhookEvents.id, evt.id));
  if (seen.length) return "duplicate";
  await db.insert(webhookEvents).values({ id: evt.id, type: evt.type });

  // Bachs sends reference + metadata on collection events; resolve order id:
  const orderId: string | undefined = evt.data?.metadata?.order_id ?? evt.data?.reference ?? undefined;

  switch (evt.type) {
    case "collection.succeeded": {
      if (orderId) {
        const rows = await db.select().from(orders).where(eq(orders.id, orderId));
        if (rows[0] && rows[0].status !== "paid") {
          // decrement stock once
          for (const it of rows[0].items) {
            const prow = await db.select().from(products).where(eq(products.id, it.productId));
            if (prow[0]) await db.update(products).set({ stock: Math.max(0, prow[0].stock - it.qty) }).where(eq(products.id, it.productId));
          }
          await db.update(orders).set({ status: "paid", bachsPaymentId: evt.data?.charge_id ?? null, updatedAt: new Date() }).where(eq(orders.id, orderId));
          // Receipt (never throws; failures only log)
          const paid = (await db.select().from(orders).where(eq(orders.id, orderId)))[0];
          if (paid) {
            await sendOrderReceipt({
              id: paid.id, customerName: paid.customerName, customerEmail: paid.customerEmail,
              items: paid.items, subtotalNgn: paid.subtotalNgn, shippingNgn: paid.shippingNgn,
              discountNgn: paid.discountNgn, totalNgn: paid.totalNgn, address: paid.address, city: paid.city,
            });
          }
        }
      }
      return "paid";
    }
    case "collection.failed":
    case "collection.underpaid":
    case "checkout.expired": {
      if (orderId) await db.update(orders).set({ status: "failed", updatedAt: new Date() }).where(eq(orders.id, orderId));
      return "failed";
    }
    case "refund.paid": {
      // refund payload carries original charge; find by payment id
      const pid = evt.data?.payment_id ?? evt.data?.charge_id;
      if (pid) {
        const all = await db.select().from(orders);
        const match = all.find((o) => o.bachsPaymentId === pid);
        if (match) await db.update(orders).set({ status: "refunded", updatedAt: new Date() }).where(eq(orders.id, match.id));
      }
      return "refunded";
    }
    default:
      return `ignored:${evt.type}`;
  }
}
