// Remembers, per visitor, which offer they've already seen or closed.
// Storage can be blocked (private mode); then everything just shows again.

export function storageGet(store: "local" | "session", key: string): string | null {
  try {
    return (store === "local" ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(store: "local" | "session", key: string, value: string) {
  try {
    (store === "local" ? window.localStorage : window.sessionStorage).setItem(key, value);
  } catch {
    // ignore
  }
}

/** True if this offer was closed under `key` within the last `days` days. */
export function closedRecently(key: string, offerId: string, days: number): boolean {
  const raw = storageGet("local", key);
  if (!raw) return false;
  try {
    const { id, at } = JSON.parse(raw) as { id: string; at: number };
    return id === offerId && Date.now() - at < days * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function rememberClosed(key: string, offerId: string) {
  storageSet("local", key, JSON.stringify({ id: offerId, at: Date.now() }));
}

/** Pages where offer promotions would get in the way. */
export const OFFER_PROMO_HIDDEN_ON = ["/offers", "/booking-confirmed", "/track", "/guide"];

export function offerPromoHiddenOn(pathname: string): boolean {
  return OFFER_PROMO_HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
