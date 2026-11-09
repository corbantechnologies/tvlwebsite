import { NextRequest, NextResponse } from "next/server";
import { getSession, type ResolvedStaff } from "./session";
import { isOwnerRole } from "./roles";
import { getDb } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

/** The signed-in admin or GM, or a 403 response. proxy.ts checks this too; this is the second lock. */
export async function requireOwner(req: NextRequest): Promise<ResolvedStaff | NextResponse> {
  const session = await getSession(req);
  if (!session || !isOwnerRole(session.role) || session.mustChangePassword) {
    return NextResponse.json({ error: "Only an admin or general manager can manage staff accounts." }, { status: 403 });
  }
  return session;
}

/** True if no active admin/GM would remain after `targetId` gets the given role and status. */
export async function wouldLeaveNoOwner(targetId: string, next: { role: string; active: boolean } | null): Promise<boolean> {
  const all = await getDb().select({ id: users.id, role: users.role, active: users.active }).from(users);
  return !all.some((u) => {
    if (u.id === targetId) return next !== null && next.active && isOwnerRole(next.role);
    return u.active && isOwnerRole(u.role);
  });
}

export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
