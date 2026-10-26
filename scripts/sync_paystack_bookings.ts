import { getDb } from "../lib/db/db";
import { bookings } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { fulfillApartmentBooking } from "../lib/bookingPaymentService";
import fs from "fs";

// Ensure env variables are loaded if running standalone
if (!process.env.DATABASE_URL) {
  try {
    const envContent = fs.readFileSync(".env.local", "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (err: any) {
    console.error("Could not read .env.local:", err.message);
  }
}
async function sync() {
  const secret = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_LIVE_KEY || "";
  if (!secret) {
    console.error("Missing PAYSTACK_SECRET_KEY in environment");
    process.exit(1);
  }

  const res = await fetch("https://api.paystack.co/transaction?perPage=50", {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json();

  if (!data.status || !Array.isArray(data.data)) {
    console.error("Failed to fetch Paystack transactions:", data.message);
    process.exit(1);
  }

  const db = getDb();
  const successful = data.data.filter((t: any) => t.status === "success");
  console.log(`Found ${successful.length} successful transactions on Paystack.\n`);

  let recoveredCount = 0;

  for (const tx of successful) {
    const ref = tx.reference;
    const isTicket = tx.metadata?.type === "event_ticket" || ref.startsWith("TKT-");
    if (isTicket) continue; // skip event tickets

    // Check if in database
    const existing = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingReference, ref))
      .limit(1);

    if (existing.length === 0) {
      console.log(`[RECOVERING MISSING BOOKING]`);
      console.log(`- Reference: ${ref}`);
      console.log(`- Guest: ${tx.metadata?.guestName || tx.customer?.first_name} (${tx.customer?.email})`);
      console.log(`- Amount: ${tx.currency} ${tx.amount / 100}`);
      console.log(`- Suite: ${tx.metadata?.apartmentName || tx.metadata?.apartmentId}`);
      console.log(`- Dates: ${tx.metadata?.checkIn} to ${tx.metadata?.checkOut}`);

      const result = await fulfillApartmentBooking(ref, tx);
      console.log(`  -> Recovered successfully! Booking ID: ${result.booking.id}, Token: ${result.booking.guestToken}`);
      recoveredCount++;
    } else {
      console.log(`[OK] Booking already in DB: ${ref} (${existing[0].guestName}) - Status: ${existing[0].paymentStatus}`);
    }
  }

  console.log(`\nSync complete. Total recovered: ${recoveredCount}`);
  process.exit(0);
}

sync().catch((e) => {
  console.error("Sync error:", e);
  process.exit(1);
});
