import { getDb } from "@/lib/db/db";
import { bookings, bookingExtras } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { Resend } from "resend";
import { evaluateApartment, loadAvailabilityData } from "@/lib/availability";
import { writeAuditLog } from "@/lib/audit";
import { escapeHtml } from "@/lib/escapeHtml";
import { newGuestToken, newId } from "@/lib/ids";
import { recordVoucherRedemption } from "@/lib/vouchers";
import { paidLabel } from "@/lib/bookingFormat";
import { buildEReservationPdf, eReservationUrl } from "@/lib/eReservation";
import { whatsappLink } from "@/lib/contact";
export { paidLabel };

type Booking = typeof bookings.$inferSelect;

export interface FulfillBookingResult {
  success: boolean;
  booking: Booking | null;
  isNew: boolean;
  alreadyPaid?: boolean;
  /** Set when the payment could not be matched to an apartment booking. */
  unmatched?: boolean;
  /** Set when staff must review the booking (dates now blocked/sold out, or underpaid). */
  needsReview?: boolean;
}

export interface FulfillOptions {
  /** Send the guest confirmation email. Disabled by the recovery script. */
  notifyGuest?: boolean;
  /** Send the staff notification email. */
  notifyStaff?: boolean;
  /** Label used in audit logs. */
  actor?: string;
}

/**
 * Marks an apartment booking as paid after Paystack confirms the charge.
 *
 * Called by BOTH the Paystack webhook and the browser verify endpoint, so it
 * is idempotent and race-safe:
 *  - the normal path updates the `pending_payment` booking created at checkout
 *    (matched by reference, or by metadata.bookingId for "Pay Now" from the
 *    guest tracker), using a conditional UPDATE so only one caller wins;
 *  - the legacy path (transactions started before server-side checkout existed)
 *    creates the booking from metadata with ON CONFLICT DO NOTHING.
 *
 * It never refuses a confirmed payment. If the dates are no longer available,
 * or the amount paid is short, the booking is saved and flagged for staff.
 */
