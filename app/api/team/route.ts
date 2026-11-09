import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { passwordResets, users } from "@/lib/db/schema";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { newId } from "@/lib/ids";
import { writeAuditLog } from "@/lib/audit";
import { ASSIGNABLE_ROLES, isOwnerRole, isStaffRole } from "@/lib/auth/roles";
import { passwordProblem } from "@/lib/auth/passwordReset";
import { emailConfigured, sendPasswordLink, temporaryPassword } from "@/lib/auth/passwordLinks";
import { isEmail, requireOwner, wouldLeaveNoOwner } from "@/lib/auth/teamAdmin";

// Staff accounts. Admin and GM only (proxy.ts and requireOwner both check).

// GET /api/team
export async function GET(req: NextRequest) {
  const admin = await requireOwner(req);
  if (admin instanceof NextResponse) return admin;
  try {
    await ensureDatabaseSeeded();
    const staff = await getDb()
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        active: users.active,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin,
        mustChangePassword: users.mustChangePassword,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    return NextResponse.json({ staff, roles: ASSIGNABLE_ROLES, emailConfigured: emailConfigured(), me: admin.id });
  } catch (error: any) {
    console.error("GET /api/team error:", error);
    return NextResponse.json({ error: "Failed to load staff list" }, { status: 500 });
  }
}

// POST /api/team  { name, email, role, password? }
// Without a password: emails an invite link when email is set up, otherwise returns a temporary password.
// Either way the person chooses their own password before using the portal.
export async function POST(req: NextRequest) {
  const admin = await requireOwner(req);
  if (admin instanceof NextResponse) return admin;
  try {
    await ensureDatabaseSeeded();
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "").trim().toLowerCase();
    const chosen = body.password ? String(body.password) : "";

    if (!name || !isEmail(email)) return NextResponse.json({ error: "Enter a name and a valid email." }, { status: 400 });
    if (!isStaffRole(role)) return NextResponse.json({ error: `Unknown role. Use one of: ${ASSIGNABLE_ROLES.join(", ")}.` }, { status: 400 });
    if (chosen) {
      const problem = passwordProblem(chosen);
      if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    }

    const db = getDb();
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing) return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });

    const password = chosen || temporaryPassword();
    const id = newId("usr");
    const now = new Date().toISOString();
    await db.insert(users).values({
      id,
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role,
      active: true,
      createdAt: now,
      mustChangePassword: true,
      passwordChangedAt: now,
    });

    const inviteSent = !chosen && (await sendPasswordLink({ id, name, email }, "invite"));
    await writeAuditLog({
      actor: admin.name,
      actorRole: admin.role,
      category: "security",
      action: "Provisioned new staff account",
      details: `Created ${name} (${email}) as ${role}. ${inviteSent ? "Invite link emailed." : "Temporary password issued."}`,
      targetId: id,
    });

    return NextResponse.json({
      success: true,
      user: { id, name, email, role, active: true, createdAt: now, mustChangePassword: true },
      inviteSent,
      temporaryPassword: chosen || inviteSent ? undefined : password,
    });
  } catch (error: any) {
    console.error("POST /api/team error:", error);
    return NextResponse.json({ error: "Failed to create staff account" }, { status: 500 });
  }
}

// PATCH /api/team  { id, role?, active?, name? }
export async function PATCH(req: NextRequest) {
  const admin = await requireOwner(req);
  if (admin instanceof NextResponse) return admin;
  try {
    await ensureDatabaseSeeded();
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "");
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) return NextResponse.json({ error: "Staff member not found." }, { status: 404 });

    const nextRole = body.role !== undefined ? String(body.role).trim().toLowerCase() : user.role.toLowerCase();
    const nextActive = body.active !== undefined ? Boolean(body.active) : user.active;
    const nextName = body.name !== undefined ? String(body.name).trim() : user.name;

    if (!isStaffRole(nextRole)) return NextResponse.json({ error: `Unknown role. Use one of: ${ASSIGNABLE_ROLES.join(", ")}.` }, { status: 400 });
    if (!nextName) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    if (user.id === admin.id && (!nextActive || !isOwnerRole(nextRole))) {
      return NextResponse.json({ error: "You cannot remove your own admin access. Ask another admin or GM." }, { status: 400 });
    }
    if (await wouldLeaveNoOwner(user.id, { role: nextRole, active: nextActive })) {
      return NextResponse.json({ error: "There must always be at least one active admin or GM." }, { status: 400 });
    }

    await db.update(users).set({ role: nextRole, active: nextActive, name: nextName }).where(eq(users.id, id));

    const changes: string[] = [];
    if (nextRole !== user.role.toLowerCase()) changes.push(`role ${user.role} → ${nextRole}`);
    if (nextActive !== user.active) changes.push(nextActive ? "reactivated" : "deactivated");
    if (nextName !== user.name) changes.push(`name ${user.name} → ${nextName}`);
    if (changes.length) {
      await writeAuditLog({
        actor: admin.name,
        actorRole: admin.role,
        category: "security",
        action: "Updated staff account",
        details: `${user.email}: ${changes.join(", ")}.`,
        targetId: id,
      });
    }
    return NextResponse.json({ success: true, user: { id, name: nextName, role: nextRole, active: nextActive } });
  } catch (error: any) {
    console.error("PATCH /api/team error:", error);
    return NextResponse.json({ error: "Failed to update staff account" }, { status: 500 });
  }
}

// DELETE /api/team?id=  Permanently removes the account. Deactivating is usually better: it keeps the history readable.
export async function DELETE(req: NextRequest) {
  const admin = await requireOwner(req);
  if (admin instanceof NextResponse) return admin;
  try {
    const id = new URL(req.url).searchParams.get("id") || "";
    if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    if (id === admin.id) return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    if (await wouldLeaveNoOwner(id, null)) {
      return NextResponse.json({ error: "There must always be at least one active admin or GM." }, { status: 400 });
    }

    await db.delete(passwordResets).where(eq(passwordResets.userId, id));
    await db.delete(users).where(eq(users.id, id));
    await writeAuditLog({
      actor: admin.name,
      actorRole: admin.role,
      category: "security",
      action: "Deleted staff account",
      details: `Deleted ${user.name} (${user.email}, ${user.role}).`,
      targetId: id,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/team error:", error);
    return NextResponse.json({ error: "Failed to delete staff member" }, { status: 500 });
  }
}
