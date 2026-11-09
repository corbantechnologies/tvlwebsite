import { test } from "node:test";
import assert from "node:assert/strict";
import { sessionPredatesPasswordChange } from "@/lib/auth/staffAccount";

test("a password change ends sessions signed in before it", () => {
  const changed = "2026-11-09T12:00:00.500Z";
  const at = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);
  assert.equal(sessionPredatesPasswordChange(at("2026-11-09T11:59:59Z"), changed), true);
  // A session issued right after the change (same second) stays valid.
  assert.equal(sessionPredatesPasswordChange(at("2026-11-09T12:00:00.900Z"), changed), false);
  assert.equal(sessionPredatesPasswordChange(at("2026-11-09T12:05:00Z"), changed), false);
  assert.equal(sessionPredatesPasswordChange(at("2026-11-09T11:00:00Z"), null), false);
});
