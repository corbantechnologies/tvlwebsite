import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { inquiries, bookings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { staffInboxFor, villageInbox } from "@/lib/staffInboxes";
import { guestView, paidLabel } from "@/lib/bookingFormat";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { escapeHtml } from "@/lib/escapeHtml";
import { sendEmail, siteUrl } from "@/lib/mailer";
import { writeAuditLog } from "@/lib/audit";
import { freeCancellationHours, PROPERTY } from "@/lib/contact";
import { msUntilCheckIn } from "@/lib/dates";

async function findByToken(token: string) {
  const db = getDb();
  const clean = token.trim().toUpperCase();

  const inqRows = await db.select().from(inquiries).where(eq(inquiries.guestToken, clean)).limit(1);
  if (inqRows.length > 0) return { type: "inquiry" as const, record: inqRows[0] };

  const bkgRows = await db.select().from(bookings).where(eq(bookings.guestToken, clean)).limit(1);
  if (bkgRows.length > 0) return { type: "booking" as const, record: bkgRows[0] };

  return null;
}

// ============================================================
// GET /api/guest/inquiry/[token]
// Read-only view of an inquiry or booking for the guest.
// Bookings are returned without staff notes or payment internals.
// ============================================================
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const limited = await rateLimit(req, RATE_LIMITS.guestLookup);
  if (limited) return limited;
  try {
    const { token } = await params;
    const found = await findByToken(token);
    if (!found) {
      return NextResponse.json({ error: `No record found for reference: ${token.trim().toUpperCase()}` }, { status: 404 });
    }
    if (found.type === "booking") {
      return NextResponse.json({ booking: guestView(found.record) });
    }
    return NextResponse.json({ inquiry: found.record });
  } catch (err: any) {
    console.error("[Guest Lookup]", err.message);
    return NextResponse.json({ error: "Could not load this reservation." }, { status: 500 });
  }
}

