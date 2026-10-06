import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { inquiries, bookings, auditLogs } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { Resend } from "resend";

// Venue → staff email mapping
function getVenueEmail(venue: string): string {
  const map: Record<string, string> = {
    village_apartment: process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke",
    restaurant: process.env.EMAIL_RESTAURANT || "restaurant@tamarind.co.ke",
    dhow: process.env.EMAIL_DHOW || "dhow@tamarind.co.ke",
    dawa_terrace: process.env.EMAIL_DAWA || "reservations.mombasa@tamarind.co.ke",
    golden_key: process.env.EMAIL_GOLDEN_KEY || "goldenkey.casino@tamarind.co.ke",
  };
  return map[venue] || map.village_apartment;
}

async function findByToken(token: string) {
  const db = getDb();
  const clean = token.trim().toUpperCase();

  // Inquiries
  const inqRows = await db.select().from(inquiries).where(eq(inquiries.guestToken, clean)).limit(1);
  if (inqRows.length > 0) return { type: "inquiry" as const, record: inqRows[0] };

  // Bookings (for Paystack-confirmed bookings that have a guestToken)
  const bkgRows = await db.select().from(bookings).where(eq(bookings.guestToken, clean)).limit(1);
  if (bkgRows.length > 0) return { type: "booking" as const, record: bkgRows[0] };

  return null;
}

