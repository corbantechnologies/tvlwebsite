import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { inquiries, bookings, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

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
      ...(body.payload || {})
    };

    await db.update(inquiries).set({
      status: updatedStatus,
      payload: updatedPayload
    }).where(eq(inquiries.id, id));

    // Auto-create booking when status is set to "Booked"
    if (updatedStatus === "Booked") {
      const existingBooking = await db.select().from(bookings).where(eq(bookings.inquiryId, id));
      if (existingBooking.length === 0) {
        const reference = "TV-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
        const newBooking = {
          id: "bkg_" + Date.now(),
          bookingReference: reference,
          inquiryId: id,
          apartmentId: updatedPayload.apartmentId || (updatedPayload.apartmentName ? updatedPayload.apartmentName.toLowerCase().replace(/\s+/g, "-") : "unknown"),
          apartmentName: updatedPayload.apartmentName || "Tamarind Village Suite",
          guestName: updatedPayload.name || "Guest",
          guestEmail: updatedPayload.email || "",
          guestPhone: updatedPayload.phone || "",
          checkIn: updatedPayload.checkIn && updatedPayload.checkIn !== "Flexible / Not specified" ? updatedPayload.checkIn : "",
          checkOut: updatedPayload.checkOut && updatedPayload.checkOut !== "Flexible / Not specified" ? updatedPayload.checkOut : "",
          adults: Number(updatedPayload.adults) || Number(updatedPayload.guests) || 1,
          children: Number(updatedPayload.children) || 0,
          packageId: updatedPayload.packageId || null,
          packageName: updatedPayload.packageName || null,
          totalAmount: Number(updatedPayload.totalCost) || 0,
          currency: "USD",
          paymentStatus: updatedPayload.paymentStatus || "unpaid",
          paymentMethod: null,
          bookingStatus: "confirmed",
          specialRequests: updatedPayload.requests || null,
          staffNotes: [],
          createdAt: new Date().toISOString(),
        };
        await db.insert(bookings).values(newBooking);

        await db.insert(auditLogs).values({
          id: "log_" + Date.now(),
          timestamp: new Date().toISOString(),
          actor: body.actor || "staff",
          actorRole: body.actorRole || "staff",
          category: "booking",
          action: "Auto-Created Booking from Inquiry",
          details: `Inquiry marked as Booked. Generated booking ${reference} for ${newBooking.guestName}`,
          targetId: newBooking.id,
          metadata: { bookingReference: reference, inquiryId: id }
        });

        sendGuestConfirmationEmail(newBooking).catch(console.warn);
      }
    }

    if (body.auditAction) {
      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: body.actor || "staff",
        actorRole: body.actorRole || "staff",
        category: body.auditCategory || "inquiry",
        action: body.auditAction,
        details: body.auditDetails || "Inquiry updated by staff",
        targetId: id
      });
    }

    const updated = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return NextResponse.json({ success: true, inquiry: updated[0] });
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    await db.delete(inquiries).where(eq(inquiries.id, id));
    return NextResponse.json({ success: true, message: "Inquiry removed" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function sendGuestConfirmationEmail(booking: any) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !booking.guestEmail) return;
  const resend = new Resend(key);
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "reservations@tamarind.co.ke",
    to: booking.guestEmail,
    subject: `Your Tamarind Village Reservation — ${booking.bookingReference}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fdfaf7;border:1px solid #e2d9d0;padding:40px;color:#1F1615">
        <h1 style="color:#821124;font-size:24px;letter-spacing:2px;text-transform:uppercase;text-align:center">Tamarind Village</h1>
        <hr style="border:1px solid #e2d9d0;margin:24px 0"/>
        <h2 style="font-size:18px">Reservation Confirmed</h2>
        <p style="font-size:14px;line-height:1.6">Dear ${booking.guestName}, your reservation <strong>${booking.bookingReference}</strong> at Tamarind Village has been confirmed by our reservations team.</p>
        <p style="font-size:13px">Suite: ${booking.apartmentName}<br/>
        Check-In: ${booking.checkIn || 'To be confirmed'}<br/>
        Check-Out: ${booking.checkOut || 'To be confirmed'}</p>
        <p style="font-size:13px">Our team will be in touch shortly with arrival details.</p>
      </div>`,
  });
}
