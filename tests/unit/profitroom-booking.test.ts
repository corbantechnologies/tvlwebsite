import { test } from "node:test";
import assert from "node:assert/strict";
import { isDirectBookingLinkShown, isProfitroomBookingActive, profitroomBookingUrl, profitroomWidgetSrc } from "@/lib/profitroomBooking";

test("ProfitRoom booking stays on until the end of the set day in Nairobi", () => {
  const until = "2027-01-31";
  assert.equal(isProfitroomBookingActive(new Date("2027-01-31T20:59:00Z"), until), true);
  assert.equal(isProfitroomBookingActive(new Date("2027-01-31T21:00:00Z"), until), false);
});

test("ProfitRoom booking is on when unset, off when set to off", () => {
  assert.equal(isProfitroomBookingActive(new Date(), undefined), true);
  assert.equal(isProfitroomBookingActive(new Date(), "off"), false);
  assert.equal(isProfitroomBookingActive(new Date(), "OFF"), false);
});

test("ProfitRoom link carries dates, guests and promo code", () => {
  assert.equal(
    profitroomBookingUrl({ checkIn: "2026-12-20", checkOut: "2026-12-24", guests: 3, promocode: "X MAS" }),
    "https://upperbooking.com/en/booking/start/tamarindvillage?checkin=2026-12-20&checkout=2026-12-24&occupancy=3&promocode=X+MAS",
  );
  assert.equal(profitroomBookingUrl(), "https://upperbooking.com/en/booking/start/tamarindvillage");
});

test("ProfitRoom's Booking.js loads by default and can be switched off", () => {
  assert.equal(profitroomWidgetSrc(undefined), "https://open.upperbooking.com/tamarindvillage/Booking.js?locale=en");
  assert.equal(profitroomWidgetSrc(""), "https://open.upperbooking.com/tamarindvillage/Booking.js?locale=en");
  assert.equal(profitroomWidgetSrc("off"), "");
  assert.equal(profitroomWidgetSrc("https://example.test/b.js"), "https://example.test/b.js");
});

test("our own Book & Pay Here link is hidden unless switched on", () => {
  assert.equal(isDirectBookingLinkShown(undefined), false);
  assert.equal(isDirectBookingLinkShown("off"), false);
  assert.equal(isDirectBookingLinkShown("on"), true);
  assert.equal(isDirectBookingLinkShown(" ON "), true);
});
