import type { ProfitroomOffer } from "@/lib/profitroomOffers";

// Display helpers for ProfitRoom offers, shared by the offer cards and the pop-up.

/** "USD 250" or null when the feed has no price. */
export function formatOfferPrice(o: Pick<ProfitroomOffer, "minPrice" | "currency">): string | null {
  if (o.minPrice == null) return null;
  const amount = Number.isInteger(o.minPrice) ? o.minPrice.toLocaleString("en-US") : o.minPrice.toFixed(2);
  return `${o.currency} ${amount}`;
}

function shortDate(iso: string, withYear: boolean): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

/** "Valid 20 Nov – 19 Dec 2026", "Valid from 20 Nov 2026", "Valid until 19 Dec 2026", or null. */
export function offerValidity(o: Pick<ProfitroomOffer, "availableFrom" | "availableTo">): string | null {
  const { availableFrom: from, availableTo: to } = o;
  if (from && to) {
    const sameYear = from.slice(0, 4) === to.slice(0, 4);
    return `Valid ${shortDate(from, !sameYear)} – ${shortDate(to, true)}`;
  }
  if (from) return `Valid from ${shortDate(from, true)}`;
  if (to) return `Valid until ${shortDate(to, true)}`;
  return null;
}

/**
 * The offer to feature in the pop-up: a seasonal offer (one with an end date),
 * soonest-ending first; otherwise the first offer in the Suite's order.
 */
export function pickFeaturedOffer<T extends Pick<ProfitroomOffer, "availableTo">>(offers: T[]): T | null {
  const dated = offers.filter((o) => o.availableTo).sort((a, b) => a.availableTo!.localeCompare(b.availableTo!));
  return dated[0] ?? offers[0] ?? null;
}
