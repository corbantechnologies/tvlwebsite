import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { COOKIE_NAME, SESSION_COOKIE_OPTIONS, createSessionToken, getSession } from "@/lib/auth/session";
import { passwordProblem } from "@/lib/auth/passwordReset";
import { setStaffPassword } from "@/lib/auth/passwordLinks";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { writeAuditLog } from "@/lib/audit";

// POST /api/auth/change-password  (any signed-in staff member)  { currentPassword, newPassword }
// Signs out the user's other devices and keeps this one signed in.
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });

  const limited = await rateLimit(req, RATE_LIMITS.login, `chpw:${session.id}`);
  if (limited) return limited;

  try {
    const { currentPassword, newPassword } = await req.json().catch(() => ({}));
    const problem = passwordProblem(newPassword);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: "Choose a password different from the current one." }, { status: 400 });
    }

    const [user] = await getDb().select().from(users).where(eq(users.id, session.id)).limit(1);
    if (!user || !user.active) return NextResponse.json({ error: "This staff account is not active." }, { status: 403 });
    if (!(await bcrypt.compare(String(currentPassword || ""), user.passwordHash))) {
      await writeAuditLog({
        actor: user.name,
        actorRole: user.role,
        category: "security",
        action: "Password Change Failed",
        details: `${user.name} entered a wrong current password.`,
        targetId: user.id,
      });
      return NextResponse.json({ error: "Your current password is not correct." }, { status: 400 });
    }

    await setStaffPassword(user.id, String(newPassword), { temporary: false });
    await writeAuditLog({
      actor: user.name,
      actorRole: user.role,
      category: "security",
      action: "Password Changed",
      details: `${user.name} changed their password.`,
      targetId: user.id,
    });

    const token = await createSessionToken({ id: user.id, name: user.name, email: user.email, role: user.role as any });
    const res = NextResponse.json({ success: true, message: "Password changed. Other devices have been signed out." });
    res.cookies.set(COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    return res;
  } catch (err: any) {
    console.error("[ChangePassword]", err.message);
    return NextResponse.json({ error: "Could not change the password. Please try again." }, { status: 500 });
  }
}
