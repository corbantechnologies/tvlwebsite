import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { auditLogs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const role = (session?.role || "").toLowerCase();
    if (!session || (role !== "admin" && role !== "gm")) {
      return NextResponse.json({ error: "Access denied. Insufficient clearance." }, { status: 403 });
    }

    await ensureDatabaseSeeded();
    const db = getDb();
    const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(200);
    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    return NextResponse.json({ success: false, logs: [], error: err.message }, { status: 500 });
  }
}
