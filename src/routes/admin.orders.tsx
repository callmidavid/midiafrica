import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { pageOrders, setOrderStatus, refundOrder } from "@/fns/shop";
import { formatPrice } from "@/lib/currency";
import { useSettings } from "@/lib/shop-store";
import { FULFILMENT_STATUSES, statusLabel } from "@/lib/order-status";
import { PageLoader, RowSkeleton } from "@/components/site/Loading";

export const Route = createFileRoute("/admin/orders")({
  component: Orders,
});

const filters = ["all", "pending", "paid", "processing", "in_transit", "delivered", "failed", "cancelled", "refunded"];
const PAGE = 20;

function Orders() {
  const qc = useQueryClient();
  const { settings } = useSettings();
  const [filter, setFilter] = useState("all");
  const [msg, setMsg] = useState<string | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);

  const q = useInfiniteQuery({
    queryKey: ["admin-orders", filter],
    queryFn: ({ pageParam }: { pageParam: string | null }) => pageOrders({ data: { cursor: pageParam, limit: PAGE, status: filter } }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    retry: 1,
  });
  const list = q.data?.pages.flatMap((p) => p.items) ?? [];
  const reload = () => qc.invalidateQueries({ queryKey: ["admin-orders"] });

  async function refund(o: (typeof list)[number]) {
    setMsg(null);
    if (!o.bachsPaymentId) return setMsg("No Bachs payment id yet — refund from the Bachs dashboard, then set fulfilment to refunded.");
    if (!confirm(`Refund ${o.id} in full via Bachs?`)) return;
    setRefunding(o.id);
    try {
      await refundOrder({ data: { id: o.id } });
      setMsg(`Refund submitted for ${o.id} ✓ (confirm refund.paid webhook)`);
      reload();
    } catch (e: any) {
      setMsg(e.message ?? "Refund failed");
    } finally {
      setRefunding(null);
    }
  }

  return (
    <AdminShell>
      <p className="eyebrow text-muted-foreground mb-2">Fulfilment · Postgres</p>
      <h1 className="font-display text-4xl mb-6">Orders ({q.data?.pages[0] ? `${list.length}${q.hasNextPage ? "+" : ""}` : "…"})</h1>
      {msg && <p className="text-sm border border-border p-3 mb-4">{msg}</p>}
      <div className="flex gap-2 flex-wrap mb-6">
        {filters.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`eyebrow border px-3 py-1.5 ${filter === s ? "bg-foreground text-background border-foreground" : "border-border"}`}>{s === "all" ? "all" : statusLabel(s)}</button>
        ))}
      </div>
      <div className="space-y-3">
        {q.isPending ? <PageLoader label="Loading orders…" /> : list.length === 0 ? <p className="text-sm text-muted-foreground">No orders.</p> : null}
        {list.map((o) => {
          const paid = !!o.bachsPaymentId || ["paid", "processing", "in_transit", "delivered", "refunded"].includes(o.status);
          const paymentText = o.status === "failed" ? "Payment failed" : o.status === "pending" && !paid ? "Awaiting payment" : "Paid ✓";
          const stage = (FULFILMENT_STATUSES as readonly string[]).includes(o.status) ? o.status : "";
          return (
            <div key={o.id} className="border border-border p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div><p className="font-mono text-xs break-all">{o.id}</p><p className="text-xs text-muted-foreground mt-1">{new Date(o.createdAt).toLocaleString()} · {o.customerName} · {o.customerEmail} · {o.customerPhone}</p></div>
                <p className="tabular-nums font-semibold">{formatPrice(o.totalNgn, "NGN", settings.fxRate)}</p>
              </div>
              <p className="text-xs mt-1 text-muted-foreground">{o.address}, {o.city}, {o.state}, {o.country} {o.couponCode && `· coupon ${o.couponCode}`} {o.bachsCheckoutId && `· ${o.bachsCheckoutId}`}</p>
              <div className="mt-2 flex gap-2 overflow-x-auto">{(o.items as { name: string; size: string; qty: number }[]).map((it, i) => <span key={i} className="text-xs border border-border px-2 py-1 whitespace-nowrap">{it.name} · {it.size} × {it.qty}</span>)}</div>
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <div className="border border-border p-3">
                  <p className="eyebrow text-muted-foreground mb-2">Payment · automatic</p>
                  <span className="eyebrow border border-border px-3 py-1.5 inline-block">{paymentText}</span>
                  <p className="text-[11px] text-muted-foreground mt-2">Set by Bachs webhook — not editable here.</p>
                </div>
                <div className="border border-border p-3">
                  <p className="eyebrow text-muted-foreground mb-2">Fulfilment · you control{stage ? ` — ${statusLabel(stage)}` : ""}</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <select
                      value={stage}
                      onChange={async (e) => { if (!e.target.value) return; await setOrderStatus({ data: { id: o.id, status: e.target.value } }); reload(); }}
                      className="border border-border bg-transparent text-sm px-2 py-1.5"
                    >
                      <option value="">Set stage…</option>
                      {FULFILMENT_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                    <button onClick={() => refund(o)} disabled={refunding === o.id} className="eyebrow border border-red-200 text-red-500 px-3 py-1.5 disabled:opacity-50">{refunding === o.id ? "Refunding…" : "Refund via Bachs"}</button>
                    <Link to="/order/$id" params={{ id: o.id }} className="eyebrow border border-border px-3 py-1.5">View →</Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {q.isFetchingNextPage && <RowSkeleton />}
        {q.hasNextPage && (
          <button onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage} className="w-full eyebrow border border-border py-3 disabled:opacity-50">
            {q.isFetchingNextPage ? "Loading…" : `Load more orders (${list.length} shown)`}
          </button>
        )}
      </div>
    </AdminShell>
  );
}
