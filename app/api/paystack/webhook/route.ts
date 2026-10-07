import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db/db";
import { bookings, eventTickets, events, auditLogs } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { sendTicketConfirmationEmail, notifyStaffNewTicket } from "@/lib/eventTicketEmail";

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      return NextResponse.json({ error: "No Paystack secret key configured" }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify HMAC SHA512 signature
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      console.warn("[Paystack Webhook] Invalid signature received.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const txData = payload.data;

    if (event === "charge.success" && txData) {
      const reference = txData.reference;
      const metadata = txData.metadata || {};
      const db = getDb();

      // Handle Event Tickets
      if (metadata.type === "event_ticket" || reference.startsWith("TKT-")) {
        const existingTicket = await db
          .select()
          .from(eventTickets)
          .where(eq(eventTickets.ticketReference, reference))
          .limit(1);

        if (existingTicket.length === 0) {
          const ticketCount = Number(metadata.ticketCount) || 1;
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
            unitPriceKes: Number(metadata.unitPriceKes) || Math.round(txData.amount / 100),
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

          if (metadata.eventId) {
            try {
              await db
                .update(events)
                .set({
                  bookedCount: sql`COALESCE(${events.bookedCount}, 0) + ${ticketCount}`,
                })
                .where(eq(events.id, metadata.eventId));
            } catch (e: any) {
              console.warn("[Webhook] Failed to update event bookedCount:", e.message);
            }
          }

          await db.insert(auditLogs).values({
            id: "log_" + Date.now(),
            timestamp: new Date().toISOString(),
            actor: "Paystack Webhook",
            actorRole: "system",
            category: "event_ticket",
            action: "Ticket Paid via Webhook",
            details: `Webhook confirmed payment for ticket ${reference} (${newTicket.guestName})`,
            targetId: newTicket.id,
          });

          await Promise.allSettled([
            sendTicketConfirmationEmail(newTicket),
            notifyStaffNewTicket(newTicket),
          ]);
        }
      } else {
        // Apartment Booking Webhook confirmation
        const existingBooking = await db
          .select()
          .from(bookings)
          .where(eq(bookings.bookingReference, reference))
          .limit(1);

        if (existingBooking.length > 0) {
          const b = existingBooking[0];
          if (b.paymentStatus !== "paid") {
            await db
              .update(bookings)
              .set({
                paymentStatus: "paid",
                paymentMethod: txData.channel || "paystack",
                paymentReference: reference,
                bookingStatus: "confirmed",
              })
              .where(eq(bookings.id, b.id));
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Paystack Webhook] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
