// Resolves DB image strings to displayable URLs.
// Admin-uploaded http(s) URLs pass through; legacy `/assets/*.jpg` seed paths
// map to the Vite-bundled imports so the catalog works without a CDN.
import { products as legacy } from "@/lib/products";

const map = new Map(legacy.map((p) => [p.id, { image: p.image, hover: p.hover }]));

export function resolveImage(id: string, image: string, hover: string): { image: string; hover: string } {
  if (image.startsWith("/assets/") && map.has(id)) return map.get(id)!;
  return { image: image || "/placeholder.jpg", hover: hover || image || "/placeholder.jpg" };
}
