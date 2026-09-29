import { NextRequest, NextResponse } from "next/server";
import { fetchUpperBookingXml } from "@/lib/profitroomProxy";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const xml = await fetchUpperBookingXml("Offers");
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
    console.error("[Profitroom Proxy] Offers error:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to fetch live offers" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
