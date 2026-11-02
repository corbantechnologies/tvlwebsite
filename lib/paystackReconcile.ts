import { eq, or } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { bookings, eventTickets } from "@/lib/db/schema";
import { fulfillApartmentBooking } from "@/lib/bookingPaymentService";
import { fulfillEventTicket, isEventTicketPayment } from "@/lib/eventTicketService";

// ============================================================
// Finds successful Paystack transactions that the website never
// recorded (e.g. a webhook that failed), and optionally records them.
// Used by the nightly cron and by `npm run sync:paystack`.
//
// Guests are NEVER emailed from here.
// ============================================================

export type MissingPayment = {
  reference: string;
  kind: "booking" | "ticket";
  currency: string;
  amount: number;
  email: string;
  label: string;
  tx: any;
};

export type ReconcileOutcome = MissingPayment & {
  result: "recorded" | "needs_review" | "unmatched" | "failed" | "dry_run";
  error?: string;
};

export async function findUnrecordedPayments(opts: { from?: string; secret?: string } = {}): Promise<{ scanned: number; missing: MissingPayment[] }> {
  const secret = opts.secret || process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not set.");
  const db = getDb();
  let page = 1;
  let scanned = 0;
  const missing: MissingPayment[] = [];

  for (;;) {
    const url = new URL("https://api.paystack.co/transaction");
    url.searchParams.set("status", "success");
    url.searchParams.set("perPage", "100");
    url.searchParams.set("page", String(page));
    if (opts.from) url.searchParams.set("from", opts.from);

    const res = await fetch(url, { headers: { Authorization: `Bearer ${secret}` } });
    const body: any = await res.json();
    if (!body.status || !Array.isArray(body.data)) {
      throw new Error(`Paystack transaction list failed on page ${page}: ${body.message || res.status}`);
    }

    for (const tx of body.data) {
      scanned++;
      const ref: string = tx.reference;
      const m = tx.metadata || {};
      const ticket = isEventTicketPayment(ref, m);
      let recorded: boolean;
      if (ticket) {
        const [t] = await db.select({ id: eventTickets.id }).from(eventTickets).where(eq(eventTickets.ticketReference, ref)).limit(1);
        recorded = Boolean(t);
      } else {
        const [b] = await db
          .select({ id: bookings.id, paymentStatus: bookings.paymentStatus })
          .from(bookings)
          .where(or(eq(bookings.bookingReference, ref), eq(bookings.paymentReference, ref)))
          .limit(1);
        recorded = Boolean(b && (b.paymentStatus === "paid" || b.paymentStatus === "refunded"));
      }
      if (!recorded) {
        missing.push({
          reference: ref,
          kind: ticket ? "ticket" : "booking",
          currency: tx.currency,
          amount: tx.amount / 100,
          email: m.guestEmail || tx.customer?.email || "",
          label: `${m.guestName || tx.customer?.email || "Unknown guest"} · ${m.apartmentName || m.eventTitle || "?"} · ${m.checkIn || m.eventDate || ""}${m.checkOut ? " to " + m.checkOut : ""}`,
          tx,
        });
      }
    }

    const pageCount = body.meta?.pageCount ?? page;
    if (page >= pageCount || body.data.length === 0) break;
    page++;
  }
  return { scanned, missing };
}

export async function recordMissingPayments(
  missing: MissingPayment[],
  opts: { apply: boolean; notifyStaff?: boolean; actor: string }
): Promise<ReconcileOutcome[]> {
  const out: ReconcileOutcome[] = [];
  for (const p of missing) {
    if (!opts.apply) {
      out.push({ ...p, result: "dry_run" });
      continue;
    }
    try {
      if (p.kind === "ticket") {
        await fulfillEventTicket(p.reference, p.tx, { notifyGuest: false, actor: opts.actor });
        out.push({ ...p, result: "recorded" });
      } else {
        const r = await fulfillApartmentBooking(p.reference, p.tx, {
          notifyGuest: false,
          notifyStaff: opts.notifyStaff ?? true,
          actor: opts.actor,
        });
        out.push({ ...p, result: r.unmatched ? "unmatched" : r.needsReview ? "needs_review" : "recorded" });
      }
    } catch (err: any) {
      out.push({ ...p, result: "failed", error: err.message });
    }
  }
  return out;
}
