import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { bookings, inquiries, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

// ============================================================
// GET /api/paystack/verify/[reference]
//
// Called after Paystack redirects to /booking-confirmed?reference=...
// Verifies payment with Paystack, creates a booking record,
// updates any linked inquiry, and sends a confirmation email.
// ============================================================
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 503 });
    }

    const db = getDb();

    // Check if this booking was already verified and recorded
    const existing = await db.select().from(bookings).where(eq(bookings.bookingReference, reference)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        booking: existing[0],
        guestToken: existing[0].guestToken,
        alreadyVerified: true,
      });
    }

    // Verify with Paystack
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const data = (await res.json()) as any;

    if (!data.status || data.data?.status !== "success") {
      return NextResponse.json(
        { error: "Payment not successful", paystackStatus: data.data?.status, details: data.message },
        { status: 400 }
      );
    }

    const txn = data.data;
    const meta = txn.metadata || {};

    // Amount in major unit (Paystack returns in smallest unit)
    const totalAmount = txn.amount / 100;
    const currency = txn.currency || meta.currency || "KES";

    // Generate a guest portal token for the confirmed booking
    const rawToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    const guestToken = `TVL-${rawToken}`;

    const newBooking = {
      id: "bkg_" + Date.now(),
      bookingReference: reference,
      inquiryId: meta.inquiryId || null,
      apartmentId: meta.apartmentId || "unknown",
      apartmentName: meta.apartmentName || "Tamarind Village Suite",
      allocatedUnit: null,
      guestName: meta.guestName || txn.customer?.first_name || "Guest",
      guestEmail: txn.customer?.email || meta.guestEmail || "",
      guestPhone: meta.guestPhone || "",
      checkIn: meta.checkIn || "",
      checkOut: meta.checkOut || "",
      adults: Number(meta.adults) || 1,
      children: Number(meta.children) || 0,
      // Meal plan
      mealPlanId: meta.mealPlanId || null,
      mealPlanName: meta.mealPlanName || null,
      mealPlanPricePerPersonUsd: Number(meta.mealPlanPricePerPersonUsd) || 0,
      mealPlanPricePerPersonKes: Number(meta.mealPlanPricePerPersonKes) || 0,
      // Pricing snapshot
      roomRateUsd: Number(meta.roomRateUsd) || 0,
      roomRateKes: Number(meta.roomRateKes) || 0,
      nights: Number(meta.nights) || 1,
      totalRoomUsd: Number(meta.totalRoomUsd) || 0,
      totalMealPlanUsd: Number(meta.totalMealPlanUsd) || 0,
      totalExtrasUsd: Number(meta.totalExtrasUsd) || 0,
      totalAmount,
      currency,
      paymentStatus: "paid",
      paymentMethod: "paystack",
      paymentReference: reference,
      bookingStatus: "confirmed",
      inquirySource: meta.inquirySource || "village_apartment",
      specialRequests: meta.specialRequests || null,
      staffNotes: [],
      guestToken,
      createdAt: new Date().toISOString(),
    };

    // Insert booking (idempotent — do nothing if reference already exists)
    await db.insert(bookings).values(newBooking).onConflictDoNothing();

    // Update linked inquiry if one exists
    if (meta.inquiryId) {
      const existingInquiry = await db.select().from(inquiries).where(eq(inquiries.id, meta.inquiryId)).limit(1);
      if (existingInquiry.length > 0) {
        const inqPayload = (existingInquiry[0].payload as any) || {};
        await db.update(inquiries)
          .set({
            status: "Booked",
            payload: {
              ...inqPayload,
              paymentStatus: "paid",
              paymentReference: reference,
              bookingReference: reference,
            },
          })
          .where(eq(inquiries.id, meta.inquiryId));
      }
    }

    // Audit log
    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: newBooking.guestName,
      actorRole: "guest",
      category: "booking",
      action: "Online Payment Confirmed — Booking Created",
      details: `Paystack payment verified: ${reference}. Booking ${newBooking.bookingReference} created for ${newBooking.guestName} (${newBooking.apartmentName})`,
      targetId: newBooking.id,
      metadata: { reference, currency, totalAmount },
    });

    // Send guest confirmation email (fire-and-forget)
    sendConfirmationEmail(newBooking).catch(console.warn);
    // Send staff notification
    notifyStaff(newBooking).catch(console.warn);

    return NextResponse.json({
      success: true,
      booking: newBooking,
      guestToken,
    });
  } catch (err: any) {
    console.error("[Paystack Verify] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================================
// Email helpers
// ============================================================

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-KE", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

async function sendConfirmationEmail(booking: any) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !booking.guestEmail) return;
  const resend = new Resend(key);

  const nights = booking.nights || (
    booking.checkIn && booking.checkOut
      ? Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000)
      : "—"
  );

  const guestPortalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/track?token=${booking.guestToken}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "reservations@tamarind.co.ke",
    to: booking.guestEmail,
    subject: `Your Tamarind Village Reservation — ${booking.bookingReference}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fdfaf7;border:1px solid #e2d9d0;padding:40px;color:#1F1615">
        <h1 style="color:#821124;font-size:22px;letter-spacing:2px;text-transform:uppercase;text-align:center">Tamarind Village</h1>
        <p style="text-align:center;color:#8b7355;font-size:12px;margin-top:4px">Mombasa Serviced Apartments</p>
        <hr style="border:none;border-top:1px solid #e2d9d0;margin:24px 0"/>
        <h2 style="font-size:18px;color:#1F1615">Reservation Confirmed</h2>
        <p style="font-size:14px;line-height:1.8">Dear ${booking.guestName},</p>
        <p style="font-size:14px;line-height:1.8">Thank you for choosing Tamarind Village. Your reservation has been confirmed and payment received.</p>
        <div style="background:#f5f0eb;border-left:4px solid #821124;padding:20px;margin:24px 0">
          <table style="width:100%;font-size:13px;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#8b7355;width:40%">Booking Reference</td><td style="font-weight:bold;color:#821124">${booking.bookingReference}</td></tr>
            <tr><td style="padding:6px 0;color:#8b7355">Suite Type</td><td>${booking.apartmentName}</td></tr>
            <tr><td style="padding:6px 0;color:#8b7355">Check-In</td><td>${formatDate(booking.checkIn)}</td></tr>
            <tr><td style="padding:6px 0;color:#8b7355">Check-Out</td><td>${formatDate(booking.checkOut)}</td></tr>
            <tr><td style="padding:6px 0;color:#8b7355">Nights</td><td>${nights}</td></tr>
            <tr><td style="padding:6px 0;color:#8b7355">Guests</td><td>${booking.adults} adult${booking.adults !== 1 ? "s" : ""}${booking.children > 0 ? `, ${booking.children} child${booking.children !== 1 ? "ren" : ""}` : ""}</td></tr>
            ${booking.mealPlanName ? `<tr><td style="padding:6px 0;color:#8b7355">Meal Plan</td><td>${booking.mealPlanName}</td></tr>` : ""}
            <tr><td style="padding:6px 0;color:#8b7355">Payment</td><td style="color:#1a7a4a;font-weight:bold">✓ Paid — ${booking.currency} ${Number(booking.totalAmount).toLocaleString()}</td></tr>
          </table>
        </div>
        ${booking.specialRequests ? `<p style="font-size:13px"><strong>Special Requests:</strong> ${booking.specialRequests}</p>` : ""}
        <div style="background:#fffbe8;border:1px solid #e2c589;padding:16px;border-radius:4px;margin:24px 0">
          <p style="font-size:13px;margin:0"><strong>Manage your booking online:</strong></p>
          <p style="font-size:12px;margin:8px 0 0;color:#8b7355">Your reference code: <strong style="color:#1F1615">${booking.guestToken}</strong></p>
          <p style="font-size:12px;margin:4px 0 0">Visit: <a href="${guestPortalUrl}" style="color:#821124">${guestPortalUrl}</a></p>
          <p style="font-size:12px;color:#8b7355;margin:4px 0 0">Use your reference code to update special requests or view your booking status.</p>
        </div>
        <p style="font-size:13px">Questions? Contact us:</p>
        <p style="font-size:13px">📞 +254 725 959 552<br/>✉ reservations.village@tamarind.co.ke</p>
        <hr style="border:none;border-top:1px solid #e2d9d0;margin:32px 0"/>
        <p style="font-size:11px;color:#8b7355;text-align:center">Tamarind Village · Mombasa · Kenya<br/>A member of the Tamarind Group</p>
      </div>`,
  });
}

