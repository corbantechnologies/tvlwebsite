import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { passwordResets, users } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { hashResetToken, passwordProblem } from "@/lib/auth/passwordReset";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { writeAuditLog } from "@/lib/audit";

// POST /api/auth/reset-password  (public)  { token, newPassword }
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, RATE_LIMITS.passwordReset, "reset");
  if (limited) return limited;

  try {
    await ensureDatabaseSeeded();
    const { token, newPassword } = await req.json().catch(() => ({}));
    if (!token) return NextResponse.json({ error: "This reset link is incomplete." }, { status: 400 });
    const problem = passwordProblem(newPassword);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });

    const db = getDb();
    const [reset] = await db
      .select()
      .from(passwordResets)
      .where(and(eq(passwordResets.token, hashResetToken(String(token))), eq(passwordResets.used, false)))
      .limit(1);
    if (!reset || new Date(reset.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: "This reset link has expired or was already used. Request a new one." }, { status: 400 });
    }

    // Claim the token first so it can only be used once, even if submitted twice.
    const [claimed] = await db
      .update(passwordResets)
      .set({ used: true })
      .where(and(eq(passwordResets.id, reset.id), eq(passwordResets.used, false)))
      .returning();
    if (!claimed) {
      return NextResponse.json({ error: "This reset link was already used. Request a new one." }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, reset.userId)).limit(1);
    if (!user || !user.active) {
      return NextResponse.json({ error: "This staff account is not active." }, { status: 403 });
    }

    await db.update(users).set({ passwordHash: await bcrypt.hash(String(newPassword), 12) }).where(eq(users.id, user.id));
    await writeAuditLog({
      actor: user.name,
      actorRole: user.role,
      category: "security",
      action: "Password Reset Completed",
      details: `${user.name} set a new password using a reset link.`,
      targetId: user.id,
    });
    return NextResponse.json({ success: true, message: "Password updated. You can sign in now." });
  } catch (err: any) {
    console.error("[ResetPassword]", err.message);
    return NextResponse.json({ error: "Could not reset the password. Please try again." }, { status: 500 });
  }
}
