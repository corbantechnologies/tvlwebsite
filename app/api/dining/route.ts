import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { diningOptions } from "@/lib/db/schema";
import { DINING } from "@/lib/data";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const data = await db.select().from(diningOptions);
    if (!data || data.length === 0) {
      return NextResponse.json({ dining: DINING, fallback: true });
    }
    return NextResponse.json({ dining: data });
  } catch (err: any) {
    console.warn("Dining DB lookup failed, returning baseline:", err);
    return NextResponse.json({ dining: DINING, fallback: true, database_error: err.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const newDining = {
      id: body.id || "din_" + Date.now(),
      name: body.name,
      description: body.description || "",
      highlights: body.highlights || [],
      hours: body.hours || "7:00 AM - 11:00 PM",
      image: body.image || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
      reservationLinkText: body.reservationLinkText || "Inquire Table",
      maxCapacity: Number(body.maxCapacity || 100),
      isActive: body.isActive !== false
    };
    await db.insert(diningOptions).values(newDining as any);
    return NextResponse.json({ success: true, dining: newDining });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create dining venue" }, { status: 500 });
  }
}
