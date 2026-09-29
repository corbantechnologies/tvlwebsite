import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { inquiries, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();

    const existing = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const current = existing[0];
    const updatedStatus = body.status || current.status;
    const updatedPayload = {
      ...(current.payload as any),
      ...(body.payload || {})
    };

    await db.update(inquiries).set({
      status: updatedStatus,
      payload: updatedPayload
    }).where(eq(inquiries.id, id));

    if (body.auditAction) {
      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: body.actor || "staff",
        actorRole: body.actorRole || "staff",
        category: body.auditCategory || "inquiry",
        action: body.auditAction,
        details: body.auditDetails || "Inquiry updated by staff",
        targetId: id
      });
    }

    return NextResponse.json({ success: true, message: "Inquiry updated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    await db.delete(inquiries).where(eq(inquiries.id, id));
    return NextResponse.json({ success: true, message: "Inquiry removed" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
