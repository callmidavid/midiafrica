import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, ShoppingBag, Minus, Plus, Truck, RotateCcw, Scissors, Check } from "lucide-react";
import { useProducts, useCart, useWishlist, useSettings } from "@/lib/shop-store";
import { formatPrice } from "@/lib/currency";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => ({ id: params.id }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useLoaderData();
  const { products } = useProducts();
  const product = products.find((p) => p.id === id);
  if (!product) throw notFound();
  return <Details productId={product.id} />;
}

function Details({ productId }: { productId: string }) {
  const { products } = useProducts();
  const product = products.find((p) => p.id === productId)!;
  const { add } = useCart();
  const { ids, toggle } = useWishlist();
  const { currency, settings } = useSettings();
  const [active, setActive] = useState(0);
  const [size, setSize] = useState("M");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const gallery = [product.image, product.hover, product.image];
  const related = products.filter((p) => p.id !== product.id && p.published).slice(0, 4);
  const wished = ids.includes(product.id);

  const doAdd = () => {
    if (product.stock <= 0) return;
    add(product.id, size, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="pt-24 md:pt-32">
      <div className="max-w-[1600px] mx-auto px-6 md:px-10">
        <nav className="eyebrow text-muted-foreground py-6 flex gap-2">
          <Link to="/" className="hover:text-foreground">Home</Link> /
          <Link to="/shop" className="hover:text-foreground">Shop</Link> /
          <span>{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-16">
          <div className="grid grid-cols-[64px_1fr] gap-4">
            <div className="hidden lg:flex flex-col gap-3">
              {gallery.map((src, i) => (
                <button key={i} onClick={() => setActive(i)} className={`aspect-[3/4] overflow-hidden border-2 transition ${active === i ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <div className="col-span-2 lg:col-span-1 overflow-hidden bg-muted aspect-[3/4] group">
              <img src={gallery[active]} alt={product.name} className="h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-110 cursor-zoom-in" />
            </div>
          </div>

          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow text-muted-foreground mb-4">{product.category} · AW26</p>
            <h1 className="font-display text-4xl md:text-6xl leading-[1] mb-4">{product.name}</h1>
            <p className="text-2xl tabular-nums mb-2">{formatPrice(product.priceNGN, currency, settings.fxRate)}</p>
            <p className="eyebrow mb-8 text-muted-foreground">{product.stock > 0 ? `${product.stock} in stock` : "Sold out"}</p>

            <p className="text-muted-foreground leading-relaxed mb-10 max-w-md">{product.description}</p>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow">Size</span>
                <button className="eyebrow text-muted-foreground hover-underline">Size guide</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={`min-w-12 h-12 px-4 border transition-colors eyebrow ${size === s ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}>{s}</button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-stretch gap-3 mb-8">
              <div className="flex items-center border border-border">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-14 w-12 place-items-center hover:bg-muted"><Minus className="h-4 w-4" /></button>
                <span className="w-10 text-center tabular-nums">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="grid h-14 w-12 place-items-center hover:bg-muted"><Plus className="h-4 w-4" /></button>
              </div>
              <button onClick={doAdd} disabled={product.stock <= 0} className="min-w-40 flex-1 bg-foreground text-background eyebrow flex items-center justify-center gap-3 hover:bg-earth transition-colors disabled:opacity-40">
                {added ? <><Check className="h-4 w-4" /> Added!</> : <><ShoppingBag className="h-4 w-4" /> Add to Bag</>}
              </button>
              <button onClick={() => toggle(product.id)} aria-label="Wishlist" className={`grid w-14 shrink-0 place-items-center border ${wished ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}>
                <Heart className={`h-4 w-4 ${wished ? "fill-current" : ""}`} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 py-6 border-y border-border text-center text-xs">
              <div className="space-y-2"><Truck className="h-4 w-4 mx-auto" /><p className="text-muted-foreground">Free global<br />shipping over ₦500k</p></div>
              <div className="space-y-2"><RotateCcw className="h-4 w-4 mx-auto" /><p className="text-muted-foreground">30-day<br />returns</p></div>
              <div className="space-y-2"><Scissors className="h-4 w-4 mx-auto" /><p className="text-muted-foreground">Made in<br />Lagos</p></div>
            </div>

            <div className="mt-8 space-y-4 text-sm">
              <Detail title="Fabric & Care">{product.fabric}. Dry clean only. Store on a padded hanger, away from direct light.</Detail>
              <Detail title="Shipping & Delivery">Lagos ₦5,000 · Nationwide ₦12,000 · Global ₦45,000. Free above ₦500,000. Dispatched within 48 hours.</Detail>
              <Detail title="Sustainability">Woven from responsibly sourced fibres. Repair service available for the lifetime of the piece.</Detail>
            </div>
          </div>
        </div>

        <section className="mt-32 md:mt-48">
          <Reveal>
            <p className="eyebrow text-muted-foreground mb-4">Continue</p>
            <h2 className="font-display text-3xl md:text-5xl mb-12">You may also love</h2>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-14 md:gap-x-6 md:gap-y-20 pb-32">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      </div>
    </div>
  );
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4">
        <span className="eyebrow">{title}</span>
        <span className="text-lg">{open ? "−" : "+"}</span>
      </button>
      <div className={`grid transition-all duration-500 ${open ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
