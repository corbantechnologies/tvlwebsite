import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { bookings, auditLogs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { Resend } from "resend";

// GET /api/bookings — list all bookings (newest first)
export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const records = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
    return NextResponse.json({ success: true, bookings: records || [] });
  } catch (err: any) {
    console.error("[API /api/bookings GET] Error:", err.message);
    return NextResponse.json({ success: false, bookings: [], error: err.message }, { status: 500 });
  }
}

// ============================================================
// POST /api/bookings
// Create a new booking directly (staff-side, no Paystack).
// For Paystack-confirmed bookings, use /api/paystack/verify/[ref].
// ============================================================
export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();
    const db = getDb();

    const nights = body.nights || (() => {
      if (body.checkIn && body.checkOut) {
        return Math.max(1, Math.ceil(
          (new Date(body.checkOut).getTime() - new Date(body.checkIn).getTime()) / 86400000
        ));
      }
      return 1;
    })();

    // Generate a guest portal token if not provided
    const rawToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    const guestToken = body.guestToken || `TVL-${rawToken}`;

    const newBooking = {
      id: "bkg_" + Date.now(),
      bookingReference: body.bookingReference || "BK-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000),
      inquiryId: body.inquiryId || null,
      apartmentId: body.apartmentId || "1-bedroom",
      apartmentName: body.apartmentName || "1 Bedroom Suite",
      allocatedUnit: body.allocatedUnit || null,
      guestName: body.guestName || "Guest",
      guestEmail: body.guestEmail || "",
      guestPhone: body.guestPhone || "",
      checkIn: body.checkIn || new Date().toISOString().split("T")[0],
      checkOut: body.checkOut || new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      adults: Number(body.adults) || 1,
      children: Number(body.children) || 0,
      // Meal plan
      mealPlanId: body.mealPlanId || null,
      mealPlanName: body.mealPlanName || null,
      mealPlanPricePerPersonUsd: Number(body.mealPlanPricePerPersonUsd) || 0,
      mealPlanPricePerPersonKes: Number(body.mealPlanPricePerPersonKes) || 0,
      // Pricing snapshot
      roomRateUsd: Number(body.roomRateUsd) || 0,
      roomRateKes: Number(body.roomRateKes) || 0,
      nights,
      totalRoomUsd: Number(body.totalRoomUsd) || 0,
      totalMealPlanUsd: Number(body.totalMealPlanUsd) || 0,
      totalExtrasUsd: Number(body.totalExtrasUsd) || 0,
      totalAmount: Number(body.totalAmount) || 0,
      currency: body.currency || "KES",
      paymentStatus: body.paymentStatus || "unpaid",
      paymentMethod: body.paymentMethod || "direct",
      paymentReference: body.paymentReference || null,
      bookingStatus: body.bookingStatus || "confirmed",
      inquirySource: body.inquirySource || "village_apartment",
      specialRequests: body.specialRequests || null,
      staffNotes: body.staffNotes || [],
      guestToken,
      createdAt: new Date().toISOString(),
    };

    await db.insert(bookings).values(newBooking);

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: body.actor || "Staff",
      actorRole: body.actorRole || "reservations",
      category: "booking",
      action: "New Reservation Created",
      details: `Created reservation ${newBooking.bookingReference} for ${newBooking.guestName} (${newBooking.apartmentName}, ${nights} nights)`,
      targetId: newBooking.id,
      metadata: { bookingReference: newBooking.bookingReference },
    });

    // Await guest confirmation and staff notification emails
    await Promise.allSettled([
      sendConfirmationEmail(newBooking),
      notifyStaff(newBooking),
    ]);

    return NextResponse.json({ success: true, booking: newBooking });
  } catch (err: any) {
    console.error("[API /api/bookings POST] Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function sendConfirmationEmail(booking: any) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !booking.guestEmail) return;
  const resend = new Resend(key);

  const guestPortalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://tamarindvillage.co.ke"}/track?token=${booking.guestToken}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "reservations.village@tamarind.co.ke",
    to: booking.guestEmail,
    subject: `Your Tamarind Village Reservation — ${booking.bookingReference}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fdfaf7;border:1px solid #e2d9d0;padding:40px;color:#1F1615">
        <h1 style="color:#821124;font-size:22px;letter-spacing:2px;text-transform:uppercase;text-align:center">Tamarind Village</h1>
        <hr style="border:none;border-top:1px solid #e2d9d0;margin:24px 0"/>
        <h2 style="font-size:18px">Reservation Confirmed</h2>
        <p style="font-size:14px;line-height:1.8">Dear ${booking.guestName},</p>
        <p style="font-size:14px;line-height:1.8">Your reservation has been confirmed by Tamarind Village Mombasa.</p>
        <div style="background:#f5f0eb;border-left:4px solid #821124;padding:20px;margin:24px 0">
          <table style="width:100%;font-size:13px;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#8b7355;width:40%">Booking Reference</td><td style="font-weight:bold;color:#821124">${booking.bookingReference}</td></tr>
            <tr><td style="padding:6px 0;color:#8b7355">Suite</td><td>${booking.apartmentName}</td></tr>
            <tr><td style="padding:6px 0;color:#8b7355">Check-In</td><td>${booking.checkIn}</td></tr>
            <tr><td style="padding:6px 0;color:#8b7355">Check-Out</td><td>${booking.checkOut}</td></tr>
            <tr><td style="padding:6px 0;color:#8b7355">Nights</td><td>${booking.nights}</td></tr>
            <tr><td style="padding:6px 0;color:#8b7355">Guests</td><td>${booking.adults} adults${booking.children > 0 ? `, ${booking.children} children` : ""}</td></tr>
            ${booking.mealPlanName ? `<tr><td style="padding:6px 0;color:#8b7355">Meal Plan</td><td>${booking.mealPlanName}</td></tr>` : ""}
            ${booking.allocatedUnit ? `<tr><td style="padding:6px 0;color:#8b7355">Unit</td><td>${booking.allocatedUnit}</td></tr>` : ""}
            <tr><td style="padding:6px 0;color:#8b7355">Total Rate</td><td style="font-weight:bold">${booking.currency} ${Number(booking.totalAmount).toLocaleString()}</td></tr>
          </table>
        </div>
        <div style="background:#fffbe8;border:1px solid #e2c589;padding:16px;border-radius:4px;margin:24px 0">
          <p style="font-size:13px;margin:0"><strong>Manage your booking online:</strong></p>
          <p style="font-size:12px;margin:8px 0 0;color:#8b7355">Reference code: <strong style="color:#1F1615">${booking.guestToken}</strong></p>
          <p style="font-size:12px;margin:4px 0 0">Visit: <a href="${guestPortalUrl}" style="color:#821124">${guestPortalUrl}</a></p>
        </div>
        <p style="font-size:13px">📞 +254 725 959 552<br/>✉ reservations.village@tamarind.co.ke</p>
      </div>`,
  });
}

