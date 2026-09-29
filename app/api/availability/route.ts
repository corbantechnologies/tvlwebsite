import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { apartmentInventory, availabilityBlocks, bookings } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

function datesOverlap(blockStart: string, blockEnd: string, checkIn: string, checkOut: string) {
  return blockStart < checkOut && blockEnd > checkIn;
}

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const { searchParams } = new URL(req.url);
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const aptId = searchParams.get("apartmentId");

    const db = getDb();
    const allBlocks = await db.select().from(availabilityBlocks);
    const inventory = await db.select().from(apartmentInventory);
    const allBookings = await db.select().from(bookings);

    if (!checkIn || !checkOut) {
      return NextResponse.json({ success: true, blocks: allBlocks });
    }

    const globallyBlocked = allBlocks.some(
      (b) => b.apartmentId === "all" && datesOverlap(b.startDate, b.endDate, checkIn, checkOut)
    );
    if (globallyBlocked) {
      return NextResponse.json({
        success: true,
        available: false,
        message: "The property is not accepting reservations during this period.",
        apartments: []
      });
    }

    const apartments = inventory.map((inv: any) => {
      const totalUnits = inv.totalUnits || 1;
      const overlapping = allBookings.filter(
        (b: any) =>
          b.apartmentId === inv.id &&
          b.bookingStatus !== "cancelled" &&
          b.bookingStatus !== "checked_out" &&
          datesOverlap(b.checkIn, b.checkOut, checkIn, checkOut)
      ).length;
      const block = allBlocks.find(
        (b: any) => b.apartmentId === inv.id && datesOverlap(b.startDate, b.endDate, checkIn, checkOut)
      );
      const occupiedUnits = Math.min(totalUnits, overlapping + (block ? totalUnits : 0));
      const availableUnits = Math.max(0, totalUnits - occupiedUnits);
      return {
        apartmentId: inv.id,
        totalUnits,
        occupiedUnits,
        availableUnits,
        available: availableUnits > 0,
        blockReason: block?.reason || null
      };
    });

    const filtered = aptId ? apartments.filter((a: any) => a.apartmentId === aptId) : apartments;
    return NextResponse.json({
      success: true,
      available: filtered.some((a: any) => a.available) || filtered.length === 0,
      apartments: filtered
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
