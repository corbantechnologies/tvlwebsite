import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { apartmentInventory, bookings, eventTickets, inquiries, vouchers } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { computeReport } from "@/lib/reports";
import { isIsoDate } from "@/lib/availability";
import { propertyToday } from "@/lib/dates";

// GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD  (managers, see lib/auth/roles.ts)
// Defaults to the current month to date.
export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const today = propertyToday();
    const sp = req.nextUrl.searchParams;
    const from = isIsoDate(sp.get("from")) ? (sp.get("from") as string) : today.slice(0, 8) + "01";
    const to = isIsoDate(sp.get("to")) ? (sp.get("to") as string) : today;
    if (to < from) return NextResponse.json({ error: "'to' must be on or after 'from'." }, { status: 400 });

    const db = getDb();
    const [b, inv, t, q, v] = await Promise.all([
      db.select().from(bookings),
      db.select().from(apartmentInventory),
      db.select().from(eventTickets),
      db.select().from(inquiries),
      db.select().from(vouchers),
    ]);
    return NextResponse.json({ report: computeReport({ from, to, bookings: b, inventory: inv, tickets: t, inquiries: q, vouchers: v }) });
  } catch (err: any) {
    console.error("[Reports]", err.message);
    return NextResponse.json({ error: "Could not build the report." }, { status: 500 });
  }
}
