import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, useProducts, useSettings } from "@/lib/shop-store";
import { formatPrice } from "@/lib/currency";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove } = useCart();
  const { products } = useProducts();
  const { currency, settings } = useSettings();
  const lines = items.map((i) => ({ ...i, product: products.find((p) => p.id === i.productId)! })).filter((l) => l.product);
  const subtotal = lines.reduce((s, l) => s + l.product.priceNGN * l.qty, 0);

  return (
    <div className="pt-32 md:pt-40 pb-24 px-6 md:px-10 max-w-5xl mx-auto">
      <p className="eyebrow text-muted-foreground mb-4">Your Bag</p>
      <h1 className="font-display text-5xl md:text-7xl mb-12">Cart</h1>
      {lines.length === 0 ? (
        <p className="text-muted-foreground">Empty. <Link to="/shop" className="underline underline-offset-4">Shop the collection →</Link></p>
      ) : (
        <div className="grid md:grid-cols-[1fr_320px] gap-12">
          <div className="space-y-8">
            {lines.map((l) => (
              <div key={`${l.productId}-${l.size}`} className="flex gap-5 border-b border-border pb-8">
                <Link to="/product/$id" params={{ id: l.productId }}><img src={l.product.image} alt={l.product.name} className="h-36 w-28 object-cover bg-muted" /></Link>
                <div className="flex-1">
                  <div className="flex justify-between gap-3">
                    <div><p className="font-display text-2xl">{l.product.name}</p><p className="text-sm text-muted-foreground mt-1">Size {l.size} · {l.product.color}</p></div>
                    <button onClick={() => remove(l.productId, l.size)} className="text-muted-foreground hover:text-foreground h-fit"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center border border-border">
                      <button onClick={() => setQty(l.productId, l.size, l.qty - 1)} className="grid h-9 w-9 place-items-center"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-8 text-center tabular-nums">{l.qty}</span>
                      <button onClick={() => setQty(l.productId, l.size, l.qty + 1)} className="grid h-9 w-9 place-items-center"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <p className="tabular-nums">{formatPrice(l.product.priceNGN * l.qty, currency, settings.fxRate)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="h-fit border border-border p-6 space-y-4 lg:sticky lg:top-28">
            <div className="flex justify-between"><span className="text-muted-foreground text-sm">Subtotal</span><span className="tabular-nums">{formatPrice(subtotal, currency, settings.fxRate)}</span></div>
            <Link to="/checkout" className="block bg-foreground text-background eyebrow text-center py-4">Proceed to checkout →</Link>
            <Link to="/shop" className="block text-center eyebrow text-muted-foreground">Continue shopping</Link>
          </div>
        </div>
      )}
    </div>
  );
}
