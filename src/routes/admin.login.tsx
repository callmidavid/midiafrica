import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const nav = useNavigate();
  const { data: session, isPending } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  if (!isPending && session?.user) {
    nav({ to: "/admin" });
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await authClient.signIn.email({ email, password });
    if (res.error) return setErr(res.error.message ?? "Login failed");
    // role is verified by AdminShell; non-admins get a 403 page
    nav({ to: "/admin" });
  }

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm border border-border p-8 space-y-4">
        <p className="eyebrow text-muted-foreground">Midi Africa · Admin</p>
        <h1 className="font-display text-3xl">Staff sign in</h1>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Admin email" className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground" required />
        {err && <p className="text-sm text-red-500">{err}</p>}
        <button className="w-full bg-foreground text-background eyebrow py-3">Sign in →</button>
      </form>
    </div>
  );
}
