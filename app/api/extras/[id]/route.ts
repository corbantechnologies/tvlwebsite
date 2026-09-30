import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { extras, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/extras/[id] — update an extra
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();

    const existing = await db.select().from(extras).where(eq(extras.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Extra not found" }, { status: 404 });
    }

    const updatePayload: Record<string, any> = {};
    const allowed = ["name", "description", "category", "priceUsd", "priceKes", "pricingUnit", "image", "isActive", "sortOrder"];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updatePayload[key] = body[key];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await db.update(extras).set(updatePayload).where(eq(extras.id, id));

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: body.actor || "Admin",
      actorRole: body.actorRole || "admin",
      category: "content",
      action: "Extra Updated",
      details: `Updated extra "${existing[0].name}" (id: ${id})`,
      targetId: id,
      metadata: updatePayload,
    });

    const updated = await db.select().from(extras).where(eq(extras.id, id)).limit(1);
    return NextResponse.json({ success: true, extra: updated[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/extras/[id] — soft-delete (deactivate) or hard delete
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const hard = searchParams.get("hard") === "true";

    const existing = await db.select().from(extras).where(eq(extras.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Extra not found" }, { status: 404 });
    }

    if (hard) {
      await db.delete(extras).where(eq(extras.id, id));
    } else {
      // Soft delete — deactivate so existing bookings with this extra aren't orphaned
      await db.update(extras).set({ isActive: false }).where(eq(extras.id, id));
    }

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: "Admin",
      actorRole: "admin",
      category: "content",
      action: hard ? "Extra Hard Deleted" : "Extra Deactivated",
      details: `${hard ? "Deleted" : "Deactivated"} extra "${existing[0].name}" (id: ${id})`,
      targetId: id,
    });

    return NextResponse.json({ success: true, message: hard ? "Extra permanently deleted" : "Extra deactivated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
