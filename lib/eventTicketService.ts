import { getDb } from "@/lib/db/db";
import { eventTickets, events } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { writeAuditLog } from "@/lib/audit";
import { newId } from "@/lib/ids";
import { recordVoucherRedemption } from "@/lib/vouchers";
import { sendTicketConfirmationEmail, notifyStaffNewTicket } from "@/lib/eventTicketEmail";

type Ticket = typeof eventTickets.$inferSelect;

export function isEventTicketPayment(reference: string, metadata: any): boolean {
  return metadata?.type === "event_ticket" || reference.startsWith("TKT-");
}

function newQrToken(): string {
  return `QR-${newId("q").substring(2, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Issues the e-ticket for a confirmed Paystack payment. Idempotent and race-safe:
 * the webhook and the confirmation page may both call it; only the first insert
 * wins, and only that call bumps the event's bookedCount and sends emails.
 */
export async function fulfillEventTicket(
  reference: string,
  txData: any,
  opts: { notifyGuest?: boolean; actor?: string } = {}
): Promise<{ ticket: Ticket | null; isNew: boolean }> {
  const { notifyGuest = true, actor = "Paystack Gateway" } = opts;
  const db = getDb();
  const metadata = txData.metadata || {};
  const ticketCount = Math.max(1, Number(metadata.ticketCount) || 1);
  const totalAmountKes = Math.round(txData.amount / 100);

  const [inserted] = await db
    .insert(eventTickets)
    .values({
      id: newId("tkt"),
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
      unitPriceKes: Number(metadata.unitPriceKes) || Math.round(totalAmountKes / ticketCount),
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
      ticketQrToken: newQrToken(),
      createdAt: new Date().toISOString(),
    })
    .onConflictDoNothing({ target: eventTickets.ticketReference })
    .returning();

  if (!inserted) {
    const [existing] = await db.select().from(eventTickets).where(eq(eventTickets.ticketReference, reference)).limit(1);
    return { ticket: existing || null, isNew: false };
  }

  if (metadata.eventId) {
    try {
      await db
        .update(events)
        .set({ bookedCount: sql`COALESCE(${events.bookedCount}, 0) + ${ticketCount}` })
        .where(eq(events.id, metadata.eventId));
    } catch (err: any) {
      console.warn("[EventTicket] Failed to update bookedCount:", err.message);
    }
  }

  await writeAuditLog({
    actor,
    actorRole: "system",
    category: "event_ticket",
    action: "Event Ticket Purchased & Verified",
    details: `Ticket ${reference} for ${inserted.eventTitle} by ${inserted.guestName} (${ticketCount} tickets, KES ${totalAmountKes})`,
    targetId: inserted.id,
    metadata: { ticketReference: reference },
  });

  await recordVoucherRedemption(metadata.voucherCode);

  await Promise.allSettled([
    notifyGuest ? sendTicketConfirmationEmail(inserted) : Promise.resolve(),
    notifyStaffNewTicket(inserted),
  ]);

  return { ticket: inserted, isNew: true };
}
