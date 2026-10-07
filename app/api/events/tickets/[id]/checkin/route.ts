import { NextRequest, NextResponse } from "next/server";
import { executeCheckIn } from "@/lib/ticketCheckIn";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const result = await executeCheckIn({
      ...body,
      identifier: id,
    });

    return NextResponse.json(result.data, { status: result.status });
  } catch (err: any) {
    console.error("[POST /api/events/tickets/[id]/checkin] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
