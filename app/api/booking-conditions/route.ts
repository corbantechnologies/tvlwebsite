import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { bookingConditions, auditLogs } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

// GET /api/booking-conditions — list conditions (active only for public, all for admin)
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    const rows = await db
      .select()
      .from(bookingConditions)
      .orderBy(asc(bookingConditions.sortOrder), asc(bookingConditions.createdAt));

    const result = all ? rows : rows.filter((r) => r.isActive);

    return NextResponse.json({ success: true, conditions: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/booking-conditions — create a new booking condition / cancellation policy
export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    if (!body.title || !body.summary || !body.content) {
      return NextResponse.json(
        { error: "Title, summary, and detailed content are required" },
        { status: 400 }
      );
    }

    const newCondition = {
      id: "cond_" + Date.now(),
      title: body.title.trim(),
      type: body.type || "cancellation", // "cancellation" | "check_in_out" | "house_rules" | "payment" | "occupancy" | "general"
      summary: body.summary.trim(),
      content: body.content.trim(),
      badge: body.badge ? body.badge.trim() : null,
      isMandatory: body.isMandatory !== false,
      sortOrder: Number(body.sortOrder || 0),
      isActive: body.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(bookingConditions).values(newCondition);

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: body.actor || "Admin",
      actorRole: body.actorRole || "admin",
      category: "policy",
      action: "Booking Condition Created",
      details: `Created condition: "${newCondition.title}" (${newCondition.type})`,
      targetId: newCondition.id,
    });

    return NextResponse.json({ success: true, condition: newCondition }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
