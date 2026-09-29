import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { packages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();
    
    await db.update(packages).set({
      name: body.name,
      subtitle: body.subtitle || "",
      category: body.category || body.tier || "Signature",
      rateUsd: Number(body.rateUsd ?? body.priceUsd ?? 0),
      rateKes: Number(body.rateKes ?? body.priceKes ?? 0),
      pricingType: body.pricingType || "per_stay",
      minimumNights: Number(body.minimumNights || body.nights || 1),
      applicableSuites: body.applicableSuites || ["all"],
      mealPlanIncluded: body.mealPlanIncluded || "",
      includedActivities: body.includedActivities || [],
      features: body.features || body.inclusions || [],
      terms: body.terms || "",
      badge: body.badge || "",
      image: body.image || body.heroImage || "",
      isFeatured: !!body.isFeatured,
      isActive: body.isActive !== false
    } as any).where(eq(packages.id, id));

    return NextResponse.json({ success: true, message: "Package updated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PUT(req, { params });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    await db.delete(packages).where(eq(packages.id, id));
    return NextResponse.json({ success: true, message: "Package deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
