import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { listCoupons, upsertCoupon, deleteCoupon } from "@/fns/shop";
import { PageLoader } from "@/components/site/Loading";

export const Route = createFileRoute("/admin/coupons")({
  component: Coupons,
});

function Coupons() {
  const qc = useQueryClient();
  const { data, isPending } = useQuery({ queryKey: ["coupons"], queryFn: () => listCoupons(), retry: 1 });
  const [code, setCode] = useState("");
  const [kind, setKind] = useState("percent");
  const [value, setValue] = useState(10);
  const [busy, setBusy] = useState(false);
  const reload = () => qc.invalidateQueries({ queryKey: ["coupons"] });
  return (
    <AdminShell>
      <p className="eyebrow text-muted-foreground mb-2">Promotions · Postgres</p>
      <h1 className="font-display text-4xl mb-6">Coupons</h1>
      <form onSubmit={async (e) => { e.preventDefault(); if (!code.trim() || busy) return; setBusy(true); try { await upsertCoupon({ data: { code: code.trim(), kind, value: Number(value), active: true, minTotalNgn: 0 } }); setCode(""); reload(); } finally { setBusy(false); } }} className="flex flex-wrap gap-2 border border-border p-4 mb-6">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODE" className="min-w-0 flex-1 border border-border bg-transparent px-3 py-2 text-sm uppercase outline-none" />
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="border border-border bg-transparent px-3 py-2 text-sm"><option value="percent">% off</option><option value="fixed">₦ off</option></select>
        <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} className="border border-border bg-transparent px-3 py-2 text-sm w-28" />
        <button disabled={busy} className="eyebrow bg-foreground text-background px-5 py-2 disabled:opacity-50">{busy ? "Adding…" : "Add"}</button>
      </form>
      {isPending ? <PageLoader label="Loading coupons…" /> : null}
      <div className="space-y-2">{(data ?? []).map((c) => (
        <div key={c.code} className="flex flex-wrap items-center justify-between gap-2 border border-border p-4 text-sm">
          <span className="font-mono break-all">{c.code} · {c.kind === "percent" ? `${c.value}%` : `₦${c.value.toLocaleString()}`} · {c.active ? "active" : "off"}</span>
          <div className="flex gap-2 shrink-0">
            <button onClick={async () => { await upsertCoupon({ data: { code: c.code, kind: c.kind, value: c.value, active: !c.active, minTotalNgn: c.minTotalNgn } }); reload(); }} className="eyebrow border border-border px-3 py-1">{c.active ? "Disable" : "Enable"}</button>
            <button onClick={async () => { await deleteCoupon({ data: { code: c.code } }); reload(); }} className="eyebrow border border-red-200 text-red-500 px-3 py-1">Delete</button>
          </div>
        </div>
      ))}</div>
    </AdminShell>
  );
}
