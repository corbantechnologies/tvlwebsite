import { NextRequest, NextResponse } from "next/server";
import { issueRefund } from "@/lib/refunds";
import { staffFromRequest } from "@/lib/auth/staffHeaders";

// POST /api/bookings/[id]/refund  (managers only, see lib/auth/roles.ts)
// Body: { amount?: number, reason?: string }  amount defaults to the full amount paid.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = staffFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const result = await issueRefund(id, {
    amount: body.amount === undefined || body.amount === "" ? undefined : Number(body.amount),
    reason: String(body.reason || "").slice(0, 200) || undefined,
    staffName: staff.name,
    staffRole: staff.role,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, booking: result.booking });
}
