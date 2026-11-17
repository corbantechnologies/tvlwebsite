// Shared rules for events: weekly repeats (e.g. a Friday happy hour), what counts as
// upcoming, and which fields the public may see.

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Cleans a list of weekday numbers (0 = Sunday … 6 = Saturday). */
export function cleanRepeatDays(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const days = value.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  return Array.from(new Set(days)).sort((a, b) => a - b);
}

type Schedule = { startDate?: string | null; endDate?: string | null; repeatDays?: unknown };

/** "Every Friday", "Every Tuesday & Thursday", "Every day", or null for a one-off event. */
export function repeatText(e: Schedule): string | null {
  const days = cleanRepeatDays(e.repeatDays);
  if (!days.length) return null;
  if (days.length === 7) return "Every day";
  const names = days.map((d) => WEEKDAYS[d]);
  return `Every ${names.length > 1 ? `${names.slice(0, -1).join(", ")} & ${names.at(-1)}` : names[0]}`;
}

/** Today's date in Mombasa, as YYYY-MM-DD. */
export function todayInKenya(now = new Date()): string {
  return new Date(now.getTime() + 3 * 3600_000).toISOString().slice(0, 10);
}

/** Not over yet: a one-off event until its (end) date has passed; a weekly one until its end date. */
export function isUpcoming(e: Schedule, today = todayInKenya()): boolean {
  const last = e.endDate || (cleanRepeatDays(e.repeatDays).length ? null : e.startDate);
  return !last || last >= today;
}

/** Fields anyone may see. Gate PINs and Paystack subaccounts stay with staff. */
const PUBLIC_FIELDS = [
  "id", "title", "slug", "description", "brand", "venue", "city", "category",
  "startDate", "endDate", "timeText", "repeatDays", "priceUsd", "priceKes", "image", "gallery",
  "maxCapacity", "bookedCount", "highlights", "dressCode", "bookingLink", "externalTicketUrl",
  "paymentEnabled", "isFeatured", "isActive",
] as const;

export function toPublicEvent<T extends Record<string, unknown>>(e: T) {
  return Object.fromEntries(PUBLIC_FIELDS.filter((k) => k in e).map((k) => [k, e[k]]));
}
