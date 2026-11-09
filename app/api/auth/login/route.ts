import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/db";
import { users, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createSessionToken, COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/roles";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { newId } from "@/lib/ids";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, RATE_LIMITS.login);
  if (limited) return limited;
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const db = getDb();
    const cleanEmail = email.trim().toLowerCase();
    const foundUsers = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);

    if (!foundUsers || foundUsers.length === 0) {
      return NextResponse.json({ error: "Invalid staff credentials." }, { status: 401 });
    }

    const user = foundUsers[0];
    if (!user.active) {
      return NextResponse.json({ error: "This staff account has been deactivated." }, { status: 403 });
    }

    const validPassword = await bcrypt.compare(String(password), user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: "Invalid staff credentials." }, { status: 401 });
    }
    if (!isStaffRole(user.role)) {
      return NextResponse.json({ error: `This account's role (${user.role}) is not recognised. Ask an admin to set it in Staff Team.` }, { status: 403 });
    }

    // Update lastLogin
    await db.update(users).set({ lastLogin: new Date().toISOString() }).where(eq(users.id, user.id));

    // Audit log
    await db.insert(auditLogs).values({
      id: newId("log"),
      timestamp: new Date().toISOString(),
      actor: user.name,
      actorRole: user.role,
      category: "security",
      action: "Staff logged into Management Portal",
      details: user.name + " (" + user.role + ") authenticated successfully.",
      targetId: user.id
    });

    const staffUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase().trim() as any,
      active: user.active
    };

    const token = await createSessionToken(staffUser);

    const response = NextResponse.json({ success: true, user: staffUser, mustChangePassword: user.mustChangePassword });
    response.cookies.set(COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

    return response;
  } catch (err: any) {
    console.error("Auth login error:", err);
    return NextResponse.json({ error: "Sign-in failed. Please try again." }, { status: 500 });
  }
}
