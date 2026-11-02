import type { bookings } from "@/lib/db/schema";

type Booking = typeof bookings.$inferSelect;

/** "KES 26,000 (USD 200)" when paid in KES, else "USD 200". */
export function paidLabel(b: Booking): string {
  const cur = (b.chargeCurrency || b.currency || "USD").toUpperCase();
  const amt = Number(b.amountPaid ?? b.chargeAmount ?? b.totalAmount) || 0;
  const main = `${cur} ${amt.toLocaleString()}`;
  return cur !== (b.currency || "USD").toUpperCase() ? `${main} (${b.currency} ${Number(b.totalAmount).toLocaleString()})` : main;
}

/**
 * The booking fields a guest may see (tracker, e-reservation). Leaves out
 * staff notes, internal ids and payment references.
 */
export function guestView(b: Booking) {
  return {
    bookingReference: b.bookingReference,
    guestToken: b.guestToken,
    apartmentId: b.apartmentId,
    apartmentName: b.apartmentName,
    allocatedUnit: b.allocatedUnit,
    guestName: b.guestName,
    guestEmail: b.guestEmail,
    guestPhone: b.guestPhone,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    nights: b.nights,
    adults: b.adults,
    children: b.children,
    mealPlanName: b.mealPlanName,
    totalAmount: b.totalAmount,
    currency: b.currency,
    chargeCurrency: b.chargeCurrency,
    chargeAmount: b.chargeAmount,
    amountPaid: b.amountPaid,
    paymentStatus: b.paymentStatus,
    paymentMethod: b.paymentMethod,
    bookingStatus: b.bookingStatus,
    specialRequests: b.specialRequests,
    refundStatus: b.refundStatus,
    refundAmount: b.refundAmount,
    changeRequest: b.changeRequest,
    checkInDone: Boolean(b.checkInDetails),
    checkInSubmittedAt: b.checkInDetails?.submittedAt ?? null,
    createdAt: b.createdAt,
  };
}

export type GuestBookingView = ReturnType<typeof guestView>;
