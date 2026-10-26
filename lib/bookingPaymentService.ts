import { getDb } from "@/lib/db/db";
import { bookings, bookingExtras, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

export interface FulfillBookingResult {
  success: boolean;
  booking: any;
  isNew: boolean;
  alreadyPaid?: boolean;
}

/**
 * Idempotently fulfills an apartment booking following Paystack payment confirmation.
 * Safe to be called multiple times (e.g. by Webhook AND browser verify endpoint).
 */
export async function fulfillApartmentBooking(
  reference: string,
  txData: any
): Promise<FulfillBookingResult> {
  const db = getDb();
  const metadata = txData.metadata || {};

  // 1. Check if a booking already exists for this reference
  const existingRows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.bookingReference, reference))
    .limit(1);

  if (existingRows.length > 0) {
    const existingBooking = existingRows[0];
    if (existingBooking.paymentStatus === "paid") {
      console.log(`[FulfillBooking] Booking ${reference} already confirmed & paid.`);
      return {
        success: true,
        booking: existingBooking,
        isNew: false,
        alreadyPaid: true,
      };
    }

    // Update existing unpaid booking to paid
    await db
      .update(bookings)
      .set({
        paymentStatus: "paid",
        paymentMethod: txData.channel || "paystack",
        paymentReference: reference,
        bookingStatus: "confirmed",
      })
      .where(eq(bookings.id, existingBooking.id));

    const updatedBooking = {
      ...existingBooking,
      paymentStatus: "paid",
      paymentMethod: txData.channel || "paystack",
      paymentReference: reference,
      bookingStatus: "confirmed",
    };

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: "Paystack Gateway",
      actorRole: "system",
      category: "booking",
      action: "Booking Payment Verified",
      details: `Payment of ${txData.currency} ${Math.round(txData.amount / 100)} verified for existing booking ${reference} (${updatedBooking.guestName})`,
      targetId: updatedBooking.id,
      metadata: { bookingReference: reference, channel: txData.channel },
    });

    // Send emails
    await Promise.allSettled([
      sendApartmentBookingEmail(updatedBooking),
      notifyStaffApartmentBooking(updatedBooking),
    ]);

    return {
      success: true,
      booking: updatedBooking,
      isNew: false,
      alreadyPaid: false,
    };
  }

  // 2. Booking does not exist — Create new booking record from metadata
  const rawToken = Math.random().toString(36).substring(2, 8).toUpperCase();
  const guestToken = metadata.guestToken || `TVL-${rawToken}`;
  const nights = Number(metadata.nights) || 1;

  const newBooking = {
    id: "bkg_" + Date.now(),
    bookingReference: reference,
    inquiryId: metadata.inquiryId || null,
    apartmentId: metadata.apartmentId || "1-bedroom",
    apartmentName: metadata.apartmentName || "1 Bedroom Suite",
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
    totalAmount: Math.round(txData.amount / 100),
    currency: txData.currency || "USD",
    paymentStatus: "paid",
    paymentMethod: txData.channel || "paystack",
    paymentReference: reference,
    bookingStatus: "confirmed",
    inquirySource: "village_apartment",
    specialRequests: metadata.specialRequests || null,
    staffNotes: [],
    guestToken,
    createdAt: new Date().toISOString(),
  };

  await db.insert(bookings).values(newBooking);

  // 3. Insert selected extras if present in metadata
  if (Array.isArray(metadata.selectedExtras) && metadata.selectedExtras.length > 0) {
    try {
      for (const extra of metadata.selectedExtras) {
        await db.insert(bookingExtras).values({
          id: "bex_" + Math.random().toString(36).substring(2, 9),
          bookingId: newBooking.id,
          extraId: extra.extraId || extra.id || "extra",
          extraName: extra.name || "Extra Amenity",
          quantity: Number(extra.quantity) || 1,
          unitPriceUsd: Number(extra.priceUsd) || 0,
          unitPriceKes: Number(extra.priceKes) || 0,
          totalPriceUsd: (Number(extra.priceUsd) || 0) * (Number(extra.quantity) || 1),
          totalPriceKes: (Number(extra.priceKes) || 0) * (Number(extra.quantity) || 1),
          notes: null,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.warn("[FulfillBooking] Failed to insert booking extras:", err.message);
    }
  }

  // 4. Log audit entry
  await db.insert(auditLogs).values({
    id: "log_" + Date.now(),
    timestamp: new Date().toISOString(),
    actor: "Paystack Gateway",
    actorRole: "system",
    category: "booking",
    action: "Booking Created & Payment Verified",
    details: `Payment of ${txData.currency} ${Math.round(txData.amount / 100)} confirmed for new booking ${newBooking.bookingReference} (${newBooking.guestName})`,
    targetId: newBooking.id,
    metadata: { bookingReference: newBooking.bookingReference, channel: txData.channel },
  });

  // 5. Send confirmation emails to guest and staff
  await Promise.allSettled([
    sendApartmentBookingEmail(newBooking),
    notifyStaffApartmentBooking(newBooking),
  ]);

  return {
    success: true,
    booking: newBooking,
    isNew: true,
    alreadyPaid: false,
  };
}

export async function sendApartmentBookingEmail(booking: any) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[Booking Email] Skipped: RESEND_API_KEY is not configured.");
    return;
  }
  if (!booking.guestEmail) {
    console.warn("[Booking Email] Skipped: No guest email address provided for booking", booking.bookingReference);
    return;
  }

  const resend = new Resend(key);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://tamarindvillage.co.ke";
  const guestPortalUrl = `${siteUrl}/track?token=${booking.guestToken}`;
  const senderEmail = process.env.EMAIL_FROM || "reservations.village@tamarind.co.ke";

  try {
    const result = await resend.emails.send({
      from: senderEmail,
      to: booking.guestEmail,
      subject: `Your Tamarind Village Reservation — ${booking.bookingReference}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fdfaf7;border:1px solid #e2d9d0;padding:40px;color:#1F1615">
          <h1 style="color:#821124;font-size:22px;letter-spacing:2px;text-transform:uppercase;text-align:center">Tamarind Village</h1>
          <hr style="border:none;border-top:1px solid #e2d9d0;margin:24px 0"/>
          <h2 style="font-size:18px">Reservation Confirmed &amp; Paid</h2>
          <p style="font-size:14px;line-height:1.8">Dear ${booking.guestName},</p>
          <p style="font-size:14px;line-height:1.8">Your payment via Paystack was successful. Your reservation is officially confirmed!</p>
          <div style="background:#f5f0eb;border-left:4px solid #821124;padding:20px;margin:24px 0">
            <table style="width:100%;font-size:13px;border-collapse:collapse">
              <tr><td style="padding:6px 0;color:#8b7355;width:40%">Booking Reference</td><td style="font-weight:bold;color:#821124">${booking.bookingReference}</td></tr>
              <tr><td style="padding:6px 0;color:#8b7355">Suite</td><td>${booking.apartmentName}</td></tr>
              <tr><td style="padding:6px 0;color:#8b7355">Check-In</td><td>${booking.checkIn}</td></tr>
              <tr><td style="padding:6px 0;color:#8b7355">Check-Out</td><td>${booking.checkOut}</td></tr>
              <tr><td style="padding:6px 0;color:#8b7355">Nights</td><td>${booking.nights}</td></tr>
              <tr><td style="padding:6px 0;color:#8b7355">Guests</td><td>${booking.adults} adults${booking.children > 0 ? `, ${booking.children} children` : ""}</td></tr>
              ${booking.mealPlanName ? `<tr><td style="padding:6px 0;color:#8b7355">Meal Plan</td><td>${booking.mealPlanName}</td></tr>` : ""}
              ${booking.specialRequests ? `<tr><td style="padding:6px 0;color:#8b7355">Special Requests</td><td>${booking.specialRequests}</td></tr>` : ""}
              <tr><td style="padding:6px 0;color:#8b7355">Total Paid</td><td style="font-weight:bold;color:#047857">${booking.currency} ${Number(booking.totalAmount).toLocaleString()}</td></tr>
            </table>
          </div>
          <div style="background:#fffbe8;border:1px solid #e2c589;padding:16px;border-radius:4px;margin:24px 0">
            <p style="font-size:13px;margin:0"><strong>Manage your booking online:</strong></p>
            <p style="font-size:12px;margin:8px 0 0;color:#8b7355">Access token: <strong style="color:#1F1615">${booking.guestToken}</strong></p>
            <p style="font-size:12px;margin:4px 0 0">View or update booking: <a href="${guestPortalUrl}" style="color:#821124;font-weight:bold">${guestPortalUrl}</a></p>
          </div>
          <p style="font-size:13px;color:#6b5d54">📞 +254 725 959 552<br/>✉ reservations.village@tamarind.co.ke<br/>📍 Silversands Road, Nyali, Mombasa, Kenya</p>
        </div>`,
    });

    if (result.error) {
      console.error("[Booking Email] Resend delivery error for guest:", result.error);
    } else {
      console.log("[Booking Email] Confirmation sent to guest successfully. ID:", result.data?.id);
    }
  } catch (e: any) {
    console.error("[Booking Email] Unexpected exception:", e.message);
  }
}

