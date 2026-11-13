import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseOffersXml, htmlToLines } from "@/lib/profitroomOffers";

const xml = readFileSync(path.join(__dirname, "../fixtures/profitroom-offers.xml"), "utf8");

test("parses every offer in the ProfitRoom feed", () => {
  const offers = parseOffersXml(xml);
  assert.deepEqual(offers.map((o) => o.id), ["785279", "808796", "875390", "848982"]);
});

test("reads names, prices, meals and images", () => {
  const [ro, bb, seafood] = parseOffersXml(xml);
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

test("marks only special offers (type S) as special", () => {
  const special = parseOffersXml(xml).filter((o) => o.isSpecial).map((o) => o.id);
  assert.deepEqual(special, ["875390", "848982"]);
});

test("turns the description HTML into plain lines, whether sent raw or escaped", () => {
  const [ro] = parseOffersXml(xml);
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
