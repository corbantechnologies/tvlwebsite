import { SignJWT, jwtVerify } from "jose";
import { StaffUser } from "@/types";
import { NextRequest } from "next/server";
import { loadStaffAccount, sessionPredatesPasswordChange } from "./staffAccount";
import { isStaffRole } from "./roles";

if (!process.env.SESSION_SECRET && !process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === "production") {
  // The fallback below is public in the repository: anyone could forge a staff session with it.
  console.error("[Auth] SESSION_SECRET is not set. Set it in Vercel → Settings → Environment Variables.");
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || "tamarind-mombasa-luxury-executive-secret-2026"
);

export const COOKIE_NAME = "tamarind_session_token";

export async function createSessionToken(user: StaffUser): Promise<string> {
  return await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/** Checks the signature and expiry only. Use resolveStaffSession for anything that grants access. */
export async function verifySessionToken(token: string): Promise<(StaffUser & { issuedAt?: number }) | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload || !payload.id || !payload.role) {
      return null;
    }
    return {
      id: payload.id as string,
      name: (payload.name as string) || "Staff User",
      email: (payload.email as string) || "",
      role: payload.role as any,
      issuedAt: typeof payload.iat === "number" ? payload.iat : undefined,
    };
  } catch {
    return null;
  }
}

export type ResolvedStaff = StaffUser & { mustChangePassword: boolean };

/**
 * The signed-in staff member, re-checked against the users table so that a
 * deactivated account, a changed role or a password reset takes effect at once
 * instead of when the 7-day cookie expires.
 */
export async function resolveStaffSession(token: string | undefined | null): Promise<ResolvedStaff | null> {
  if (!token) return null;
  const claims = await verifySessionToken(token);
  if (!claims) return null;
  let account;
  try {
    account = await loadStaffAccount(claims.id);
  } catch (err: any) {
    // Database unreachable: fall back to the signed cookie rather than locking every desk out.
    console.warn("[Auth] Could not re-check staff account, using session cookie:", err?.message);
    return { id: claims.id, name: claims.name, email: claims.email, role: claims.role, mustChangePassword: false };
  }
  if (!account || !account.active || !isStaffRole(account.role)) return null;
  if (sessionPredatesPasswordChange(claims.issuedAt, account.passwordChangedAt)) return null;
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role.toLowerCase().trim() as any,
    mustChangePassword: account.mustChangePassword,
  };
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export async function getSession(req?: NextRequest): Promise<ResolvedStaff | null> {
  let token: string | undefined;
  if (req) {
    token = req.cookies.get(COOKIE_NAME)?.value;
  } else {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      return null;
    }
  }
  return await resolveStaffSession(token);
}
