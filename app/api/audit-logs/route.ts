import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { auditLogs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(200);
    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    return NextResponse.json({ success: false, logs: [], error: err.message }, { status: 500 });
  }
}
