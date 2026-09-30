import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useCart, useProducts, useSettings } from "@/lib/shop-store";
import { formatPrice } from "@/lib/currency";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, setQty, remove, clear } = useCart();
  const { products } = useProducts();
  const { currency, settings } = useSettings();
  const lines = items
    .map((i) => ({ ...i, product: products.find((p) => p.id === i.productId)! }))
    .filter((l) => l.product);
  const subtotal = lines.reduce((s, l) => s + l.product.priceNGN * l.qty, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] bg-black/40" />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.7, 0, 0.2, 1] }}
            className="fixed right-0 top-0 z-[71] flex h-full w-full max-w-md flex-col bg-background border-l border-border"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <p className="eyebrow">Your Bag ({lines.reduce((s, l) => s + l.qty, 0)})</p>
              <button onClick={onClose} aria-label="Close bag" className="grid h-9 w-9 place-items-center"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {lines.length === 0 && <p className="text-muted-foreground text-sm py-16 text-center">Your bag is empty.<br /><Link to="/shop" onClick={onClose} className="underline underline-offset-4">Continue shopping</Link></p>}
              {lines.map((l) => (
                <div key={`${l.productId}-${l.size}`} className="flex gap-4">
                  <img src={l.product.image} alt={l.product.name} className="h-28 w-24 shrink-0 object-cover bg-muted" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-display text-lg leading-tight">{l.product.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">Size {l.size} · {l.product.color}</p>
                      </div>
                      <button onClick={() => remove(l.productId, l.size)} aria-label="Remove" className="text-muted-foreground hover:text-foreground h-fit"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button onClick={() => setQty(l.productId, l.size, l.qty - 1)} className="grid h-8 w-8 place-items-center" aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-8 text-center text-sm tabular-nums">{l.qty}</span>
                        <button onClick={() => setQty(l.productId, l.size, l.qty + 1)} className="grid h-8 w-8 place-items-center" aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <p className="text-sm tabular-nums">{formatPrice(l.product.priceNGN * l.qty, currency, settings.fxRate)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {lines.length > 0 && (
              <div className="border-t border-border px-6 py-5 space-y-4">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatPrice(subtotal, currency, settings.fxRate)}</span></div>
                <p className="text-xs text-muted-foreground">Shipping + discounts calculated at checkout.</p>
                <div className="flex gap-2">
                  <button onClick={clear} className="eyebrow border border-border px-4 py-3 hover:border-foreground">Clear</button>
                  <Link to="/checkout" onClick={onClose} className="flex-1 bg-foreground text-background eyebrow text-center py-3 hover:opacity-90">Checkout →</Link>
                </div>
                <Link to="/cart" onClick={onClose} className="block text-center eyebrow text-muted-foreground hover:text-foreground">View full cart</Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
