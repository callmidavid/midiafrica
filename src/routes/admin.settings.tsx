import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { getStoreConfig, saveStoreConfig } from "@/fns/shop";
import { BACHS_SANDBOX_URL, BACHS_LIVE_URL } from "@/lib/bachs";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data: cfg } = useQuery({ queryKey: ["store-config"], queryFn: () => getStoreConfig(), retry: 1 });
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [msg, setMsg] = useState("");
  const cur: Record<string, string> = form ?? (cfg ? { fx_rate: String(cfg.fx), shipping_lagos: String(cfg.lagos), shipping_nationwide: String(cfg.nationwide), shipping_global: String(cfg.global), free_above: String(cfg.freeAbove) } : {});
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...cur, [k]: e.target.value });
  const F = "w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground";

  return (
    <AdminShell>
      <p className="eyebrow text-muted-foreground mb-2">Store config · Postgres</p>
      <h1 className="font-display text-4xl mb-6">Settings</h1>
      {msg && <p className="text-sm border border-border p-3 mb-4">{msg}</p>}
      <div className="grid md:grid-cols-2 gap-6">
        <section className="border border-border p-5 space-y-3">
          <h2 className="eyebrow">Bachs payments (env — server only)</h2>
          <p className="text-xs text-muted-foreground">Sandbox: <span className="font-mono">{BACHS_SANDBOX_URL}</span> · Live: <span className="font-mono">{BACHS_LIVE_URL}</span></p>
          <p className="text-sm">Mode: <strong>{cfg ? (cfg.bachsSandbox ? "Sandbox" : "LIVE") : "…"}</strong> · Key: <strong>{cfg ? (cfg.bachsKeySet ? "configured ✓" : "MISSING — set BACHS_API_KEY in .env") : "…"}</strong></p>
          <p className="text-xs text-muted-foreground">Keys live in <span className="font-mono">.env</span> (never in the browser or DB). To go live: verify account, set <span className="font-mono">BACHS_SANDBOX=false</span> + <span className="font-mono">BACHS_API_KEY=sk_live_…</span>, redeploy.</p>
          <p className="text-xs text-muted-foreground">Webhook URL: <span className="font-mono">{typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/bachs</span> — subscribe to collection.succeeded/failed/underpaid, checkout.expired, refund.*</p>
        </section>
        <section className="border border-border p-5 space-y-3">
          <h2 className="eyebrow">Currency + shipping (₦)</h2>
          <label className="text-xs">FX rate: 1 USD = ? NGN<input value={cur.fx_rate ?? ""} onChange={set("fx_rate")} type="number" className={F} /></label>
          <label className="text-xs">Lagos shipping<input value={cur.shipping_lagos ?? ""} onChange={set("shipping_lagos")} type="number" className={F} /></label>
          <label className="text-xs">Nationwide shipping<input value={cur.shipping_nationwide ?? ""} onChange={set("shipping_nationwide")} type="number" className={F} /></label>
          <label className="text-xs">Global shipping<input value={cur.shipping_global ?? ""} onChange={set("shipping_global")} type="number" className={F} /></label>
          <label className="text-xs">Free shipping above<input value={cur.free_above ?? ""} onChange={set("free_above")} type="number" className={F} /></label>
          <button onClick={async () => { await saveStoreConfig({ data: cur }); setForm(null); qc.invalidateQueries({ queryKey: ["store-config"] }); setMsg("Saved ✓ — checkout uses these values immediately."); }} className="eyebrow bg-foreground text-background px-6 py-2">Save</button>
        </section>
      </div>
    </AdminShell>
  );
}
