import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseOffersXml, htmlToLines, isOfferCurrent } from "@/lib/profitroomOffers";

const xml = readFileSync(path.join(__dirname, "../fixtures/profitroom-offers.xml"), "utf8");

test("parses every offer in the ProfitRoom feed", () => {
  const offers = parseOffersXml(xml);
  assert.deepEqual(offers.map((o) => o.id), ["1252992", "785279", "808796", "875390", "848982"]);
});

test("reads names, prices, meals and images", () => {
  const [, ro, bb, seafood] = parseOffersXml(xml);
  assert.equal(bb.name, "Bed & Breakfast");
  assert.equal(ro.minPrice, 213);
  assert.equal(ro.currency, "USD");
  assert.equal(ro.priceNights, 1);
  assert.equal(ro.priceOccupancy, 2);
  assert.equal(ro.meals, "Room Only");
  assert.equal(seafood.meals, "Breakfast and Dinner");
  assert.deepEqual(seafood.tags, ["Active", "Deals"]);
  assert.equal(seafood.image, "https://r.profitroom.com/tamarindvillage/images/offers/2o7Yx58kVL88Jynx.jpg");
});

test("shows special offers and seasonal offers, not standing rates", () => {
  const special = parseOffersXml(xml).filter((o) => o.isSpecial).map((o) => o.id);
  // 1252992 is type O but runs 20 Nov to 19 Dec; Room Only and B&B stay off.
  assert.deepEqual(special, ["1252992", "875390", "848982"]);
});

test("an offer tagged Deals in the Suite counts as special", () => {
  const [o] = parseOffersXml(
    "<Offers><Offer><OfferID>9</OfferID><OfferName>X</OfferName><OfferType>O</OfferType><Tags><Tag>Deals</Tag></Tags></Offer></Offers>",
  );
  assert.equal(o.isSpecial, true);
});

test("reads the offer's dates and drops it once they have passed (Nairobi time)", () => {
  const [festive, ro] = parseOffersXml(xml);
  assert.equal(festive.availableFrom, "2026-11-20");
  assert.equal(festive.availableTo, "2026-12-19");
  assert.equal(ro.availableFrom, null);
  assert.equal(ro.availableTo, null);
  assert.equal(isOfferCurrent(festive, new Date("2026-11-17T08:00:00Z")), true);
  assert.equal(isOfferCurrent(festive, new Date("2026-12-19T20:59:00Z")), true); // 23:59 in Nairobi
  assert.equal(isOfferCurrent(festive, new Date("2026-12-19T21:00:00Z")), false); // 20 Dec in Nairobi
  assert.equal(isOfferCurrent(ro, new Date("2030-01-01T00:00:00Z")), true);
});

test("turns the description HTML into plain lines, whether sent raw or escaped", () => {
  const [festive, ro] = parseOffersXml(xml);
  assert.deepEqual(festive.descriptionLines, ["Price includes room charge and a free breakfast per person throughout your stay"]);
  assert.deepEqual(ro.descriptionLines, [
    "Offer includes:",
    "• accommodation in comfortable apartments",
    "• unlimited access to Wi-Fi",
  ]);
  assert.deepEqual(htmlToLines("&lt;p&gt;Hi &amp; welcome&lt;/p&gt;&lt;script&gt;x&lt;/script&gt;"), ["Hi & welcome", "x"]);
});

test("drops offers without an id and rejects non-https images", () => {
  const offers = parseOffersXml(
    "<Offers><Offer><OfferName>No id</OfferName></Offer><Offer><OfferID>1</OfferID><OfferName>A</OfferName><OfferImage>javascript:alert(1)</OfferImage></Offer></Offers>",
  );
  assert.equal(offers.length, 1);
  assert.equal(offers[0].image, null);
});
