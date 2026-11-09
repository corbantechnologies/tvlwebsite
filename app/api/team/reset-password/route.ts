import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { sendPasswordLink, setStaffPassword, temporaryPassword } from "@/lib/auth/passwordLinks";
import { requireOwner } from "@/lib/auth/teamAdmin";

// POST /api/team/reset-password  { id, method: "email" | "temporary" }
// "email" sends the person a one-hour reset link; "temporary" sets a new password
// now and returns it once, for the admin to pass on. Either way the person's
// other sessions end and they choose their own password at next sign-in.
export async function POST(req: NextRequest) {
  const admin = await requireOwner(req);
  if (admin instanceof NextResponse) return admin;
  try {
    const { id, method } = await req.json().catch(() => ({}));
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, String(id || ""))).limit(1);
    if (!user) return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    if (user.id === admin.id) {
      return NextResponse.json({ error: "Change your own password from My account." }, { status: 400 });
    }
    if (!user.active) return NextResponse.json({ error: "Reactivate this account first." }, { status: 400 });

    if (method === "email") {
      const sent = await sendPasswordLink(user, "reset");
      if (!sent) {
        return NextResponse.json(
          { error: "The reset email could not be sent (check RESEND_API_KEY and EMAIL_FROM in Vercel). Use a temporary password instead." },
          { status: 502 }
        );
      }
      await writeAuditLog({
        actor: admin.name,
        actorRole: admin.role,
        category: "security",
        action: "Staff Password Reset Link Sent",
        details: `${admin.name} emailed ${user.email} a password reset link.`,
        targetId: user.id,
      });
      return NextResponse.json({ success: true, message: `Reset link emailed to ${user.email}. It works for one hour.` });
    }

    const password = temporaryPassword();
    await setStaffPassword(user.id, password, { temporary: true });
    await writeAuditLog({
      actor: admin.name,
      actorRole: admin.role,
      category: "security",
      action: "Staff Password Reset",
      details: `${admin.name} set a temporary password for ${user.email}. They must choose their own at next sign-in.`,
      targetId: user.id,
    });
    return NextResponse.json({ success: true, temporaryPassword: password });
  } catch (error: any) {
    console.error("POST /api/team/reset-password error:", error);
    return NextResponse.json({ error: "Could not reset the password." }, { status: 500 });
  }
}
