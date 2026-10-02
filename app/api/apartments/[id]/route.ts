import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { apartments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id || '').trim();
    const db = getDb();
    let [apt] = await db.select().from(apartments).where(eq(apartments.id, decodedId)).limit(1);
    if (!apt) {
      const all = await db.select().from(apartments);
      const lower = decodedId.toLowerCase();
      apt = all.find((a) => {
        const aId = (a.id || '').toLowerCase();
        if (aId === lower || aId.replace(/\s+/g, '-') === lower) return true;
        if (lower.includes('1') || lower.includes('one')) return aId.includes('1') || aId.includes('one') || a.bedrooms === 1;
        if (lower.includes('2') || lower.includes('two')) return aId.includes('2') || aId.includes('two') || a.bedrooms === 2;
        if (lower.includes('3') || lower.includes('three')) return aId.includes('3') || aId.includes('three') || a.bedrooms === 3;
        return false;
      }) as any;
    }
    if (!apt) {
      return NextResponse.json({ error: "Suite not found" }, { status: 404 });
    }
    return NextResponse.json({ apartment: apt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      rank: body.rank !== undefined ? Number(body.rank) : 0
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
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.rank !== undefined) updateData.rank = Number(body.rank);

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
