import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { useProducts, useSettings } from "@/lib/shop-store";
import { Reveal } from "@/components/site/Reveal";
import { Search } from "lucide-react";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Midi Africa" },
      { name: "description", content: "Discover the Midi Africa collection: elegant, timeless, contemporary African luxury." },
    ],
  }),
  component: Shop,
});

const categories = ["All", "Women", "Men", "Bridal", "Accessories", "Outerwear"] as const;

function Shop() {
  const { products } = useProducts();
  const { settings } = useSettings();
  const [cat, setCat] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"featured" | "low" | "high">("featured");
  const maxNGN = 6500000;
  const [max, setMax] = useState(maxNGN);

  const filtered = useMemo(() => {
    let list = products.filter(
      (p) =>
        p.published &&
        (cat === "All" || p.category === cat) &&
        p.priceNGN <= max &&
        (query === "" || p.name.toLowerCase().includes(query.toLowerCase()))
    );
    if (sort === "low") list = [...list].sort((a, b) => a.priceNGN - b.priceNGN);
    if (sort === "high") list = [...list].sort((a, b) => b.priceNGN - a.priceNGN);
    return list;
  }, [products, cat, query, sort, max]);

  return (
    <div>
      <section className="pt-36 md:pt-44 pb-12 md:pb-16 px-6 md:px-10 max-w-[1600px] mx-auto">
        <Reveal>
          <p className="eyebrow text-muted-foreground mb-6">The Shop · AW26</p>
          <h1 className="font-display text-6xl md:text-8xl leading-[0.9]">
            The <span className="italic">Collection</span>
          </h1>
        </Reveal>
      </section>

      <section className="sticky top-[68px] md:top-[76px] z-30 bg-background/85 backdrop-blur-xl border-y border-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 py-3 md:py-4">
          <div className="flex gap-x-6 gap-y-2 min-w-0 overflow-x-auto pb-1 -mb-1 md:flex-wrap md:overflow-visible md:pb-0 md:mb-0" style={{ scrollbarWidth: "none" }}>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`eyebrow shrink-0 transition-colors ${cat === c ? "text-foreground border-b border-foreground pb-1" : "text-muted-foreground hover:text-foreground"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 md:hidden">
            <div className="flex flex-1 items-center gap-2 border-b border-border pb-1">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pieces" className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as "featured" | "low" | "high")} className="bg-transparent eyebrow border-b border-border pb-1 outline-none cursor-pointer shrink-0">
              <option value="featured">Featured</option>
              <option value="low">Price ↑</option>
              <option value="high">Price ↓</option>
            </select>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs">
              <span className="eyebrow text-muted-foreground">Under ₦{Math.round(max).toLocaleString()}</span>
              <input type="range" min={500000} max={maxNGN} step={50000} value={max} onChange={(e) => setMax(Number(e.target.value))} className="accent-foreground w-32" />
            </div>
            <div className="flex items-center gap-2 border-b border-border pb-1">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="bg-transparent outline-none text-sm w-32 placeholder:text-muted-foreground" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as "featured" | "low" | "high")} className="bg-transparent eyebrow border-b border-border pb-1 outline-none cursor-pointer">
              <option value="featured">Sort · Featured</option>
              <option value="low">Price ↑</option>
              <option value="high">Price ↓</option>
            </select>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 md:px-10 py-10 md:py-20 max-w-[1600px] mx-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-32">No pieces match your filters.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 sm:gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-20">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
