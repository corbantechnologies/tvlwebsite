import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { passwordResets, users } from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import { sendEmail, siteUrl } from "@/lib/mailer";
import { escapeHtml } from "@/lib/escapeHtml";
import { INVITE_TOKEN_TTL_MS, RESET_TOKEN_TTL_MS, newResetToken } from "./passwordReset";

// ============================================================
// Staff password links (emailed through Resend) and temporary
// passwords (for when email is not set up). Staff emails only:
// nothing here ever writes to a guest.
// ============================================================

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/** A readable random password for an admin to pass on. The user must replace it at first sign-in. */
export function temporaryPassword(): string {
  return `Tv-${randomBytes(9).toString("base64url")}`;
}

/**
 * Emails a one-time link to choose a password. "invite" is for a new account
 * (valid 3 days), "reset" for a forgotten password (valid 1 hour). Once the new
 * link is sent, earlier unused links for the same person stop working.
 * Returns false if the email could not be sent.
 */
export async function sendPasswordLink(user: { id: string; name: string; email: string }, kind: "reset" | "invite"): Promise<boolean> {
  if (!emailConfigured()) return false;
  const db = getDb();
  const { token, hash } = newResetToken();
  const now = Date.now();
  const id = newId("pwr");
  await db.insert(passwordResets).values({
    id,
    userId: user.id,
    token: hash,
    expiresAt: new Date(now + (kind === "invite" ? INVITE_TOKEN_TTL_MS : RESET_TOKEN_TTL_MS)).toISOString(),
    used: false,
    createdAt: new Date(now).toISOString(),
  });

  const link = `${siteUrl()}/admin/login?reset=${encodeURIComponent(token)}`;
  const valid = kind === "invite" ? "3 days" : "one hour";
  const intro =
    kind === "invite"
      ? "A Tamarind staff portal account has been created for you. Use the button below to choose your password."
      : "Someone asked to reset the password for your Tamarind staff portal account. If it was you, use the button below.";
  const sent = await sendEmail({
    to: user.email,
    subject: kind === "invite" ? "Your Tamarind staff portal account" : "Reset your Tamarind staff portal password",
    html: `<div style="font-family:sans-serif;max-width:560px;padding:24px;border:1px solid #e2d9d0">
      <h2 style="color:#821124;margin-top:0">${kind === "invite" ? "Welcome to the staff portal" : "Password reset"}</h2>
      <p>Hi ${escapeHtml(user.name)},</p>
      <p>${intro}</p>
      <p><a href="${escapeHtml(link)}" style="background:#821124;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;display:inline-block">Choose a password</a></p>
      <p style="font-size:12px;color:#777">The link works once and expires in ${valid}. Your sign-in email is ${escapeHtml(user.email)}.
      If you did not expect this email, you can ignore it.</p>
    </div>`,
  });
  if (!sent) {
    await db.delete(passwordResets).where(eq(passwordResets.id, id));
    return false;
  }
  await db
    .update(passwordResets)
    .set({ used: true })
    .where(and(eq(passwordResets.userId, user.id), eq(passwordResets.used, false), ne(passwordResets.id, id)));
  return true;
}

/**
 * Sets a new password. `temporary` means an admin chose or generated it, so the
 * user must replace it at next sign-in. Either way every older session ends.
 */
export async function setStaffPassword(userId: string, password: string, opts: { temporary: boolean }) {
  const db = getDb();
  await db
    .update(users)
    .set({
      passwordHash: await bcrypt.hash(password, 12),
      mustChangePassword: opts.temporary,
      passwordChangedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId));
  // Any outstanding reset link is now stale.
  await db.update(passwordResets).set({ used: true }).where(and(eq(passwordResets.userId, userId), eq(passwordResets.used, false)));
}
