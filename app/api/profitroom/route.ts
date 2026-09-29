import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const adults = searchParams.get("adults") || "2";

  // Profitroom proxy endpoint returning structured rates
  return NextResponse.json({
    status: "ok",
    hotel: "tamarind_village_mombasa",
    channel: "website_direct",
    query: { checkIn, checkOut, adults: Number(adults) },
    rates: [
      { roomCode: "1BED", pricePerNight: 160, currency: "USD", available: true },
      { roomCode: "2BED", pricePerNight: 260, currency: "USD", available: true },
      { roomCode: "3BED", pricePerNight: 390, currency: "USD", available: true }
    ]
  });
}
