import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { inquiries, auditLogs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const data = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
    return NextResponse.json({ inquiries: data });
  } catch (err: any) {
    return NextResponse.json({ inquiries: [], error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();
    const db = getDb();
    
    const guestToken = "tvl_" + Math.random().toString(36).substring(2, 9).toUpperCase();
    const newInquiry = {
      id: "inq_" + Date.now(),
      type: body.type || "general",
      payload: {
        ...body.payload,
        guestToken
      },
      status: "Pending",
      createdAt: new Date().toISOString()
    };

    await db.insert(inquiries).values(newInquiry);

    // Audit log
    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: "guest",
      actorRole: "guest",
      category: "inquiry",
      action: "New Guest Reservation Inquiry Submitted",
      details: (body.payload?.name || "Guest") + " submitted a " + (body.type || "reservation") + " inquiry.",
      targetId: newInquiry.id,
      metadata: { guestToken }
    });

    return NextResponse.json({ success: true, inquiry: newInquiry, guestToken });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit inquiry" }, { status: 500 });
  }
}
