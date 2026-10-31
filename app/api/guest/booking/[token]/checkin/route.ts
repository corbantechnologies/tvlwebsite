import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { bookings, type OnlineCheckIn } from "@/lib/db/schema";
import { bookingByGuestToken } from "@/lib/guestLookup";
import { guestView } from "@/lib/bookingFormat";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { propertyToday } from "@/lib/dates";
import { sendEmail, siteUrl } from "@/lib/mailer";
import { villageInbox } from "@/lib/staffInboxes";
import { escapeHtml } from "@/lib/escapeHtml";
import { writeAuditLog } from "@/lib/audit";

const ID_TYPES = ["passport", "national_id", "alien_id", "other"] as const;

// ============================================================
// POST /api/guest/booking/[token]/checkin  (public, guest token)
// Online check-in: the details reception would otherwise collect at
// the desk. Can be resubmitted to correct a mistake until check-out.
// ============================================================
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const limited = await rateLimit(req, RATE_LIMITS.guestAction);
  if (limited) return limited;

  try {
    const { token } = await params;
    const booking = await bookingByGuestToken(token);
    if (!booking) return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    if (booking.paymentStatus !== "paid" || ["cancelled", "no_show", "expired", "payment_failed", "checked_out"].includes(booking.bookingStatus)) {
      return NextResponse.json({ error: "Online check-in opens once your reservation is confirmed and paid." }, { status: 409 });
    }
    if (booking.checkOut < propertyToday()) {
      return NextResponse.json({ error: "This stay has ended." }, { status: 409 });
    }

    const body = await req.json().catch(() => ({}));
    const text = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
    const details: OnlineCheckIn = {
      submittedAt: new Date().toISOString(),
      fullName: text(body.fullName, 120),
      nationality: text(body.nationality, 60),
      idType: (ID_TYPES as readonly string[]).includes(body.idType) ? body.idType : "other",
      idNumber: text(body.idNumber, 40),
      arrivalTime: text(body.arrivalTime, 40) || undefined,
      arrivalBy: text(body.arrivalBy, 40) || undefined,
      flightOrTrain: text(body.flightOrTrain, 40) || undefined,
      otherGuests: text(body.otherGuests, 500) || undefined,
      carRegistration: text(body.carRegistration, 20) || undefined,
      notes: text(body.notes, 1000) || undefined,
    };
    if (!details.fullName || !details.nationality || !details.idNumber) {
      return NextResponse.json({ error: "Please enter your full name, nationality and ID or passport number." }, { status: 400 });
    }

    const db = getDb();
    const [updated] = await db.update(bookings).set({ checkInDetails: details }).where(eq(bookings.id, booking.id)).returning();
    const resubmitted = Boolean(booking.checkInDetails);

    const e = escapeHtml;
    const row = (k: string, v?: string) => (v ? `<tr><td style="padding:4px 12px 4px 0;color:#8b7355">${e(k)}</td><td>${e(v)}</td></tr>` : "");
    sendEmail({
      to: villageInbox(),
      subject: `[Online check-in${resubmitted ? " updated" : ""}] ${booking.guestName} · arriving ${booking.checkIn}`,
      html: `<div style="font-family:sans-serif;max-width:600px;padding:24px;border:1px solid #e2d9d0">
        <h2 style="color:#821124;margin-top:0">Online check-in ${resubmitted ? "updated" : "received"}</h2>
        <p>${e(booking.bookingReference)} · ${e(booking.apartmentName)} · ${e(booking.checkIn)} to ${e(booking.checkOut)}</p>
        <table style="font-size:13px;border-collapse:collapse">
          ${row("Name", details.fullName)}${row("Nationality", details.nationality)}
          ${row("ID", `${details.idType.replace("_", " ")} ending ${details.idNumber.slice(-4)}`)}
          ${row("Arrival", [details.arrivalTime, details.arrivalBy, details.flightOrTrain].filter(Boolean).join(" · "))}
          ${row("Other guests", details.otherGuests)}${row("Car", details.carRegistration)}${row("Notes", details.notes)}
        </table>
        <p style="font-size:12px;color:#777">The full ID number is in the staff portal.</p>
        <p><a href="${e(siteUrl())}/admin/frontdesk">Open front desk</a></p>
      </div>`,
    }).catch(() => {});

    await writeAuditLog({
      actor: booking.guestName,
      actorRole: "guest",
      category: "booking",
      action: resubmitted ? "Online Check-In Updated" : "Online Check-In Completed",
      details: `${booking.bookingReference}: guest submitted online check-in.`,
      targetId: booking.id,
    });

    return NextResponse.json({ success: true, booking: guestView(updated) });
  } catch (err: any) {
    console.error("[Online Check-In]", err.message);
    return NextResponse.json({ error: "Could not save your check-in. Please try again." }, { status: 500 });
  }
}
