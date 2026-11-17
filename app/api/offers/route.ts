import { NextResponse } from "next/server";
import { getProfitroomOffers, isOfferCurrent } from "@/lib/profitroomOffers";

// GET /api/offers — public: offers published in the ProfitRoom Suite.
// ?all=1 includes standard rates (room only, B&B); default is special offers only.
// Offers whose end date has passed are never returned.
export async function GET(req: Request) {
  const all = new URL(req.url).searchParams.get("all") === "1";
  const result = await getProfitroomOffers();
  const { fetchedAt, stale } = result;
  const offers = result.offers.filter((o) => isOfferCurrent(o));
  return NextResponse.json(
    { success: true, offers: all ? offers : offers.filter((o) => o.isSpecial), fetchedAt, stale },
    { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } },
  );
}
