import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminListOrders, adminListProducts } from "@/fns/shop";
import { formatPrice } from "@/lib/currency";
import { useSettings } from "@/lib/shop-store";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { settings } = useSettings();
  const ordersQ = useQuery({ queryKey: ["admin-orders"], queryFn: () => adminListOrders(), retry: 1 });
  const productsQ = useQuery({ queryKey: ["admin-products"], queryFn: () => adminListProducts(), retry: 1 });
  const orders = ordersQ.data ?? [];
  const products = productsQ.data ?? [];
  const revenue = orders.filter((o) => ["paid", "fulfilled", "delivered"].includes(o.status)).reduce((s, o) => s + o.totalNgn, 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const low = products.filter((p) => p.stock < 5);
  const recent = orders.slice(0, 6);

  return (
    <AdminShell>
      <p className="eyebrow text-muted-foreground mb-2">Overview · live from Postgres</p>
      <h1 className="font-display text-4xl md:text-5xl mb-8">Dashboard</h1>
      {(ordersQ.isError || productsQ.isError) && <p className="text-sm text-red-500 border border-red-200 p-3 mb-4">Server unreachable — check DATABASE_URL + server build.</p>}
      <div className="grid sm:grid-cols-4 gap-3 mb-10">
        {[
          { k: "Revenue", v: formatPrice(revenue, "NGN", settings.fxRate) },
          { k: "Orders", v: String(orders.length) },
          { k: "Pending payment", v: String(pending) },
          { k: "Products", v: String(products.length) },
        ].map((s) => (
          <div key={s.k} className="border border-border p-5"><p className="eyebrow text-muted-foreground mb-2">{s.k}</p><p className="font-display text-3xl">{s.v}</p></div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="eyebrow mb-4">Recent orders</h2>
          {recent.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> : recent.map((o) => (
            <div key={o.id} className="flex justify-between border-b border-border py-3 text-sm">
              <span className="font-mono text-xs">{o.id.slice(0, 20)}… · {o.status}</span>
              <span className="tabular-nums">{formatPrice(o.totalNgn, "NGN", settings.fxRate)}</span>
            </div>
          ))}
        </div>
        <div>
          <h2 className="eyebrow mb-4">Low stock (&lt;5)</h2>
          {low.length === 0 ? <p className="text-sm text-muted-foreground">All stocked.</p> : low.map((p) => (
            <div key={p.id} className="flex justify-between border-b border-border py-3 text-sm"><span>{p.name}</span><span className="text-red-500">{p.stock} left</span></div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