// ============================================================
// PATCH /api/guest/inquiry/[token]
// Guest updates special requests / dietary needs / arrival notes.
// ============================================================
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const limited = await rateLimit(req, RATE_LIMITS.guestAction);
  if (limited) return limited;
  try {
    const { token } = await params;
    const body = await req.json();
    const clip = (v: unknown) => (v === undefined ? undefined : String(v ?? "").slice(0, 1000));
    const specialRequests = clip(body.specialRequests);
    const dietaryNeeds = clip(body.dietaryNeeds);
    const arrivalTime = clip(body.arrivalTime);
    const notes = clip(body.notes);

    const found = await findByToken(token);
    if (!found) return NextResponse.json({ error: "No record found for this token" }, { status: 404 });

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

      await db.update(inquiries).set({ payload: updatedPayload }).where(eq(inquiries.id, current.id));

      notifyStaff(
        staffInboxFor(current.venue || "village_apartment"),
        `[Guest Update] ${updatedPayload.name || "Guest"} updated their requests`,
        [
          ["Guest", updatedPayload.name],
          ["Inquiry", current.id],
          ["Special requests", updatedPayload.specialRequests],
          ["Dietary needs", updatedPayload.dietaryNeeds],
          ["Arrival time", updatedPayload.arrivalTime],
          ["Notes", updatedPayload.guestNotes],
        ]
      ).catch(() => {});

      await writeAuditLog({
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

    const current = found.record;
    const parts = [
      specialRequests && `Requests: ${specialRequests}`,
      dietaryNeeds && `Dietary: ${dietaryNeeds}`,
      arrivalTime && `Arrival: ${arrivalTime}`,
      notes && `Notes: ${notes}`,
    ].filter(Boolean);
    const [updated] = await db
      .update(bookings)
      .set({
        specialRequests: specialRequests ?? current.specialRequests,
        staffNotes: [
          ...((current.staffNotes as any[]) || []),
          { text: `Guest update: ${parts.join(" · ") || "no details"}`, author: "Guest (self-service)", timestamp: new Date().toISOString() },
        ],
      })
      .where(eq(bookings.id, current.id))
      .returning();

    notifyStaff(villageInbox(), `[Guest Update] ${current.guestName} · ${current.bookingReference}`, [
      ["Guest", current.guestName],
      ["Booking", current.bookingReference],
      ["Stay", `${current.checkIn} to ${current.checkOut}`],
      ["Update", parts.join(" · ")],
    ]).catch(() => {});

    return NextResponse.json({ success: true, booking: guestView(updated) });
  } catch (err: any) {
    console.error("[Guest Update]", err.message);
    return NextResponse.json({ error: "Could not save your update." }, { status: 500 });
  }
}

// ============================================================
// DELETE /api/guest/inquiry/[token]
// Guest cancels their inquiry or booking.
//
// Bookings follow the cancellation policy:
//   - not paid yet                    → cancelled straight away
//   - paid, more than FREE_CANCELLATION_HOURS before check-in
//                                     → cancelled, full refund marked as due
//                                       (staff issue it from the admin)
//   - paid, inside that window        → not cancelled; sent to staff as a
//                                       cancellation request to decide
// ============================================================
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const limited = await rateLimit(req, RATE_LIMITS.guestAction);
  if (limited) return limited;
  try {
    const { token } = await params;
    const found = await findByToken(token);
    if (!found) return NextResponse.json({ error: "No record found for this token" }, { status: 404 });

    const db = getDb();

    if (found.type === "inquiry") {
      const current = found.record;
      const payload = (current.payload as any) || {};

      if (current.status === "Booked") {
        return NextResponse.json(
          { error: `This inquiry has already been converted to a confirmed booking. Please contact us to cancel: ${PROPERTY.email}` },
          { status: 409 }
        );
      }

      await db.update(inquiries).set({ status: "Cancelled" }).where(eq(inquiries.id, current.id));
      sendCancellationEmails({
        guestEmail: payload.email || "",
        guestName: payload.name || "Guest",
        reference: current.id,
        staffInbox: staffInboxFor(current.venue || "village_apartment"),
        what: "inquiry",
      }).catch(() => {});
      await writeAuditLog({
        actor: payload.name || "Guest",
        actorRole: "guest",
        category: "inquiry",
        action: "Guest Cancelled Inquiry",
        details: `Guest self-cancelled inquiry ${current.id}`,
        targetId: current.id,
      });
      return NextResponse.json({ success: true, message: "Your inquiry has been cancelled. A confirmation has been sent to your email." });
    }

    const current = found.record;
    if (["cancelled", "expired", "payment_failed"].includes(current.bookingStatus)) {
      return NextResponse.json({ error: "This reservation is already cancelled." }, { status: 409 });
    }
    if (["in_house", "checked_out", "departing_today", "no_show"].includes(current.bookingStatus)) {
      return NextResponse.json(
        { error: "This stay has already started or finished, so it cannot be cancelled online. Please contact reservations." },
        { status: 409 }
      );
    }

    const paid = current.paymentStatus === "paid";
    const freeHours = freeCancellationHours();
    const insideWindow = msUntilCheckIn(current.checkIn) < freeHours * 3600 * 1000;

    if (paid && insideWindow) {
      const request = {
        type: "cancel" as const,
        message: "Guest asked to cancel online inside the free-cancellation period.",
        requestedAt: new Date().toISOString(),
        status: "open" as const,
      };
      const [updated] = await db.update(bookings).set({ changeRequest: request }).where(eq(bookings.id, current.id)).returning();
      notifyStaff(villageInbox(), `[Cancellation request] ${current.guestName} · ${current.bookingReference}`, [
        ["Guest", `${current.guestName} (${current.guestEmail}, ${current.guestPhone})`],
        ["Booking", current.bookingReference],
        ["Stay", `${current.checkIn} to ${current.checkOut}`],
        ["Paid", paidLabel(current)],
        ["Why staff must decide", `Check-in is less than ${freeHours} hours away, so this is outside free cancellation.`],
      ]).catch(() => {});
      await writeAuditLog({
        actor: current.guestName,
        actorRole: "guest",
        category: "booking",
        action: "Guest Requested Late Cancellation",
        details: `${current.bookingReference}: guest asked to cancel inside the ${freeHours}-hour window; sent to staff.`,
        targetId: current.id,
      });
      return NextResponse.json({
        success: true,
        pending: true,
        booking: guestView(updated),
        message: `Check-in is less than ${freeHours} hours away, so our team will review your cancellation and contact you shortly. Your booking stays active until then.`,
      });
    }

    const [updated] = await db
      .update(bookings)
      .set({ bookingStatus: "cancelled", ...(paid ? { refundStatus: "due" } : {}) })
      .where(eq(bookings.id, current.id))
      .returning();

    sendCancellationEmails({
      guestEmail: current.guestEmail,
      guestName: current.guestName,
      reference: current.bookingReference,
      staffInbox: villageInbox(),
      what: "reservation",
      refundNote: paid
        ? `A full refund of ${paidLabel(current)} will be issued to your original payment method. Card refunds usually take 5 to 10 working days; M-Pesa is faster.`
        : undefined,
      staffNote: paid ? `REFUND DUE: ${paidLabel(current)}. Issue it from Admin, Bookings, then the booking's Refund button.` : undefined,
    }).catch(() => {});
    await writeAuditLog({
      actor: current.guestName,
      actorRole: "guest",
      category: "booking",
      action: "Guest Cancelled Booking",
      details: `Guest self-cancelled booking ${current.bookingReference}${paid ? " (refund due)" : ""}`,
      targetId: current.id,
    });

    return NextResponse.json({
      success: true,
      booking: guestView(updated),
      message: paid
        ? "Your reservation is cancelled. Your refund will be processed by our team, and a confirmation has been sent to your email."
        : "Your reservation has been cancelled. A confirmation has been sent to your email.",
    });
  } catch (err: any) {
    console.error("[Guest Cancel]", err.message);
    return NextResponse.json({ error: "Could not cancel right now. Please contact reservations." }, { status: 500 });
  }
}

