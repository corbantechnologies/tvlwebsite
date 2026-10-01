import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { availabilityBlocks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    await db.delete(availabilityBlocks).where(eq(availabilityBlocks.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
