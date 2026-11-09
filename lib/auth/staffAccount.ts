import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

// ============================================================
// The staff session cookie is a signed token that lasts 7 days. On its
// own it would keep a removed user signed in, and keep an old role,
// until it expired. So every staff request re-reads the account here:
// a deactivated account, a changed role or a password change takes
// effect on the next request. (No in-memory cache: proxy.ts and the
// API routes run as separate serverless functions, so one could not
// clear the other's copy. The lookup is a single primary-key read.)
// ============================================================

export type StaffAccountState = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  mustChangePassword: boolean;
  passwordChangedAt: string | null;
};

/** Reads the account, or throws if the database cannot be reached. */
export async function loadStaffAccount(id: string): Promise<StaffAccountState | null> {
  await ensureDatabaseSeeded();
  const [row] = await getDb()
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      mustChangePassword: users.mustChangePassword,
      passwordChangedAt: users.passwordChangedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row ?? null;
}

/** True when the session was signed in before the password was last changed. */
export function sessionPredatesPasswordChange(issuedAtSeconds: number | undefined, passwordChangedAt: string | null): boolean {
  if (!passwordChangedAt || !issuedAtSeconds) return false;
  const changed = Math.floor(new Date(passwordChangedAt).getTime() / 1000);
  return Number.isFinite(changed) && issuedAtSeconds < changed;
}