async function notifyStaff(booking: any) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);
  const staffEmail = process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke";

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "reservations.village@tamarind.co.ke",
    to: staffEmail,
    subject: `[New Reservation Created] ${booking.guestName} · ${booking.bookingReference}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;padding:24px;border:1px solid #e2d9d0">
        <h2 style="color:#821124">New Reservation Logged in PMS Ledger</h2>
        <p><strong>Reference:</strong> ${booking.bookingReference}</p>
        <p><strong>Guest:</strong> ${booking.guestName}</p>
        <p><strong>Email:</strong> ${booking.guestEmail || "—"}</p>
        <p><strong>Phone:</strong> ${booking.guestPhone || "—"}</p>
        <p><strong>Suite:</strong> ${booking.apartmentName}</p>
        <p><strong>Check-In:</strong> ${booking.checkIn}</p>
        <p><strong>Check-Out:</strong> ${booking.checkOut}</p>
        <p><strong>Nights:</strong> ${booking.nights}</p>
        <p><strong>Guests:</strong> ${booking.adults} adults, ${booking.children} children</p>
        ${booking.allocatedUnit ? `<p><strong>Allocated Unit:</strong> ${booking.allocatedUnit}</p>` : ""}
        <p><strong>Total:</strong> ${booking.currency} ${Number(booking.totalAmount).toLocaleString()}</p>
        <p><strong>Payment Status:</strong> ${booking.paymentStatus}</p>
        ${booking.specialRequests ? `<p><strong>Special Requests:</strong> ${booking.specialRequests}</p>` : ""}
      </div>`,
  });
}
