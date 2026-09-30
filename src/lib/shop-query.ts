// React Query hooks over server functions (Postgres source of truth).
// Products sync into the zustand cache so shop/PDP render instantly + offline.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { listProducts } from "@/fns/shop";
import { useProducts, type Product } from "@/lib/shop-store";
import { resolveImage } from "@/lib/local-images";

type DbRow = {
  id: string; name: string; category: string; priceNgn: number;
  image: string; hover: string; fabric: string | null; color: string | null;
  sizes: unknown; stock: number; description: string | null;
  featured: boolean; published: boolean; createdAt: Date | string;
};

function toStore(r: DbRow): Product {
  const { image, hover } = resolveImage(r.id, r.image, r.hover);
  return {
    id: r.id, name: r.name, category: r.category, priceNGN: r.priceNgn,
    image, hover, fabric: r.fabric ?? "", color: r.color ?? "",
    sizes: Array.isArray(r.sizes) ? (r.sizes as string[]) : ["XS", "S", "M", "L", "XL"],
    stock: r.stock, description: r.description ?? "",
    featured: r.featured, published: r.published,
    createdAt: new Date(r.createdAt).toISOString(),
  };
}

/** Fetch published catalog from Postgres; falls back to local cache on error. */
export function useSyncProducts() {
  const setAll = useProducts((s) => s.setAll);
  const q = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const rows = (await listProducts()) as DbRow[];
      return rows.map(toStore);
    },
    staleTime: 60_000,
    retry: 1,
  });
  useEffect(() => {
    if (q.data?.length) setAll(q.data);
  }, [q.data, setAll]);
  return q;
}

export function useRefreshProducts() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["products"] });
}
