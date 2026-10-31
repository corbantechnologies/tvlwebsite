import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { runDailyJobs } from "@/lib/dailyJobs";
import { opsAlert } from "@/lib/opsAlert";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ============================================================
// GET /api/cron/daily
// Run by Vercel Cron (vercel.json) every morning. Vercel sends
// "Authorization: Bearer $CRON_SECRET"; set CRON_SECRET in Vercel.
// ============================================================
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  if (!secret || given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDatabaseSeeded();
    const r = await runDailyJobs();
    return NextResponse.json({
      ok: true,
      recovered: r.reconciled.length,
      expired: r.expired,
      abandoned: r.abandoned.length,
      arrivals: r.arrivals.length,
      openRequests: r.openRequests.length,
      refundsDue: r.refundsDue.length,
      reviewEmailsSent: r.reviewEmailsSent,
      reconcileError: r.reconcileError,
    });
  } catch (err: any) {
    await opsAlert("Nightly jobs failed", err.message, { key: "cron-daily" });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
