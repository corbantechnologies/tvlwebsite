import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";

// ============================================================
// Fixed-window rate limiting backed by Postgres, so the limit holds
// across Vercel's serverless instances (an in-memory counter would
// reset on every cold start).
//
// Fails open: if the database is unreachable the request is allowed,
// because refusing a paying guest is worse than a burst of traffic.
// ============================================================

export type RateLimitRule = {
  /** Short name for the action, e.g. "login". */
  name: string;
  /** Requests allowed per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
};

export const RATE_LIMITS = {
  login: { name: "login", limit: 10, windowSeconds: 15 * 60 },
  passwordReset: { name: "pwreset", limit: 5, windowSeconds: 60 * 60 },
  checkout: { name: "checkout", limit: 20, windowSeconds: 60 * 60 },
  inquiry: { name: "inquiry", limit: 10, windowSeconds: 60 * 60 },
  guestLookup: { name: "lookup", limit: 60, windowSeconds: 15 * 60 },
  guestAction: { name: "guestact", limit: 20, windowSeconds: 60 * 60 },
} satisfies Record<string, RateLimitRule>;

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/** Counts one hit for `key` under `rule`. Returns whether it is within the limit. */
export async function hit(rule: RateLimitRule, key: string): Promise<{ ok: boolean; retryAfter: number }> {
  try {
    const id = `${rule.name}:${key}`;
    const rows = (await getDb().execute(sql`
      INSERT INTO rate_limits (key, count, window_start)
      VALUES (${id}, 1, now())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${rule.windowSeconds})
                     THEN 1 ELSE rate_limits.count + 1 END,
        window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${rule.windowSeconds})
                     THEN now() ELSE rate_limits.window_start END
      RETURNING count, EXTRACT(EPOCH FROM (window_start + make_interval(secs => ${rule.windowSeconds}) - now()))::int AS retry_after
    `)) as unknown as { count: number; retry_after: number }[];
    const row = rows[0];
    return { ok: Number(row.count) <= rule.limit, retryAfter: Math.max(1, Number(row.retry_after) || rule.windowSeconds) };
  } catch (err: any) {
    console.warn("[RateLimit] check skipped:", err.message);
    return { ok: true, retryAfter: 0 };
  }
}

/**
 * Route helper: returns a 429 response when the caller's IP is over the limit,
 * or null to continue. Usage: `const limited = await rateLimit(req, RATE_LIMITS.login); if (limited) return limited;`
 */
export async function rateLimit(req: NextRequest | Request, rule: RateLimitRule, extraKey = ""): Promise<NextResponse | null> {
  const key = extraKey ? `${clientIp(req)}:${extraKey}` : clientIp(req);
  const { ok, retryAfter } = await hit(rule, key);
  if (ok) return null;
  return NextResponse.json(
    { error: "Too many attempts. Please wait a few minutes and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

/** Deletes counters whose window ended more than a day ago. Called by the daily cron. */
export async function pruneRateLimits(): Promise<void> {
  try {
    await getDb().execute(sql`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`);
  } catch (err: any) {
    console.warn("[RateLimit] prune failed:", err.message);
  }
}
