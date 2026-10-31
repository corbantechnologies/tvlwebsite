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
  const { getClient } = await import("../lib/db/db");
  const { findUnrecordedPayments, recordMissingPayments } = await import("../lib/paystackReconcile");

  const { scanned, missing } = await findUnrecordedPayments({ from: fromArg, secret });
  console.log(`Scanned ${scanned} successful Paystack transactions; ${missing.length} not recorded as paid.\n`);

  const outcomes = await recordMissingPayments(missing, { apply, notifyStaff, actor: "Paystack Sync Script" });
  for (const o of outcomes) {
    console.log(`${o.kind === "ticket" ? "TICKET " : "BOOKING"} ${o.reference} · ${o.currency} ${o.amount} · ${o.label}`);
    if (o.result === "unmatched") console.log("   -> skipped: no apartment details in metadata (logged for staff review)");
    else if (o.result === "needs_review") console.log("   -> recorded, NEEDS REVIEW (dates conflict or underpaid)");
    else if (o.result === "recorded") console.log("   -> recorded");
    else if (o.result === "failed") console.error(`   -> FAILED: ${o.error}`);
  }

  const recorded = outcomes.filter((o) => o.result === "recorded" || o.result === "needs_review").length;
  const failed = outcomes.filter((o) => o.result === "failed").length;
  console.log(
    apply
      ? `\nDone. Recorded ${recorded}, failed ${failed}.`
      : `\nDry run only. Re-run with --apply to record these ${missing.length} payments (guests will not be emailed).`
  );
  await getClient().end();
}

main().catch((e) => {
  console.error("Sync error:", e);
  process.exit(1);
});
