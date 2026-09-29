import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { bookings, auditLogs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const records = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
    return NextResponse.json({ success: true, bookings: records || [] });
  } catch (err: any) {
    console.error("[API /api/bookings GET] Error:", err.message);
    return NextResponse.json({ success: false, bookings: [], error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();
    const db = getDb();

    const newBooking = {
      id: "res_" + Date.now(),
      bookingReference: "BK-" + new Date().getFullYear() + "-" + Math.floor(100 + Math.random() * 900),
      inquiryId: body.inquiryId || null,
      apartmentId: body.apartmentId || "1-bedroom",
      apartmentName: body.apartmentName || "1 Bedroom Suite",
      guestName: body.guestName || "Guest",
      guestEmail: body.guestEmail || "",
      guestPhone: body.guestPhone || "",
      checkIn: body.checkIn || new Date().toISOString().split("T")[0],
      checkOut: body.checkOut || new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      adults: Number(body.adults) || 1,
      children: Number(body.children) || 0,
      packageId: body.packageId || "ro",
      packageName: body.packageName || "Room Only",
      totalAmount: Number(body.totalAmount) || 0,
      currency: body.currency || "USD",
      paymentStatus: body.paymentStatus || "unpaid",
      paymentMethod: body.paymentMethod || "card",
      bookingStatus: body.bookingStatus || "confirmed",
      specialRequests: body.specialRequests || "",
      staffNotes: body.staffNotes || [],
      createdAt: new Date().toISOString(),
    };

    await db.insert(bookings).values(newBooking);

    // Audit Log entry
    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: "staff",
      actorRole: "Front Desk",
      category: "booking",
      action: "New Reservation Created",
      details: `Created reservation ${newBooking.bookingReference} for ${newBooking.guestName}`,
      targetId: newBooking.id,
      metadata: { bookingReference: newBooking.bookingReference }
    });

    return NextResponse.json({ success: true, booking: newBooking });
  } catch (err: any) {
    console.error("[API /api/bookings POST] Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();
    const { id, action, bookingStatus, note } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
    }

    const db = getDb();
    const existing = await db.select().from(bookings).where(eq(bookings.id, id));

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Booking record not found" }, { status: 404 });
    }

    const currentBooking = existing[0];
    const updatePayload: Record<string, any> = {};

    if (action === "check-in") {
      updatePayload.bookingStatus = "in_house";
    } else if (action === "check-out") {
      updatePayload.bookingStatus = "checked_out";
    } else if (bookingStatus) {
      updatePayload.bookingStatus = bookingStatus;
    }

    if (note) {
      const currentNotes = (currentBooking.staffNotes as any[]) || [];
      updatePayload.staffNotes = [
        ...currentNotes,
        { text: note, timestamp: new Date().toISOString(), author: "Front Desk Staff" }
      ];
    }

    if (Object.keys(updatePayload).length > 0) {
      await db.update(bookings).set(updatePayload).where(eq(bookings.id, id));

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: "staff",
        actorRole: "Front Desk",
        category: "operations",
        action: `Front Desk Operation: ${action || "Status Update"}`,
        details: `Updated booking ${currentBooking.bookingReference} (${currentBooking.guestName}): status changed to ${updatePayload.bookingStatus || currentBooking.bookingStatus}`,
        targetId: id,
        metadata: updatePayload
      });
    }

    const updated = await db.select().from(bookings).where(eq(bookings.id, id));
    return NextResponse.json({ success: true, booking: updated[0] });
  } catch (err: any) {
    console.error("[API /api/bookings PATCH] Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
