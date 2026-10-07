import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { eventTickets, events, auditLogs } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { sendTicketConfirmationEmail, notifyStaffNewTicket } from "@/lib/eventTicketEmail";

// GET /api/events/tickets — list all tickets (or filter by eventId)
export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    let query = db.select().from(eventTickets).orderBy(desc(eventTickets.createdAt));
    let records = [];

    if (eventId) {
      records = await db
        .select()
        .from(eventTickets)
        .where(eq(eventTickets.eventId, eventId))
        .orderBy(desc(eventTickets.createdAt));
    } else {
      records = await query;
    }

    return NextResponse.json({ success: true, tickets: records || [] });
  } catch (err: any) {
    console.error("[GET /api/events/tickets] Error:", err.message);
    return NextResponse.json({ success: false, tickets: [], error: err.message }, { status: 500 });
  }
}

// POST /api/events/tickets — Create a Complimentary / Staff-Issued VIP Ticket
export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const body = await req.json();

    const {
      eventId,
      eventTitle,
      brand,
      venue,
      eventDate,
      guestName,
      guestEmail,
      guestPhone,
      ticketCount,
      notes,
      issuedBy,
    } = body;

    if (!eventId || !guestName || !guestEmail) {
      return NextResponse.json(
        { error: "eventId, guestName, and guestEmail are required." },
        { status: 400 }
      );
    }

    const count = Number(ticketCount) || 1;
    const ticketRef = "VIP-" + Math.floor(10000 + Math.random() * 90000);
    const qrToken =
      "QR-VIP-" +
      Math.random().toString(36).substring(2, 8).toUpperCase() +
      "-" +
      Date.now().toString(36).substring(4).toUpperCase();

    const newTicket = {
      id: "tkt_" + Date.now(),
      ticketReference: ticketRef,
      eventId,
      eventTitle: eventTitle || "Resort Special Event",
      brand: brand || "tamarind_restaurant",
      venue: venue || "Tamarind Mombasa",
      eventDate: eventDate || new Date().toISOString().split("T")[0],
      guestName,
      guestEmail,
      guestPhone: guestPhone || "",
      ticketCount: count,
      unitPriceKes: 0,
      unitPriceUsd: 0,
      totalAmountKes: 0,
      totalAmountUsd: 0,
      currency: "KES",
      discountAmountKes: 0,
      voucherCode: "COMPLIMENTARY",
      paymentStatus: "comp",
      paymentMethod: "staff_issued",
      paymentReference: "COMP-" + Date.now(),
      subaccountCode: null,
      checkInStatus: "pending",
      dietaryRequirements: body.dietaryRequirements || null,
      specialRequests: notes || null,
      ticketQrToken: qrToken,
      createdAt: new Date().toISOString(),
    };

    await db.insert(eventTickets).values(newTicket);

    // Increment event bookedCount
    try {
      await db
        .update(events)
        .set({
          bookedCount: sql`COALESCE(${events.bookedCount}, 0) + ${count}`,
        })
        .where(eq(events.id, eventId));
    } catch (e: any) {
      console.warn("[Comp Ticket] Failed to increment bookedCount:", e.message);
    }

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: issuedBy || "Staff Admin",
      actorRole: "reservations",
      category: "event_ticket",
      action: "Complimentary Ticket Issued",
      details: `Issued ${count} comp ticket(s) ${newTicket.ticketReference} for ${newTicket.eventTitle} to ${newTicket.guestName}`,
      targetId: newTicket.id,
      metadata: { ticketReference: newTicket.ticketReference },
    });

    // Send confirmation email
    await Promise.allSettled([
      sendTicketConfirmationEmail(newTicket),
      notifyStaffNewTicket(newTicket),
    ]);

    return NextResponse.json({ success: true, ticket: newTicket });
  } catch (err: any) {
    console.error("[POST /api/events/tickets] Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
