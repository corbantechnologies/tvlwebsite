import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();
    await db.update(events).set({
      title: body.title,
      description: body.description,
      venue: body.venue,
      category: body.category,
      startDate: body.startDate,
      endDate: body.endDate,
      timeText: body.timeText,
      priceUsd: Number(body.priceUsd || 0),
      priceKes: Number(body.priceKes || 0),
      image: body.image,
      gallery: body.gallery,
      maxCapacity: Number(body.maxCapacity || 100),
      bookedCount: Number(body.bookedCount || 0),
      highlights: body.highlights,
      dressCode: body.dressCode,
      bookingLink: body.bookingLink,
      isFeatured: !!body.isFeatured,
      isActive: body.isActive !== false
    } as any).where(eq(events.id, id));
    return NextResponse.json({ success: true, message: "Event updated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    await db.delete(events).where(eq(events.id, id));
    return NextResponse.json({ success: true, message: "Event deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
