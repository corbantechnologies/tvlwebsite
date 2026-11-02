import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/db";

export const dynamic = "force-dynamic";

// ============================================================
// GET /api/health  (public)
// For an uptime monitor (e.g. UptimeRobot, Better Stack): returns 200
// when the site can reach the database, 503 otherwise. Also reports
// which integrations are configured, without revealing any values.
// ============================================================
export async function GET() {
  const started = Date.now();
  let database = false;
  try {
    await getDb().execute(sql`SELECT 1`);
    database = true;
  } catch {
    database = false;
  }
  const body = {
    ok: database,
    database,
    latencyMs: Date.now() - started,
    configured: {
      paystack: Boolean(process.env.PAYSTACK_SECRET_KEY),
      email: Boolean(process.env.RESEND_API_KEY),
      sessionSecret: Boolean(process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET),
      cronSecret: Boolean(process.env.CRON_SECRET),
    },
    time: new Date().toISOString(),
  };
  return NextResponse.json(body, { status: database ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