// ---------------------------------------------------------------
// Email helpers (all guest text is escaped)
// ---------------------------------------------------------------

async function notifyStaff(to: string, subject: string, rows: [string, unknown][]) {
  const e = escapeHtml;
  await sendEmail({
    to,
    subject,
    html: `<div style="font-family:sans-serif;max-width:600px;padding:24px;border:1px solid #e2d9d0">
      <h2 style="color:#821124;margin-top:0">${e(subject.replace(/^\[[^\]]+\]\s*/, ""))}</h2>
      <table style="font-size:13px;border-collapse:collapse">${rows
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#8b7355;vertical-align:top">${e(k)}</td><td style="padding:4px 0">${e(v)}</td></tr>`)
        .join("")}</table>
      <p style="margin-top:16px"><a href="${e(siteUrl())}/admin/bookings">Open the staff portal</a></p>
    </div>`,
  });
}

async function sendCancellationEmails(p: {
  guestEmail: string;
  guestName: string;
  reference: string;
  staffInbox: string;
  what: "inquiry" | "reservation";
  refundNote?: string;
  staffNote?: string;
}) {
  const e = escapeHtml;
  const jobs: Promise<boolean>[] = [];
  if (p.guestEmail) {
    jobs.push(
      sendEmail({
        to: p.guestEmail,
        replyTo: PROPERTY.email,
        subject: `Cancellation confirmed: ${p.reference}`,
        html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fdfaf7;border:1px solid #e2d9d0;padding:40px;color:#1F1615">
          <h1 style="color:#821124;font-size:22px;letter-spacing:2px;text-align:center">TAMARIND VILLAGE</h1>
          <hr style="border:none;border-top:1px solid #e2d9d0;margin:24px 0"/>
          <h2 style="font-size:18px">Cancellation confirmed</h2>
          <p style="font-size:14px;line-height:1.6">Dear ${e(p.guestName)},</p>
          <p style="font-size:14px;line-height:1.6">Your ${p.what} <strong>${e(p.reference)}</strong> has been cancelled.</p>
          ${p.refundNote ? `<p style="font-size:14px;line-height:1.6">${e(p.refundNote)}</p>` : ""}
          <p style="font-size:14px;line-height:1.6">If this was a mistake, or you would like to rebook, just reply to this email.</p>
          <p style="font-size:13px">${e(PROPERTY.phoneDisplay)}<br/>${e(PROPERTY.email)}</p>
        </div>`,
      })
    );
  }
  jobs.push(
    sendEmail({
      to: p.staffInbox,
      subject: `[Cancellation] ${p.guestName} · ${p.reference}`,
      html: `<div style="font-family:sans-serif;max-width:600px;padding:24px;border:1px solid #e2d9d0">
        <h2 style="color:#821124">Guest cancelled their ${p.what}</h2>
        <p><strong>Guest:</strong> ${e(p.guestName)} (${e(p.guestEmail || "no email")})</p>
        <p><strong>Reference:</strong> ${e(p.reference)}</p>
        ${p.staffNote ? `<p style="background:#fef2f2;border:1px solid #fca5a5;padding:10px"><strong>${e(p.staffNote)}</strong></p>` : ""}
        <p><a href="${e(siteUrl())}/admin/bookings">Open the staff portal</a></p>
      </div>`,
    })
  );
  await Promise.allSettled(jobs);
}

