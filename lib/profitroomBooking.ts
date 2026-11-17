/**
 * ProfitRoom booking engine link, shown as the main "Book now" option until
 * the ProfitRoom agreement ends.
 *
 * NEXT_PUBLIC_PROFITROOM_BOOKING_UNTIL controls it:
 *   - unset          -> ProfitRoom is shown
 *   - "YYYY-MM-DD"   -> shown up to and including that date (Nairobi time), then hidden
 *   - "off"          -> hidden
 */

const PROFITROOM_START_URL = "https://upperbooking.com/en/booking/start/tamarindvillage";

const UNTIL = process.env.NEXT_PUBLIC_PROFITROOM_BOOKING_UNTIL?.trim();

export function isProfitroomBookingActive(now: Date = new Date(), until: string | undefined = UNTIL): boolean {
  if (!until) return true;
  if (until.toLowerCase() === "off") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return true;
  // End of the given day in Africa/Nairobi (UTC+3, no DST).
  const end = new Date(`${until}T23:59:59+03:00`);
  return now.getTime() <= end.getTime();
}

export interface ProfitroomBookingParams {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  promocode?: string;
}

export function profitroomBookingUrl(params: ProfitroomBookingParams = {}): string {
  const query = new URLSearchParams();
  if (params.checkIn) query.set("checkin", params.checkIn);
  if (params.checkOut) query.set("checkout", params.checkOut);
  if (params.guests && params.guests > 0) query.set("occupancy", String(params.guests));
  if (params.promocode) query.set("promocode", params.promocode);
  const qs = query.toString();
  return qs ? `${PROFITROOM_START_URL}?${qs}` : PROFITROOM_START_URL;
}

export function openProfitroomBooking(params: ProfitroomBookingParams = {}): void {
  window.open(profitroomBookingUrl(params), "_blank", "noopener,noreferrer");
}

type ProfitroomWidget = { Open: (opts: Record<string, unknown>) => void };

/**
 * Opens one ProfitRoom offer. Uses ProfitRoom's own Booking.Open() from their
 * Booking.js script (see PROFITROOM_WIDGET_SRC); if that hasn't loaded yet,
 * opens the booking engine start page.
 */
export function openProfitroomOffer(offerId: string): void {
  const widget = (window as unknown as { Booking?: ProfitroomWidget }).Booking;
  const numericId = Number(offerId);
  if (widget && typeof widget.Open === "function" && Number.isFinite(numericId)) {
    widget.Open({ OfferID: numericId });
    return;
  }
  openProfitroomBooking();
}

/**
 * ProfitRoom's Booking.js (from their "Integrating a booking system with own
 * booking form" guide). It provides Booking.Open({OfferID}), which opens one
 * offer in a panel over our site. NEXT_PUBLIC_PROFITROOM_WIDGET_SRC can point
 * it elsewhere, or "off" stops it loading.
 */
const DEFAULT_WIDGET_SRC = "https://open.upperbooking.com/tamarindvillage/Booking.js?locale=en";

export function profitroomWidgetSrc(value: string | undefined = process.env.NEXT_PUBLIC_PROFITROOM_WIDGET_SRC): string {
  const v = value?.trim();
  if (!v) return DEFAULT_WIDGET_SRC;
  if (v.toLowerCase() === "off") return "";
  return v;
}

export const PROFITROOM_WIDGET_SRC = profitroomWidgetSrc();

/**
 * Our own "Book & Pay Here" link (Paystack checkout) next to ProfitRoom's
 * Book Now. Hidden unless NEXT_PUBLIC_SHOW_DIRECT_BOOKING_LINK is "on".
 * When ProfitRoom is switched off, our checkout is the main button and this
 * setting doesn't apply.
 */
export function isDirectBookingLinkShown(
  value: string | undefined = process.env.NEXT_PUBLIC_SHOW_DIRECT_BOOKING_LINK,
): boolean {
  return value?.trim().toLowerCase() === "on";
}
