import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useSyncProducts } from "@/lib/shop-query";
import { isMaintenanceMode } from "@/lib/maintenance";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl">404</h1>
        <p className="mt-4 eyebrow text-muted-foreground">Page not found</p>
        <div className="mt-8">
          <Link
            to="/"
            className="eyebrow border-b border-foreground pb-1"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl">This page didn't load</h1>
        <p className="mt-3 text-sm text-muted-foreground">Please try again in a moment.</p>
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="eyebrow border-b border-foreground pb-1"
          >
            Try again
          </button>
          <a href="/" className="eyebrow border-b border-muted-foreground pb-1">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Midi Africa - Fashion designer in lagos" },
      { name: "description", content: "Midi Africa is a contemporary luxury fashion house celebrating African craftsmanship, heritage and modern elegance." },
      { property: "og:title", content: "Midi Africa - Fashion designer in lagos" },
      { property: "og:description", content: "Midi Africa is a contemporary luxury fashion house celebrating African craftsmanship, heritage and modern elegance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Midi Africa - Fashion designer in lagos" },
      { name: "twitter:description", content: "Midi Africa is a contemporary luxury fashion house celebrating African craftsmanship, heritage and modern elegance." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/e141b764-a204-4ce7-9b44-0bb5f096e3e2" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/e141b764-a204-4ce7-9b44-0bb5f096e3e2" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // Evaluated server-side on every request — the single source of truth.
  const maintenance =
    typeof process !== "undefined" &&
    (process.env.MAINTENANCE_MODE === "true" || process.env.VITE_MAINTENANCE_MODE === "true");
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: `window.__MAINTENANCE__=${maintenance ? "true" : "false"};` }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = path.startsWith("/admin");
  const isAuthPage = path === "/login" || path === "/signup";

  // Holding page: the entire site — including admin and login — is paused.
  if (isMaintenanceMode()) {
    return (
      <QueryClientProvider client={queryClient}>
        <MaintenancePage />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CatalogSync />
      {!isAdmin && <Header />}
      <main key={path} className="animate-in fade-in duration-500">
        <Outlet />
      </main>
      {!isAdmin && !isAuthPage && <Footer />}
    </QueryClientProvider>
  );
}

function MaintenancePage() {
  return (
    <div className="min-h-dvh grid place-items-center bg-ink text-ivory px-6">
      <div className="max-w-xl text-center">
        <p className="eyebrow text-ivory/60 mb-6">Midi Africa</p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-tight mb-6">
          Sorry, this website is temporarily down due to hosting settlement issues.
        </h1>
        <p className="text-ivory/70 leading-relaxed">
          We're working to get the atelier back online. Please check back soon.
        </p>
      </div>
    </div>
  );
}

function CatalogSync() {
  useSyncProducts();
  return null;
}
