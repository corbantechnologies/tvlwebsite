import { SignJWT, jwtVerify } from "jose";
import { StaffUser } from "@/types";
import { NextRequest } from "next/server";

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

export async function verifySessionToken(token: string): Promise<StaffUser | null> {
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
    };
  } catch {
    return null;
  }
}

export async function getSession(req?: NextRequest): Promise<StaffUser | null> {
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
  if (!token) return null;
  return await verifySessionToken(token);
}
