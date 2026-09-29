import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { apartmentInventory } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const rows = await db.select().from(apartmentInventory);
    return NextResponse.json({ success: true, inventory: rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const { apartmentId, totalUnits, notes } = await req.json();
    if (!apartmentId || totalUnits === undefined) {
      return NextResponse.json({ error: "apartmentId and totalUnits required" }, { status: 400 });
    }
    const db = getDb();
    const now = new Date().toISOString();
    await db.insert(apartmentInventory).values({
      id: apartmentId,
      totalUnits: Number(totalUnits),
      notes: notes || null,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: apartmentInventory.id,
      set: { totalUnits: Number(totalUnits), notes: notes || null, updatedAt: now },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
