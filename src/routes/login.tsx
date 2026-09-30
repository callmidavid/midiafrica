import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [socialBusy, setSocialBusy] = useState(false);
  const from = (Route.useSearch() as { redirect?: string }).redirect;

  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    nav({ to: role === "admin" ? "/admin" : (from as any) ?? "/account" });
    return null;
  }

  async function social() {
    setErr("");
    setSocialBusy(true);
    try {
      const res = await authClient.signIn.social({ provider: "google", callbackURL: (from as string) ?? "/account" });
      if (res?.error) setErr(res.error.message ?? "Google sign-in failed — try again.");
    } catch (e: any) {
      setErr(e?.message ?? "Google sign-in failed — check connection and retry.");
    } finally {
      setSocialBusy(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await authClient.signIn.email({ email, password });
    setBusy(false);
    if (res.error) return setErr(res.error.message ?? "Login failed");
    nav({ to: (from as any) ?? "/account" });
  }

  const F = "w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground";
  return (
    <div className="min-h-screen grid place-items-center px-6 pt-24">
      <div className="w-full max-w-sm space-y-4">
        <p className="eyebrow text-muted-foreground">Midi Africa</p>
        <h1 className="font-display text-4xl">Welcome back</h1>
        <button
          onClick={social}
          disabled={socialBusy}
          className="w-full border border-border eyebrow py-3.5 hover:border-foreground disabled:opacity-50"
        >
          {socialBusy ? "Connecting to Google…" : "Continue with Google"}
        </button>
        {err && <p className="text-sm text-red-500">{err}</p>}
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="flex-1 border-t border-border" /> or <span className="flex-1 border-t border-border" /></div>
        <form onSubmit={submit} className="space-y-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className={F} required />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className={F} required />
          <button disabled={busy} className="w-full bg-foreground text-background eyebrow py-3.5 disabled:opacity-40">{busy ? "Signing in…" : "Sign in →"}</button>
        </form>
        <p className="text-sm text-muted-foreground">New here? <Link to="/signup" className="underline underline-offset-4 text-foreground">Create account</Link></p>
      </div>
    </div>
  );
}