export async function fulfillApartmentBooking(
  reference: string,
  txData: any,
  opts: FulfillOptions = {}
): Promise<FulfillBookingResult> {
  const { notifyGuest = true, notifyStaff = true, actor = "Paystack Gateway" } = opts;
  const db = getDb();
  const metadata = txData.metadata || {};

  // 1. Find the booking this payment belongs to.
  let [existing] = await db.select().from(bookings).where(eq(bookings.bookingReference, reference)).limit(1);
  if (!existing && metadata.bookingId) {
    [existing] = await db.select().from(bookings).where(eq(bookings.id, String(metadata.bookingId))).limit(1);
  }

  let booking: Booking;
  let isNew = false;

  if (existing) {
    if (existing.paymentStatus === "paid") {
      return { success: true, booking: existing, isNew: false, alreadyPaid: true };
    }

    const [claimed] = await db
      .update(bookings)
      .set({
        paymentStatus: "paid",
        paymentMethod: txData.channel || "paystack",
        paymentReference: reference,
        amountPaid: Number(txData.amount) / 100,
        chargeCurrency: (txData.currency || existing.chargeCurrency || existing.currency || "USD").toUpperCase(),
        paidAt: txData.paid_at || new Date().toISOString(),
        bookingStatus: ["pending_payment", "expired", "payment_failed", "inquiry"].includes(existing.bookingStatus)
          ? "confirmed"
          : existing.bookingStatus,
      })
      .where(and(eq(bookings.id, existing.id), ne(bookings.paymentStatus, "paid")))
      .returning();

    if (!claimed) {
      // Another request (webhook or verify) confirmed it first.
      const [current] = await db.select().from(bookings).where(eq(bookings.id, existing.id)).limit(1);
      return { success: true, booking: current || existing, isNew: false, alreadyPaid: true };
    }
    booking = claimed;
  } else {
    // 2. Legacy path: no booking was created before payment.
    if (!metadata.apartmentId) {
      await writeAuditLog({
        actor,
        actorRole: "system",
        category: "booking",
        action: "Unmatched Paystack Payment",
        details: `Payment ${reference} (${txData.currency} ${txData.amount / 100}, ${txData.customer?.email || "no email"}) could not be matched to an apartment booking.`,
        targetId: reference,
        metadata: { reference, metadata },
      });
      return { success: false, booking: null, isNew: false, unmatched: true };
    }

    const nights = Number(metadata.nights) || 1;
    let guestToken = typeof metadata.guestToken === "string" && metadata.guestToken ? metadata.guestToken : newGuestToken();
    const [tokenTaken] = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.guestToken, guestToken)).limit(1);
    if (tokenTaken) guestToken = newGuestToken();

    const values = {
      id: newId("bkg"),
      bookingReference: reference,
      inquiryId: metadata.inquiryId || null,
      apartmentId: metadata.apartmentId,
      apartmentName: metadata.apartmentName || metadata.apartmentId,
      allocatedUnit: null,
      guestName: metadata.guestName || metadata.name || txData.customer?.first_name || "Guest",
      guestEmail: metadata.guestEmail || metadata.email || txData.customer?.email || "",
      guestPhone: metadata.guestPhone || metadata.phone || txData.customer?.phone || "",
      checkIn: metadata.checkIn || new Date().toISOString().split("T")[0],
      checkOut: metadata.checkOut || new Date(Date.now() + 86400000 * nights).toISOString().split("T")[0],
      adults: Number(metadata.adults) || 1,
      children: Number(metadata.children) || 0,
      mealPlanId: metadata.mealPlanId || null,
      mealPlanName: metadata.mealPlanName || null,
      mealPlanPricePerPersonUsd: Number(metadata.mealPlanPricePerPersonUsd || metadata.mealPlanRateUsd) || 0,
      mealPlanPricePerPersonKes: Number(metadata.mealPlanPricePerPersonKes) || 0,
      roomRateUsd: Number(metadata.roomRateUsd) || 0,
      roomRateKes: Number(metadata.roomRateKes) || 0,
      nights,
      totalRoomUsd: Number(metadata.totalRoomUsd) || 0,
      totalMealPlanUsd: Number(metadata.totalMealPlanUsd) || 0,
      totalExtrasUsd: Number(metadata.totalExtrasUsd) || 0,
      totalAmount: txData.amount / 100,
      currency: txData.currency || "USD",
      paymentStatus: "paid",
      paymentMethod: txData.channel || "paystack",
      paymentReference: reference,
      chargeCurrency: (txData.currency || "USD").toUpperCase(),
      chargeAmount: txData.amount / 100,
      amountPaid: txData.amount / 100,
      paidAt: txData.paid_at || new Date().toISOString(),
      bookingStatus: "confirmed",
      inquirySource: "village_apartment",
      specialRequests: metadata.specialRequests || null,
      staffNotes: [],
      guestToken,
      createdAt: new Date().toISOString(),
    };

    const [inserted] = await db
      .insert(bookings)
      .values(values)
      .onConflictDoNothing({ target: bookings.bookingReference })
      .returning();

    if (!inserted) {
      const [current] = await db.select().from(bookings).where(eq(bookings.bookingReference, reference)).limit(1);
      return { success: true, booking: current || null, isNew: false, alreadyPaid: true };
    }
    booking = inserted;
    isNew = true;

    if (Array.isArray(metadata.selectedExtras) && metadata.selectedExtras.length > 0) {
      try {
        await db.insert(bookingExtras).values(
          metadata.selectedExtras.map((extra: any) => {
            const qty = Number(extra.quantity) || 1;
            return {
              id: newId("bex"),
              bookingId: booking.id,
              extraId: extra.extraId || extra.id || "extra",
              extraName: extra.name || "Extra Amenity",
              quantity: qty,
              unitPriceUsd: Number(extra.priceUsd) || 0,
              unitPriceKes: Number(extra.priceKes) || 0,
              totalPriceUsd: (Number(extra.priceUsd) || 0) * qty,
              totalPriceKes: (Number(extra.priceKes) || 0) * qty,
              notes: null,
              createdAt: new Date().toISOString(),
            };
          })
        );
      } catch (err: any) {
        console.warn("[FulfillBooking] Failed to insert booking extras:", err.message);
      }
    }
  }

  // 3. Sanity checks that need a human: short payment, or dates no longer free.
  const reviewReasons: string[] = [];
  const paidMajor = txData.amount / 100;
  const paidCurrency = (txData.currency || "").toUpperCase();
  // Compare against what checkout asked Paystack to charge (KES or USD), else the USD total.
  const expected =
    existing?.chargeCurrency && existing.chargeAmount != null && existing.chargeCurrency.toUpperCase() === paidCurrency
      ? { currency: paidCurrency, amount: Number(existing.chargeAmount) }
      : paidCurrency === (booking.currency || "").toUpperCase()
        ? { currency: paidCurrency, amount: Number(booking.totalAmount) }
        : null;
  if (expected && paidMajor + 0.01 < expected.amount) {
    reviewReasons.push(`Paid ${paidCurrency} ${paidMajor} but ${expected.currency} ${expected.amount} was due.`);
  } else if (!expected) {
    reviewReasons.push(`Paid in ${paidCurrency || "an unknown currency"} (${paidMajor}); please confirm it covers the ${booking.currency} ${booking.totalAmount} total.`);
  }
  try {
    const data = await loadAvailabilityData(db);
    const check = evaluateApartment(data, booking.apartmentId, booking.checkIn, booking.checkOut, {
      excludeBookingId: booking.id,
    });
    if (check.availableUnits <= 0) {
      reviewReasons.push(
        `${booking.apartmentName} is no longer available for ${booking.checkIn} to ${booking.checkOut} (${check.reason || "blocked or fully booked"}). Payment was received anyway; please relocate or refund.`
      );
    }
  } catch (err: any) {
    console.warn("[FulfillBooking] Availability re-check failed:", err.message);
  }

  if (reviewReasons.length > 0) {
    const notes = [
      ...((booking.staffNotes as any[]) || []),
      ...reviewReasons.map((text) => ({ text: `ACTION NEEDED: ${text}`, author: "System", timestamp: new Date().toISOString() })),
    ];
    try {
      await db.update(bookings).set({ staffNotes: notes }).where(eq(bookings.id, booking.id));
      booking = { ...booking, staffNotes: notes };
    } catch (err: any) {
      console.warn("[FulfillBooking] Failed to save review note:", err.message);
    }
  }

  await writeAuditLog({
    actor,
    actorRole: "system",
    category: "booking",
    action: isNew ? "Booking Created & Payment Verified" : "Booking Payment Verified",
    details: `Payment of ${txData.currency} ${paidMajor} confirmed for booking ${booking.bookingReference} (${booking.guestName})${reviewReasons.length ? ` — needs review: ${reviewReasons.join(" ")}` : ""}`,
    targetId: booking.id,
    metadata: { bookingReference: booking.bookingReference, paymentReference: reference, channel: txData.channel, reviewReasons },
  });

  await recordVoucherRedemption(metadata.voucherCode);

  await Promise.allSettled([
    notifyGuest ? sendApartmentBookingEmail(booking) : Promise.resolve(),
    notifyStaff ? notifyStaffApartmentBooking(booking, reviewReasons) : Promise.resolve(),
  ]);

  return { success: true, booking, isNew, alreadyPaid: false, needsReview: reviewReasons.length > 0 };
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://tamarindvillage.co.ke";
}

