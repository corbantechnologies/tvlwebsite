import { and, eq, gte, inArray, isNull, lt, lte, ne, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { bookings } from "@/lib/db/schema";
import { addDays, propertyToday } from "@/lib/dates";
import { escapeHtml } from "@/lib/escapeHtml";
import { sendEmail, siteUrl } from "@/lib/mailer";
import { villageInbox } from "@/lib/staffInboxes";
import { findUnrecordedPayments, recordMissingPayments, type ReconcileOutcome } from "@/lib/paystackReconcile";
import { opsAlert } from "@/lib/opsAlert";
import { pruneRateLimits } from "@/lib/rateLimit";
import { writeAuditLog } from "@/lib/audit";
import { sendReviewRequestEmail } from "@/lib/guestEmails";

type Booking = typeof bookings.$inferSelect;

/** Unpaid checkouts older than this are marked expired (they stopped holding the unit after 30 minutes). */
export const EXPIRE_PENDING_AFTER_HOURS = 6;

export type DailyReport = {
  reconciled: ReconcileOutcome[];
  reconcileError: string | null;
  expired: number;
  abandoned: Booking[];
  arrivals: Booking[];
  openRequests: Booking[];
  refundsDue: Booking[];
  reviewEmailsSent: number;
};

/**
 * The nightly job (see app/api/cron/daily). Each step is independent: one
 * failing does not stop the others. Ends with one briefing email to the
 * Village reservations inbox.
 */
export async function runDailyJobs(now = new Date()): Promise<DailyReport> {
  const db = getDb();
  const today = propertyToday();

  // 1. Record any paid Paystack transaction the website missed (last 3 days).
  let reconciled: ReconcileOutcome[] = [];
  let reconcileError: string | null = null;
  try {
    const from = new Date(now.getTime() - 3 * 86400000).toISOString();
    const { missing } = await findUnrecordedPayments({ from });
    reconciled = await recordMissingPayments(missing, { apply: true, notifyStaff: true, actor: "Nightly Reconciliation" });
  } catch (err: any) {
    reconcileError = err.message;
    await opsAlert("Nightly Paystack reconciliation failed", err.message, { key: "reconcile" });
  }

  // 2. Expire stale unpaid checkouts.
  const cutoff = new Date(now.getTime() - EXPIRE_PENDING_AFTER_HOURS * 3600000).toISOString();
  const expiredRows = await db
    .update(bookings)
    .set({ bookingStatus: "expired" })
    .where(and(eq(bookings.bookingStatus, "pending_payment"), ne(bookings.paymentStatus, "paid"), lt(bookings.createdAt, cutoff)))
    .returning({ id: bookings.id });

  // 3. Abandoned checkouts not yet reported (guests who reached Paystack but did not pay).
  const abandoned = await db
    .select()
    .from(bookings)
    .where(and(inArray(bookings.bookingStatus, ["expired", "payment_failed"]), isNull(bookings.abandonedNotifiedAt), ne(bookings.paymentStatus, "paid")));
  if (abandoned.length > 0) {
    await db
      .update(bookings)
      .set({ abandonedNotifiedAt: now.toISOString() })
      .where(inArray(bookings.id, abandoned.map((b) => b.id)));
  }

  // 4. Today's arrivals, open guest requests, refunds owed.
  const arrivals = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.checkIn, today), inArray(bookings.bookingStatus, ["confirmed", "arriving_today"])));
  const openRequests = await db
    .select()
    .from(bookings)
    .where(sql`${bookings.changeRequest} ->> 'status' = 'open'`);
  const refundsDue = await db.select().from(bookings).where(eq(bookings.refundStatus, "due"));

  // 5. Post-stay review request (only when switched on).
  let reviewEmailsSent = 0;
  if (process.env.REVIEW_EMAILS_ENABLED === "true") {
    const stayed = await db
      .select()
      .from(bookings)
      .where(
        and(
          gte(bookings.checkOut, addDays(today, -3)),
          lte(bookings.checkOut, addDays(today, -1)),
          eq(bookings.paymentStatus, "paid"),
          inArray(bookings.bookingStatus, ["confirmed", "checked_out", "departing_today", "in_house"]),
          isNull(bookings.reviewRequestedAt)
        )
      );
    for (const b of stayed) {
      // Claim first so a retried cron never sends twice.
      const [claimed] = await db
        .update(bookings)
        .set({ reviewRequestedAt: now.toISOString() })
        .where(and(eq(bookings.id, b.id), isNull(bookings.reviewRequestedAt)))
        .returning({ id: bookings.id });
      if (claimed && (await sendReviewRequestEmail(b))) reviewEmailsSent++;
    }
  }

  await pruneRateLimits();

  const report: DailyReport = {
    reconciled,
    reconcileError,
    expired: expiredRows.length,
    abandoned,
    arrivals,
    openRequests,
    refundsDue,
    reviewEmailsSent,
  };

  await sendDailyBriefing(report, today);
  await writeAuditLog({
    actor: "Nightly Jobs",
    actorRole: "system",
    category: "system",
    action: "Daily jobs completed",
    details: `Recovered ${reconciled.filter((r) => r.result !== "dry_run").length} payment(s), expired ${report.expired} checkout(s), ${abandoned.length} abandoned, ${arrivals.length} arrival(s) today, ${reviewEmailsSent} review email(s).`,
  });
  return report;
}