export async function notifyStaffApartmentBooking(booking: any) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);
  const staffEmail = process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke";
  const senderEmail = process.env.EMAIL_FROM || "reservations.village@tamarind.co.ke";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://tamarindvillage.co.ke";

  try {
    const result = await resend.emails.send({
      from: senderEmail,
      to: staffEmail,
      subject: `[Paid Reservation Confirmed] ${booking.guestName} · ${booking.bookingReference}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;padding:24px;border:1px solid #e2d9d0">
          <h2 style="color:#821124">Paid Reservation Confirmed</h2>
          <p><strong>Reference:</strong> ${booking.bookingReference}</p>
          <p><strong>Guest:</strong> ${booking.guestName} (${booking.guestEmail} / ${booking.guestPhone})</p>
          <p><strong>Suite:</strong> ${booking.apartmentName}</p>
          <p><strong>Check-In:</strong> ${booking.checkIn} → <strong>Check-Out:</strong> ${booking.checkOut} (${booking.nights} nights)</p>
          <p><strong>Occupancy:</strong> ${booking.adults} Adults, ${booking.children} Children</p>
          ${booking.mealPlanName ? `<p><strong>Meal Plan:</strong> ${booking.mealPlanName}</p>` : ""}
          ${booking.specialRequests ? `<p><strong>Special Requests:</strong> ${booking.specialRequests}</p>` : ""}
          <p><strong>Total Paid:</strong> ${booking.currency} ${Number(booking.totalAmount).toLocaleString()}</p>
          <p><strong>Payment Method:</strong> ${booking.paymentMethod} (Ref: ${booking.paymentReference || booking.bookingReference})</p>
          <p><strong>Guest Access Token:</strong> <code>${booking.guestToken}</code></p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
          <p><a href="${siteUrl}/admin/bookings" style="background:#821124;color:#fff;padding:8px 16px;text-decoration:none;border-radius:4px;display:inline-block">Open Admin Bookings</a></p>
        </div>`,
    });

    if (result.error) {
      console.error("[Staff Booking Email] Resend delivery error for staff:", result.error);
    } else {
      console.log("[Staff Booking Email] Notification sent to staff successfully. ID:", result.data?.id);
    }
  } catch (e: any) {
    console.error("[Staff Booking Email] Unexpected exception:", e.message);
  }
}
