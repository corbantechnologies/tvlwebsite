import { XMLParser } from "fast-xml-parser";

// ============================================================
// ProfitRoom offers feed.
//
// Offers and packages are managed in the ProfitRoom Suite and published
// at OFFERS_FEED_URL. ProfitRoom has agreed to the website reading it.
// The feed is read on the server, cached, and served to the site from
// /api/offers. If ProfitRoom is unreachable, the last good copy is used.
// ============================================================

export const OFFERS_FEED_URL =
  process.env.PROFITROOM_OFFERS_FEED_URL?.trim() || "https://wis.upperbooking.com/tamarindvillage/Offers.xml?locale=en";

const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

export type ProfitroomOffer = {
  id: string;
  name: string;
  /** "S" = special offer/deal, "O" = standard rate (room only, B&B). */
  type: string;
  isSpecial: boolean;
  summary: string;
  /** Description as plain text lines (HTML stripped; list items become lines). */
  descriptionLines: string[];
  meals: string | null;
  tags: string[];
  minPrice: number | null;
  currency: string;
  priceOccupancy: number | null;
  priceNights: number | null;
  image: string | null;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  trimValues: true,
  isArray: (name) => name === "Offer" || name === "Tag",
});

function text(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && "#text" in (v as Record<string, unknown>)) {
    return text((v as Record<string, unknown>)["#text"]);
  }
  return "";
}

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Turns ProfitRoom's HTML description into plain text lines. Never returns HTML. */
export function htmlToLines(html: string): string[] {
  if (!html) return [];
  const withBreaks = decodeEntities(html)
    .replace(/<\s*(li)[^>]*>/gi, "\n• ")
    .replace(/<\s*(br|\/p|\/li|\/ul|\/ol|\/div|\/h\d)[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "");
  return decodeEntities(withBreaks)
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l && l !== "•");
}

function safeImageUrl(u: string): string | null {
  try {
    const url = new URL(u);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function num(v: string): number | null {
  if (!v) return null;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

type RawOffer = {
  OfferID?: unknown;
  OfferName?: unknown;
  OfferType?: unknown;
  OfferSummary?: unknown;
  OfferDescription?: unknown;
  OfferImage?: unknown;
  MinPrice?: Record<string, unknown>;
  Tags?: { Tag?: unknown[] };
};

export function parseOffersXml(xml: string): ProfitroomOffer[] {
  // Parse the description HTML out of the raw XML when ProfitRoom sends it unescaped.
  const doc = parser.parse(xml.replace(
    /<OfferDescription>([\s\S]*?)<\/OfferDescription>/g,
    (_m, inner: string) => `<OfferDescription><![CDATA[${inner.replace(/]]>/g, "")}]]></OfferDescription>`,
  ));
  const raw: unknown[] = doc?.Offers?.Offer ?? [];

  return raw
    .map((o): ProfitroomOffer | null => {
      const r = o as RawOffer;
      const id = text(r.OfferID);
      const name = decodeEntities(text(r.OfferName));
      if (!id || !name) return null;

      const type = text(r.OfferType) || "O";
      const tags: string[] = [];
      let meals: string | null = null;
      for (const t of (r.Tags?.Tag ?? []) as unknown[]) {
        const value = decodeEntities(text(t));
        if (!value) continue;
        if (typeof t === "object" && (t as Record<string, unknown>)["@_Type"] === "Meals") meals = value;
        else tags.push(value);
      }

      const mp = (r.MinPrice ?? {}) as Record<string, unknown>;
      const minPrice = num(text(mp.Price)) ?? num(text(mp));

      return {
        id,
        name,
        type,
        isSpecial: type === "S" || tags.some((t) => t.toLowerCase() === "deals"),
        summary: decodeEntities(text(r.OfferSummary)),
        descriptionLines: htmlToLines(text(r.OfferDescription)),
        meals,
        tags,
        minPrice,
        currency: text(mp.Currency) || "USD",
        priceOccupancy: num(text(mp.Occupancy)),
        priceNights: num(text(mp.Nights)),
        image: safeImageUrl(text(r.OfferImage)),
      };
    })
    .filter((o): o is ProfitroomOffer => o !== null);
}

let cache: { offers: ProfitroomOffer[]; fetchedAt: number } | null = null;

export type OffersResult = { offers: ProfitroomOffer[]; fetchedAt: string | null; stale: boolean };

export async function getProfitroomOffers(): Promise<OffersResult> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return { offers: cache.offers, fetchedAt: new Date(cache.fetchedAt).toISOString(), stale: false };
  }
  try {
    const res = await fetch(OFFERS_FEED_URL, {
      headers: { Accept: "application/xml, text/xml", "User-Agent": "TamarindVillageWebsite/1.0 (offers feed)" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`ProfitRoom offers feed returned ${res.status}`);
    const offers = parseOffersXml(await res.text());
    cache = { offers, fetchedAt: now };
    return { offers, fetchedAt: new Date(now).toISOString(), stale: false };
  } catch (err) {
    console.error("[ProfitRoom offers]", err instanceof Error ? err.message : err);
    if (cache) return { offers: cache.offers, fetchedAt: new Date(cache.fetchedAt).toISOString(), stale: true };
    return { offers: [], fetchedAt: null, stale: true };
  }
}
