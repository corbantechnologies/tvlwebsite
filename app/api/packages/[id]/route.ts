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
      subtitle: body.subtitle,
      category: body.category,
      rateUsd: Number(body.rateUsd),
      rateKes: Number(body.rateKes || 0),
      pricingType: body.pricingType,
      minimumNights: Number(body.minimumNights || 1),
      applicableSuites: body.applicableSuites,
      mealPlanIncluded: body.mealPlanIncluded,
      includedActivities: body.includedActivities,
      features: body.features,
      terms: body.terms,
      badge: body.badge,
      image: body.image,
      isFeatured: !!body.isFeatured,
      isActive: body.isActive !== false
    } as any).where(eq(packages.id, id));
    return NextResponse.json({ success: true, message: "Package updated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
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
