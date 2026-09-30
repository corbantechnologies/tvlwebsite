import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { apartments } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const data = await db.select().from(apartments);
    return NextResponse.json({ apartments: data || [] });
  } catch (err: any) {
    console.error("GET /api/apartments database error:", err);
    return NextResponse.json({ apartments: [], error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const newApt = {
      id: body.id || "apt_" + Date.now(),
      name: body.name,
      description: body.description || "",
      size: body.size || "85 m²",
      maxGuests: Number(body.maxGuests || 2),
      pricePerNight: Number(body.pricePerNight || 200),
      image: body.image || "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--2.jpg",
      gallery: body.gallery || [],
      amenities: body.amenities || [],
      bedrooms: Number(body.bedrooms || 1),
      bathrooms: Number(body.bathrooms || 1),
      highlights: body.highlights || [],
      bedConfig: body.bedConfig || "1 King Bed",
      viewType: body.viewType || "Ocean View",
      isActive: body.isActive !== false
    };
    await db.insert(apartments).values(newApt as any);
    return NextResponse.json({ success: true, apartment: newApt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create suite" }, { status: 500 });
  }
}
