import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { bookings } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { evaluateApartment, loadAvailabilityData, NON_OCCUPYING_STATUSES } from "@/lib/availability";
import { chargeFor, normalizePayCurrency } from "@/lib/fx";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { generateReference, getSiteOrigin, initializePaystackTransaction } from "@/lib/paystack";

// ============================================================
// POST /api/guest/pay  (public, authorised by the guest token)
// Body: { token: "TVL-XXXXXX" }
//
// "Pay Now" from the guest booking tracker. Pays the EXISTING booking
// for its stored total. The booking id travels in Paystack metadata so
// fulfillment updates this row instead of creating a duplicate.
// Inquiries cannot be paid online: staff convert them to a booking first.
// ============================================================
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, RATE_LIMITS.guestAction);
  if (limited) return limited;
  try {
    await ensureDatabaseSeeded();
    const { token, payCurrency } = await req.json();
    const clean = String(token || "").trim().toUpperCase();
    if (!clean) return NextResponse.json({ error: "Booking token is required." }, { status: 400 });

    const db = getDb();
    const [booking] = await db.select().from(bookings).where(eq(bookings.guestToken, clean)).limit(1);
    if (!booking) {
      return NextResponse.json(
        { error: "Online payment is available once our team has confirmed your stay. We'll send you a payment link." },
        { status: 404 }
      );
    }
    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ error: "This booking is already paid." }, { status: 409 });
    }
    if (booking.bookingStatus === "cancelled" || booking.bookingStatus === "no_show") {
      return NextResponse.json({ error: "This booking has been cancelled." }, { status: 409 });
    }
    const amount = Number(booking.totalAmount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "This booking has no amount due yet. Please contact reservations." }, { status: 400 });
    }

    // A lapsed online checkout no longer holds its unit, so re-check before taking payment again.
    if (booking.bookingStatus === "pending_payment" || NON_OCCUPYING_STATUSES.includes(booking.bookingStatus)) {
      const data = await loadAvailabilityData(db);
      const check = evaluateApartment(data, booking.apartmentId, booking.checkIn, booking.checkOut, {
        excludeBookingId: booking.id,
      });
      if (check.availableUnits <= 0) {
        return NextResponse.json(
          { error: "Sorry, these dates are no longer available. Please contact reservations or choose new dates." },
          { status: 409 }
        );
      }
    }

    // Bookings are priced in USD; a KES payment is converted at today's rate.
    const priced = (booking.currency || "USD").toUpperCase();
    const charge =
      priced === "USD"
        ? chargeFor(amount, normalizePayCurrency(payCurrency))
        : { currency: priced, amount, fxRate: null as number | null };
    await db
      .update(bookings)
      .set({ chargeCurrency: charge.currency, chargeAmount: charge.amount, fxRate: charge.fxRate })
      .where(eq(bookings.id, booking.id));

    const reference = generateReference("TVL");
    const init = await initializePaystackTransaction({
      email: booking.guestEmail,
      amount: charge.amount,
      currency: charge.currency,
      reference,
      callbackUrl: `${getSiteOrigin(req)}/booking-confirmed`,
      metadata: {
        type: "apartment_booking",
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        guestToken: booking.guestToken,
        guestName: booking.guestName,
        apartmentId: booking.apartmentId,
        apartmentName: booking.apartmentName,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
      },
    });

    if (!init.ok) return NextResponse.json({ error: init.error }, { status: init.status });
    return NextResponse.json({ success: true, authorizationUrl: init.authorizationUrl, reference });
  } catch (err: any) {
    console.error("[Guest Pay] Error:", err.message);
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 500 });
  }
}
