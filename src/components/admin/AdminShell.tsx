import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { authClient, useSession } from "@/lib/auth-client";
import { LayoutDashboard, Package, ShoppingCart, Users, Ticket, Settings, LogOut } from "lucide-react";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (isPending) return <div className="min-h-screen grid place-items-center"><p className="eyebrow text-muted-foreground">Loading…</p></div>;
  if (!session?.user) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="text-center">
          <p className="eyebrow text-muted-foreground mb-3">Restricted</p>
          <p className="font-display text-3xl mb-6">Sign in to continue</p>
          <Link to="/login" search={{ redirect: path } as any} className="eyebrow bg-foreground text-background px-8 py-3">Sign in →</Link>
        </div>
      </div>
    );
  }
  if (role !== "admin") {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="text-center">
          <p className="eyebrow text-muted-foreground mb-3">403 — Admins only</p>
          <p className="font-display text-3xl mb-6">You don't have access.</p>
          <Link to="/" className="eyebrow border border-border px-8 py-3">← Back to store</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen grid md:grid-cols-[240px_1fr]">
      <aside className="border-b md:border-b-0 md:border-r border-border bg-muted/30 p-5 md:min-h-screen md:sticky md:top-0 md:h-screen">
        <Link to="/admin" className="font-display text-lg tracking-[0.15em] uppercase">Midi · Admin</Link>
        <p className="text-xs text-muted-foreground mt-1 truncate">{session.user.email}</p>
        <nav className="mt-6 flex md:flex-col gap-1 overflow-x-auto">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={`flex items-center gap-3 px-3 py-2.5 text-sm whitespace-nowrap ${path === l.to ? "bg-foreground text-background" : "hover:bg-muted"}`}>
              <l.icon className="h-4 w-4" />{l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 flex md:flex-col gap-2">
          <Link to="/" className="eyebrow text-muted-foreground px-3">← View store</Link>
          <button onClick={async () => { await authClient.signOut(); nav({ to: "/login" }); }} className="eyebrow text-muted-foreground px-3 flex items-center gap-2"><LogOut className="h-3.5 w-3.5" /> Logout</button>
        </div>
      </aside>
      <main className="p-5 md:p-10 max-w-6xl">{children}</main>
    </div>
  );
}
