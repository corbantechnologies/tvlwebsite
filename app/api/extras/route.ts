import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { extras, auditLogs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

// GET /api/extras — public + admin: list all active extras
export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") !== "false"; // default: active only

    const rows = await db.select().from(extras).orderBy(extras.sortOrder, extras.category);
    const filtered = activeOnly ? rows.filter((e) => e.isActive) : rows;

    return NextResponse.json({ success: true, extras: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/extras — admin/manager/reservations: create a new extra
export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const body = await req.json();

    if (!body.name || !body.category) {
      return NextResponse.json({ error: "name and category are required" }, { status: 400 });
    }

    const newExtra = {
      id: "ext_" + Date.now(),
      name: body.name,
      description: body.description || "",
      category: body.category, // "transfer" | "amenity" | "excursion" | "fnb" | "experience"
      priceUsd: Number(body.priceUsd || 0),
      priceKes: Number(body.priceKes || 0),
      pricingUnit: body.pricingUnit || "per_booking", // "per_booking" | "per_person" | "per_night" | "per_item"
      image: body.image || null,
      isActive: body.isActive !== false,
      sortOrder: Number(body.sortOrder || 0),
      createdAt: new Date().toISOString(),
    };

    await db.insert(extras).values(newExtra);

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: body.actor || "Admin",
      actorRole: body.actorRole || "admin",
      category: "content",
      action: "Extra Created",
      details: `Created extra: "${newExtra.name}" (${newExtra.category}) at USD ${newExtra.priceUsd} / KES ${newExtra.priceKes}`,
      targetId: newExtra.id,
    });

    return NextResponse.json({ success: true, extra: newExtra }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
