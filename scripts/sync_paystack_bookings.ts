/**
 * Recovers paid Paystack transactions that have no booking / ticket in the database.
 *
 * Usage (from the repo root, with DATABASE_URL and PAYSTACK_SECRET_KEY set, e.g. in .env.local):
 *   npx tsx scripts/sync_paystack_bookings.ts            # dry run: lists what is missing
 *   npx tsx scripts/sync_paystack_bookings.ts --apply    # records the missing bookings/tickets
 *   npx tsx scripts/sync_paystack_bookings.ts --apply --from=2026-01-01
 *
 * Guests are NEVER emailed by this script. Staff get the normal internal
 * notification for each recovered booking unless --no-staff-email is passed.
 */
import fs from "fs";

function loadEnvFile(path: string) {
  if (!fs.existsSync(path)) return;
  for (const line of fs.readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.substring(0, idx).trim();
    let val = trimmed.substring(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const notifyStaff = !args.includes("--no-staff-email");
  const fromArg = args.find((a) => a.startsWith("--from="))?.split("=")[1];

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !process.env.DATABASE_URL) {
    console.error("PAYSTACK_SECRET_KEY and DATABASE_URL must be set.");
    process.exit(1);
  }

  // Imported after env is loaded so the DB client picks up DATABASE_URL.
  const { getDb, getClient } = await import("../lib/db/db");
  const { bookings, eventTickets } = await import("../lib/db/schema");
  const { eq, or } = await import("drizzle-orm");
  const { fulfillApartmentBooking } = await import("../lib/bookingPaymentService");
  const { fulfillEventTicket, isEventTicketPayment } = await import("../lib/eventTicketService");

  const db = getDb();
  let page = 1;
  let scanned = 0;
  const missing: any[] = [];

  // Page through every successful transaction.
  for (;;) {
    const url = new URL("https://api.paystack.co/transaction");
    url.searchParams.set("status", "success");
    url.searchParams.set("perPage", "100");
    url.searchParams.set("page", String(page));
    if (fromArg) url.searchParams.set("from", fromArg);

    const res = await fetch(url, { headers: { Authorization: `Bearer ${secret}` } });
    const body: any = await res.json();
    if (!body.status || !Array.isArray(body.data)) {
      console.error(`Failed to fetch page ${page}:`, body.message);
      process.exit(1);
    }

    for (const tx of body.data) {
      scanned++;
      const ref: string = tx.reference;
      if (isEventTicketPayment(ref, tx.metadata)) {
        const [t] = await db.select({ id: eventTickets.id }).from(eventTickets).where(eq(eventTickets.ticketReference, ref)).limit(1);
        if (!t) missing.push(tx);
      } else {
        const [b] = await db
          .select({ id: bookings.id, paymentStatus: bookings.paymentStatus })
          .from(bookings)
          .where(or(eq(bookings.bookingReference, ref), eq(bookings.paymentReference, ref)))
          .limit(1);
        if (!b || b.paymentStatus !== "paid") missing.push(tx);
      }
    }

    const pageCount = body.meta?.pageCount ?? page;
    if (page >= pageCount || body.data.length === 0) break;
    page++;
  }

  console.log(`Scanned ${scanned} successful Paystack transactions; ${missing.length} not recorded as paid.\n`);

  let recovered = 0;
  let failed = 0;
  for (const tx of missing) {
    const ref = tx.reference;
    const m = tx.metadata || {};
    const label = isEventTicketPayment(ref, m) ? "TICKET " : "BOOKING";
    console.log(
      `${label} ${ref} · ${tx.currency} ${tx.amount / 100} · ${m.guestName || tx.customer?.email} · ${m.apartmentName || m.eventTitle || "?"} · ${m.checkIn || m.eventDate || ""}${m.checkOut ? " → " + m.checkOut : ""}`
    );
    if (!apply) continue;

    try {
      if (isEventTicketPayment(ref, m)) {
        await fulfillEventTicket(ref, tx, { notifyGuest: false, actor: "Paystack Sync Script" });
      } else {
        const result = await fulfillApartmentBooking(ref, tx, {
          notifyGuest: false,
          notifyStaff,
          actor: "Paystack Sync Script",
        });
        if (result.unmatched) {
          console.log("   -> skipped: no apartment details in metadata (logged for staff review)");
          continue;
        }
        if (result.needsReview) console.log("   -> recorded, NEEDS REVIEW (dates conflict or underpaid)");
      }
      recovered++;
      console.log("   -> recorded");
    } catch (err: any) {
      failed++;
      console.error(`   -> FAILED: ${err.message}`);
    }
  }

  console.log(
    apply
      ? `\nDone. Recorded ${recovered}, failed ${failed}.`
      : `\nDry run only. Re-run with --apply to record these ${missing.length} payments (guests will not be emailed).`
  );
  await getClient().end();
}

main().catch((e) => {
  console.error("Sync error:", e);
  process.exit(1);
});
