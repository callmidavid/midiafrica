import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminListOrders, setOrderStatus, refundOrder } from "@/fns/shop";
import { formatPrice } from "@/lib/currency";
import { useSettings } from "@/lib/shop-store";

export const Route = createFileRoute("/admin/orders")({
  component: Orders,
});

const statuses = ["draft", "pending", "paid", "failed", "fulfilled", "delivered", "cancelled", "refunded"];

function Orders() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-orders"], queryFn: () => adminListOrders(), retry: 1 });
  const { settings } = useSettings();
  const [filter, setFilter] = useState("all");
  const [msg, setMsg] = useState<string | null>(null);
  const list = (data ?? []).filter((o) => filter === "all" || o.status === filter);
  const reload = () => qc.invalidateQueries({ queryKey: ["admin-orders"] });

  async function refund(o: NonNullable<typeof data>[number]) {
    setMsg(null);
    if (!o.bachsPaymentId) return setMsg("No Bachs payment id yet — refund from the Bachs dashboard, then set status manually.");
    if (!confirm(`Refund ${o.id} in full via Bachs?`)) return;
    try {
      await refundOrder({ data: { id: o.id } });
      setMsg(`Refund submitted for ${o.id} ✓ (confirm refund.paid webhook)`);
      reload();
    } catch (e: any) {
      setMsg(e.message ?? "Refund failed");
    }
  }

  return (
    <AdminShell>
      <p className="eyebrow text-muted-foreground mb-2">Fulfilment · Postgres</p>
      <h1 className="font-display text-4xl mb-6">Orders ({list.length})</h1>
      {msg && <p className="text-sm border border-border p-3 mb-4">{msg}</p>}
      <div className="flex gap-2 flex-wrap mb-6">
        {["all", ...statuses].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`eyebrow border px-3 py-1.5 ${filter === s ? "bg-foreground text-background border-foreground" : "border-border"}`}>{s}</button>
        ))}
      </div>
      <div className="space-y-3">
        {list.length === 0 && <p className="text-sm text-muted-foreground">No orders.</p>}
        {list.map((o) => (
          <div key={o.id} className="border border-border p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div><p className="font-mono text-xs break-all">{o.id}</p><p className="text-xs text-muted-foreground mt-1">{new Date(o.createdAt).toLocaleString()} · {o.customerName} · {o.customerEmail} · {o.customerPhone}</p></div>
              <p className="tabular-nums font-semibold">{formatPrice(o.totalNgn, "NGN", settings.fxRate)}</p>
            </div>
            <p className="text-xs mt-1 text-muted-foreground">{o.address}, {o.city}, {o.state}, {o.country} {o.couponCode && `· coupon ${o.couponCode}`} {o.bachsCheckoutId && `· ${o.bachsCheckoutId}`}</p>
            <div className="mt-2 flex gap-2 overflow-x-auto">{(o.items as { name: string; size: string; qty: number }[]).map((it, i) => <span key={i} className="text-xs border border-border px-2 py-1 whitespace-nowrap">{it.name} · {it.size} × {it.qty}</span>)}</div>
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <select value={o.status} onChange={async (e) => { await setOrderStatus({ data: { id: o.id, status: e.target.value } }); reload(); }} className="border border-border bg-transparent text-sm px-2 py-1.5">
                {statuses.map((s) => <option key={s}>{s}</option>)}
              </select>
              <button onClick={() => refund(o)} className="eyebrow border border-red-200 text-red-500 px-3 py-1.5">Refund via Bachs</button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
