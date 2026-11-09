import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { writeAuditLog } from "@/lib/audit";
import { emailConfigured, sendPasswordLink } from "@/lib/auth/passwordLinks";

const GENERIC = "If that email belongs to an active staff account, a reset link is on its way. It expires in one hour. Check your spam folder too.";
const NO_EMAIL =
  "Password reset emails are not set up on this site yet. Ask an admin to reset your password from Staff Team; they will give you a temporary one.";

// POST /api/auth/forgot-password  (public)  { email }
// Gives the same answer whether or not the email has an account, so it cannot be used to discover staff emails.
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, RATE_LIMITS.passwordReset);
  if (limited) return limited;

  if (!emailConfigured()) return NextResponse.json({ success: true, message: NO_EMAIL });

  try {
    await ensureDatabaseSeeded();
    const { email } = await req.json().catch(() => ({}));
    const clean = String(email || "").trim().toLowerCase();
    if (!clean) return NextResponse.json({ error: "Enter your staff email address." }, { status: 400 });

    const [user] = await getDb().select().from(users).where(eq(users.email, clean)).limit(1);
    if (user && user.active) {
      const sent = await sendPasswordLink(user, "reset");
      await writeAuditLog({
        actor: user.name,
        actorRole: user.role,
        category: "security",
        action: sent ? "Password Reset Requested" : "Password Reset Email Failed",
        details: sent
          ? `Password reset link sent to ${user.email}.`
          : `Could not email a reset link to ${user.email}. Check RESEND_API_KEY and that EMAIL_FROM's domain is verified in Resend.`,
        targetId: user.id,
      });
    }
    return NextResponse.json({ success: true, message: GENERIC });
  } catch (err: any) {
    console.error("[ForgotPassword]", err.message);
    return NextResponse.json({ success: true, message: GENERIC });
  }
}
