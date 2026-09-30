import { create } from "zustand";
import { persist } from "zustand/middleware";
import { products as seedProducts } from "@/lib/products";
import { DEFAULT_FX_RATE } from "@/lib/currency";

// ---------- Types ----------
export type Product = {
  id: string;
  name: string;
  category: string;
  priceNGN: number;
  image: string;
  hover: string;
  fabric: string;
  color: string;
  sizes: string[];
  stock: number;
  description: string;
  featured: boolean;
  published: boolean;
  createdAt: string;
};

export type CartItem = { productId: string; size: string; qty: number };

export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  size: string;
  qty: number;
  unitNGN: number;
};

export type OrderStatus =
  | "draft"
  | "pending"
  | "paid"
  | "failed"
  | "fulfilled"
  | "delivered"
  | "cancelled"
  | "refunded";

export type Order = {
  id: string;
  items: OrderItem[];
  subtotalNGN: number;
  shippingNGN: number;
  discountNGN: number;
  totalNGN: number;
  currency: "NGN" | "USD";
  customer: { name: string; email: string; phone: string; address: string; city: string; state: string; country: string; notes: string };
  status: OrderStatus;
  bachsCheckoutId: string | null;
  bachsCheckoutUrl: string | null;
  couponCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Coupon = { code: string; kind: "percent" | "fixed"; value: number; active: boolean; minTotalNGN: number };

export type Settings = {
  fxRate: number;
  shippingLagos: number;
  shippingNationwide: number;
  shippingGlobal: number;
  freeShippingAbove: number;
  bachsSandbox: boolean;
};

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL"];

function seed(): Product[] {
  return seedProducts.map((p, i) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    // legacy seed price was USD — convert to NGN
    priceNGN: Math.round(p.price * DEFAULT_FX_RATE),
    image: p.image,
    hover: p.hover,
    fabric: p.fabric,
    color: p.color,
    sizes: DEFAULT_SIZES,
    stock: 10 + ((i * 7) % 20),
    description: `A quiet study in proportion and fabric. Cut in ${p.fabric.toLowerCase()}, finished by hand at our Lagos atelier in ${p.color.toLowerCase()}.`,
    featured: i < 8,
    published: true,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));
}

// ---------- Products ----------
type ProductState = {
  products: Product[];
  setAll: (list: Product[]) => void;
  upsert: (p: Product) => void;
  remove: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  reset: () => void;
};

export const useProducts = create<ProductState>()(
  persist(
    (set) => ({
      products: seed(),
      setAll: (list) => set({ products: list }),
      upsert: (p) => set((s) => ({ products: s.products.some((x) => x.id === p.id) ? s.products.map((x) => (x.id === p.id ? p : x)) : [p, ...s.products] })),
      remove: (id) => set((s) => ({ products: s.products.filter((x) => x.id !== id) })),
      adjustStock: (id, delta) => set((s) => ({ products: s.products.map((x) => (x.id === id ? { ...x, stock: Math.max(0, x.stock + delta) } : x)) })),
      reset: () => set({ products: seed() }),
    }),
    { name: "midi-products-v1" }
  )
);

// ---------- Cart ----------
type CartState = {
  items: CartItem[];
  add: (productId: string, size: string, qty?: number) => void;
  remove: (productId: string, size: string) => void;
  setQty: (productId: string, size: string, qty: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (productId, size, qty = 1) =>
        set((s) => {
          const found = s.items.find((i) => i.productId === productId && i.size === size);
          if (found) return { items: s.items.map((i) => (i === found ? { ...i, qty: i.qty + qty } : i)) };
          return { items: [...s.items, { productId, size, qty }] };
        }),
      remove: (productId, size) => set((s) => ({ items: s.items.filter((i) => !(i.productId === productId && i.size === size)) })),
      setQty: (productId, size, qty) =>
        set((s) => (qty <= 0 ? { items: s.items.filter((i) => !(i.productId === productId && i.size === size)) } : { items: s.items.map((i) => (i.productId === productId && i.size === size ? { ...i, qty } : i)) })),
      clear: () => set({ items: [] }),
    }),
    { name: "midi-cart-v1" }
  )
);

// ---------- Wishlist ----------
type WishState = { ids: string[]; toggle: (id: string) => void };
export const useWishlist = create<WishState>()(
  persist(
    (set) => ({ ids: [], toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id] })) }),
    { name: "midi-wishlist-v1" }
  )
);

// ---------- Orders ----------
type OrderState = {
  orders: Order[];
  place: (o: Order) => void;
  update: (id: string, patch: Partial<Order>) => void;
};
export const useOrders = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],
      place: (o) => set((s) => ({ orders: [o, ...s.orders] })),
      update: (id, patch) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o)) })),
    }),
    { name: "midi-orders-v1" }
  )
);

// ---------- Coupons ----------
type CouponState = { coupons: Coupon[]; upsert: (c: Coupon) => void; remove: (code: string) => void };
export const useCoupons = create<CouponState>()(
  persist(
    (set) => ({
      coupons: [{ code: "WELCOME10", kind: "percent", value: 10, active: true, minTotalNGN: 0 }],
      upsert: (c) => set((s) => ({ coupons: s.coupons.some((x) => x.code === c.code) ? s.coupons.map((x) => (x.code === c.code ? c : x)) : [...s.coupons, c] })),
      remove: (code) => set((s) => ({ coupons: s.coupons.filter((x) => x.code !== code) })),
    }),
    { name: "midi-coupons-v1" }
  )
);

// ---------- Settings ----------
type SettingsState = { settings: Settings; update: (p: Partial<Settings>) => void; currency: "NGN" | "USD"; setCurrency: (c: "NGN" | "USD") => void };
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        fxRate: DEFAULT_FX_RATE,
        shippingLagos: 5000,
        shippingNationwide: 12000,
        shippingGlobal: 45000,
        freeShippingAbove: 500000,
        bachsSandbox: true,
      },
      update: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      currency: "NGN",
      setCurrency: (currency) => set({ currency }),
    }),
    { name: "midi-settings-v1" }
  )
);

// ---------- Helpers ----------
export function cartTotals(items: CartItem[], products: Product[], coupon: Coupon | null, shippingNGN: number, freeAbove: number) {
  const subtotalNGN = items.reduce((sum, i) => {
    const p = products.find((x) => x.id === i.productId);
    return sum + (p ? p.priceNGN * i.qty : 0);
  }, 0);
  let discountNGN = 0;
  if (coupon && coupon.active && subtotalNGN >= coupon.minTotalNGN) {
    discountNGN = coupon.kind === "percent" ? Math.round((subtotalNGN * coupon.value) / 100) : Math.min(coupon.value, subtotalNGN);
  }
  const ship = subtotalNGN - discountNGN >= freeAbove || subtotalNGN === 0 ? 0 : shippingNGN;
  return { subtotalNGN, discountNGN, shippingNGN: ship, totalNGN: Math.max(0, subtotalNGN - discountNGN + ship) };
}

export function newOrderId(): string {
  return `order_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
}
