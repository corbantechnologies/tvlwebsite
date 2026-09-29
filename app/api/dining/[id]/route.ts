import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { diningOptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();
    
    await db.update(diningOptions).set({
      name: body.name || body.title,
      description: body.description || "",
      highlights: body.highlights || [],
      hours: body.hours || "",
      image: body.image || "",
      reservationLinkText: body.reservationLinkText || "Reserve Table",
      maxCapacity: Number(body.maxCapacity || 100),
      isActive: body.isActive !== false
    } as any).where(eq(diningOptions.id, id));

    return NextResponse.json({ success: true, message: "Dining venue updated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PUT(req, { params });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    await db.delete(diningOptions).where(eq(diningOptions.id, id));
    return NextResponse.json({ success: true, message: "Dining venue removed" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
