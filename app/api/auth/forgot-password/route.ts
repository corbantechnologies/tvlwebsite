import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { passwordResets, users } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { newId } from "@/lib/ids";
import { newResetToken, RESET_TOKEN_TTL_MS } from "@/lib/auth/passwordReset";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { sendEmail, siteUrl } from "@/lib/mailer";
import { escapeHtml } from "@/lib/escapeHtml";
import { writeAuditLog } from "@/lib/audit";

const GENERIC = "If that email belongs to an active staff account, a reset link is on its way. It expires in one hour.";

// POST /api/auth/forgot-password  (public)  { email }
// Always gives the same answer, so it cannot be used to discover staff emails.
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, RATE_LIMITS.passwordReset);
  if (limited) return limited;

  try {
    await ensureDatabaseSeeded();
    const { email } = await req.json().catch(() => ({}));
    const clean = String(email || "").trim().toLowerCase();
    if (!clean) return NextResponse.json({ error: "Enter your staff email address." }, { status: 400 });

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, clean)).limit(1);
    if (user && user.active) {
      const { token, hash } = newResetToken();
      const now = Date.now();
      await db.insert(passwordResets).values({
        id: newId("pwr"),
        userId: user.id,
        token: hash,
        expiresAt: new Date(now + RESET_TOKEN_TTL_MS).toISOString(),
        used: false,
        createdAt: new Date(now).toISOString(),
      });
      const link = `${siteUrl()}/admin/login?reset=${encodeURIComponent(token)}`;
      await sendEmail({
        to: user.email,
        subject: "Reset your Tamarind staff portal password",
        html: `<div style="font-family:sans-serif;max-width:560px;padding:24px;border:1px solid #e2d9d0">
          <h2 style="color:#821124;margin-top:0">Password reset</h2>
          <p>Hi ${escapeHtml(user.name)},</p>
          <p>Someone asked to reset the password for your Tamarind staff portal account. If it was you, use the button below within one hour.</p>
          <p><a href="${escapeHtml(link)}" style="background:#821124;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;display:inline-block">Choose a new password</a></p>
          <p style="font-size:12px;color:#777">If you did not ask for this, ignore this email; your password stays the same.</p>
        </div>`,
      });
      await writeAuditLog({
        actor: user.name,
        actorRole: user.role,
        category: "security",
        action: "Password Reset Requested",
        details: `Password reset link sent to ${user.email}.`,
        targetId: user.id,
      });
    }
    return NextResponse.json({ success: true, message: GENERIC });
  } catch (err: any) {
    console.error("[ForgotPassword]", err.message);
    return NextResponse.json({ success: true, message: GENERIC });
  }
}
