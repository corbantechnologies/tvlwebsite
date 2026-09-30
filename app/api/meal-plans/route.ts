import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { mealPlans, auditLogs } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

// GET /api/meal-plans — list all meal plans (active-only by default)
export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") !== "false";

    const rows = await db.select().from(mealPlans).orderBy(mealPlans.sortOrder);
    const filtered = activeOnly ? rows.filter((p) => p.isActive) : rows;

    return NextResponse.json({ success: true, mealPlans: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/meal-plans — admin only: create a new meal plan
// In practice the three standard plans are seeded; this allows for custom additions.
export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const body = await req.json();

    if (!body.name || !body.shortName) {
      return NextResponse.json({ error: "name and shortName are required" }, { status: 400 });
    }

    const id = body.id || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const newPlan = {
      id,
      name: body.name,
      shortName: body.shortName,
      description: body.description || "",
      pricePerPersonPerDayUsd: Number(body.pricePerPersonPerDayUsd || 0),
      pricePerPersonPerDayKes: Number(body.pricePerPersonPerDayKes || 0),
      image: body.image || null,
      highlights: body.highlights || [],
      isActive: body.isActive !== false,
      sortOrder: Number(body.sortOrder || 99),
      createdAt: new Date().toISOString(),
    };

    await db.insert(mealPlans).values(newPlan);

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: body.actor || "Admin",
      actorRole: body.actorRole || "admin",
      category: "content",
      action: "Meal Plan Created",
      details: `Created meal plan: "${newPlan.name}" at USD ${newPlan.pricePerPersonPerDayUsd}pp/day`,
      targetId: newPlan.id,
    });

    return NextResponse.json({ success: true, mealPlan: newPlan }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
