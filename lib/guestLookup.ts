import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { bookings } from "@/lib/db/schema";

/** Finds a booking by its guest token (TVL-XXXXXX). Tokens are case-insensitive. */
export async function bookingByGuestToken(token: string) {
  const clean = String(token || "").trim().toUpperCase();
  if (!/^TVL-[A-Z0-9]{4,12}$/.test(clean)) return null;
  const [b] = await getDb().select().from(bookings).where(eq(bookings.guestToken, clean)).limit(1);
  return b || null;
}
