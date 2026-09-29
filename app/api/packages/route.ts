import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { packages } from "@/lib/db/schema";
import { DEFAULT_RESORT_PACKAGES } from "@/lib/data";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const data = await db.select().from(packages);
    if (!data || data.length === 0) {
      return NextResponse.json({ packages: DEFAULT_RESORT_PACKAGES, fallback: true });
    }
    return NextResponse.json({ packages: data });
  } catch (err: any) {
    console.warn("Packages DB lookup failed, returning baseline:", err);
    return NextResponse.json({ packages: DEFAULT_RESORT_PACKAGES, fallback: true, database_error: err.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const newPkg = {
      id: body.id || "pkg_" + Date.now(),
      name: body.name,
      slug,
      subtitle: body.subtitle || "",
      category: body.category || "boarding",
      rateUsd: Number(body.rateUsd || 0),
      rateKes: Number(body.rateKes || 0),
      pricingType: body.pricingType || "per_stay",
      minimumNights: Number(body.minimumNights || 1),
      applicableSuites: body.applicableSuites || ["all"],
      mealPlanIncluded: body.mealPlanIncluded || "bed_breakfast",
      includedActivities: body.includedActivities || [],
      features: body.features || [],
      terms: body.terms || "",
      badge: body.badge || "",
      image: body.image || "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--3.jpg",
      isFeatured: !!body.isFeatured,
      isActive: body.isActive !== false,
      createdAt: new Date().toISOString()
    };
    await db.insert(packages).values(newPkg as any);
    return NextResponse.json({ success: true, package: newPkg });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create package" }, { status: 500 });
  }
}
