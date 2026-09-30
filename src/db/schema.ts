// Drizzle schema — Neon Postgres. better-auth tables + Midi Africa shop tables.
import { pgTable, text, integer, boolean, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";

// ---------- better-auth (email+password + Google) ----------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("customer"), // 'admin' | 'customer'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ---------- Shop ----------
export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  priceNgn: integer("price_ngn").notNull(),
  image: text("image").notNull(),
  hover: text("hover").notNull(),
  fabric: text("fabric").notNull().default(""),
  color: text("color").notNull().default(""),
  sizes: jsonb("sizes").$type<string[]>().notNull().default(["XS", "S", "M", "L", "XL"]),
  stock: integer("stock").notNull().default(0),
  description: text("description").notNull().default(""),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type OrderItemJson = { productId: string; name: string; image: string; size: string; qty: number; unitNGN: number };

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull().default(""),
  address: text("address").notNull().default(""),
  city: text("city").notNull().default(""),
  state: text("state").notNull().default(""),
  country: text("country").notNull().default("Nigeria"),
  notes: text("notes").notNull().default(""),
  items: jsonb("items").$type<OrderItemJson[]>().notNull(),
  subtotalNgn: integer("subtotal_ngn").notNull(),
  shippingNgn: integer("shipping_ngn").notNull(),
  discountNgn: integer("discount_ngn").notNull().default(0),
  totalNgn: integer("total_ngn").notNull(),
  currency: text("currency").notNull().default("NGN"),
  status: text("status").notNull().default("pending"), // draft|pending|paid|failed|fulfilled|delivered|cancelled|refunded
  couponCode: text("coupon_code"),
  bachsCheckoutId: text("bachs_checkout_id"),
  bachsCheckoutUrl: text("bachs_checkout_url"),
  bachsPaymentId: text("bachs_payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const coupons = pgTable("coupons", {
  code: text("code").primaryKey(),
  kind: text("kind").notNull().default("percent"), // percent | fixed
  value: integer("value").notNull(),
  active: boolean("active").notNull().default(true),
  minTotalNgn: integer("min_total_ngn").notNull().default(0),
});

// Webhook idempotency — every Bachs evt_* processed once.
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
});

// Simple KV for store config (fx rate, shipping). Secrets stay in env.
export const settings = pgTable(
  "settings",
  { key: text("key").notNull(), value: text("value").notNull() },
  (t) => [primaryKey({ columns: [t.key] })]
);
