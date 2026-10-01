import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { bookingConditions, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/booking-conditions/[id] — update a booking condition
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();

    const existing = await db
      .select()
      .from(bookingConditions)
      .where(eq(bookingConditions.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Condition not found" }, { status: 404 });
    }

    const updatePayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    const allowed = [
      "title",
      "type",
      "summary",
      "content",
      "badge",
      "isMandatory",
      "sortOrder",
      "isActive",
    ];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === "sortOrder") {
          updatePayload[key] = Number(body[key] || 0);
        } else if (key === "isMandatory" || key === "isActive") {
          updatePayload[key] = Boolean(body[key]);
        } else {
          updatePayload[key] = body[key];
        }
      }
    }

    await db.update(bookingConditions).set(updatePayload).where(eq(bookingConditions.id, id));

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: body.actor || "Admin",
      actorRole: body.actorRole || "admin",
      category: "policy",
      action: "Booking Condition Updated",
      details: `Updated condition "${existing[0].title}" (id: ${id})`,
      targetId: id,
      metadata: updatePayload,
    });

    const updated = await db
      .select()
      .from(bookingConditions)
      .where(eq(bookingConditions.id, id))
      .limit(1);

    return NextResponse.json({ success: true, condition: updated[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/booking-conditions/[id] — delete condition
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = await db
      .select()
      .from(bookingConditions)
      .where(eq(bookingConditions.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Condition not found" }, { status: 404 });
    }

    await db.delete(bookingConditions).where(eq(bookingConditions.id, id));

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: "Admin",
      actorRole: "admin",
      category: "policy",
      action: "Booking Condition Deleted",
      details: `Deleted condition: "${existing[0].title}" (id: ${id})`,
      targetId: id,
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
