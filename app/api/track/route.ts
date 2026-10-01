import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { inquiries, bookings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ============================================================
// /api/track — Query parameter helper for ?token=TVL-XXXXXX
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || searchParams.get("ref");
    if (!token) {
      return NextResponse.json({ error: "Reference code or token is required" }, { status: 400 });
    }

    const clean = token.trim().toUpperCase();
    const db = getDb();

    // Check inquiries by guestToken or ID
    const inq = await db.select().from(inquiries).where(eq(inquiries.guestToken, clean)).limit(1);
    if (inq.length > 0) {
      return NextResponse.json({ success: true, inquiry: inq[0], type: "inquiry" });
    }

    // Check bookings by guestToken or bookingReference
    const bkg = await db.select().from(bookings).where(eq(bookings.guestToken, clean)).limit(1);
    if (bkg.length > 0) {
      return NextResponse.json({ success: true, booking: bkg[0], inquiry: bkg[0], type: "booking" });
    }

    // Also check bookings by bookingReference
    const bkgRef = await db.select().from(bookings).where(eq(bookings.bookingReference, clean)).limit(1);
    if (bkgRef.length > 0) {
      return NextResponse.json({ success: true, booking: bkgRef[0], inquiry: bkgRef[0], type: "booking" });
    }

    return NextResponse.json({ error: "No reservation or inquiry found for this reference code." }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
