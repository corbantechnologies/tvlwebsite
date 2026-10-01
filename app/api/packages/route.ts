import { NextRequest, NextResponse } from "next/server";

// ============================================================
// /api/packages is now a compatibility redirect to /api/meal-plans
// 
// The old "packages" concept (full-stay resort bundles) has been
// replaced by the "meal-plans" model (per-person-per-day pricing).
// This route proxies to /api/meal-plans for backwards compatibility
// with any existing client-side code that calls /api/packages.
// ============================================================

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const activeParam = url.searchParams.get("active");

  const mealPlansUrl = new URL("/api/meal-plans", url.origin);
  if (activeParam !== null) mealPlansUrl.searchParams.set("active", activeParam);

  const res = await fetch(mealPlansUrl.toString());
  const data = await res.json();

  // Map response to old "packages" key for backwards compatibility
  return NextResponse.json({
    packages: data.mealPlans || [],
    mealPlans: data.mealPlans || [],
    note: "This endpoint is deprecated. Use /api/meal-plans directly.",
  });
}

export async function POST(req: NextRequest) {
  // Forward to /api/meal-plans
  const body = await req.json();
  const url = new URL(req.url);
  const mealPlansUrl = new URL("/api/meal-plans", url.origin);

  const res = await fetch(mealPlansUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
