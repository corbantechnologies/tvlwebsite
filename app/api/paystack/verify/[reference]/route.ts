import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { bookings, inquiries, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

export async function GET(_: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const { reference } = await params;
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 503 });
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const data = await res.json() as any;
    if (!data.status || data.data.status !== "success") {
      return NextResponse.json({ error: "Payment not successful", data: data.data }, { status: 400 });
    }

    const meta = data.data.metadata || {};
    const db = getDb();
    const newBooking = {
      id: "bkg_" + Date.now(),
      bookingReference: reference,
      inquiryId: meta.inquiryId || null,
      apartmentId: meta.apartmentId || "unknown",
      apartmentName: meta.apartmentName || "Tamarind Village Suite",
      guestName: meta.guestName || data.data.customer?.first_name || "Guest",
      guestEmail: data.data.customer?.email || meta.guestEmail || "",
      guestPhone: meta.guestPhone || "",
      checkIn: meta.checkIn || "",
      checkOut: meta.checkOut || "",
      adults: Number(meta.adults) || 1,
      children: Number(meta.children) || 0,
      packageId: meta.packageId || null,
      packageName: meta.packageName || null,
      totalAmount: data.data.amount / 100,
      currency: data.data.currency || "USD",
      paymentStatus: "paid",
      paymentMethod: "paystack",
      bookingStatus: "confirmed",
      specialRequests: meta.specialRequests || null,
      staffNotes: [],
      createdAt: new Date().toISOString(),
    };

    await db.insert(bookings).values(newBooking).onConflictDoNothing();

    // Update linked inquiry if present
    if (meta.inquiryId) {
      const existing = await db.select().from(inquiries).where(eq(inquiries.id, meta.inquiryId));
      if (existing.length > 0) {
        const payload = (existing[0].payload as any) || {};
        await db.update(inquiries).set({
          status: "Booked",
          payload: { ...payload, paymentStatus: "paid", paymentReference: reference }
        }).where(eq(inquiries.id, meta.inquiryId));
      }
    }

    sendConfirmationEmail(newBooking).catch(console.warn);

    return NextResponse.json({ success: true, booking: newBooking });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function sendConfirmationEmail(booking: any) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !booking.guestEmail) return;
  const resend = new Resend(key);
  const nights = booking.checkIn && booking.checkOut
    ? Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000)
    : "—";
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "reservations@tamarind.co.ke",
    to: booking.guestEmail,
    subject: `Your Tamarind Village Reservation — ${booking.bookingReference}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fdfaf7;border:1px solid #e2d9d0;padding:40px;color:#1F1615">
        <h1 style="color:#821124;font-size:24px;letter-spacing:2px;text-transform:uppercase;text-align:center">Tamarind Village</h1>
        <p style="text-align:center;color:#8b7355;font-size:12px">Mombasa Serviced Apartments</p>
        <hr style="border:1px solid #e2d9d0;margin:24px 0"/>
        <h2 style="font-size:18px">Reservation Confirmed</h2>
        <p style="font-size:14px;line-height:1.6">Dear ${booking.guestName}, thank you for choosing Tamarind Village. Your reservation is confirmed.</p>
        <div style="background:#f5f0eb;border-left:4px solid #821124;padding:20px;margin:20px 0">
          <table style="width:100%;font-size:13px;border-collapse:collapse">
            <tr><td style="padding:4px 0;color:#8b7355">Booking Ref</td><td style="font-weight:bold">${booking.bookingReference}</td></tr>
            <tr><td style="padding:4px 0;color:#8b7355">Suite</td><td>${booking.apartmentName}</td></tr>
            <tr><td style="padding:4px 0;color:#8b7355">Check-In</td><td>${booking.checkIn}</td></tr>
            <tr><td style="padding:4px 0;color:#8b7355">Check-Out</td><td>${booking.checkOut}</td></tr>
            <tr><td style="padding:4px 0;color:#8b7355">Nights</td><td>${nights}</td></tr>
            <tr><td style="padding:4px 0;color:#8b7355">Guests</td><td>${booking.adults} adult(s)</td></tr>
            <tr><td style="padding:4px 0;color:#8b7355">Total</td><td><strong>${booking.currency} ${Number(booking.totalAmount).toLocaleString()}</strong></td></tr>
          </table>
        </div>
        <p style="font-size:13px">Questions? Contact us:<br/>
          📞 +254 711 123 456<br/>
          ✉ reservations.village@tamarind.co.ke
        </p>
      </div>`,
  });
}