async function notifyStaff(booking: any) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);
  const staffEmail = process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke";

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "reservations@tamarind.co.ke",
    to: staffEmail,
    subject: `[New Booking — Paid] ${booking.guestName} · ${booking.bookingReference}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;padding:24px;border:1px solid #e2d9d0">
        <h2 style="color:#821124">New Online Booking Received</h2>
        <p><strong>Reference:</strong> ${booking.bookingReference}</p>
        <p><strong>Guest:</strong> ${booking.guestName}</p>
        <p><strong>Email:</strong> ${booking.guestEmail}</p>
        <p><strong>Phone:</strong> ${booking.guestPhone || "—"}</p>
        <p><strong>Suite:</strong> ${booking.apartmentName}</p>
        <p><strong>Check-In:</strong> ${booking.checkIn}</p>
        <p><strong>Check-Out:</strong> ${booking.checkOut}</p>
        <p><strong>Guests:</strong> ${booking.adults} adults, ${booking.children} children</p>
        ${booking.mealPlanName ? `<p><strong>Meal Plan:</strong> ${booking.mealPlanName}</p>` : ""}
        <p><strong>Total Paid:</strong> ${booking.currency} ${Number(booking.totalAmount).toLocaleString()}</p>
        ${booking.specialRequests ? `<p><strong>Special Requests:</strong> ${booking.specialRequests}</p>` : ""}
        <p style="color:#8b7355;font-size:12px">Please allocate a unit and prepare for arrival via the staff dashboard.</p>
      </div>`,
  });
}
