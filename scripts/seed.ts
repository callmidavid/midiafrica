// Seed Neon with catalog + coupon + store config. Run: bun ./scripts/seed.ts
// Needs DATABASE_URL in env (bun auto-loads .env).
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { products, coupons, settings } from "../src/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const seedProducts = [
  { id: "sahel-slip", name: "Sahel Silk Slip Dress", category: "Women", usd: 780, fabric: "100% Mulberry Silk", color: "Ivory" },
  { id: "kano-kaftan", name: "Kano Emerald Kaftan", category: "Women", usd: 1240, fabric: "Silk Jacquard", color: "Emerald" },
  { id: "harmattan-coat", name: "Harmattan Wool Coat", category: "Outerwear", usd: 1980, fabric: "Italian Wool", color: "Burgundy" },
  { id: "sable-jumpsuit", name: "Sable Linen Jumpsuit", category: "Women", usd: 620, fabric: "Belgian Linen", color: "Sand" },
  { id: "atelier-suit", name: "Atelier Tailored Suit", category: "Men", usd: 2450, fabric: "Wool & Silk", color: "Cognac" },
  { id: "onyx-tote", name: "Onyx Leather Tote", category: "Accessories", usd: 890, fabric: "Full-grain Leather", color: "Terracotta" },
  { id: "aisha-bridal", name: "Aisha Bridal Gown", category: "Bridal", usd: 4200, fabric: "Silk & Gold Thread", color: "Ivory" },
  { id: "obelisk-blazer", name: "Obelisk Cream Blazer", category: "Women", usd: 1100, fabric: "Wool Crepe", color: "Cream" },
];

const FX = Number(process.env.FX_RATE_NGN_PER_USD ?? 1500);

for (let i = 0; i < seedProducts.length; i++) {
  const p = seedProducts[i];
  await db.insert(products).values({
    id: p.id,
    name: p.name,
    category: p.category,
    priceNgn: Math.round(p.usd * FX),
    image: `/assets/${p.id}.jpg`,
    hover: `/assets/${p.id}.jpg`,
    fabric: p.fabric,
    color: p.color,
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: 10 + ((i * 7) % 20),
    description: `A quiet study in proportion and fabric. Cut in ${p.fabric.toLowerCase()}, finished by hand at our Lagos atelier in ${p.color.toLowerCase()}.`,
    featured: true,
    published: true,
  }).onConflictDoNothing();
}

await db.insert(coupons).values({ code: "WELCOME10", kind: "percent", value: 10, active: true, minTotalNgn: 0 }).onConflictDoNothing();

const cfg: Record<string, string> = {
  fx_rate: String(FX),
  shipping_lagos: process.env.SHIPPING_LAGOS_NGN ?? "5000",
  shipping_nationwide: process.env.SHIPPING_NATIONWIDE_NGN ?? "12000",
  shipping_global: process.env.SHIPPING_GLOBAL_NGN ?? "45000",
  free_above: process.env.FREE_SHIPPING_ABOVE_NGN ?? "500000",
};
for (const [key, value] of Object.entries(cfg)) {
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}

console.log("Seed done:", seedProducts.length, "products + WELCOME10 + settings");
