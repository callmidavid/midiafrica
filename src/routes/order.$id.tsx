import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Package, Truck, Home, CreditCard } from "lucide-react";
import { getOrder } from "@/fns/shop";
import { useSettings } from "@/lib/shop-store";
import { formatPrice } from "@/lib/currency";
import { TRACKER_STEPS, TRACKER_LABELS, statusLabel } from "@/lib/order-status";
import { PageLoader } from "@/components/site/Loading";

export const Route = createFileRoute("/order/$id")({
  component: OrderDetails,
});

function OrderDetails() {
  const { id } = Route.useParams();
  const { currency, settings } = useSettings();
  const { data: order, isPending, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder({ data: { id } }),
    retry: 3,
    retryDelay: 2000,
  });

  if (isPending) return <div className="pt-32 md:pt-40 pb-24 px-4 max-w-3xl mx-auto"><PageLoader label="Loading order…" /></div>;
  if (isError || !order)
    return (
      <div className="pt-40 pb-32 px-6 max-w-xl mx-auto text-center">
        <h1 className="font-display text-4xl mb-4">Order not found</h1>
        <p className="text-muted-foreground mb-8">Check the link or find it in your account.</p>
        <Link to="/account" className="eyebrow bg-foreground text-background px-8 py-4">Go to account →</Link>
      </div>
    );

  const stepIdx = (TRACKER_STEPS as readonly string[]).indexOf(order.status);
  const terminal = ["failed", "cancelled", "refunded"].includes(order.status);
  const items = order.items as { productId: string; name: string; image: string; size: string; qty: number; unitNGN: number }[];

  return (
    <div className="pt-32 md:pt-40 pb-24 px-4 sm:px-6 md:px-10 max-w-3xl mx-auto">
      <div className="text-center mb-10">
        {order.status === "delivered" ? (
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
        ) : (
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        )}
        <p className="eyebrow text-muted-foreground mb-3 break-all">Order {order.id}</p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl mb-3">
          {order.status === "pending" ? "Confirming payment…" : order.status === "failed" ? "Payment didn't go through" : order.status === "delivered" ? "Delivered." : "Thank you."}
        </h1>
        <span className="inline-block eyebrow border border-border px-4 py-1.5">{statusLabel(order.status)}</span>
        {order.status === "pending" && <p className="text-sm text-muted-foreground mt-4">Bachs is confirming your payment — this page updates automatically.</p>}
      </div>

      {!terminal && stepIdx >= 0 && (
        <>
          {/* Mobile: vertical timeline */}
          <ol className="sm:hidden mb-10 ml-1.5 border-l-2 border-border">
            {TRACKER_LABELS.map((label, i) => (
              <li key={label} className="relative pl-6 pb-5 last:pb-0">
                <span className={`absolute -left-[7px] top-0.5 h-3 w-3 rounded-full ring-4 ring-background ${i <= stepIdx ? "bg-foreground" : "bg-border"}`} />
                <p className={`eyebrow ${i <= stepIdx ? "" : "text-muted-foreground"}`}>{label}</p>
                {i === stepIdx && <p className="text-xs text-muted-foreground mt-1">Current stage</p>}
              </li>
            ))}
          </ol>
          {/* Desktop: horizontal steps */}
          <ol className="hidden sm:grid grid-cols-5 gap-2 mb-10">
            {TRACKER_LABELS.map((label, i) => (
              <li key={label} className={`border-t-2 pt-2 text-center ${i <= stepIdx ? "border-foreground" : "border-border"}`}>
                <p className={`eyebrow ${i <= stepIdx ? "" : "text-muted-foreground"}`}>{label}</p>
              </li>
            ))}
          </ol>
        </>
      )}

      <section className="border border-border divide-y divide-border mb-6">
        {items.map((it, i) => (
          <Link key={i} to="/product/$id" params={{ id: it.productId }} className="flex gap-4 p-4 hover:bg-muted/50">
            <img src={it.image} alt={it.name} className="h-20 w-16 shrink-0 object-cover bg-muted" />
            <div className="flex-1 min-w-0">
              <p className="font-display text-base sm:text-lg leading-tight truncate">{it.name}</p>
              <p className="text-xs text-muted-foreground mt-1">Size {it.size} × {it.qty}</p>
            </div>
            <p className="text-sm tabular-nums shrink-0">{formatPrice(it.unitNGN * it.qty, currency, settings.fxRate)}</p>
          </Link>
        ))}
      </section>

      <section className="border border-border p-5 space-y-2 text-sm mb-6">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotalNgn, currency, settings.fxRate)}</span></div>
        {order.discountNgn > 0 && <div className="flex justify-between text-green-600"><span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span><span>−{formatPrice(order.discountNgn, currency, settings.fxRate)}</span></div>}
        <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shippingNgn === 0 ? "Free" : formatPrice(order.shippingNgn, currency, settings.fxRate)}</span></div>
        <div className="flex justify-between font-semibold text-base border-t border-border pt-3"><span>Total paid</span><span>{formatPrice(order.totalNgn, currency, settings.fxRate)}</span></div>
      </section>

      <section className="grid sm:grid-cols-2 gap-4 text-sm">
        <div className="border border-border p-5">
          <p className="eyebrow text-muted-foreground mb-3 flex items-center gap-2"><Truck className="h-3.5 w-3.5" /> Deliver to</p>
          <p className="font-medium">{order.customerName}</p>
          <p className="text-muted-foreground">{order.address}, {order.city}, {order.state}, {order.country}</p>
          <p className="text-muted-foreground">{order.customerPhone}</p>
        </div>
        <div className="border border-border p-5">
          <p className="eyebrow text-muted-foreground mb-3 flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Payment</p>
          <p>Bachs · {order.currency}</p>
          {order.bachsCheckoutId && <p className="font-mono text-xs text-muted-foreground mt-1 break-all">{order.bachsCheckoutId}</p>}
          <p className="text-muted-foreground mt-2 flex items-center gap-2"><Home className="h-3.5 w-3.5" /> Dispatches within 48 hours</p>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-3 justify-center">
        <Link to="/shop" className="eyebrow bg-foreground text-background px-8 py-4">Continue shopping</Link>
        <Link to="/account" className="eyebrow border border-border px-8 py-4">All orders</Link>
      </div>
    </div>
  );
}
