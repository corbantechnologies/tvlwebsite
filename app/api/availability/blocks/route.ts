import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { availabilityBlocks } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const rows = await db.select().from(availabilityBlocks);
    return NextResponse.json({ success: true, blocks: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const { apartmentId, startDate, endDate, reason, blockedBy } = await req.json();
    if (!apartmentId || !startDate || !endDate) {
      return NextResponse.json({ error: "apartmentId, startDate, endDate required" }, { status: 400 });
    }
    const db = getDb();
    const newBlock = {
      id: "blk_" + Date.now(),
      apartmentId,
      startDate,
      endDate,
      reason: reason || "Blocked",
      blockedBy: blockedBy || "Admin",
      createdAt: new Date().toISOString(),
    };
    await db.insert(availabilityBlocks).values(newBlock);
    return NextResponse.json({ success: true, block: newBlock }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
