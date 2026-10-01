import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { rateOverrides, auditLogs } from "@/lib/db/schema";
import { and, eq, gte, lte, or } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

// ============================================================
// GET /api/availability/rates
// Returns rate overrides, optionally filtered by apartmentId and/or date range
//
// Query params:
//   ?apartmentId=1-bedroom     — filter by specific apartment type
//   ?startDate=2026-12-20     — overlapping range filter start
//   ?endDate=2027-01-05       — overlapping range filter end
// ============================================================
export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const apartmentId = searchParams.get("apartmentId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let rows = await db.select().from(rateOverrides).orderBy(rateOverrides.startDate);

    // Filter: apartment
    if (apartmentId) {
      rows = rows.filter((r) => r.apartmentId === apartmentId || r.apartmentId === "all");
    }

    // Filter: overlap with requested date range
    if (startDate && endDate) {
      rows = rows.filter((r) => r.startDate < endDate && r.endDate > startDate);
    }

    return NextResponse.json({ success: true, rateOverrides: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================================
// POST /api/availability/rates
// Create a new rate override for a specific apartment type and date range
//
// Body:
// {
//   apartmentId: "1-bedroom" | "2-bedroom" | "3-bedroom" | "all",
//   startDate: "YYYY-MM-DD",
//   endDate: "YYYY-MM-DD",
//   rateUsd: 250,           // optional — null = no price override, just minNights
//   rateKes: 32500,         // optional
//   minNights: 3,           // optional — default 1
//   label: "Christmas 2026"  // optional description
// }
// ============================================================
export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const body = await req.json();

    if (!body.apartmentId || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: "apartmentId, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    if (body.startDate >= body.endDate) {
      return NextResponse.json({ error: "startDate must be before endDate" }, { status: 400 });
    }

    const newOverride = {
      id: "ro_" + Date.now(),
      apartmentId: body.apartmentId,
      startDate: body.startDate,
      endDate: body.endDate,
      rateUsd: body.rateUsd != null ? Number(body.rateUsd) : null,
      rateKes: body.rateKes != null ? Number(body.rateKes) : null,
      minNights: Number(body.minNights || 1),
      label: body.label || null,
      createdBy: body.createdBy || "Admin",
      createdAt: new Date().toISOString(),
    };

    await db.insert(rateOverrides).values(newOverride);

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: body.createdBy || "Admin",
      actorRole: "admin",
      category: "availability",
      action: "Rate Override Created",
      details: `Set rate override for ${body.apartmentId} from ${body.startDate} to ${body.endDate}: USD ${body.rateUsd ?? "no change"}, min ${newOverride.minNights} nights`,
      targetId: newOverride.id,
      metadata: newOverride,
    });

    return NextResponse.json({ success: true, rateOverride: newOverride }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================================
// DELETE /api/availability/rates?id=ro_xxx
// Remove a rate override by ID
// ============================================================
export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id query param is required" }, { status: 400 });
    }

    const existing = await db.select().from(rateOverrides).where(eq(rateOverrides.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Rate override not found" }, { status: 404 });
    }

    await db.delete(rateOverrides).where(eq(rateOverrides.id, id));

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: "Admin",
      actorRole: "admin",
      category: "availability",
      action: "Rate Override Removed",
      details: `Removed rate override for ${existing[0].apartmentId} (${existing[0].startDate} – ${existing[0].endDate})`,
      targetId: id,
    });

    return NextResponse.json({ success: true, message: "Rate override removed" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================================
// PATCH /api/availability/rates?id=ro_xxx
// Update a rate override (label, rates, minNights)
// ============================================================
export async function PATCH(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id query param is required" }, { status: 400 });
    }

    const existing = await db.select().from(rateOverrides).where(eq(rateOverrides.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Rate override not found" }, { status: 404 });
    }

    const updatePayload: Record<string, any> = {};
    const allowed = ["startDate", "endDate", "rateUsd", "rateKes", "minNights", "label"];
    for (const key of allowed) {
      if (body[key] !== undefined) updatePayload[key] = body[key];
    }

    await db.update(rateOverrides).set(updatePayload).where(eq(rateOverrides.id, id));

    const updated = await db.select().from(rateOverrides).where(eq(rateOverrides.id, id)).limit(1);
    return NextResponse.json({ success: true, rateOverride: updated[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
