import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { availabilityBlocks, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

// GET /api/availability/blocks — list all blocks
export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const rows = await db.select().from(availabilityBlocks).orderBy(availabilityBlocks.startDate);
    return NextResponse.json({ success: true, blocks: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/availability/blocks — create a new block
export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();
    const { apartmentId, startDate, endDate, reason, blockedBy, blockType, source } = body;

    if (!apartmentId || !startDate || !endDate) {
      return NextResponse.json({ error: "apartmentId, startDate, and endDate are required" }, { status: 400 });
    }

    if (startDate >= endDate) {
      return NextResponse.json({ error: "startDate must be before endDate" }, { status: 400 });
    }

    const db = getDb();
    const newBlock = {
      id: "blk_" + Date.now(),
      apartmentId,
      startDate,
      endDate,
      reason: reason || "Blocked",
      blockType: blockType || "hard_block", // "hard_block" | "rate_hold"
      source: source || "direct",           // "direct" | "opera" | "upperbooking"
      blockedBy: blockedBy || "Admin",
      createdAt: new Date().toISOString(),
    };

    await db.insert(availabilityBlocks).values(newBlock);

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: blockedBy || "Admin",
      actorRole: "admin",
      category: "availability",
      action: `Availability Block Created (${blockType || "hard_block"})`,
      details: `Blocked ${apartmentId} from ${startDate} to ${endDate}: ${reason || "No reason given"} (source: ${source || "direct"})`,
      targetId: newBlock.id,
      metadata: newBlock,
    });

    return NextResponse.json({ success: true, block: newBlock }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/availability/blocks?id=blk_xxx — remove a block
export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id query param is required" }, { status: 400 });
    }

    const existing = await db.select().from(availabilityBlocks).where(eq(availabilityBlocks.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    await db.delete(availabilityBlocks).where(eq(availabilityBlocks.id, id));

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: "Admin",
      actorRole: "admin",
      category: "availability",
      action: "Availability Block Removed",
      details: `Removed block for ${existing[0].apartmentId} (${existing[0].startDate} – ${existing[0].endDate})`,
      targetId: id,
    });

    return NextResponse.json({ success: true, message: "Block removed" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
