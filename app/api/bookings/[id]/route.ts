import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { bookings, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/bookings/[id] — fetch a single booking
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const rows = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, booking: rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/bookings/[id] — update booking status, notes, payment, etc.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, bookingStatus, note, paymentStatus, paymentReference, actor, actorRole } = body;

    const db = getDb();
    const existing = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const current = existing[0];
    const updatePayload: Record<string, any> = {};

    // Status transitions driven by action shortcuts
    if (action === "check-in") {
      updatePayload.bookingStatus = "in_house";
    } else if (action === "check-out") {
      updatePayload.bookingStatus = "checked_out";
    } else if (action === "confirm") {
      updatePayload.bookingStatus = "confirmed";
    } else if (action === "cancel") {
      updatePayload.bookingStatus = "cancelled";
    } else if (action === "no-show") {
      updatePayload.bookingStatus = "no_show";
    } else if (bookingStatus) {
      updatePayload.bookingStatus = bookingStatus;
    }

    // Payment updates
    if (paymentStatus) updatePayload.paymentStatus = paymentStatus;
    if (paymentReference) updatePayload.paymentReference = paymentReference;

    // Append a staff note
    if (note) {
      const currentNotes = (current.staffNotes as any[]) || [];
      updatePayload.staffNotes = [
        ...currentNotes,
        {
          text: note,
          author: actor || "Staff",
          timestamp: new Date().toISOString(),
        },
      ];
    }

    if (Object.keys(updatePayload).length > 0) {
      await db.update(bookings).set(updatePayload).where(eq(bookings.id, id));

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: actor || "Staff",
        actorRole: actorRole || "staff",
        category: "operations",
        action: `Booking ${action ? action.charAt(0).toUpperCase() + action.slice(1) : "Updated"}: ${current.bookingReference}`,
        details: `Updated booking ${current.bookingReference} (${current.guestName}): ${JSON.stringify(updatePayload)}`,
        targetId: id,
        metadata: updatePayload,
      });
    }

    const updated = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return NextResponse.json({ success: true, booking: updated[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/bookings/[id] — cancel a booking (soft: sets status to cancelled)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    await db.update(bookings).set({ bookingStatus: "cancelled" }).where(eq(bookings.id, id));

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: "Admin",
      actorRole: "admin",
      category: "operations",
      action: "Booking Cancelled",
      details: `Cancelled booking ${existing[0].bookingReference} (${existing[0].guestName})`,
      targetId: id,
    });

    return NextResponse.json({ success: true, message: "Booking cancelled" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
