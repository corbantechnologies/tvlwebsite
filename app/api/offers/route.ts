import { NextResponse } from "next/server";
import { getProfitroomOffers } from "@/lib/profitroomOffers";

// GET /api/offers — public: offers published in the ProfitRoom Suite.
// ?all=1 includes standard rates (room only, B&B); default is special offers only.
export async function GET(req: Request) {
  const all = new URL(req.url).searchParams.get("all") === "1";
  const { offers, fetchedAt, stale } = await getProfitroomOffers();
  return NextResponse.json(
    { success: true, offers: all ? offers : offers.filter((o) => o.isSpecial), fetchedAt, stale },
    { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } },
  );
}
