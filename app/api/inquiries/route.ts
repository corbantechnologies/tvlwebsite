import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { inquiries, auditLogs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { Resend } from "resend";

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

    // Send staff alert email (fire-and-forget)
    sendStaffAlertEmail(newInquiry).catch(() => {});

    return NextResponse.json({ success: true, inquiry: newInquiry, guestToken });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit inquiry" }, { status: 500 });
  }
}

async function sendStaffAlertEmail(inquiry: any) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);
  const payload = inquiry.payload || {};
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "reservations@tamarind.co.ke",
    to: process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke",
    subject: `[New Inquiry] ${payload.name || "Guest"} — ${inquiry.type}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2d9d0">
        <h2 style="color:#821124">New Guest Inquiry Received</h2>
        <p><strong>Type:</strong> ${inquiry.type}</p>
        <p><strong>Guest Name:</strong> ${payload.name || "Guest"}</p>
        <p><strong>Email:</strong> ${payload.email || "N/A"}</p>
        <p><strong>Phone:</strong> ${payload.phone || "N/A"}</p>
        <p><strong>Details:</strong></p>
        <pre style="background:#f5f0eb;padding:12px;border-radius:4px">${JSON.stringify(payload, null, 2)}</pre>
        <p>Please log in to the staff dashboard to respond.</p>
      </div>`,
  });
}
