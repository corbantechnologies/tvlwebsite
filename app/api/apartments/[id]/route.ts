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
    } as any).where(eq(apartments.id, id));

    return NextResponse.json({ success: true, message: "Suite updated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();
    
    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.size !== undefined) updateData.size = body.size;
    if (body.maxGuests !== undefined) updateData.maxGuests = Number(body.maxGuests);
    if (body.pricePerNight !== undefined) updateData.pricePerNight = Number(body.pricePerNight);
    if (body.price_per_night_usd !== undefined) updateData.pricePerNight = Number(body.price_per_night_usd);
    if (body.image !== undefined) updateData.image = body.image;
    if (body.gallery !== undefined) updateData.gallery = body.gallery;
    if (body.amenities !== undefined) updateData.amenities = body.amenities;
    if (body.bedrooms !== undefined) updateData.bedrooms = Number(body.bedrooms);
    if (body.bathrooms !== undefined) updateData.bathrooms = Number(body.bathrooms);
    if (body.highlights !== undefined) updateData.highlights = body.highlights;
    if (body.bedConfig !== undefined) updateData.bedConfig = body.bedConfig;
    if (body.viewType !== undefined) updateData.viewType = body.viewType;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    await db.update(apartments).set(updateData as any).where(eq(apartments.id, id));
    return NextResponse.json({ success: true, message: "Suite patched" });
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