function senderEmail(): string {
  return process.env.EMAIL_FROM || "reservations.village@tamarind.co.ke";
}

export async function sendApartmentBookingEmail(booking: Booking) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[Booking Email] Skipped: RESEND_API_KEY is not configured.");
    return;
  }
  if (!booking.guestEmail) {
    console.warn("[Booking Email] Skipped: no guest email for booking", booking.bookingReference);
    return;
  }

  const resend = new Resend(key);
  const guestPortalUrl = `${siteUrl()}/track?token=${encodeURIComponent(booking.guestToken || "")}`;
  const eResUrl = eReservationUrl(booking);
  const waUrl = whatsappLink(`Hello Tamarind Village, this is ${booking.guestName} (booking ${booking.bookingReference}).`);
  const e = escapeHtml;

  // The e-reservation PDF; the email still goes out if it cannot be built.
  let attachments: { filename: string; content: Buffer }[] | undefined;
  try {
    attachments = [{ filename: `Tamarind-Village-${booking.bookingReference}.pdf`, content: await buildEReservationPdf(booking) }];
  } catch (err: any) {
    console.warn("[Booking Email] e-reservation PDF failed:", err.message);
  }

  try {
    const result = await resend.emails.send({
      from: senderEmail(),
      to: booking.guestEmail,
      replyTo: process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke",
      attachments,
      subject: `Your Tamarind Village Reservation — ${booking.bookingReference}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fdfaf7;border:1px solid #e2d9d0;padding:40px;color:#1F1615">
          <h1 style="color:#821124;font-size:22px;letter-spacing:2px;text-transform:uppercase;text-align:center">Tamarind Village</h1>
          <hr style="border:none;border-top:1px solid #e2d9d0;margin:24px 0"/>
          <h2 style="font-size:18px">Reservation Confirmed &amp; Paid</h2>
          <p style="font-size:14px;line-height:1.8">Dear ${e(booking.guestName)},</p>
          <p style="font-size:14px;line-height:1.8">Your payment via Paystack was successful. Your reservation is officially confirmed!</p>
          <div style="background:#f5f0eb;border-left:4px solid #821124;padding:20px;margin:24px 0">
            <table style="width:100%;font-size:13px;border-collapse:collapse">
              <tr><td style="padding:6px 0;color:#8b7355;width:40%">Booking Reference</td><td style="font-weight:bold;color:#821124">${e(booking.bookingReference)}</td></tr>
              <tr><td style="padding:6px 0;color:#8b7355">Suite</td><td>${e(booking.apartmentName)}</td></tr>
              <tr><td style="padding:6px 0;color:#8b7355">Check-In</td><td>${e(booking.checkIn)}</td></tr>
              <tr><td style="padding:6px 0;color:#8b7355">Check-Out</td><td>${e(booking.checkOut)}</td></tr>
              <tr><td style="padding:6px 0;color:#8b7355">Nights</td><td>${e(booking.nights)}</td></tr>
              <tr><td style="padding:6px 0;color:#8b7355">Guests</td><td>${e(booking.adults)} adults${booking.children > 0 ? `, ${e(booking.children)} children` : ""}</td></tr>
              ${booking.mealPlanName ? `<tr><td style="padding:6px 0;color:#8b7355">Meal Plan</td><td>${e(booking.mealPlanName)}</td></tr>` : ""}
              ${booking.specialRequests ? `<tr><td style="padding:6px 0;color:#8b7355">Special Requests</td><td>${e(booking.specialRequests)}</td></tr>` : ""}
              <tr><td style="padding:6px 0;color:#8b7355">Total Paid</td><td style="font-weight:bold;color:#047857">${e(paidLabel(booking))}</td></tr>
            </table>
          </div>
          <p style="font-size:13px;line-height:1.8">Your e-reservation is attached as a PDF. Show its QR code at reception, or open it online:</p>
          <p style="text-align:center;margin:20px 0">
            <a href="${e(eResUrl)}" style="background:#821124;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;display:inline-block;font-family:sans-serif;font-size:13px;margin:4px">View e-reservation</a>
            <a href="${e(guestPortalUrl)}" style="background:#1F1615;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;display:inline-block;font-family:sans-serif;font-size:13px;margin:4px">Check in online</a>
            <a href="${e(waUrl)}" style="background:#25D366;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;display:inline-block;font-family:sans-serif;font-size:13px;margin:4px">WhatsApp us</a>
          </p>
          <div style="background:#fffbe8;border:1px solid #e2c589;padding:16px;border-radius:4px;margin:24px 0">
            <p style="font-size:13px;margin:0"><strong>Manage your booking online:</strong></p>
            <p style="font-size:12px;margin:8px 0 0;color:#8b7355">Access token: <strong style="color:#1F1615">${e(booking.guestToken)}</strong></p>
            <p style="font-size:12px;margin:4px 0 0">View or update booking: <a href="${e(guestPortalUrl)}" style="color:#821124;font-weight:bold">${e(guestPortalUrl)}</a></p>
          </div>
          <p style="font-size:13px;color:#6b5d54">📞 +254 725 959 552<br/>✉ reservations.village@tamarind.co.ke<br/>📍 Silversands Road, Nyali, Mombasa, Kenya</p>
        </div>`,
    });
    if (result.error) console.error("[Booking Email] Resend delivery error for guest:", result.error);
  } catch (err: any) {
    console.error("[Booking Email] Unexpected exception:", err.message);
  }
}

