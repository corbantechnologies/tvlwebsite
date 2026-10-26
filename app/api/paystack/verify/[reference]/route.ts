import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { bookings, eventTickets, events, auditLogs } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { Resend } from "resend";
import { sendTicketConfirmationEmail, notifyStaffNewTicket } from "@/lib/eventTicketEmail";
import { fulfillApartmentBooking } from "@/lib/bookingPaymentService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    await ensureDatabaseSeeded();
    const { reference } = await params;
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET) {
      return NextResponse.json(
        { error: "Payment verification unavailable: missing Paystack secret key." },
        { status: 500 }
      );
    }

    if (!reference) {
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
    }

    const db = getDb();

    // 1. Check if an event ticket already exists for this reference
    const existingTicket = await db
      .select()
      .from(eventTickets)
      .where(eq(eventTickets.ticketReference, reference))
      .limit(1);

    if (existingTicket.length > 0) {
      return NextResponse.json({
        success: true,
        isEventTicket: true,
        ticket: existingTicket[0],
      });
    }

    // 2. Check if a booking already exists for this reference
    const existingBooking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingReference, reference))
      .limit(1);

    if (existingBooking.length > 0 && existingBooking[0].paymentStatus === "paid") {
      return NextResponse.json({
        success: true,
        isEventTicket: false,
        booking: existingBooking[0],
        guestToken: existingBooking[0].guestToken,
      });
    }

    // 3. Verify with Paystack API
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data?.status !== "success") {
      return NextResponse.json(
        {
          error: paystackData.message || "Payment has not been confirmed by Paystack.",
          paystackStatus: paystackData.data?.status,
        },
        { status: 400 }
      );
    }

    const txData = paystackData.data;
    const metadata = txData.metadata || {};

    // 4. Handle EVENT TICKETS
    if (metadata.type === "event_ticket" || reference.startsWith("TKT-")) {
      const ticketCount = Number(metadata.ticketCount) || 1;
      const unitPriceKes = Number(metadata.unitPriceKes) || Math.round(txData.amount / 100);
      const totalAmountKes = Math.round(txData.amount / 100);

      const qrToken =
        "QR-" +
        Math.random().toString(36).substring(2, 8).toUpperCase() +
        "-" +
        Date.now().toString(36).substring(4).toUpperCase();

      const newTicket = {
        id: "tkt_" + Date.now(),
        ticketReference: reference,
        eventId: metadata.eventId || "resort_event",
        eventTitle: metadata.eventTitle || "Resort Special Event",
        brand: metadata.brand || "tamarind_village",
        venue: metadata.venue || "Tamarind Village Mombasa",
        eventDate: metadata.eventDate || new Date().toISOString().split("T")[0],
        guestName: metadata.guestName || txData.customer?.first_name || "Valued Guest",
        guestEmail: metadata.guestEmail || txData.customer?.email || "",
        guestPhone: metadata.guestPhone || txData.customer?.phone || "",
        ticketCount,
        unitPriceKes,
        unitPriceUsd: Number(metadata.unitPriceUsd) || 0,
        totalAmountKes,
        totalAmountUsd: Number(metadata.totalAmountUsd) || 0,
        currency: txData.currency || "KES",
        discountAmountKes: Number(metadata.discountAmountKes) || 0,
        voucherCode: metadata.voucherCode || null,
        paymentStatus: "paid",
        paymentMethod: txData.channel || "paystack",
        paymentReference: reference,
        subaccountCode: txData.subaccount?.subaccount_code || metadata.subaccountCode || null,
        checkInStatus: "pending",
        dietaryRequirements: metadata.dietaryRequirements || null,
        specialRequests: metadata.specialRequests || null,
        ticketQrToken: qrToken,
        createdAt: new Date().toISOString(),
      };

      await db.insert(eventTickets).values(newTicket);

      // Increment bookedCount for this event if event exists
      if (metadata.eventId) {
        try {
          await db
            .update(events)
            .set({
              bookedCount: sql`COALESCE(${events.bookedCount}, 0) + ${ticketCount}`,
            })
            .where(eq(events.id, metadata.eventId));
        } catch (e: any) {
          console.warn("[Ticket Verify] Could not update event bookedCount:", e.message);
        }
      }

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: "Paystack Gateway",
        actorRole: "system",
        category: "event_ticket",
        action: "Event Ticket Purchased & Verified",
        details: `Ticket ${newTicket.ticketReference} purchased for ${newTicket.eventTitle} by ${newTicket.guestName} (${ticketCount} tickets, KES ${totalAmountKes})`,
        targetId: newTicket.id,
        metadata: { ticketReference: newTicket.ticketReference, paymentReference: reference },
      });

      // Dispatch E-Ticket email and staff notification
      await Promise.allSettled([
        sendTicketConfirmationEmail(newTicket),
        notifyStaffNewTicket(newTicket),
      ]);

      return NextResponse.json({
        success: true,
        isEventTicket: true,
        ticket: newTicket,
      });
    }

    // 5. Handle APARTMENT BOOKINGS
    const fulfillment = await fulfillApartmentBooking(reference, txData);

    return NextResponse.json({
      success: true,
      isEventTicket: false,
      booking: fulfillment.booking,
      guestToken: fulfillment.booking?.guestToken,
    });
  } catch (err: any) {
    console.error("[Paystack Verify] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
