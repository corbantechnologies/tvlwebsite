import { NextRequest, NextResponse } from "next/server";
import { fetchUpperBookingXml } from "@/lib/profitroomProxy";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") === "offers" ? "Offers" : "Rooms";

  try {
    const xml = await fetchUpperBookingXml(type);
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  } catch (err: any) {
    console.error(`[Profitroom Proxy] ${type} error:`, err.message);
    return NextResponse.json(
      { error: err.message || `Failed to fetch live ${type}` },
      { status: 500 }
    );
  }
}
