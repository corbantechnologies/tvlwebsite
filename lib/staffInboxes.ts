// ============================================================
// Staff inbox routing by brand / venue.
// Single source of truth for where staff alerts go (event ticket
// sales, inquiries, guest updates). Each inbox can be overridden
// with an env var; the defaults are the published addresses.
// ============================================================

type Inbox = "village" | "restaurant" | "dhow" | "dawa" | "golden_key";

const INBOX_BY_KEY: Record<string, Inbox> = {
  village_apartment: "village",
  tamarind_village: "village",
  village: "village",
  event: "village",
  general: "village",
  apartment: "village",
  restaurant: "restaurant",
  tamarind_restaurant: "restaurant",
  dhow: "dhow",
  tamarind_dhow: "dhow",
  dawa: "dawa",
  dawa_terrace: "dawa",
  golden_key: "golden_key",
  golden_key_casino: "golden_key",
  casino: "golden_key",
};

function inboxAddress(inbox: Inbox): string {
  switch (inbox) {
    case "restaurant":
      return process.env.EMAIL_RESTAURANT || "restaurant@tamarind.co.ke";
    case "dhow":
      return process.env.EMAIL_DHOW || "dhow@tamarind.co.ke";
    case "dawa":
      return process.env.EMAIL_DAWA || "reservations.mombasa@tamarind.co.ke";
    case "golden_key":
      return process.env.EMAIL_GOLDEN_KEY || "goldenkey.casino@tamarind.co.ke";
    default:
      return villageInbox();
  }
}

/** Tamarind Village reservations inbox (apartment bookings, payment alerts). */
export function villageInbox(): string {
  return process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke";
}

/**
 * Staff inbox for a brand or venue key such as "tamarind_dhow", "dawa-terrace"
 * or "village_apartment". The brand wins over the venue when both are given.
 * Unknown keys go to the Village reservations inbox.
 */
export function staffInboxFor(venueOrBrand?: string | null, brand?: string | null): string {
  const norm = (v?: string | null) => (v || "").toLowerCase().trim().replace(/-/g, "_");
  const inbox = INBOX_BY_KEY[norm(brand)] || INBOX_BY_KEY[norm(venueOrBrand)] || "village";
  return inboxAddress(inbox);
}
