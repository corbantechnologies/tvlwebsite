import type { bookings } from "@/lib/db/schema";
import { escapeHtml } from "@/lib/escapeHtml";
import { sendEmail } from "@/lib/mailer";
import { PROPERTY } from "@/lib/contact";

type Booking = typeof bookings.$inferSelect;

/**
 * Post-stay thank-you with a review link. Sent by the nightly job only when
 * REVIEW_EMAILS_ENABLED=true, once per booking, 1 to 3 days after check-out.
 */
export async function sendReviewRequestEmail(b: Booking): Promise<boolean> {
  if (!b.guestEmail) return false;
  const reviewUrl = process.env.GOOGLE_REVIEW_URL || "https://g.page/r/tamarind-village/review";
  const e = escapeHtml;
  return sendEmail({
    to: b.guestEmail,
    replyTo: PROPERTY.email,
    subject: "Thank you for staying at Tamarind Village",
    html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fdfaf7;border:1px solid #e2d9d0;padding:36px;color:#1F1615">
      <h1 style="color:#821124;font-size:20px;letter-spacing:2px;text-transform:uppercase;text-align:center">Tamarind Village</h1>
      <p style="font-size:14px;line-height:1.8">Dear ${e(b.guestName)},</p>
      <p style="font-size:14px;line-height:1.8">Thank you for staying with us in the ${e(b.apartmentName)}. We hope you enjoyed Mombasa and the view from the cliff.</p>
      <p style="font-size:14px;line-height:1.8">If you have two minutes, a short review helps other travellers find us and helps our team improve.</p>
      <p style="text-align:center;margin:28px 0"><a href="${e(reviewUrl)}" style="background:#821124;color:#fff;padding:12px 22px;text-decoration:none;border-radius:4px;display:inline-block;font-family:sans-serif;font-size:13px">Leave a review</a></p>
      <p style="font-size:13px;line-height:1.8">Anything we could have done better? Just reply to this email; it goes straight to our reservations team.</p>
      <p style="font-size:12px;color:#8b7355">${e(PROPERTY.phoneDisplay)} · ${e(PROPERTY.email)}</p>
    </div>`,
  });
}
