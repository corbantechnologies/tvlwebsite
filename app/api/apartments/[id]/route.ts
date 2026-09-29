import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { apartments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();
    await db.update(apartments).set({
      name: body.name,
      description: body.description,
      size: body.size,
      maxGuests: Number(body.maxGuests),
      pricePerNight: Number(body.pricePerNight),
      image: body.image,
      gallery: body.gallery,
      amenities: body.amenities,
      bedrooms: Number(body.bedrooms),
      bathrooms: Number(body.bathrooms),
      highlights: body.highlights,
      bedConfig: body.bedConfig,
      viewType: body.viewType,
      isActive: body.isActive !== false
    } as any).where(eq(apartments.id, id));
    return NextResponse.json({ success: true, message: "Suite updated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    await db.delete(apartments).where(eq(apartments.id, id));
    return NextResponse.json({ success: true, message: "Suite removed" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
