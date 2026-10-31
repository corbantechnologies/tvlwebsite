import { randomUUID } from "crypto";

/**
 * Collision-safe primary key, e.g. newId("log") -> "log_3f9c1a2b7d4e4f0a".
 * Replaces the old `"log_" + Date.now()` pattern, which collided whenever two
 * rows were written in the same millisecond (e.g. webhook + verify racing).
 */
export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").substring(0, 16)}`;
}

/** Short guest-facing access token such as TVL-7K2Q9X. */
export function newGuestToken(): string {
  return `TVL-${randomUUID().replace(/-/g, "").substring(0, 6).toUpperCase()}`;
}
