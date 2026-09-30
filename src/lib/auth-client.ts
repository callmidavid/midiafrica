// Client-side auth (safe for browser — no secrets).
import { createAuthClient } from "better-auth/react";

const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.PUBLIC_SITE_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

export const authClient = createAuthClient({ baseURL });

export const { useSession, signIn, signUp, signOut } = authClient;
