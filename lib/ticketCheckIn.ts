import { getDb } from "@/lib/db/db";
import { eventTickets, events, auditLogs } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function executeCheckIn({
  identifier,
  gatePin,
  scannedBy,
  eventId,
}: {
  identifier: string;
  gatePin?: string;
  scannedBy?: string;
  eventId?: string;
}) {
  await ensureDatabaseSeeded();
  const db = getDb();

  if (!identifier || typeof identifier !== "string") {
    return { status: 400, data: { error: "Ticket reference or QR token required" } };
  }

  const trimmed = identifier.trim();

  // Look up ticket by id, ticketReference, or ticketQrToken
  const foundTickets = await db
    .select()
    .from(eventTickets)
    .where(
      or(
        eq(eventTickets.id, trimmed),
        eq(eventTickets.ticketReference, trimmed.toUpperCase()),
        eq(eventTickets.ticketQrToken, trimmed)
      )
    )
    .limit(1);

  if (foundTickets.length === 0) {
    return {
      status: 404,
      data: { error: "Invalid ticket. No record found for this token or reference.", code: "NOT_FOUND" },
    };
  }

  const ticket = foundTickets[0];

  // Optional event scope verification
  if (eventId && ticket.eventId !== eventId) {
    return {
      status: 400,
      data: {
        error: `Ticket is for a different event: "${ticket.eventTitle}".`,
        code: "WRONG_EVENT",
        ticket,
      },
    };
  }

  // Gate PIN verification (if provided or event has PIN)
  if (gatePin) {
    const eventRecord = await db
      .select()
      .from(events)
      .where(eq(events.id, ticket.eventId))
      .limit(1);

    const requiredPin = eventRecord[0]?.gatePin || "2026";
    if (gatePin.trim() !== requiredPin.trim()) {
      return {
        status: 401,
        data: { error: "Incorrect Gate PIN. Entry authorization denied.", code: "INVALID_PIN" },
      };
    }
  }

  // Anti-fraud double entry prevention
  if (ticket.checkInStatus === "checked_in") {
    return {
      status: 409,
      data: {
        error: `Ticket ALREADY SCANNED on ${new Date(ticket.checkedInAt || "").toLocaleString()} by ${ticket.checkedInBy || "Gate Staff"}.`,
        code: "ALREADY_CHECKED_IN",
        ticket,
      },
    };
  }

  // Check payment status
  if (ticket.paymentStatus !== "paid" && ticket.paymentStatus !== "comp") {
    return {
      status: 402,
      data: {
        error: `Ticket payment is ${ticket.paymentStatus}. Entry denied.`,
        code: "PAYMENT_NOT_CONFIRMED",
        ticket,
      },
    };
  }

  const checkInTime = new Date().toISOString();
  const staffName = scannedBy || "Gate Staff";

  await db
    .update(eventTickets)
    .set({
      checkInStatus: "checked_in",
      checkedInAt: checkInTime,
      checkedInBy: staffName,
    })
    .where(eq(eventTickets.id, ticket.id));

  await db.insert(auditLogs).values({
    id: "log_" + Date.now(),
    timestamp: checkInTime,
    actor: staffName,
    actorRole: "gate_checkin",
    category: "event_gate",
    action: "Guest Checked In at Gate",
    details: `Admitted ${ticket.guestName} (${ticket.ticketCount} attendees) for ${ticket.eventTitle} (Ref: ${ticket.ticketReference})`,
    targetId: ticket.id,
    metadata: { ticketReference: ticket.ticketReference, eventId: ticket.eventId },
  });

  return {
    status: 200,
    data: {
      success: true,
      message: "Check-in successful! Karibu!",
      ticket: {
        ...ticket,
        checkInStatus: "checked_in",
        checkedInAt: checkInTime,
        checkedInBy: staffName,
      },
    },
  };
}
