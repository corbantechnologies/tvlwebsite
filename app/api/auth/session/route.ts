import { NextRequest, NextResponse } from "next/server";
import { resolveStaffSession, COOKIE_NAME } from "@/lib/auth/session";

// GET /api/auth/session — the signed-in staff member as the database has them now (role, temporary password).
export async function GET(req: NextRequest) {
  const user = await resolveStaffSession(req.cookies.get(COOKIE_NAME)?.value);
  return NextResponse.json({ user });
}
