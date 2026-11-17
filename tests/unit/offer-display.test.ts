import { test } from "node:test";
import assert from "node:assert/strict";
import { formatOfferPrice, offerValidity, pickFeaturedOffer } from "@/lib/offerDisplay";

test("formats offer dates for the cards and pop-up", () => {
  assert.equal(offerValidity({ availableFrom: "2026-11-20", availableTo: "2026-12-19" }), "Valid 20 Nov – 19 Dec 2026");
  assert.equal(offerValidity({ availableFrom: "2026-12-20", availableTo: "2027-01-05" }), "Valid 20 Dec 2026 – 5 Jan 2027");
  assert.equal(offerValidity({ availableFrom: "2026-11-20", availableTo: null }), "Valid from 20 Nov 2026");
  assert.equal(offerValidity({ availableFrom: null, availableTo: "2026-12-19" }), "Valid until 19 Dec 2026");
  assert.equal(offerValidity({ availableFrom: null, availableTo: null }), null);
});

test("formats prices", () => {
  assert.equal(formatOfferPrice({ minPrice: 1250, currency: "USD" }), "USD 1,250");
  assert.equal(formatOfferPrice({ minPrice: 213.5, currency: "USD" }), "USD 213.50");
  assert.equal(formatOfferPrice({ minPrice: null, currency: "USD" }), null);
});

test("features the seasonal offer ending soonest, else the first offer", () => {
  const a = { id: "a", availableTo: null };
  const b = { id: "b", availableTo: "2026-12-31" };
  const c = { id: "c", availableTo: "2026-12-19" };
  assert.equal(pickFeaturedOffer([a, b, c])?.id, "c");
  assert.equal(pickFeaturedOffer([a])?.id, "a");
  assert.equal(pickFeaturedOffer([]), null);
});
