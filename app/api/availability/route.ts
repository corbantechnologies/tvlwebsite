import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { apartmentInventory, availabilityBlocks, bookings, rateOverrides, apartments } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

function datesOverlap(blockStart: string, blockEnd: string, checkIn: string, checkOut: string): boolean {
  return blockStart < checkOut && blockEnd > checkIn;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.ceil(ms / 86400000));
}

// ============================================================
// GET /api/availability
//
// Without date params: returns all blocks and inventory
// With date params: returns per-apartment availability + applicable rate
//
// Query params:
//   ?checkIn=2026-12-20&checkOut=2027-01-02
//   ?apartmentId=1-bedroom   (optional filter)
// ============================================================
export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const { searchParams } = new URL(req.url);
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const aptId = searchParams.get("apartmentId");

    const db = getDb();
    const [allBlocks, inventory, allBookings, allRateOverrides, allApartments] = await Promise.all([
      db.select().from(availabilityBlocks),
      db.select().from(apartmentInventory),
      db.select().from(bookings),
      db.select().from(rateOverrides),
      db.select().from(apartments),
    ]);

    // No dates: return raw blocks + inventory for the calendar UI
    if (!checkIn || !checkOut) {
      return NextResponse.json({
        success: true,
        blocks: allBlocks,
        inventory,
        rateOverrides: allRateOverrides,
      });
    }

    const nights = nightsBetween(checkIn, checkOut);

    // Property-wide block check
    const globallyBlocked = allBlocks.some(
      (b) => b.apartmentId === "all" && b.blockType === "hard_block" && datesOverlap(b.startDate, b.endDate, checkIn, checkOut)
    );

    if (globallyBlocked) {
      return NextResponse.json({
        success: true,
        available: false,
        message: "The property is not accepting reservations during this period.",
        apartments: [],
        nights,
      });
    }

    // Build per-apartment availability map
    const apartmentResults = inventory.map((inv) => {
      const totalUnits = inv.totalUnits || 1;

      // Active bookings overlapping the requested dates
      const overlappingBookings = allBookings.filter(
        (b) =>
          b.apartmentId === inv.id &&
          !["cancelled", "checked_out", "no_show"].includes(b.bookingStatus) &&
          datesOverlap(b.checkIn, b.checkOut, checkIn, checkOut)
      ).length;

      // Hard blocks for this specific apartment type
      const hardBlock = allBlocks.find(
        (b) => b.apartmentId === inv.id && b.blockType === "hard_block" && datesOverlap(b.startDate, b.endDate, checkIn, checkOut)
      );

      // If hard blocked, all units are considered taken
      const occupiedUnits = hardBlock ? totalUnits : Math.min(totalUnits, overlappingBookings);
      const availableUnits = Math.max(0, totalUnits - occupiedUnits);

      // Find applicable rate override (most specific wins: apt-specific > "all")
      // If multiple overrides overlap, use the one with the latest startDate (most recently set)
      const applicableOverrides = allRateOverrides.filter(
        (ro) =>
          (ro.apartmentId === inv.id || ro.apartmentId === "all") &&
          datesOverlap(ro.startDate, ro.endDate, checkIn, checkOut)
      );

      // Sort: apt-specific first, then by most recent
      applicableOverrides.sort((a, b) => {
        if (a.apartmentId !== "all" && b.apartmentId === "all") return -1;
        if (a.apartmentId === "all" && b.apartmentId !== "all") return 1;
        return a.startDate > b.startDate ? -1 : 1;
      });

      const activeOverride = applicableOverrides[0] || null;

      // Base rate from apartments table
      const aptRecord = allApartments.find((a) => a.id === inv.id);
      const baseRateUsd = aptRecord ? aptRecord.pricePerNight : 0;

      // Effective rate: override wins if present
      const effectiveRateUsd = activeOverride?.rateUsd ?? baseRateUsd;
      const effectiveRateKes = activeOverride?.rateKes ?? (baseRateUsd * 130); // fallback KES estimate

      // Min nights enforcement
      const minNights = activeOverride?.minNights ?? 1;
      const meetsMinNights = nights >= minNights;

      // Check: minimum stay for rate hold blocks
      const rateHoldBlock = allBlocks.find(
        (b) => b.apartmentId === inv.id && b.blockType === "rate_hold" && datesOverlap(b.startDate, b.endDate, checkIn, checkOut)
      );

      return {
        apartmentId: inv.id,
        apartmentName: aptRecord?.name || inv.id,
        totalUnits,
        occupiedUnits,
        availableUnits,
        available: availableUnits > 0 && meetsMinNights,
        blockReason: hardBlock?.reason || null,
        rateHold: rateHoldBlock ? { reason: rateHoldBlock.reason } : null,
        rateOverride: activeOverride
          ? {
              id: activeOverride.id,
              rateUsd: activeOverride.rateUsd,
              rateKes: activeOverride.rateKes,
              minNights: activeOverride.minNights,
              label: activeOverride.label,
            }
          : null,
        effectiveRateUsd,
        effectiveRateKes,
        minNights,
        meetsMinNights,
        nights,
        estimatedTotalUsd: effectiveRateUsd * nights,
      };
    });

    const filtered = aptId
      ? apartmentResults.filter((a) => a.apartmentId === aptId)
      : apartmentResults;

    const anyAvailable = filtered.some((a) => a.available) || filtered.length === 0;

    return NextResponse.json({
      success: true,
      available: anyAvailable,
      nights,
      apartments: filtered,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
