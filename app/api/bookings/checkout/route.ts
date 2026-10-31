import { NextRequest, NextResponse } from "next/server";
import { sql, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { bookings, bookingExtras } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { loadAvailabilityData } from "@/lib/availability";
import { quoteApartmentStay, QuoteError } from "@/lib/bookingQuote";
import { generateReference, getSiteOrigin, initializePaystackTransaction } from "@/lib/paystack";
import { newGuestToken, newId } from "@/lib/ids";
import { writeAuditLog } from "@/lib/audit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================
// POST /api/bookings/checkout  (public)
//
// Server-side apartment checkout:
//   1. validates the guest's selection and recalculates the price,
//   2. checks blocks + inventory under a per-apartment lock,
//   3. saves a `pending_payment` booking (holds the unit for 30 min),
//   4. starts the Paystack transaction with the booking's reference.
//
// The webhook / verify endpoint then only marks that booking as paid,
// so every payment has a booking row in the portal from the start.
// ============================================================
export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    if (!name || !EMAIL_RE.test(email) || !phone) {
      return NextResponse.json({ error: "Please enter your name, a valid email address and a phone number." }, { status: 400 });
    }

    const selectedExtras = Array.isArray(body.selectedExtras)
      ? body.selectedExtras.map((x: any) => ({ extraId: String(x.extraId || ""), quantity: Number(x.quantity) || 0 }))
      : [];

    const db = getDb();
    const reference = generateReference("TVL");

    // Check availability and create the booking atomically per apartment type,
    // so two guests cannot both take the last unit.
    const created = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${"booking:" + String(body.apartmentId || "")}))`);

      const data = await loadAvailabilityData(tx);
      const quote = await quoteApartmentStay(data, {
        apartmentId: String(body.apartmentId || ""),
        checkIn: String(body.checkIn || ""),
        checkOut: String(body.checkOut || ""),
        adults: Number(body.adults),
        children: Number(body.children),
        mealPlanId: body.mealPlanId || null,
        selectedExtras,
        promocode: body.promocode || null,
      });

      if (!quote.availability.available) {
        throw new QuoteError(quote.availability.reason || "This apartment is not available for the selected dates.", 409);
      }
      if (quote.totalUsd <= 0) {
        throw new QuoteError("This booking total is zero. Please contact reservations to confirm it.", 400);
      }

      const booking = {
        id: newId("bkg"),
        bookingReference: reference,
        inquiryId: null,
        apartmentId: quote.apartmentId,
        apartmentName: quote.apartmentName,
        allocatedUnit: null,
        guestName: name,
        guestEmail: email,
        guestPhone: phone,
        checkIn: quote.checkIn,
        checkOut: quote.checkOut,
        adults: quote.adults,
        children: quote.children,
        mealPlanId: quote.mealPlanId,
        mealPlanName: quote.mealPlanName,
        mealPlanPricePerPersonUsd: quote.mealPlanRateUsd,
        mealPlanPricePerPersonKes: quote.mealPlanRateKes,
        roomRateUsd: quote.nightlyRateUsd,
        roomRateKes: 0,
        nights: quote.nights,
        totalRoomUsd: quote.totalRoomUsd,
        totalMealPlanUsd: quote.totalMealPlanUsd,
        totalExtrasUsd: quote.totalExtrasUsd,
        totalAmount: quote.totalUsd,
        currency: "USD",
        paymentStatus: "unpaid",
        paymentMethod: "paystack",
        paymentReference: reference,
        bookingStatus: "pending_payment",
        inquirySource: "village_apartment",
        specialRequests: String(body.specialRequests || "").trim() || null,
        staffNotes: quote.voucherCode
          ? [{ text: `Promo code ${quote.voucherCode} applied (−$${quote.discountUsd}).`, author: "System", timestamp: new Date().toISOString() }]
          : [],
        guestToken: newGuestToken(),
        createdAt: new Date().toISOString(),
      };
      await tx.insert(bookings).values(booking);

      if (quote.extras.length > 0) {
        await tx.insert(bookingExtras).values(
          quote.extras.map((x) => ({
            id: newId("bex"),
            bookingId: booking.id,
            extraId: x.extraId,
            extraName: x.name,
            quantity: x.quantity,
            unitPriceUsd: x.unitPriceUsd,
            unitPriceKes: x.unitPriceKes,
            totalPriceUsd: x.totalUsd,
            totalPriceKes: Math.round(x.totalUsd * 130),
            notes: null,
            createdAt: new Date().toISOString(),
          }))
        );
      }
      return { booking, quote };
    });

    const { booking, quote } = created;

    const init = await initializePaystackTransaction({
      email,
      amount: quote.totalUsd,
      currency: "USD",
      reference,
      callbackUrl: `${getSiteOrigin(req)}/booking-confirmed`,
      metadata: {
        type: "apartment_booking",
        bookingId: booking.id,
        guestToken: booking.guestToken,
        guestName: name,
        guestEmail: email,
        guestPhone: phone,
        apartmentId: booking.apartmentId,
        apartmentName: booking.apartmentName,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        adults: booking.adults,
        children: booking.children,
        voucherCode: quote.voucherCode,
      },
    });

    if (!init.ok) {
      // Release the hold so the unit is not blocked by a checkout that never reached Paystack.
      await db.update(bookings).set({ bookingStatus: "payment_failed" }).where(eq(bookings.id, booking.id));
      return NextResponse.json({ error: init.error }, { status: init.status });
    }

    await writeAuditLog({
      actor: "Website Checkout",
      actorRole: "system",
      category: "booking",
      action: "Checkout Started (Pending Payment)",
      details: `${name} started checkout for ${booking.apartmentName}, ${booking.checkIn} to ${booking.checkOut} (USD ${quote.totalUsd}).`,
      targetId: booking.id,
      metadata: { bookingReference: reference },
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: init.authorizationUrl,
      reference,
      totalUsd: quote.totalUsd,
    });
  } catch (err: any) {
    if (err instanceof QuoteError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[Checkout] Error:", err.message);
    return NextResponse.json({ error: "We couldn't start your booking. Please try again or contact reservations." }, { status: 500 });
  }
}
