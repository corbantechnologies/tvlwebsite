import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { events } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { propertyToday } from "@/lib/availability";
import { evaluateVoucher, USD_TO_KES } from "@/lib/vouchers";
import { generateReference, getSiteOrigin, initializePaystackTransaction } from "@/lib/paystack";
import { resolvePaystackSubaccount } from "@/lib/paystackSubaccounts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TICKETS_PER_ORDER = 20;

// ============================================================
// POST /api/events/checkout  (public)
// Body: { eventId, ticketCount, guestName, guestEmail, guestPhone,
//         dietaryRequirements?, voucherCode? }
//
// Prices the ticket order from the database (never from the browser),
// enforces paymentEnabled / active / capacity, picks the subaccount
// from the event, then starts the Paystack transaction.
// ============================================================
export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();

    const guestName = String(body.guestName || "").trim();
    const guestEmail = String(body.guestEmail || "").trim();
    const guestPhone = String(body.guestPhone || "").trim();
    const ticketCount = Math.floor(Number(body.ticketCount) || 0);

    if (!guestName || !EMAIL_RE.test(guestEmail) || !guestPhone) {
      return NextResponse.json({ error: "Please fill in your name, a valid email and phone number." }, { status: 400 });
    }
    if (ticketCount < 1 || ticketCount > MAX_TICKETS_PER_ORDER) {
      return NextResponse.json({ error: `You can buy between 1 and ${MAX_TICKETS_PER_ORDER} tickets per order.` }, { status: 400 });
    }

    const db = getDb();
    const [event] = await db.select().from(events).where(eq(events.id, String(body.eventId || ""))).limit(1);
    if (!event || event.isActive === false) {
      return NextResponse.json({ error: "This event is no longer available." }, { status: 404 });
    }
    if (!event.paymentEnabled) {
      return NextResponse.json({ error: "Online ticket sales are not open for this event." }, { status: 400 });
    }
    const lastDay = event.endDate || event.startDate;
    if (lastDay && lastDay < propertyToday()) {
      return NextResponse.json({ error: "This event has already taken place." }, { status: 400 });
    }
    if (event.maxCapacity != null) {
      const remaining = event.maxCapacity - (event.bookedCount || 0);
      if (remaining < ticketCount) {
        return NextResponse.json(
          { error: remaining > 0 ? `Only ${remaining} tickets remain for this event.` : "This event is sold out." },
          { status: 409 }
        );
      }
    }

    const unitPriceKes = event.priceKes || 0;
    const unitPriceUsd = event.priceUsd || Math.round(unitPriceKes / USD_TO_KES);
    const subtotalKes = unitPriceKes * ticketCount;
    if (subtotalKes <= 0) {
      return NextResponse.json({ error: "This event has no ticket price set. Please contact us." }, { status: 400 });
    }

    let discountAmountKes = 0;
    let voucherCode: string | null = null;
    if (body.voucherCode && String(body.voucherCode).trim()) {
      const result = await evaluateVoucher(String(body.voucherCode), {
        scope: "event",
        eventId: event.id,
        subtotalUsd: subtotalKes / USD_TO_KES,
        subtotalKes,
      });
      if (!result.valid) return NextResponse.json({ error: result.error }, { status: 400 });
      discountAmountKes = result.discountAmountKes;
      voucherCode = result.voucher.code;
    }

    const totalAmountKes = Math.max(0, subtotalKes - discountAmountKes);
    if (totalAmountKes <= 0) {
      return NextResponse.json({ error: "This order total is zero. Please contact us to arrange a complimentary pass." }, { status: 400 });
    }

    const subaccount = resolvePaystackSubaccount(event.brand, event.subaccountCode);
    const reference = generateReference("TKT");

    const init = await initializePaystackTransaction({
      email: guestEmail,
      amount: totalAmountKes,
      currency: "KES",
      reference,
      callbackUrl: `${getSiteOrigin(req)}/events/ticket-confirmed`,
      subaccount,
      metadata: {
        type: "event_ticket",
        eventId: event.id,
        eventTitle: event.title,
        brand: event.brand,
        venue: event.venue,
        eventDate: event.startDate,
        guestName,
        guestEmail,
        guestPhone,
        ticketCount,
        unitPriceKes,
        unitPriceUsd,
        totalAmountKes,
        totalAmountUsd: Math.round(totalAmountKes / USD_TO_KES),
        discountAmountKes,
        voucherCode,
        dietaryRequirements: String(body.dietaryRequirements || "").trim() || null,
      },
    });

    if (!init.ok) return NextResponse.json({ error: init.error }, { status: init.status });
    return NextResponse.json({ success: true, authorizationUrl: init.authorizationUrl, reference, totalAmountKes });
  } catch (err: any) {
    console.error("[Event Checkout] Error:", err.message);
    return NextResponse.json({ error: "Could not start ticket checkout. Please try again." }, { status: 500 });
  }
}
