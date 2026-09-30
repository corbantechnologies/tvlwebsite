import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { globalSettings, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

// Hero/site settings are stored as key-value rows in global_settings.
// The following keys are used:
//   "hero"            — { headline, subtext, heroImageUrl, logoUrl }
//   "banner"          — { active: boolean, text: string, link?: string }
//   "contact"         — { phone, email, address, mapUrl }
//   "transfer_vehicles"
//   "event_packages"

// ============================================================
// GET /api/settings
//
// Admin dashboard: returns staff list + audit logs + all settings
// Public site: can call /api/settings?key=hero for a single value
// ============================================================
export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (key) {
      // Single setting lookup (public-safe)
      const rows = await db.select().from(globalSettings).where(eq(globalSettings.key, key)).limit(1);
      if (rows.length === 0) {
        return NextResponse.json({ value: null });
      }
      return NextResponse.json({ key, value: rows[0].value });
    }

    // Full settings dump (admin use)
    const settingsList = await db.select().from(globalSettings);
    const settingsMap: Record<string, any> = {};
    settingsList.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({ settings: settingsMap });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================================
// POST /api/settings
// Upsert one or more settings.
//
// Body option 1 — single key:
//   { key: "banner", value: { active: true, text: "..." } }
//
// Body option 2 — batch:
//   { settings: { hero: {...}, banner: {...} } }
// ============================================================
export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const body = await req.json();

    const upsertSetting = async (key: string, value: any) => {
      const existing = await db.select().from(globalSettings).where(eq(globalSettings.key, key)).limit(1);
      if (existing.length === 0) {
        await db.insert(globalSettings).values({ key, value });
      } else {
        await db.update(globalSettings).set({ value }).where(eq(globalSettings.key, key));
      }
    };

    if (body.settings && typeof body.settings === "object") {
      // Batch upsert
      const keys = Object.keys(body.settings);
      await Promise.all(keys.map((k) => upsertSetting(k, body.settings[k])));

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: body.actor || "Admin",
        actorRole: body.actorRole || "admin",
        category: "settings",
        action: "Settings Updated",
        details: `Updated settings: ${keys.join(", ")}`,
        targetId: "global_settings",
      });

      return NextResponse.json({ success: true, updated: keys });
    }

    if (body.key) {
      // Single upsert
      await upsertSetting(body.key, body.value);

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: body.actor || "Admin",
        actorRole: body.actorRole || "admin",
        category: "settings",
        action: "Setting Updated",
        details: `Updated setting: "${body.key}"`,
        targetId: "global_settings",
        metadata: { key: body.key },
      });

      return NextResponse.json({ success: true, message: "Setting saved" });
    }

    return NextResponse.json({ error: "Provide key+value or settings object" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================================
// DELETE /api/settings?key=xxx — remove a setting
// ============================================================
export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 });

    await db.delete(globalSettings).where(eq(globalSettings.key, key));
    return NextResponse.json({ success: true, message: `Setting "${key}" removed` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
