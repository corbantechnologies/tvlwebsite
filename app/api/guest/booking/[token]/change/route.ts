import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { bookings, type BookingChangeRequest } from "@/lib/db/schema";
import { bookingByGuestToken } from "@/lib/guestLookup";
import { guestView } from "@/lib/bookingFormat";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { isIsoDate, loadAvailabilityData, evaluateApartment } from "@/lib/availability";
import { propertyToday } from "@/lib/dates";
import { sendEmail, siteUrl } from "@/lib/mailer";
import { villageInbox } from "@/lib/staffInboxes";
import { escapeHtml } from "@/lib/escapeHtml";
import { writeAuditLog } from "@/lib/audit";

// ============================================================
// POST /api/guest/booking/[token]/change  (public, guest token)
// Body: { newCheckIn, newCheckOut, message? }
//
// A date-change REQUEST. Nothing changes on the booking until staff
// accept it, because a new stay length may cost more or less. The
// guest is told straight away whether the new dates look available.
// ============================================================
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const limited = await rateLimit(req, RATE_LIMITS.guestAction);
  if (limited) return limited;

  try {
    const { token } = await params;
    const booking = await bookingByGuestToken(token);
    if (!booking) return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    if (["cancelled", "no_show", "expired", "payment_failed", "checked_out", "in_house"].includes(booking.bookingStatus)) {
      return NextResponse.json({ error: "This reservation can no longer be changed online. Please contact reservations." }, { status: 409 });
    }

    const body = await req.json().catch(() => ({}));
    const newCheckIn = String(body.newCheckIn || "");
    const newCheckOut = String(body.newCheckOut || "");
    const message = String(body.message || "").trim().slice(0, 1000) || undefined;
    if (!isIsoDate(newCheckIn) || !isIsoDate(newCheckOut) || newCheckOut <= newCheckIn) {
      return NextResponse.json({ error: "Choose a check-in date and a later check-out date." }, { status: 400 });
    }
    if (newCheckIn < propertyToday()) {
      return NextResponse.json({ error: "The new check-in date is in the past." }, { status: 400 });
    }

    const data = await loadAvailabilityData(getDb());
    const check = evaluateApartment(data, booking.apartmentId, newCheckIn, newCheckOut, { excludeBookingId: booking.id });

    const request: BookingChangeRequest = {
      type: "change_dates",
      newCheckIn,
      newCheckOut,
      message,
      requestedAt: new Date().toISOString(),
      status: "open",
    };
    const [updated] = await getDb().update(bookings).set({ changeRequest: request }).where(eq(bookings.id, booking.id)).returning();

    const e = escapeHtml;
    sendEmail({
      to: villageInbox(),
      subject: `[Date change request] ${booking.guestName} · ${booking.bookingReference}`,
      html: `<div style="font-family:sans-serif;max-width:600px;padding:24px;border:1px solid #e2d9d0">
        <h2 style="color:#821124;margin-top:0">Guest asked to change dates</h2>
        <p><strong>${e(booking.guestName)}</strong> (${e(booking.guestEmail)}, ${e(booking.guestPhone)}) · ${e(booking.bookingReference)} · ${e(booking.apartmentName)}</p>
        <p>From <strong>${e(booking.checkIn)} to ${e(booking.checkOut)}</strong> to <strong>${e(newCheckIn)} to ${e(newCheckOut)}</strong> (${check.nights} night${check.nights === 1 ? "" : "s"}).</p>
        <p>New dates: ${check.available ? "<span style='color:#047857'>available</span>" : `<span style='color:#b91c1c'>not available (${e(check.reason)})</span>`}. Rate for the new dates: USD ${e(check.estimatedTotalUsd)} room only.</p>
        ${message ? `<p>Guest's message: “${e(message)}”</p>` : ""}
        <p>Update the booking in the portal, settle any price difference, then mark the request done.</p>
        <p><a href="${e(siteUrl())}/admin/bookings">Open bookings</a></p>
      </div>`,
    }).catch(() => {});

    await writeAuditLog({
      actor: booking.guestName,
      actorRole: "guest",
      category: "booking",
      action: "Guest Requested Date Change",
      details: `${booking.bookingReference}: ${booking.checkIn}–${booking.checkOut} → ${newCheckIn}–${newCheckOut} (${check.available ? "available" : "not available"}).`,
      targetId: booking.id,
    });

    return NextResponse.json({
      success: true,
      available: check.available,
      booking: guestView(updated),
      message: check.available
        ? "Request sent. Those dates look available; our team will confirm and let you know about any price difference."
        : `Request sent, but those dates look unavailable (${check.reason}). Our team will contact you with options.`,
    });
  } catch (err: any) {
    console.error("[Change Request]", err.message);
    return NextResponse.json({ error: "Could not send your request. Please try again." }, { status: 500 });
  }
}
