import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/db";
import { users, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function POST(req: NextRequest) {
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

    const validPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: "Invalid staff credentials." }, { status: 401 });
    }

    // Update lastLogin
    await db.update(users).set({ lastLogin: new Date().toISOString() }).where(eq(users.id, user.id));

    // Audit log
    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: "staff",
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
      role: user.role as any,
      active: user.active
    };

    const token = await createSessionToken(staffUser);

    const response = NextResponse.json({ success: true, user: staffUser });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (err: any) {
    console.error("Auth login error:", err);
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 });
  }
}
