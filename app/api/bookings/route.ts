import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { bookings, auditLogs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

// GET /api/bookings — list all bookings (newest first)
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

// ============================================================
// POST /api/bookings
// Create a new booking directly (staff-side, no Paystack).
// For Paystack-confirmed bookings, use /api/paystack/verify/[ref].
// ============================================================
export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();
    const db = getDb();

    const nights = body.nights || (() => {
      if (body.checkIn && body.checkOut) {
        return Math.max(1, Math.ceil(
          (new Date(body.checkOut).getTime() - new Date(body.checkIn).getTime()) / 86400000
        ));
      }
      return 1;
    })();

    // Generate a guest portal token if not provided
    const rawToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    const guestToken = body.guestToken || `TVL-${rawToken}`;

    const newBooking = {
      id: "bkg_" + Date.now(),
      bookingReference: body.bookingReference || "BK-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000),
      inquiryId: body.inquiryId || null,
      apartmentId: body.apartmentId || "1-bedroom",
      apartmentName: body.apartmentName || "1 Bedroom Suite",
      allocatedUnit: body.allocatedUnit || null,
      guestName: body.guestName || "Guest",
      guestEmail: body.guestEmail || "",
      guestPhone: body.guestPhone || "",
      checkIn: body.checkIn || new Date().toISOString().split("T")[0],
      checkOut: body.checkOut || new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      adults: Number(body.adults) || 1,
      children: Number(body.children) || 0,
      // Meal plan
      mealPlanId: body.mealPlanId || null,
      mealPlanName: body.mealPlanName || null,
      mealPlanPricePerPersonUsd: Number(body.mealPlanPricePerPersonUsd) || 0,
      mealPlanPricePerPersonKes: Number(body.mealPlanPricePerPersonKes) || 0,
      // Pricing snapshot
      roomRateUsd: Number(body.roomRateUsd) || 0,
      roomRateKes: Number(body.roomRateKes) || 0,
      nights,
      totalRoomUsd: Number(body.totalRoomUsd) || 0,
      totalMealPlanUsd: Number(body.totalMealPlanUsd) || 0,
      totalExtrasUsd: Number(body.totalExtrasUsd) || 0,
      totalAmount: Number(body.totalAmount) || 0,
      currency: body.currency || "KES",
      paymentStatus: body.paymentStatus || "unpaid",
      paymentMethod: body.paymentMethod || "direct",
      paymentReference: body.paymentReference || null,
      bookingStatus: body.bookingStatus || "confirmed",
      inquirySource: body.inquirySource || "village_apartment",
      specialRequests: body.specialRequests || null,
      staffNotes: body.staffNotes || [],
      guestToken,
      createdAt: new Date().toISOString(),
    };

    await db.insert(bookings).values(newBooking);

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: body.actor || "Staff",
      actorRole: body.actorRole || "reservations",
      category: "booking",
      action: "New Reservation Created",
      details: `Created reservation ${newBooking.bookingReference} for ${newBooking.guestName} (${newBooking.apartmentName}, ${nights} nights)`,
      targetId: newBooking.id,
      metadata: { bookingReference: newBooking.bookingReference },
    });

    return NextResponse.json({ success: true, booking: newBooking });
  } catch (err: any) {
    console.error("[API /api/bookings POST] Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
