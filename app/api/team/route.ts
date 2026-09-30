import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/db";
import { users, auditLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET /api/team — Return all real staff members
export async function GET() {
  try {
    const db = getDb();
    const staffList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        active: users.active,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ staff: staffList });
  } catch (error: any) {
    console.error("GET /api/team error:", error);
    return NextResponse.json({ error: "Failed to load staff list" }, { status: 500 });
  }
}

// POST /api/team — Provision a new staff user
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, role, password } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Name, email, and role are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = getDb();

    // Check if email already exists
    const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    const rawPassword = password || "Tamarind@" + new Date().getFullYear();
    const passwordHash = bcrypt.hashSync(rawPassword, 10);
    const userId = "usr_" + Date.now();
    const now = new Date().toISOString();

    await db.insert(users).values({
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: role.trim(),
      active: true,
      createdAt: now,
    });

    // Audit log
    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: now,
      actor: session.name || "Admin",
      actorRole: session.role || "admin",
      category: "security",
      action: "Provisioned new staff account",
      details: `Created staff account for ${name.trim()} (${cleanEmail}) with role ${role}.`,
      targetId: userId,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        role: role.trim(),
        active: true,
        createdAt: now,
      },
      temporaryPassword: password ? undefined : rawPassword,
    });
  } catch (error: any) {
    console.error("POST /api/team error:", error);
    return NextResponse.json({ error: "Failed to create staff account" }, { status: 500 });
  }
}

// DELETE /api/team — Remove a staff member
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (id === session.id) {
      return NextResponse.json({ error: "Cannot delete your own active admin account." }, { status: 400 });
    }

    const db = getDb();
    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/team error:", error);
    return NextResponse.json({ error: "Failed to delete staff member" }, { status: 500 });
  }
}
