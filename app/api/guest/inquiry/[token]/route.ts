import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { inquiries } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    await ensureDatabaseSeeded();
    const { token } = await params;
    const cleanToken = token.trim().toUpperCase();
    const db = getDb();
    const allInquiries = await db.select().from(inquiries);

    const match = allInquiries.find(inq => {
      const p = inq.payload as any;
      return p?.guestToken && p.guestToken.toUpperCase() === cleanToken;
    });

    if (!match) {
      return NextResponse.json({ error: "No inquiry found matching token " + cleanToken }, { status: 404 });
    }

    return NextResponse.json({ inquiry: match });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
