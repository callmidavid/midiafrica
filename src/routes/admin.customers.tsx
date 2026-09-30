import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { listOrdersLean } from "@/fns/shop";
import { formatPrice } from "@/lib/currency";
import { useSettings } from "@/lib/shop-store";
import { REVENUE_STATUSES } from "@/lib/order-status";
import { PageLoader } from "@/components/site/Loading";

export const Route = createFileRoute("/admin/customers")({
  component: Customers,
});

function Customers() {
  const { data, isPending } = useQuery({ queryKey: ["admin-orders-lean"], queryFn: () => listOrdersLean(), retry: 1 });
  const { settings } = useSettings();
  const map = new Map<string, { name: string; userId: string | null; orders: number; spent: number; last: string }>();
  (data ?? []).forEach((o) => {
    const e = map.get(o.customerEmail) ?? { name: o.customerName, userId: o.userId, orders: 0, spent: 0, last: String(o.createdAt) };
    e.orders += 1;
    if (REVENUE_STATUSES.includes(o.status)) e.spent += o.totalNgn;
    if (String(o.createdAt) > e.last) e.last = String(o.createdAt);
    map.set(o.customerEmail, e);
  });
  const rows = [...map.entries()];
  return (
    <AdminShell>
      <p className="eyebrow text-muted-foreground mb-2">People · live</p>
      <h1 className="font-display text-4xl mb-6">Customers ({rows.length})</h1>
      {isPending ? <PageLoader label="Loading customers…" /> : rows.length === 0 ? <p className="text-sm text-muted-foreground">No customers yet — they appear after first checkout.</p> : (
        <div className="space-y-2">{rows.map(([email, c]) => (
          <div key={email} className="flex flex-wrap justify-between gap-2 border border-border p-4 text-sm">
            <div className="min-w-0"><p className="font-medium truncate">{c.name} {c.userId && <span className="eyebrow text-muted-foreground">· account</span>}</p><p className="text-xs text-muted-foreground break-all">{email} · {c.orders} orders</p></div>
            <div className="text-right shrink-0"><p className="tabular-nums">{formatPrice(c.spent, "NGN", settings.fxRate)}</p><p className="text-xs text-muted-foreground">{new Date(c.last).toLocaleDateString()}</p></div>
          </div>
        ))}</div>
      )}
    </AdminShell>
  );
}
