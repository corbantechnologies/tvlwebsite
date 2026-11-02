import { Resend } from "resend";

// ============================================================
// One place to send email through Resend. Never throws: a failed
// email must not fail the booking, payment or request around it.
// ============================================================

export type MailAttachment = { filename: string; content: Buffer | string; contentType?: string };

export function senderAddress(): string {
  return process.env.EMAIL_FROM || "reservations.village@tamarind.co.ke";
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://tamarindvillage.co.ke").replace(/\/$/, "");
}

export async function sendEmail(msg: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: MailAttachment[];
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[Mail] Skipped "${msg.subject}": RESEND_API_KEY is not set.`);
    return false;
  }
  const to = Array.isArray(msg.to) ? msg.to.filter(Boolean) : msg.to;
  if (!to || (Array.isArray(to) && to.length === 0)) return false;
  try {
    const result = await new Resend(key).emails.send({
      from: senderAddress(),
      to,
      subject: msg.subject,
      html: msg.html,
      replyTo: msg.replyTo,
      attachments: msg.attachments,
    });
    if (result.error) {
      console.error(`[Mail] Resend error for "${msg.subject}":`, result.error);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error(`[Mail] Failed to send "${msg.subject}":`, err.message);
    return false;
  }
}
