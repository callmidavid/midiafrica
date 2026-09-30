import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart, useProducts, useSettings } from "@/lib/shop-store";
import { useSession } from "@/lib/auth-client";
import { formatPrice, ngnToUsd } from "@/lib/currency";
import { createCheckout, getMyProfile } from "@/fns/shop";
import { openBachsOverlay } from "@/lib/bachs";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

const empty = { name: "", email: "", phone: "", address: "", city: "", state: "Lagos", country: "Nigeria", notes: "" };
const DRAFT_KEY = "midi-checkout-draft-v1";

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return { ...empty, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...empty };
}

function CheckoutPage() {
  const nav = useNavigate();
  const { items, clear } = useCart();
  const { products } = useProducts();
  const { settings } = useSettings();
  const { data: session } = useSession();
  const [form, setForm] = useState<typeof empty>(() => ({
    ...loadDraft(),
    ...(session?.user ? { name: session.user.name ?? "", email: session.user.email ?? "" } : {}),
  }));
  const profile = useQuery({ queryKey: ["my-profile"], queryFn: () => getMyProfile(), enabled: !!session?.user, retry: 1, staleTime: 60_000 });

  // Prefill saved details (account profile first, then session basics)
  useEffect(() => {
    const p = profile.data;
    if (p) {
      setForm((f) => ({
        ...f,
        name: p.name || f.name || session?.user?.name || "",
        email: f.email || session?.user?.email || "",
        phone: p.phone || f.phone,
        address: p.address || f.address,
        city: p.city || f.city,
        state: p.state || f.state,
        country: p.country || f.country,
      }));
    }
  }, [profile.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const [zone, setZone] = useState<"lagos" | "nationwide" | "global">("lagos");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipBase = zone === "lagos" ? settings.shippingLagos : zone === "nationwide" ? settings.shippingNationwide : settings.shippingGlobal;
  const lines = items.map((i) => ({ ...i, product: products.find((p) => p.id === i.productId)! })).filter((l) => l.product);
  const subtotal = lines.reduce((s, l) => s + l.product.priceNGN * l.qty, 0);
  const previewShip = subtotal >= settings.freeShippingAbove || subtotal === 0 ? 0 : shipBase;

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const v = e.target.value;
    // Guests: keep a local draft so nothing is retyped. Signed-in shoppers
    // persist server-side on every successful checkout.
    if (!session?.user && k !== "notes") {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, [k]: v }));
      } catch { /* ignore */ }
    }
    setForm((f) => ({ ...f, [k]: v }));
  };

  async function pay() {
    setError(null);
    if (lines.length === 0) return setError("Your bag is empty.");
    if (!form.name || !form.email || !form.address || !form.city || !form.phone) return setError("Fill name, email, phone, address and city.");
    setBusy(true);
    try {
      // Server re-prices from Postgres, creates the order + Bachs session (key stays server-side)
      const res = await createCheckout({
        data: {
          items: lines.map((l) => ({ productId: l.productId, size: l.size, qty: l.qty })),
          customer: form,
          zone,
          couponCode: code.trim() || null,
        },
      });
      clear();
      await openBachsOverlay(res.checkoutUrl, (e) => {
        if (e.type === "checkout.completed") nav({ to: "/order/$id", params: { id: res.orderId } });
      });
      nav({ to: "/order/$id", params: { id: res.orderId } });
    } catch (e: any) {
      setError(e.message ?? "Payment failed to start.");
    } finally {
      setBusy(false);
    }
  }

  const { currency } = useSettings();

  return (
    <div className="pt-32 md:pt-40 pb-24 px-6 md:px-10 max-w-6xl mx-auto">
      {busy && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-background/90 backdrop-blur-sm px-6" role="status" aria-live="polite">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-foreground" />
            <p className="eyebrow">Creating secure payment…</p>
            <p className="text-sm text-muted-foreground">Do not close this page.</p>
          </div>
        </div>
      )}
      <p className="eyebrow text-muted-foreground mb-4">Secure checkout · Bachs</p>
      <h1 className="font-display text-5xl md:text-7xl mb-12">Checkout</h1>
      {!session?.user && (
        <p className="text-sm border border-border p-4 mb-8">Checking out as guest. <Link to="/login" search={{ redirect: "/checkout" } as any} className="underline underline-offset-4">Sign in</Link> to track orders in your account.</p>
      )}
      <div className="grid md:grid-cols-[1fr_360px] gap-12">
        <div className="space-y-10">
          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
              <h2 className="eyebrow">Contact + Shipping</h2>
              {profile.data && (profile.data.name || profile.data.address) && (
                <p className="text-xs text-green-600">Saved details filled in ✓</p>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={form.name} onChange={set("name")} placeholder="Full name *" className="border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground" />
              <input value={form.email} onChange={set("email")} placeholder="Email *" type="email" className="border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground" />
              <input value={form.phone} onChange={set("phone")} placeholder="Phone *" className="border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground" />
              <input value={form.address} onChange={set("address")} placeholder="Street address *" className="border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground" />
              <input value={form.city} onChange={set("city")} placeholder="City *" className="border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground" />
              <select value={form.state} onChange={set("state")} className="border border-border bg-transparent px-4 py-3 text-sm outline-none">
                {["Lagos", "Abuja", "Rivers", "Oyo", "Kano", "Other (Nigeria)", "Ghana", "UK", "USA", "Other (Global)"].map((s) => <option key={s}>{s}</option>)}
              </select>
              <input value={form.country} onChange={set("country")} placeholder="Country" className="border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground" />
              <select value={zone} onChange={(e) => setZone(e.target.value as any)} className="border border-border bg-transparent px-4 py-3 text-sm outline-none">
                <option value="lagos">Lagos delivery — ₦{settings.shippingLagos.toLocaleString()}</option>
                <option value="nationwide">Nationwide — ₦{settings.shippingNationwide.toLocaleString()}</option>
                <option value="global">Global — ₦{settings.shippingGlobal.toLocaleString()}</option>
              </select>
            </div>
            <textarea value={form.notes} onChange={set("notes")} placeholder="Delivery notes (optional)" rows={2} className="mt-3 w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground" />
          </section>
          <section>
            <h2 className="eyebrow mb-5">Discount code</h2>
            <div className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. WELCOME10" className="flex-1 border border-border bg-transparent px-4 py-3 text-sm uppercase outline-none focus:border-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Validated securely on the server at payment time.</p>
          </section>
          {error && <p className="text-sm text-red-500 border border-red-200 bg-red-50 p-4">{error}</p>}
          <button onClick={pay} disabled={busy || lines.length === 0} className="w-full bg-foreground text-background eyebrow py-5 disabled:opacity-40 hover:opacity-90">
            {busy ? "Opening secure payment…" : `Pay with Bachs →`}
          </button>
          <p className="text-xs text-muted-foreground">Cards · bank transfer · mobile money · crypto. Total confirmed server-side (≈ ${ngnToUsd(subtotal + previewShip, settings.fxRate).toFixed(2)}). Webhook confirms your order.</p>
        </div>
        <aside className="h-fit border border-border p-6 space-y-4 lg:sticky lg:top-28">
          <p className="eyebrow">Order summary</p>
          {lines.map((l) => (
            <div key={`${l.productId}-${l.size}`} className="flex gap-3 items-center">
              <img src={l.product.image} className="h-14 w-12 object-cover bg-muted" alt="" />
              <div className="flex-1 text-sm"><p className="truncate">{l.product.name}</p><p className="text-xs text-muted-foreground">Size {l.size} × {l.qty}</p></div>
              <p className="text-sm tabular-nums">{formatPrice(l.product.priceNGN * l.qty, currency, settings.fxRate)}</p>
            </div>
          ))}
          <div className="border-t border-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal, currency, settings.fxRate)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping (est.)</span><span>{previewShip === 0 ? "Free" : formatPrice(previewShip, currency, settings.fxRate)}</span></div>
          </div>
          <Link to="/cart" className="block text-center eyebrow text-muted-foreground">← Back to cart</Link>
        </aside>
      </div>
    </div>
  );
}
