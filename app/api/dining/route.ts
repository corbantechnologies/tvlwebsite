import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { diningOptions } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const data = await db.select().from(diningOptions);
    return NextResponse.json({ dining: data || [] });
  } catch (err: any) {
    console.error("GET /api/dining database error:", err);
    return NextResponse.json({ dining: [], error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const newVenue = {
      id: body.id || "venue_" + Date.now(),
      name: body.name || body.title,
      description: body.description || "",
      highlights: body.highlights || [],
      hours: body.hours || "Open Daily: 12:00 PM - 11:00 PM",
      image: body.image || "https://media.tamarind.co.ke/tvl-website-assets/tamarind_restaurant.jpg",
      reservationLinkText: body.reservationLinkText || "Book Reservation",
      maxCapacity: Number(body.maxCapacity || 100),
      isActive: body.isActive !== false
    };

    await db.insert(diningOptions).values(newVenue as any);
    return NextResponse.json({ success: true, venue: newVenue });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create dining venue" }, { status: 500 });
  }
}
