import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import {
  allApartmentIds,
  evaluateApartment,
  isIsoDate,
  loadAvailabilityData,
  nightsBetween,
} from "@/lib/availability";

// ============================================================
// GET /api/availability
//
// Without date params: returns all blocks and inventory
// With date params: returns per-apartment availability + applicable rate
//
// Query params:
//   ?checkIn=2026-12-20&checkOut=2027-01-02
//   ?apartmentId=1-bedroom   (optional filter)
//
// NOTE: this endpoint is for display only. Checkout re-checks
// availability on the server (see lib/availability.ts and
// /api/bookings/checkout) before any payment is taken.
// ============================================================
export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const { searchParams } = new URL(req.url);
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const aptId = searchParams.get("apartmentId");

    const data = await loadAvailabilityData(getDb());

    // No dates: return raw blocks + inventory for the calendar UI
    if (!checkIn || !checkOut) {
      return NextResponse.json({
        success: true,
        blocks: data.blocks,
        inventory: data.inventory,
        rateOverrides: data.rateOverrides,
      });
    }

    if (!isIsoDate(checkIn) || !isIsoDate(checkOut) || checkIn >= checkOut) {
      return NextResponse.json(
        { success: false, available: false, message: "Please choose a valid check-in and check-out date.", apartments: [] },
        { status: 400 }
      );
    }

    const nights = nightsBetween(checkIn, checkOut);
    const ids = aptId ? [aptId] : allApartmentIds(data);
    const results = ids.map((id) => evaluateApartment(data, id, checkIn, checkOut));

    const propertyBlocked = results.some((r) => r.propertyBlocked);
    if (propertyBlocked) {
      return NextResponse.json({
        success: true,
        available: false,
        message: "The property is not accepting reservations during this period.",
        apartments: results,
        nights,
      });
    }

    // Fail closed: if nothing matched, report unavailable instead of available.
    const anyAvailable = results.some((a) => a.available);

    return NextResponse.json({
      success: true,
      available: anyAvailable,
      message: anyAvailable ? undefined : results[0]?.reason || "No apartments are available for these dates.",
      nights,
      apartments: results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
