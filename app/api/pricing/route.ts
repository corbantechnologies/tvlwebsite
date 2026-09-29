import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { pricingRules } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const data = await db.select().from(pricingRules).where(eq(pricingRules.id, "default")).limit(1);
    if (!data || data.length === 0) {
      return NextResponse.json({ pricing: { markupMultiplier: 1.0, taxRate: 8, seasonalFactor: "regular" } });
    }
    return NextResponse.json({ pricing: data[0] });
  } catch (err: any) {
    return NextResponse.json({ pricing: { markupMultiplier: 1.0, taxRate: 8, seasonalFactor: "regular" }, error: err.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const updated = {
      markupMultiplier: Number(body.markupMultiplier ?? 1.0),
      taxRate: Number(body.taxRate ?? 8),
      seasonalFactor: body.seasonalFactor || "regular"
    };

    const exists = await db.select().from(pricingRules).where(eq(pricingRules.id, "default")).limit(1);
    if (!exists || exists.length === 0) {
      await db.insert(pricingRules).values({ id: "default", ...updated });
    } else {
      await db.update(pricingRules).set(updated).where(eq(pricingRules.id, "default"));
    }

    return NextResponse.json({ success: true, pricing: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
