// Promote a user to admin: ADMIN_EMAIL=you@example.com bun ./scripts/promote-admin.ts
// Sign up / log in with that email first, then run this.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { user } from "../src/db/schema";

const email = process.env.ADMIN_EMAIL;
if (!email) throw new Error("Set ADMIN_EMAIL in .env first");

const db = drizzle(neon(process.env.DATABASE_URL!));
const rows = await db.update(user).set({ role: "admin" }).where(eq(user.email, email)).returning({ id: user.id, email: user.email });
if (!rows.length) throw new Error(`No user found with email ${email} — sign up first, then retry`);
console.log("Promoted to admin:", rows[0].email);
