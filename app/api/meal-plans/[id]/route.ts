import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { mealPlans, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/meal-plans/[id] — update a meal plan (rates, highlights, active status)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();

    const existing = await db.select().from(mealPlans).where(eq(mealPlans.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
    }

    const updatePayload: Record<string, any> = {};
    const allowed = [
      "name", "shortName", "description",
      "pricePerPersonPerDayUsd", "pricePerPersonPerDayKes",
      "image", "highlights", "isActive", "sortOrder"
    ];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updatePayload[key] = body[key];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await db.update(mealPlans).set(updatePayload).where(eq(mealPlans.id, id));

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: body.actor || "Admin",
      actorRole: body.actorRole || "admin",
      category: "content",
      action: "Meal Plan Updated",
      details: `Updated meal plan "${existing[0].name}" (id: ${id})`,
      targetId: id,
      metadata: updatePayload,
    });

    const updated = await db.select().from(mealPlans).where(eq(mealPlans.id, id)).limit(1);
    return NextResponse.json({ success: true, mealPlan: updated[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/meal-plans/[id] — deactivate (soft) or hard delete
// NOTE: the three seeded plans (room-only, bed-breakfast, half-board) should not be hard-deleted
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const hard = searchParams.get("hard") === "true";

// Admin has full control to hard delete any plan

    const existing = await db.select().from(mealPlans).where(eq(mealPlans.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
    }

    if (hard) {
      await db.delete(mealPlans).where(eq(mealPlans.id, id));
    } else {
      await db.update(mealPlans).set({ isActive: false }).where(eq(mealPlans.id, id));
    }

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: "Admin",
      actorRole: "admin",
      category: "content",
      action: hard ? "Meal Plan Deleted" : "Meal Plan Deactivated",
      details: `${hard ? "Deleted" : "Deactivated"} meal plan "${existing[0].name}" (id: ${id})`,
      targetId: id,
    });

    return NextResponse.json({
      success: true,
      message: hard ? "Meal plan permanently deleted" : "Meal plan deactivated",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