// ============================================================
// GET /api/guest/inquiry/[token]
// Read-only view of inquiry/booking status for the guest
// ============================================================
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const found = await findByToken(token);

    if (!found) {
      return NextResponse.json(
        { error: `No record found for reference: ${token.trim().toUpperCase()}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ [found.type]: found.record });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================================
// PATCH /api/guest/inquiry/[token]
// Guest updates special requests / dietary needs / arrival notes
// ============================================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { specialRequests, dietaryNeeds, arrivalTime, notes } = body;

    const found = await findByToken(token);
    if (!found) {
      return NextResponse.json({ error: "No record found for this token" }, { status: 404 });
    }

    const db = getDb();

    if (found.type === "inquiry") {
      const current = found.record;
      const currentPayload = (current.payload as any) || {};

      const updatedPayload = {
        ...currentPayload,
        ...(specialRequests !== undefined && { specialRequests }),
        ...(dietaryNeeds !== undefined && { dietaryNeeds }),
        ...(arrivalTime !== undefined && { arrivalTime }),
        ...(notes !== undefined && { guestNotes: notes }),
        guestUpdatedAt: new Date().toISOString(),
      };

      await db.update(inquiries)
        .set({ payload: updatedPayload })
        .where(eq(inquiries.id, current.id));

      // Notify staff
      notifyStaffOfGuestUpdate(current, updatedPayload, "Special requests updated by guest").catch(() => { });

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: currentPayload.name || "Guest",
        actorRole: "guest",
        category: "inquiry",
        action: "Guest Updated Special Requests",
        details: `Guest updated special requests for inquiry ${current.id}`,
        targetId: current.id,
      });

      const updated = await db.select().from(inquiries).where(eq(inquiries.id, current.id)).limit(1);
      return NextResponse.json({ success: true, inquiry: updated[0] });
    }

    if (found.type === "booking") {
      const current = found.record;
      const existingNotes = (current.staffNotes as any[]) || [];
      const noteEntry = {
        text: `Guest update: ${specialRequests || notes || "No details provided"}`,
        author: "Guest (self-service)",
        timestamp: new Date().toISOString(),
      };

      await db.update(bookings)
        .set({
          specialRequests: specialRequests || current.specialRequests,
          staffNotes: [...existingNotes, noteEntry],
        })
        .where(eq(bookings.id, current.id));

      const updated = await db.select().from(bookings).where(eq(bookings.id, current.id)).limit(1);
      return NextResponse.json({ success: true, booking: updated[0] });
    }

    return NextResponse.json({ error: "Unknown record type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================================
// DELETE /api/guest/inquiry/[token]
// Guest cancels their inquiry or booking
// ============================================================
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const found = await findByToken(token);
    if (!found) {
      return NextResponse.json({ error: "No record found for this token" }, { status: 404 });
    }

    const db = getDb();

    if (found.type === "inquiry") {
      const current = found.record;
      const payload = (current.payload as any) || {};

      if (current.status === "Booked") {
        return NextResponse.json(
          { error: "This inquiry has already been converted to a confirmed booking. Please contact us directly to cancel: reservations.village@tamarind.co.ke" },
          { status: 409 }
        );
      }

      await db.update(inquiries)
        .set({ status: "Cancelled" })
        .where(eq(inquiries.id, current.id));

      sendCancellationEmails(
        payload.email || "",
        payload.name || "Guest",
        current.id,
        current.venue,
        "inquiry"
      ).catch(() => { });

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: payload.name || "Guest",
        actorRole: "guest",
        category: "inquiry",
        action: "Guest Cancelled Inquiry",
        details: `Guest self-cancelled inquiry ${current.id}`,
        targetId: current.id,
      });

      return NextResponse.json({ success: true, message: "Your inquiry has been cancelled. A confirmation has been sent to your email." });
    }

    if (found.type === "booking") {
      const current = found.record;

      if (["in_house", "checked_out"].includes(current.bookingStatus)) {
        return NextResponse.json(
          { error: "Cancellation not possible for bookings already checked in or completed. Please contact us directly." },
          { status: 409 }
        );
      }

      await db.update(bookings)
        .set({ bookingStatus: "cancelled" })
        .where(eq(bookings.id, current.id));

      sendCancellationEmails(
        current.guestEmail,
        current.guestName,
        current.bookingReference,
        current.inquirySource || "village_apartment",
        "booking"
      ).catch(() => { });

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: current.guestName,
        actorRole: "guest",
        category: "booking",
        action: "Guest Cancelled Booking",
        details: `Guest self-cancelled booking ${current.bookingReference}`,
        targetId: current.id,
      });

      return NextResponse.json({ success: true, message: "Your reservation has been cancelled. A confirmation has been sent to your email." });
    }

    return NextResponse.json({ error: "Unknown record type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------
// Email helpers
// ---------------------------------------------------------------

async function notifyStaffOfGuestUpdate(inquiry: any, updatedPayload: any, subject: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);
  const staffEmail = getVenueEmail(inquiry.venue || "village_apartment");

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "reservations@tamarind.co.ke",
    to: staffEmail,
    subject: `[Guest Update] ${updatedPayload.name || "Guest"} — ${subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;padding:24px;border:1px solid #e2d9d0">
        <h2 style="color:#821124">Guest Updated Their Request</h2>
        <p><strong>Guest:</strong> ${updatedPayload.name || "N/A"}</p>
        <p><strong>Inquiry ID:</strong> ${inquiry.id}</p>
        <p><strong>Special Requests:</strong> ${updatedPayload.specialRequests || "—"}</p>
        <p><strong>Dietary Needs:</strong> ${updatedPayload.dietaryNeeds || "—"}</p>
        <p><strong>Arrival Time:</strong> ${updatedPayload.arrivalTime || "—"}</p>
        <p><strong>Guest Notes:</strong> ${updatedPayload.guestNotes || "—"}</p>
        <p>Please log in to the staff dashboard to review.</p>
      </div>`,
  });
}

async function sendCancellationEmails(
  guestEmail: string,
  guestName: string,
  reference: string,
  venue: string,
  type: "inquiry" | "booking"
) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);
  const staffEmail = getVenueEmail(venue);
  const fromEmail = process.env.EMAIL_FROM || "reservations@tamarind.co.ke";

  const guestHtml = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fdfaf7;border:1px solid #e2d9d0;padding:40px;color:#1F1615">
      <h1 style="color:#821124;font-size:22px;letter-spacing:2px;text-align:center">TAMARIND VILLAGE</h1>
      <hr style="border:1px solid #e2d9d0;margin:24px 0"/>
      <h2 style="font-size:18px">Cancellation Confirmed</h2>
      <p style="font-size:14px;line-height:1.6">Dear ${guestName},</p>
      <p style="font-size:14px;line-height:1.6">Your ${type === "booking" ? "reservation" : "inquiry"} <strong>${reference}</strong> has been successfully cancelled.</p>
      <p style="font-size:14px;line-height:1.6">If this was a mistake, or if you would like to rebook, please contact us:</p>
      <p style="font-size:13px">📞 +254 725 959 552<br/>✉ reservations.village@tamarind.co.ke</p>
      <p style="font-size:12px;color:#8b7355;margin-top:32px">Tamarind Village — Mombasa Serviced Apartments</p>
    </div>`;

  const promises: Promise<any>[] = [];

  if (guestEmail) {
    promises.push(resend.emails.send({
      from: fromEmail,
      to: guestEmail,
      subject: `Cancellation Confirmed — ${reference}`,
      html: guestHtml,
    }));
  }

  promises.push(resend.emails.send({
    from: fromEmail,
    to: staffEmail,
    subject: `[Cancellation] ${guestName} — ${reference}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;padding:24px;border:1px solid #e2d9d0">
        <h2 style="color:#821124">Guest Cancelled Their ${type === "booking" ? "Booking" : "Inquiry"}</h2>
        <p><strong>Guest:</strong> ${guestName}</p>
        <p><strong>Reference:</strong> ${reference}</p>
        <p><strong>Guest Email:</strong> ${guestEmail || "—"}</p>
        <p>Please update your records accordingly.</p>
      </div>`,
  }));

  await Promise.allSettled(promises);
}
