import { test } from "node:test";
import assert from "node:assert/strict";
import { canCallApi, canViewPage, homePageFor } from "@/lib/auth/roles";
import { isPublicApiRequest } from "@/lib/auth/apiAccess";

test("owners can manage staff; others cannot", () => {
  assert.ok(canCallApi("admin", "POST", "/api/team"));
  assert.ok(canCallApi("GM", "GET", "/api/audit-logs"));
  assert.ok(!canCallApi("manager", "GET", "/api/team"));
  assert.ok(!canCallApi("reception", "DELETE", "/api/team"));
});

test("refunds and reports need a manager", () => {
  assert.ok(canCallApi("manager", "POST", "/api/bookings/bkg_1/refund"));
  assert.ok(!canCallApi("reservations", "POST", "/api/bookings/bkg_1/refund"));
  assert.ok(!canCallApi("reception", "GET", "/api/reports"));
});

test("reservations edit availability and promos but not content", () => {
  assert.ok(canCallApi("reservations", "POST", "/api/availability/blocks"));
  assert.ok(canCallApi("reservations", "PATCH", "/api/vouchers"));
  assert.ok(!canCallApi("reservations", "PUT", "/api/apartments/1-bedroom"));
  assert.ok(!canCallApi("reception", "POST", "/api/availability/blocks"));
});

test("front desk handles bookings; gate staff only scan tickets", () => {
  assert.ok(canCallApi("reception", "PATCH", "/api/bookings/bkg_1"));
  assert.ok(canCallApi("security", "POST", "/api/events/tickets/tkt_1/checkin"));
  assert.ok(!canCallApi("security", "GET", "/api/bookings"));
  assert.ok(!canCallApi("", "GET", "/api/bookings"));
});

test("page access mirrors the API rules", () => {
  assert.ok(canViewPage("reception", "/admin/frontdesk"));
  assert.ok(!canViewPage("reception", "/admin/pricing"));
  assert.ok(canViewPage("security", "/admin/events/checkin"));
  assert.ok(!canViewPage("security", "/admin/events"));
  assert.ok(canViewPage("security", "/admin/guide"));
  assert.ok(canViewPage("manager", "/admin/events/ledger"));
  assert.equal(homePageFor("security"), "/admin/events/checkin");
  assert.equal(homePageFor("reception"), "/admin/frontdesk");
});

test("public API allowlist", () => {
  const sp = (q = "") => new URLSearchParams(q);
  assert.ok(!isPublicApiRequest("GET", "/api/bookings", sp()));
  assert.ok(!isPublicApiRequest("GET", "/api/vouchers", sp()));
  assert.ok(isPublicApiRequest("GET", "/api/vouchers", sp("code=X")));
  assert.ok(isPublicApiRequest("POST", "/api/bookings/checkout", sp()));
  assert.ok(isPublicApiRequest("POST", "/api/auth/forgot-password", sp()));
  assert.ok(isPublicApiRequest("GET", "/api/health", sp()));
  assert.ok(isPublicApiRequest("GET", "/api/cron/daily", sp()));
  assert.ok(isPublicApiRequest("POST", "/api/guest/booking/TVL-ABC123/checkin", sp()));
  assert.ok(!isPublicApiRequest("POST", "/api/guest/booking/TVL-ABC123/refund", sp()));
  assert.ok(!isPublicApiRequest("POST", "/api/bookings/bkg_1/refund", sp()));
  assert.ok(!isPublicApiRequest("GET", "/api/reports", sp()));
});
