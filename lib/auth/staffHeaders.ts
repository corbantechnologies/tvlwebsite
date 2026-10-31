import type { NextRequest } from "next/server";

/**
 * The signed-in staff member for this request, as verified by proxy.ts
 * (which sets these headers only after checking the session cookie).
 * Use this instead of an "actor" field from the request body.
 */
export function staffFromRequest(req: NextRequest | Request): { id: string; name: string; role: string } {
  const h = req.headers;
  let name = h.get("x-staff-name") || "Staff";
  try {
    name = decodeURIComponent(name);
  } catch {
    /* keep raw */
  }
  return { id: h.get("x-staff-id") || "", name, role: h.get("x-staff-role") || "staff" };
}
