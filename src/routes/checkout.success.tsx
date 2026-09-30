import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getOrder } from "@/fns/shop";
import { useSettings } from "@/lib/shop-store";
import { formatPrice } from "@/lib/currency";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkout/success")({
  component: SuccessPage,
});

function SuccessPage() {
  const search = Route.useSearch() as { order?: string; checkout_id?: string };
  const { currency, settings } = useSettings();
  const { data: order } = useQuery({
    queryKey: ["order", search.order],
    queryFn: () => getOrder({ data: { id: search.order! } }),
    enabled: !!search.order,
    retry: 3,
    retryDelay: 2000, // webhook may land a few seconds after redirect
  });

  return (
    <div className="pt-40 pb-32 px-6 max-w-2xl mx-auto text-center">
      <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-6" />
      <p className="eyebrow text-muted-foreground mb-4">Order received</p>
      <h1 className="font-display text-5xl md:text-6xl mb-6">Thank you.</h1>
      {order ? (
        <div className="border border-border p-6 text-left space-y-2 text-sm">
          <p><span className="text-muted-foreground">Order:</span> {order.id}</p>
          <p><span className="text-muted-foreground">Email:</span> {order.customerEmail}</p>
          <p><span className="text-muted-foreground">Total:</span> {formatPrice(order.totalNgn, currency, settings.fxRate)}</p>
          <p><span className="text-muted-foreground">Status:</span> {order.status}{order.status === "pending" ? " — confirming payment via Bachs…" : order.status === "paid" ? " ✓ paid — dispatching in 48h" : ""}</p>
        </div>
      ) : (
        <p className="text-muted-foreground">Confirming {search.order ?? search.checkout_id ?? "…"} — refresh in a moment.</p>
      )}
      <div className="mt-10 flex flex-wrap gap-3 justify-center">
        <Link to="/shop" className="eyebrow bg-foreground text-background px-8 py-4">Continue shopping</Link>
        <Link to="/account" className="eyebrow border border-border px-8 py-4">Track order</Link>
      </div>
    </div>
  );
}
