import { createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "@/components/site/ProductCard";
import { useWishlist, useProducts } from "@/lib/shop-store";

export const Route = createFileRoute("/wishlist")({
  component: WishPage,
});

function WishPage() {
  const { ids } = useWishlist();
  const { products } = useProducts();
  const list = products.filter((p) => ids.includes(p.id));
  return (
    <div className="pt-32 md:pt-40 pb-24 px-6 md:px-10 max-w-[1600px] mx-auto">
      <p className="eyebrow text-muted-foreground mb-4">Saved pieces</p>
      <h1 className="font-display text-5xl md:text-7xl mb-12">Wishlist</h1>
      {list.length === 0 ? <p className="text-muted-foreground">Nothing saved yet.</p> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-14">
          {list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}
