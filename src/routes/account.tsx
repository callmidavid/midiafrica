import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authClient, useSession } from "@/lib/auth-client";
import { myOrders, getOrder } from "@/fns/shop";
import { useSettings } from "@/lib/shop-store";
import { formatPrice } from "@/lib/currency";

export const Route = createFileRoute("/account")({
  component: AccountPage,
});

function AccountPage() {
  const { data: session, isPending } = useSession();
  const { currency, settings } = useSettings();
  const [lookup, setLookup] = useState("");
  const [foundId, setFoundId] = useState<string | null>(null);

  const mine = useQuery({ queryKey: ["my-orders"], queryFn: () => myOrders(), enabled: !!session?.user, retry: 1 });
  const guest = useQuery({ queryKey: ["order", foundId], queryFn: () => getOrder({ data: { id: foundId! } }), enabled: !!foundId, retry: false });

  const list = [...(mine.data ?? [])];
  if (guest.data && !list.some((o) => o.id === guest.data!.id)) list.unshift(guest.data);

  return (
    <div className="pt-32 md:pt-40 pb-24 px-6 md:px-10 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="eyebrow text-muted-foreground mb-4">Your account</p>
          <h1 className="font-display text-5xl md:text-7xl">{session?.user ? `Hello, ${session.user.name?.split(" ")[0] ?? "there"}` : "Track order"}</h1>
        </div>
        {isPending ? null : session?.user ? (
          <div className="text-sm text-muted-foreground text-right">
            <p>{session.user.email} {(session.user as { role?: string }).role === "admin" && <Link to="/admin" className="underline">· Admin →</Link>}</p>
            <button onClick={() => authClient.signOut()} className="underline underline-offset-4 mt-1">Sign out</button>
          </div>
        ) : (
          <Link to="/login" className="eyebrow border border-border px-6 py-3">Sign in / up →</Link>
        )}
      </div>

      <div className="flex gap-2 mb-10">
        <input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="Paste guest order ID (order_…)" className="flex-1 border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground" />
        <button onClick={() => setFoundId(lookup.trim() || null)} className="eyebrow bg-foreground text-background px-6">Find</button>
      </div>
      {guest.isError && <p className="text-sm text-red-500 mb-4">Order not found.</p>}

      {list.length === 0 ? <p className="text-muted-foreground">No orders yet — they appear here after checkout.</p> : (
        <div className="space-y-4">
          {list.map((o) => (
            <div key={o.id} className="border border-border p-5">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-mono text-xs break-all">{o.id}</p>
                <span className="eyebrow border border-border px-3 py-1">{o.status}</span>
              </div>
              <div className="mt-3 flex gap-3 overflow-x-auto">
                {(o.items as { image: string; name: string; size: string; qty: number }[]).map((it, i) => <img key={i} src={it.image} alt={it.name} title={`${it.name} · ${it.size} × ${it.qty}`} className="h-16 w-14 object-cover bg-muted" />)}
              </div>
              <div className="mt-3 flex justify-between text-sm">
                <span className="text-muted-foreground">{new Date(o.createdAt).toLocaleString()} · {(o.items as unknown[]).length} lines</span>
                <span className="tabular-nums">{formatPrice(o.totalNgn, currency, settings.fxRate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
