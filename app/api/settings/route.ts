import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { globalSettings, users, auditLogs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const staffList = await db.select().from(users);
    const logsList = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(200);
    const settingsList = await db.select().from(globalSettings);

    const settingsMap: Record<string, any> = {};
    settingsList.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      staff_users: staffList.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active })),
      system_audit_logs: logsList,
      transfer_vehicles: settingsMap["transfer_vehicles"] || null,
      event_packages: settingsMap["event_packages"] || null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { key, value } = body;
    if (!key) return NextResponse.json({ error: "Key required" }, { status: 400 });

    const exists = await db.select().from(globalSettings).where(eq(globalSettings.key, key)).limit(1);
    if (!exists || exists.length === 0) {
      await db.insert(globalSettings).values({ key, value });
    } else {
      await db.update(globalSettings).set({ value }).where(eq(globalSettings.key, key));
    }
    return NextResponse.json({ success: true, message: "Setting saved" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
