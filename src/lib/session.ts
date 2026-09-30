// Server-only session helpers for server functions + admin guards.
import { getAuth } from "@/lib/auth";

export async function getSessionUser(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function requireAdmin(request: Request) {
  const user = await getSessionUser(request);
  if (!user || (user as { role?: string }).role !== "admin") {
    throw new Response("Forbidden — admin only", { status: 403 });
  }
  return user;
}
