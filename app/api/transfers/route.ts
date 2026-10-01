import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { transfers, bookings, auditLogs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();

    // 1. Fetch from transfers table
    const explicitTransfers = await db
      .select()
      .from(transfers)
      .orderBy(desc(transfers.createdAt));

    // 2. Fetch bookings with transfer requests
    const allBookings = await db.select().from(bookings);
    const bookingTransfers: any[] = [];

    allBookings.forEach((b) => {
      const notes = (b.specialRequests || "").toLowerCase();
      if (
        notes.includes("transfer") ||
        notes.includes("airport") ||
        notes.includes("sgr") ||
        notes.includes("pickup") ||
        notes.includes("alphard")
      ) {
        // Only include if not already explicitly in transfers table
        const alreadyExists = explicitTransfers.some(
          (t) => t.bookingId === b.id || (t.bookingReference && t.bookingReference === b.bookingReference)
        );
        if (!alreadyExists) {
          bookingTransfers.push({
            id: `bkg_tr_${b.id}`,
            bookingId: b.id,
            bookingReference: b.bookingReference,
            guestName: b.guestName,
            guestEmail: b.guestEmail,
            guestPhone: b.guestPhone,
            pickupLocation: notes.includes("sgr")
              ? "Mombasa SGR Terminus"
              : "Moi International Airport (MBA)",
            dropoffLocation: "Tamarind Village Mombasa",
            pickupDateTime: `${b.checkIn} 14:00`,
            flightOrTrainNumber: b.specialRequests || "Guest Booking Request",
            vehicleType: notes.includes("alphard")
              ? "Luxury Alphard VIP"
              : "Executive Private Sedan",
            passengers: (b.adults || 1) + (b.children || 0),
            driverName: null,
            driverPhone: null,
            status: "scheduled",
            costKes: 3500,
            costUsd: 30,
            notes: b.specialRequests || "Created automatically from reservation check-in notes",
            createdAt: b.createdAt,
            isFromBooking: true,
          });
        }
      }
    });

    return NextResponse.json({
      transfers: [...explicitTransfers, ...bookingTransfers],
    });
  } catch (err: any) {
    console.error("GET /api/transfers error:", err);
    return NextResponse.json({ error: "Failed to load transfers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const body = await req.json();

    const {
      guestName,
      guestPhone,
      guestEmail,
      pickupLocation,
      dropoffLocation,
      pickupDateTime,
      flightOrTrainNumber,
      vehicleType,
      passengers,
      driverName,
      driverPhone,
      costKes,
      costUsd,
      notes,
      bookingReference,
    } = body;

    if (!guestName || !pickupLocation || !dropoffLocation || !pickupDateTime) {
      return NextResponse.json(
        { error: "Guest name, pickup location, dropoff location, and date/time are required." },
        { status: 400 }
      );
    }

    const transferId = "tr_" + Date.now();
    const now = new Date().toISOString();

    const newTransfer = {
      id: transferId,
      bookingId: body.bookingId || null,
      bookingReference: bookingReference ? bookingReference.trim() : null,
      guestName: guestName.trim(),
      guestPhone: guestPhone ? guestPhone.trim() : null,
      guestEmail: guestEmail ? guestEmail.trim() : null,
      pickupLocation: pickupLocation.trim(),
      dropoffLocation: dropoffLocation.trim(),
      pickupDateTime: pickupDateTime.trim(),
      flightOrTrainNumber: flightOrTrainNumber ? flightOrTrainNumber.trim() : null,
      vehicleType: vehicleType || "Executive Private Sedan",
      passengers: Number(passengers) || 1,
      driverName: driverName ? driverName.trim() : null,
      driverPhone: driverPhone ? driverPhone.trim() : null,
      status: "scheduled",
      costKes: Number(costKes) || 0,
      costUsd: Number(costUsd) || 0,
      notes: notes ? notes.trim() : null,
      createdAt: now,
    };

    await db.insert(transfers).values(newTransfer);

    // Audit log
    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: now,
      actor: "staff",
      actorRole: "concierge",
      category: "transfers",
      action: "Booked VIP Transfer",
      details: `Scheduled ${newTransfer.vehicleType} for ${guestName} (${pickupLocation} → ${dropoffLocation})`,
      targetId: transferId,
    });

    return NextResponse.json({ success: true, transfer: newTransfer });
  } catch (err: any) {
    console.error("POST /api/transfers error:", err);
    return NextResponse.json({ error: "Failed to schedule transfer" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { id, status, driverName, driverPhone, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Transfer ID is required" }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;
    if (driverName !== undefined) updateData.driverName = driverName;
    if (driverPhone !== undefined) updateData.driverPhone = driverPhone;
    if (notes !== undefined) updateData.notes = notes;

    await db.update(transfers).set(updateData).where(eq(transfers.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/transfers error:", err);
    return NextResponse.json({ error: "Failed to update transfer" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Transfer ID is required" }, { status: 400 });
    }

    await db.delete(transfers).where(eq(transfers.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/transfers error:", err);
    return NextResponse.json({ error: "Failed to delete transfer" }, { status: 500 });
  }
}