export async function notifyStaffApartmentBooking(booking: Booking, reviewReasons: string[] = []) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);
  const staffEmail = process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke";
  const e = escapeHtml;
  const needsReview = reviewReasons.length > 0;

  try {
    const result = await resend.emails.send({
      from: senderEmail(),
      to: staffEmail,
      subject: `${needsReview ? "[ACTION NEEDED] " : ""}[Paid Reservation] ${booking.guestName} · ${booking.bookingReference}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;padding:24px;border:1px solid #e2d9d0">
          <h2 style="color:#821124">Paid Reservation Confirmed</h2>
          ${
            needsReview
              ? `<div style="background:#fef2f2;border:1px solid #fca5a5;padding:12px;margin-bottom:16px"><strong>Needs review:</strong><ul>${reviewReasons
                  .map((r) => `<li>${e(r)}</li>`)
                  .join("")}</ul></div>`
              : ""
          }
          <p><strong>Reference:</strong> ${e(booking.bookingReference)}</p>
          <p><strong>Guest:</strong> ${e(booking.guestName)} (${e(booking.guestEmail)} / ${e(booking.guestPhone)})</p>
          <p><strong>Suite:</strong> ${e(booking.apartmentName)}</p>
          <p><strong>Check-In:</strong> ${e(booking.checkIn)} → <strong>Check-Out:</strong> ${e(booking.checkOut)} (${e(booking.nights)} nights)</p>
          <p><strong>Occupancy:</strong> ${e(booking.adults)} Adults, ${e(booking.children)} Children</p>
          ${booking.mealPlanName ? `<p><strong>Meal Plan:</strong> ${e(booking.mealPlanName)}</p>` : ""}
          ${booking.specialRequests ? `<p><strong>Special Requests:</strong> ${e(booking.specialRequests)}</p>` : ""}
          <p><strong>Total Paid:</strong> ${e(paidLabel(booking))}</p>
          <p><strong>Payment Method:</strong> ${e(booking.paymentMethod)} (Ref: ${e(booking.paymentReference || booking.bookingReference)})</p>
          <p><strong>Guest Access Token:</strong> <code>${e(booking.guestToken)}</code></p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
          <p><a href="${e(siteUrl())}/admin/bookings" style="background:#821124;color:#fff;padding:8px 16px;text-decoration:none;border-radius:4px;display:inline-block">Open Admin Bookings</a></p>
        </div>`,
    });
    if (result.error) console.error("[Staff Booking Email] Resend delivery error:", result.error);
  } catch (err: any) {
    console.error("[Staff Booking Email] Unexpected exception:", err.message);
  }
}
