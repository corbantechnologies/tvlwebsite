import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { inquiries, bookings, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

// Shared handler for PUT and PATCH
async function handleUpdate(req: NextRequest, params: Promise<{ id: string }>) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();

    const existing = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const current = existing[0];
    const updatedStatus = body.status || current.status;
    const updatedPayload = {
      ...(current.payload as any),
      ...(body.payload || {}),
    };

    // Conversion to booking when status = "Booked"
    let generatedBooking: any = null;
    if (updatedStatus === "Booked") {
      const existingBooking = await db.select().from(bookings).where(eq(bookings.inquiryId, id));
      if (existingBooking.length === 0) {
        const reference = body.bookingReference || "BK-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);

        const nights = (() => {
          const ci = body.checkIn || updatedPayload.checkIn;
          const co = body.checkOut || updatedPayload.checkOut;
          if (ci && co) return Math.max(1, Math.ceil((new Date(co).getTime() - new Date(ci).getTime()) / 86400000));
          return 1;
        })();

        const staffNotesList: any[] = [];
        if (body.roomAllocated || updatedPayload.roomAllocated) {
          staffNotesList.push({
            text: `Unit Allocated: ${body.roomAllocated || updatedPayload.roomAllocated}`,
            author: body.actor || "Reservations",
            timestamp: new Date().toISOString(),
          });
        }
        if (body.paymentReference || updatedPayload.paymentReference) {
          staffNotesList.push({
            text: `Payment Reference: ${body.paymentReference || updatedPayload.paymentReference}`,
            author: body.actor || "Reservations",
            timestamp: new Date().toISOString(),
          });
        }
        if (body.notes || updatedPayload.internalNotes) {
          staffNotesList.push({
            text: body.notes || updatedPayload.internalNotes,
            author: body.actor || "Reservations",
            timestamp: new Date().toISOString(),
          });
        }

        // Generate a guest portal token
        const rawToken = Math.random().toString(36).substring(2, 8).toUpperCase();
        const guestToken = `TVL-${rawToken}`;

        generatedBooking = {
          id: "bkg_" + Date.now(),
          bookingReference: reference,
          inquiryId: id,
          apartmentId: body.apartmentId || updatedPayload.apartmentId ||
            (updatedPayload.apartmentName ? updatedPayload.apartmentName.toLowerCase().replace(/\s+/g, "-") : "1-bedroom"),
          apartmentName: body.apartmentName || updatedPayload.apartmentName || "Tamarind Village Suite",
          allocatedUnit: body.roomAllocated || updatedPayload.roomAllocated || null,
          guestName: body.guestName || updatedPayload.name || "Guest",
          guestEmail: body.guestEmail || updatedPayload.email || "",
          guestPhone: body.guestPhone || updatedPayload.phone || "",
          checkIn: body.checkIn || updatedPayload.checkIn || "",
          checkOut: body.checkOut || updatedPayload.checkOut || "",
          adults: Number(body.adults) || Number(updatedPayload.adults) || Number(updatedPayload.guests) || 1,
          children: Number(body.children) || Number(updatedPayload.children) || 0,
          // Meal plan
          mealPlanId: body.mealPlanId || updatedPayload.mealPlanId || null,
          mealPlanName: body.mealPlanName || updatedPayload.mealPlanName || null,
          mealPlanPricePerPersonUsd: Number(body.mealPlanPricePerPersonUsd) || 0,
          mealPlanPricePerPersonKes: Number(body.mealPlanPricePerPersonKes) || 0,
          // Pricing snapshot
          roomRateUsd: Number(body.roomRateUsd) || 0,
          roomRateKes: Number(body.roomRateKes) || 0,
          nights,
          totalRoomUsd: Number(body.totalRoomUsd) || 0,
          totalMealPlanUsd: Number(body.totalMealPlanUsd) || 0,
          totalExtrasUsd: Number(body.totalExtrasUsd) || 0,
          totalAmount: Number(body.totalAmount) || Number(updatedPayload.quotedRateKes) || Number(updatedPayload.totalCost) || 0,
          currency: body.currency || updatedPayload.currency || "KES",
          paymentStatus: body.paymentStatus || updatedPayload.paymentStatus || "unpaid",
          paymentMethod: body.paymentMethod || updatedPayload.paymentMethod || "direct",
          paymentReference: body.paymentReference || updatedPayload.paymentReference || null,
          bookingStatus: "confirmed",
          inquirySource: current.venue || "village_apartment",
          specialRequests: body.specialRequests || updatedPayload.specialRequests || updatedPayload.requests || null,
          staffNotes: staffNotesList,
          guestToken,
          createdAt: new Date().toISOString(),
        };

        await db.insert(bookings).values(generatedBooking);

        updatedPayload.bookingReference = generatedBooking.bookingReference;
        updatedPayload.guestToken = guestToken;
        if (body.roomAllocated) updatedPayload.roomAllocated = body.roomAllocated;
        if (body.paymentReference) updatedPayload.paymentReference = body.paymentReference;

        await db.insert(auditLogs).values({
          id: "log_" + Date.now(),
          timestamp: new Date().toISOString(),
          actor: body.actor || "Reservations Staff",
          actorRole: body.actorRole || "reservations",
          category: "booking",
          action: "Inquiry Converted to Confirmed Booking",
          details: `Inquiry ${id} converted to reservation ${generatedBooking.bookingReference} for ${generatedBooking.guestName} (${generatedBooking.apartmentName})`,
          targetId: generatedBooking.id,
          metadata: { bookingReference: generatedBooking.bookingReference, inquiryId: id },
        });

        // Send guest confirmation email
        sendGuestConfirmationEmail(generatedBooking).catch(console.warn);
      }
    }

    // Update the inquiry row
    const venueToSet = body.venue || current.venue;
    await db.update(inquiries).set({
      status: updatedStatus,
      venue: venueToSet,
      payload: updatedPayload,
    }).where(eq(inquiries.id, id));

    // Append audit for the inquiry update itself
    if (body.auditAction) {
      await db.insert(auditLogs).values({
        id: "log_" + (Date.now() + 1),
        timestamp: new Date().toISOString(),
        actor: body.actor || "staff",
        actorRole: body.actorRole || "staff",
        category: body.auditCategory || "inquiry",
        action: body.auditAction,
        details: body.auditDetails || "Inquiry updated by staff",
        targetId: id,
      });
    }

    const updated = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
    return NextResponse.json({ success: true, inquiry: updated[0], booking: generatedBooking });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleUpdate(req, params);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleUpdate(req, params);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    await db.delete(inquiries).where(eq(inquiries.id, id));
    return NextResponse.json({ success: true, message: "Inquiry removed" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------
// Guest confirmation email (sent on inquiry-to-booking conversion)
// ---------------------------------------------------------------
async function sendGuestConfirmationEmail(booking: any) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !booking.guestEmail) return;
  const resend = new Resend(key);

  const guestPortalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/track?token=${booking.guestToken}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "reservations@tamarind.co.ke",
    to: booking.guestEmail,
    subject: `Your Tamarind Village Reservation — ${booking.bookingReference}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fdfaf7;border:1px solid #e2d9d0;padding:40px;color:#1F1615">
        <h1 style="color:#821124;font-size:22px;letter-spacing:2px;text-transform:uppercase;text-align:center">Tamarind Village</h1>
        <hr style="border:none;border-top:1px solid #e2d9d0;margin:24px 0"/>
        <h2 style="font-size:18px">Reservation Confirmed</h2>
        <p style="font-size:14px;line-height:1.8">Dear ${booking.guestName},</p>
        <p style="font-size:14px;line-height:1.8">Your reservation <strong>${booking.bookingReference}</strong> at Tamarind Village has been confirmed by our reservations team.</p>
        <div style="background:#f5f0eb;border-left:4px solid #821124;padding:20px;margin:24px 0">
          <table style="width:100%;font-size:13px;border-collapse:collapse">
            <tr><td style="padding:5px 0;color:#8b7355">Suite</td><td>${booking.apartmentName}</td></tr>
            <tr><td style="padding:5px 0;color:#8b7355">Check-In</td><td>${booking.checkIn || "To be confirmed"}</td></tr>
            <tr><td style="padding:5px 0;color:#8b7355">Check-Out</td><td>${booking.checkOut || "To be confirmed"}</td></tr>
            ${booking.mealPlanName ? `<tr><td style="padding:5px 0;color:#8b7355">Meal Plan</td><td>${booking.mealPlanName}</td></tr>` : ""}
            ${booking.allocatedUnit ? `<tr><td style="padding:5px 0;color:#8b7355">Your Unit</td><td>${booking.allocatedUnit}</td></tr>` : ""}
          </table>
        </div>
        <div style="background:#fffbe8;border:1px solid #e2c589;padding:16px;border-radius:4px;margin:24px 0">
          <p style="font-size:13px;margin:0"><strong>Manage your booking online:</strong></p>
          <p style="font-size:12px;margin:8px 0 0;color:#8b7355">Reference: <strong style="color:#1F1615">${booking.guestToken}</strong></p>
          <p style="font-size:12px;margin:4px 0 0">Visit: <a href="${guestPortalUrl}" style="color:#821124">${guestPortalUrl}</a></p>
        </div>
        <p style="font-size:13px">Our team will be in touch with full arrival details.</p>
        <p style="font-size:13px">📞 +254 725 959 552<br/>✉ reservations.village@tamarind.co.ke</p>
      </div>`,
  });
}
