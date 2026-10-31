import { eq, or } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { bookings } from "@/lib/db/schema";
import { writeAuditLog } from "@/lib/audit";

type Booking = typeof bookings.$inferSelect;

// ============================================================
// Paystack refunds, always started by a staff member from the admin.
// Paystack then reports progress through the webhook (refund.*).
// ============================================================

/** Amount and currency the guest actually paid for this booking. */
export function paidAmountOf(b: Booking): { amount: number; currency: string } {
  const currency = b.chargeCurrency || b.currency || "USD";
  const amount = Number(b.amountPaid ?? b.chargeAmount ?? b.totalAmount) || 0;
  return { amount, currency };
}

export async function issueRefund(
  bookingId: string,
  opts: { amount?: number; reason?: string; staffName: string; staffRole: string }
): Promise<{ ok: true; booking: Booking } | { ok: false; status: number; error: string }> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return { ok: false, status: 503, error: "Paystack is not configured." };

  const db = getDb();
  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!b) return { ok: false, status: 404, error: "Booking not found." };
  if (b.paymentStatus !== "paid") return { ok: false, status: 409, error: "Only paid bookings can be refunded." };
  if (b.refundStatus === "processing" || b.refundStatus === "refunded") {
    return { ok: false, status: 409, error: `A refund is already ${b.refundStatus} for this booking.` };
  }
  if (!b.paymentReference) return { ok: false, status: 409, error: "This booking has no Paystack reference." };

  const paid = paidAmountOf(b);
  const amount = opts.amount != null ? Number(opts.amount) : paid.amount;
  if (!Number.isFinite(amount) || amount <= 0 || amount > paid.amount + 0.001) {
    return { ok: false, status: 400, error: `Refund must be between 0 and ${paid.currency} ${paid.amount}.` };
  }

  const res = await fetch("https://api.paystack.co/refund", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      transaction: b.paymentReference,
      amount: Math.round(amount * 100),
      currency: paid.currency,
      merchant_note: `${opts.reason || "Refund"} (by ${opts.staffName})`.slice(0, 200),
      customer_note: `Refund for Tamarind Village booking ${b.bookingReference}`,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as any;
  if (!body.status) {
    return { ok: false, status: 502, error: body.message || "Paystack refused the refund." };
  }

  const [updated] = await db
    .update(bookings)
    .set({
      refundStatus: "processing",
      refundAmount: amount,
      refundReference: String(body.data?.id ?? ""),
      staffNotes: [
        ...((b.staffNotes as any[]) || []),
        {
          text: `Refund of ${paid.currency} ${amount} started via Paystack${opts.reason ? `: ${opts.reason}` : ""}.`,
          author: opts.staffName,
          timestamp: new Date().toISOString(),
        },
      ],
    })
    .where(eq(bookings.id, b.id))
    .returning();

  await writeAuditLog({
    actor: opts.staffName,
    actorRole: opts.staffRole,
    category: "payment",
    action: "Refund Started",
    details: `Refund of ${paid.currency} ${amount} started for ${b.bookingReference} (${b.guestName}).`,
    targetId: b.id,
    metadata: { paystackRefundId: body.data?.id, reason: opts.reason },
  });

  return { ok: true, booking: updated };
}

/** Applies a Paystack refund.* webhook event to the matching booking. */
export async function applyRefundEvent(event: string, data: any): Promise<void> {
  const txRef = data?.transaction_reference || data?.transaction?.reference;
  if (!txRef) return;
  const status =
    event === "refund.processed" ? "refunded" : event === "refund.failed" ? "failed" : "processing";

  const db = getDb();
  const [b] = await db
    .select()
    .from(bookings)
    .where(or(eq(bookings.paymentReference, txRef), eq(bookings.bookingReference, txRef)))
    .limit(1);
  if (!b) return;

  await db
    .update(bookings)
    .set({
      refundStatus: status,
      ...(status === "refunded" ? { paymentStatus: "refunded" } : {}),
    })
    .where(eq(bookings.id, b.id));

  await writeAuditLog({
    actor: "Paystack Webhook",
    actorRole: "system",
    category: "payment",
    action: `Refund ${status}`,
    details: `Paystack reports refund ${status} for ${b.bookingReference}.`,
    targetId: b.id,
    metadata: { event, refundReference: data?.refund_reference },
  });
}
