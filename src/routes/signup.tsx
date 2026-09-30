import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/signup")({
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [socialBusy, setSocialBusy] = useState(false);

  if (session?.user) {
    nav({ to: "/account" });
    return null;
  }

  async function social() {
    setErr("");
    setSocialBusy(true);
    try {
      const res = await authClient.signIn.social({ provider: "google", callbackURL: "/account" });
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
    const res = await authClient.signUp.email({ email, password, name });
    setBusy(false);
    if (res.error) return setErr(res.error.message ?? "Signup failed");
    nav({ to: "/account" });
  }

  const F = "w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground";
  return (
    <div className="min-h-screen grid place-items-center px-6 pt-24">
      <div className="w-full max-w-sm space-y-4">
        <p className="eyebrow text-muted-foreground">Midi Africa</p>
        <h1 className="font-display text-4xl">Create account</h1>
        <button onClick={social} disabled={socialBusy} className="w-full border border-border eyebrow py-3.5 hover:border-foreground disabled:opacity-50">
          {socialBusy ? "Connecting to Google…" : "Continue with Google"}
        </button>
        {err && <p className="text-sm text-red-500">{err}</p>}
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="flex-1 border-t border-border" /> or <span className="flex-1 border-t border-border" /></div>
        <form onSubmit={submit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={F} required />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className={F} required />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password (8+ chars)" minLength={8} className={F} required />
          <button disabled={busy} className="w-full bg-foreground text-background eyebrow py-3.5 disabled:opacity-40">{busy ? "Creating…" : "Create account →"}</button>
        </form>
        <p className="text-sm text-muted-foreground">Have an account? <Link to="/login" className="underline underline-offset-4 text-foreground">Sign in</Link></p>
      </div>
    </div>
  );
}
