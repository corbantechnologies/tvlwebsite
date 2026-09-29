import { SignJWT, jwtVerify } from "jose";
import { StaffUser } from "@/types";

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
  } catch (err) {
    return null;
  }
}
