// Maintenance mode — holding page when the store is paused.
// The server injects window.__MAINTENANCE__ into the HTML on every request,
// so client and server can never disagree (immune to stale bundles/caches).
// Env fallbacks cover non-SSR contexts. Enable with VITE_MAINTENANCE_MODE
// or MAINTENANCE_MODE=true.
declare global {
  interface Window {
    __MAINTENANCE__?: boolean;
  }
}

export function isMaintenanceMode(): boolean {
  try {
    if (typeof window !== "undefined" && typeof window.__MAINTENANCE__ === "boolean") {
      return window.__MAINTENANCE__;
    }
  } catch {
    /* ignore */
  }
  try {
    const v = (import.meta as any)?.env?.VITE_MAINTENANCE_MODE;
    if (v === "true" || v === true) return true;
  } catch {
    /* ignore */
  }
  try {
    if (
      typeof process !== "undefined" &&
      process.env &&
      (process.env.MAINTENANCE_MODE === "true" || process.env.VITE_MAINTENANCE_MODE === "true")
    ) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