async function sendDailyBriefing(r: DailyReport, today: string) {
  const e = escapeHtml;
  const section = (title: string, rows: string[], empty: string) =>
    `<h3 style="color:#821124;font-size:15px;margin:20px 0 6px">${e(title)}</h3>` +
    (rows.length ? `<ul style="font-size:13px;line-height:1.7;padding-left:18px;margin:0">${rows.join("")}</ul>` : `<p style="font-size:13px;color:#777;margin:0">${e(empty)}</p>`);

  const bookingLine = (b: Booking, extra = "") =>
    `<li><strong>${e(b.guestName)}</strong> · ${e(b.apartmentName)} · ${e(b.checkIn)} to ${e(b.checkOut)} · ${e(b.bookingReference)}${extra}</li>`;

  const html = `<div style="font-family:sans-serif;max-width:640px;padding:24px;border:1px solid #e2d9d0">
    <h2 style="color:#821124;margin-top:0">Daily reservations briefing · ${e(today)}</h2>
    ${section(
      "Today's arrivals",
      r.arrivals.map((b) =>
        bookingLine(b, b.checkInDetails ? " · <span style='color:#047857'>online check-in done</span>" : " · <span style='color:#b45309'>not checked in online</span>")
      ),
      "No arrivals today."
    )}
    ${section(
      "Guest requests waiting for you",
      r.openRequests.map((b) => {
        const req = b.changeRequest;
        const what = req?.type === "cancel" ? "cancellation request" : `date change to ${req?.newCheckIn} to ${req?.newCheckOut}`;
        return bookingLine(b, ` · ${e(what)}${req?.message ? `: “${e(req.message)}”` : ""}`);
      }),
      "No open requests."
    )}
    ${section("Refunds to issue", r.refundsDue.map((b) => bookingLine(b, " · cancelled within the free period")), "None.")}
    ${section(
      "Payments recovered from Paystack",
      r.reconciled.map(
        (o) =>
          `<li>${e(o.reference)} · ${e(o.currency)} ${e(o.amount)} · ${e(o.label)} · <strong>${e(o.result.replace("_", " "))}</strong>${o.error ? ` (${e(o.error)})` : ""}. The guest has not been emailed; resend the confirmation from the booking if needed.</li>`
      ),
      r.reconcileError ? `Reconciliation failed: ${r.reconcileError}` : "Every Paystack payment is recorded."
    )}
    ${section(
      "Abandoned checkouts (did not pay)",
      r.abandoned.map((b) => `<li>${e(b.guestName)} · ${e(b.guestEmail)} · ${e(b.guestPhone)} · ${e(b.apartmentName)} · ${e(b.checkIn)} to ${e(b.checkOut)} · USD ${e(b.totalAmount)}</li>`),
      "None."
    )}
    <p style="font-size:12px;color:#777;margin-top:20px">${r.expired} unpaid checkout(s) expired today${r.reviewEmailsSent ? ` · ${r.reviewEmailsSent} review request(s) sent` : ""}.</p>
    <p><a href="${e(siteUrl())}/admin/bookings" style="background:#821124;color:#fff;padding:8px 16px;text-decoration:none;border-radius:4px;display:inline-block">Open bookings</a></p>
  </div>`;

  await sendEmail({ to: villageInbox(), subject: `Daily briefing ${today}: ${r.arrivals.length} arrival(s), ${r.openRequests.length + r.refundsDue.length} to action`, html });
}
