import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { bookings, eventTickets } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { fulfillApartmentBooking } from "@/lib/bookingPaymentService";
import { fulfillEventTicket, isEventTicketPayment } from "@/lib/eventTicketService";

// ============================================================
// GET /api/paystack/verify/[reference]
// Called by the confirmation pages after Paystack redirects the guest.
// Uses the same idempotent fulfillment as the webhook, so whichever
// arrives first records the payment and the other is a no-op.
// ============================================================
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    await ensureDatabaseSeeded();
    const { reference } = await params;
    if (!reference) {
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
    }

    const db = getDb();

    // Already recorded (usually by the webhook)?
    const [ticket] = await db.select().from(eventTickets).where(eq(eventTickets.ticketReference, reference)).limit(1);
    if (ticket) {
      return NextResponse.json({ success: true, isEventTicket: true, ticket });
    }
    const [paidBooking] = await db.select().from(bookings).where(eq(bookings.paymentReference, reference)).limit(1);
    if (paidBooking && paidBooking.paymentStatus === "paid") {
      return NextResponse.json({
        success: true,
        isEventTicket: false,
        booking: paidBooking,
        guestToken: paidBooking.guestToken,
      });
    }

    const verified = await verifyPaystackTransaction(reference);
    if (!verified.ok) {
      return NextResponse.json(
        { error: verified.error, paystackStatus: verified.paystackStatus },
        { status: verified.status }
      );
    }
    const txData = verified.data;

    if (isEventTicketPayment(reference, txData.metadata)) {
      const result = await fulfillEventTicket(reference, txData, { actor: "Paystack Verify" });
      return NextResponse.json({ success: true, isEventTicket: true, ticket: result.ticket });
    }

    const result = await fulfillApartmentBooking(reference, txData, { actor: "Paystack Verify" });
    if (!result.booking) {
      return NextResponse.json(
        { error: "Your payment was received but we couldn't match it to a booking. Our team has been alerted; please contact reception with your reference." },
        { status: 422 }
      );
    }
    return NextResponse.json({
      success: true,
      isEventTicket: false,
      booking: result.booking,
      guestToken: result.booking.guestToken,
    });
  } catch (err: any) {
    console.error("[Paystack Verify] Error:", err.message);
    return NextResponse.json(
      { error: "We couldn't confirm your payment just now. If you were charged, your booking is safe; please refresh or contact reception." },
      { status: 500 }
    );
  }
}
