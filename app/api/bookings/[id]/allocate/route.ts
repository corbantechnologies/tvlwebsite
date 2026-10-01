import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { bookings, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ============================================================
// POST /api/bookings/[id]/allocate
// Staff assigns a physical unit to a confirmed booking.
// E.g. "Unit 4B, Block B, 3rd Floor"
//
// This is done AFTER a booking is confirmed, once the
// reservations/reception team has determined which physical
// unit the guest will occupy.
// ============================================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { allocatedUnit, note, actor, actorRole } = body;

    if (!allocatedUnit || !allocatedUnit.trim()) {
      return NextResponse.json({ error: "allocatedUnit is required" }, { status: 400 });
    }

    const db = getDb();
    const existing = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = existing[0];

    if (booking.bookingStatus === "cancelled") {
      return NextResponse.json({ error: "Cannot allocate a unit to a cancelled booking" }, { status: 409 });
    }

    // Append a staff note about the allocation
    const existingNotes = (booking.staffNotes as any[]) || [];
    const allocationNote = {
      text: `Unit allocated: ${allocatedUnit.trim()}${note ? ` — ${note}` : ""}`,
      author: actor || "Reservations",
      timestamp: new Date().toISOString(),
    };

    await db.update(bookings)
      .set({
        allocatedUnit: allocatedUnit.trim(),
        staffNotes: [...existingNotes, allocationNote],
      })
      .where(eq(bookings.id, id));

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: actor || "Reservations",
      actorRole: actorRole || "reservations",
      category: "operations",
      action: "Unit Allocated",
      details: `Allocated unit "${allocatedUnit.trim()}" to booking ${booking.bookingReference} (${booking.guestName})`,
      targetId: id,
      metadata: { allocatedUnit: allocatedUnit.trim(), bookingReference: booking.bookingReference },
    });

    const updated = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return NextResponse.json({ success: true, booking: updated[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/bookings/[id]/allocate — return the current allocation for a booking
export async function GET(
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

    const booking = existing[0];
    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      allocatedUnit: booking.allocatedUnit || null,
      allocated: !!booking.allocatedUnit,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
