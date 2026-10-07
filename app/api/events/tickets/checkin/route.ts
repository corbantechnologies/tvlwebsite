import { NextRequest, NextResponse } from "next/server";
import { executeCheckIn } from "@/lib/ticketCheckIn";

// POST /api/events/tickets/checkin
// Body: {
//   identifier: string (ticketReference, ticketQrToken, or ticket ID),
//   gatePin?: string,
//   scannedBy?: string,
//   eventId?: string
// }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await executeCheckIn(body);
    return NextResponse.json(result.data, { status: result.status });
  } catch (err: any) {
    console.error("[POST /api/events/tickets/checkin] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
