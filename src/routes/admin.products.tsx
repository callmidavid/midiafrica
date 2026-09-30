import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { pageProducts, upsertProduct, deleteProduct, type ProductInput } from "@/fns/shop";
import { formatPrice } from "@/lib/currency";
import { useSettings } from "@/lib/shop-store";
import { useRefreshProducts } from "@/lib/shop-query";
import { RowSkeleton } from "@/components/site/Loading";

export const Route = createFileRoute("/admin/products")({
  component: Products,
});

const blank: ProductInput = {
  name: "", category: "Women", priceNGN: 500000, image: "", hover: "",
  fabric: "", color: "", sizes: ["XS", "S", "M", "L", "XL"], stock: 10,
  description: "", featured: false, published: true,
};

const PAGE = 20;

function Products() {
  const qc = useQueryClient();
  const refreshStorefront = useRefreshProducts();
  const { settings } = useSettings();
  const [editing, setEditing] = useState<(ProductInput & { id?: string }) | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const pq = useInfiniteQuery({
    queryKey: ["admin-products"],
    queryFn: ({ pageParam }: { pageParam: string | null }) => pageProducts({ data: { cursor: pageParam, limit: PAGE } }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    retry: 1,
  });
  const all = pq.data?.pages.flatMap((p) => p.items) ?? [];
  const list = all.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
  const reload = () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); refreshStorefront(); };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !editing.name) return;
    setBusy(true);
    try {
      await upsertProduct({ data: { ...editing, priceNGN: Number(editing.priceNGN), stock: Number(editing.stock) } });
      setEditing(null);
      reload();
    } finally {
      setBusy(false);
    }
  }
  const F = "w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground";

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div><p className="eyebrow text-muted-foreground mb-2">Catalog · Postgres</p><h1 className="font-display text-4xl">Products</h1></div>
        <div className="flex flex-wrap gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search loaded" className="min-w-0 flex-1 border border-border bg-transparent px-3 py-2 text-sm outline-none sm:max-w-48" />
          <button onClick={() => setEditing({ ...blank })} className="eyebrow shrink-0 bg-foreground text-background px-5 py-2">+ New</button>
        </div>
      </div>
      {pq.isError && <p className="text-sm text-red-500 border border-red-200 p-3 mb-4">Server unreachable.</p>}

      {editing && (
        <form onSubmit={save} className="border border-border p-5 mb-8 grid sm:grid-cols-3 gap-3">
          <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Name *" className={F} />
          <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={F}>
            {["Women", "Men", "Bridal", "Accessories", "Outerwear"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <input type="number" value={editing.priceNGN} onChange={(e) => setEditing({ ...editing, priceNGN: Number(e.target.value) })} placeholder="Price NGN" className={F} />
          <input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="Image URL" className={F} />
          <input value={editing.hover} onChange={(e) => setEditing({ ...editing, hover: e.target.value })} placeholder="Hover image URL" className={F} />
          <input value={editing.fabric} onChange={(e) => setEditing({ ...editing, fabric: e.target.value })} placeholder="Fabric" className={F} />
          <input value={editing.color} onChange={(e) => setEditing({ ...editing, color: e.target.value })} placeholder="Color" className={F} />
          <input type="number" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} placeholder="Stock" className={F} />
          <input value={editing.sizes.join(",")} onChange={(e) => setEditing({ ...editing, sizes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="Sizes XS,S,M,L,XL" className={F} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Published</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /> Featured</label>
          <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Description" rows={2} className={`${F} sm:col-span-3`} />
          <div className="sm:col-span-3 flex gap-2">
            <button disabled={busy} className="eyebrow bg-foreground text-background px-6 py-2 disabled:opacity-40">{busy ? "Saving…" : "Save"}</button>
            <button type="button" onClick={() => setEditing(null)} className="eyebrow border border-border px-6 py-2">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {pq.isPending ? (<><RowSkeleton /><RowSkeleton /><RowSkeleton /></>) : list.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 sm:gap-4 border border-border p-3">
            <img src={p.image} alt="" className="h-14 w-12 shrink-0 object-cover bg-muted" />
            <div className="flex-1 min-w-40">
              <p className="font-medium truncate">{p.name} {!p.published && <span className="eyebrow text-muted-foreground">(hidden)</span>}</p>
              <p className="text-xs text-muted-foreground">{p.category} · {formatPrice(p.priceNgn, "NGN", settings.fxRate)} · stock {p.stock}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing({ id: p.id, name: p.name, category: p.category, priceNGN: p.priceNgn, image: p.image, hover: p.hover, fabric: p.fabric ?? "", color: p.color ?? "", sizes: (p.sizes as string[]) ?? [], stock: p.stock, description: p.description ?? "", featured: p.featured, published: p.published })} className="eyebrow border border-border px-4 py-1.5">Edit</button>
              <button onClick={async () => { if (confirm(`Delete ${p.name}?`)) { await deleteProduct({ data: { id: p.id } }); reload(); } }} className="eyebrow border border-red-200 text-red-500 px-4 py-1.5">Delete</button>
            </div>
          </div>
        ))}
        {pq.isFetchingNextPage && <RowSkeleton />}
        {pq.hasNextPage && (
          <button onClick={() => pq.fetchNextPage()} disabled={pq.isFetchingNextPage} className="w-full eyebrow border border-border py-3 disabled:opacity-50">
            {pq.isFetchingNextPage ? "Loading…" : `Load more products (${all.length} shown)`}
          </button>
        )}
      </div>
    </AdminShell>
  );
}
