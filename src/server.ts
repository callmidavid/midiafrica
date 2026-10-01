import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    // Authoritative maintenance gate (prod): static 503 for page navigations.
    // Survives stale client bundles/caches — the app shell can never render.
    if (isMaintenanceRequest(request)) {
      return new Response(renderMaintenancePage(), {
        status: 503,
        headers: { "content-type": "text/html; charset=utf-8", "retry-after": "3600" },
      });
    }
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

const MAINTENANCE_ALLOW = ["/api/", "/assets/", "/_"];
const MAINTENANCE_ALLOW_EXACT = new Set(["/favicon.ico"]);

function isMaintenanceRequest(request: Request): boolean {
  const maintenance =
    process.env.MAINTENANCE_MODE === "true" || process.env.VITE_MAINTENANCE_MODE === "true";
  if (!maintenance) return false;
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const accept = request.headers.get("accept") ?? "";
  if (!accept.includes("text/html")) return false; // API / RPC / assets pass through
  const path = new URL(request.url).pathname;
  if (MAINTENANCE_ALLOW_EXACT.has(path)) return false;
  if (MAINTENANCE_ALLOW.some((p) => path === p || path.startsWith(p))) return false;
  return true;
}

function renderMaintenancePage(): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Temporarily down — Midi Africa</title>
<style>body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#292524;color:#faf7f2;font-family:Georgia,serif;padding:24px}main{max-width:34rem;text-align:center}.eyebrow{font-family:system-ui;font-size:.7rem;letter-spacing:.32em;text-transform:uppercase;opacity:.6;margin-bottom:24px}h1{font-weight:400;font-size:clamp(1.8rem,6vw,3rem);line-height:1.2;margin:0 0 24px}p{opacity:.7;line-height:1.6}</style></head>
<body><main><div class="eyebrow">Midi Africa</div><h1>Sorry, this website is temporarily down due to hosting settlement issues.</h1><p>We&apos;re working to get the atelier back online. Please check back soon.</p></main></body></html>`;
}
