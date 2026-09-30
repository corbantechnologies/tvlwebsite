import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { pricingRules, globalSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    
    // Base pricing rules
    const baseData = await db.select().from(pricingRules).where(eq(pricingRules.id, "default")).limit(1);
    const base = baseData.length > 0 ? baseData[0] : { markupMultiplier: 1.0, taxRate: 8, seasonalFactor: "regular" };

    // Extended pricing rules from globalSettings
    const extData = await db.select().from(globalSettings).where(eq(globalSettings.key, "pricing_extended")).limit(1);
    const extended = extData.length > 0 ? extData[0].value : {
      exchangeRate: 128.5,
      weekendSurchargePercent: 5,
      vatPercent: 16,
      cateringLevyPercent: 2,
      seasonalPeriods: [
        { id: "sp_1", name: "Low Season (Coastal Breeze)", startDate: "05-01", endDate: "06-30", multiplier: 0.85, minNights: 1 },
        { id: "sp_2", name: "Regular Season", startDate: "07-01", endDate: "11-30", multiplier: 1.0, minNights: 2 },
        { id: "sp_3", name: "Festive Peak (Christmas & New Year)", startDate: "12-15", endDate: "01-10", multiplier: 1.35, minNights: 3 },
      ],
      promoCodes: [
        { code: "DIRECT2026", discountPercent: 10, label: "Direct Web Booking Privilege", active: true },
        { code: "DHOWRETREAT", discountPercent: 15, label: "Suite + Sunset Dhow Combo", active: true },
      ],
    };

    return NextResponse.json({
      pricing: {
        ...base,
        ...(typeof extended === "object" ? extended : {}),
      },
    });
  } catch (err: any) {
    console.error("GET /api/pricing error:", err);
    return NextResponse.json(
      {
        pricing: {
          markupMultiplier: 1.0,
          taxRate: 8,
          seasonalFactor: "regular",
          exchangeRate: 128.5,
          weekendSurchargePercent: 5,
          vatPercent: 16,
          cateringLevyPercent: 2,
        },
        error: err.message,
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const baseUpdate = {
      markupMultiplier: Number(body.markupMultiplier ?? 1.0),
      taxRate: Number(body.taxRate ?? 8),
      seasonalFactor: body.seasonalFactor || "regular",
    };

    const exists = await db.select().from(pricingRules).where(eq(pricingRules.id, "default")).limit(1);
    if (!exists || exists.length === 0) {
      await db.insert(pricingRules).values({ id: "default", ...baseUpdate });
    } else {
      await db.update(pricingRules).set(baseUpdate).where(eq(pricingRules.id, "default"));
    }

    // Extended settings
    const extendedPayload = {
      exchangeRate: Number(body.exchangeRate ?? 128.5),
      weekendSurchargePercent: Number(body.weekendSurchargePercent ?? 5),
      vatPercent: Number(body.vatPercent ?? 16),
      cateringLevyPercent: Number(body.cateringLevyPercent ?? 2),
      seasonalPeriods: body.seasonalPeriods || [],
      promoCodes: body.promoCodes || [],
    };

    const extExists = await db.select().from(globalSettings).where(eq(globalSettings.key, "pricing_extended")).limit(1);
    if (!extExists || extExists.length === 0) {
      await db.insert(globalSettings).values({ key: "pricing_extended", value: extendedPayload });
    } else {
      await db.update(globalSettings).set({ value: extendedPayload }).where(eq(globalSettings.key, "pricing_extended"));
    }

    return NextResponse.json({
      success: true,
      pricing: { ...baseUpdate, ...extendedPayload },
    });
  } catch (err: any) {
    console.error("POST /api/pricing error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
