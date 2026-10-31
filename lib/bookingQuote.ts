import { getDb } from "@/lib/db/db";
import { extras, mealPlans } from "@/lib/db/schema";
import { evaluateVoucher } from "@/lib/vouchers";
import {
  AvailabilityData,
  ApartmentAvailability,
  evaluateApartment,
  isIsoDate,
  propertyToday,
} from "@/lib/availability";

// ============================================================
// Server-side price calculation for apartment bookings.
//
// The browser shows a price, but the amount actually charged on
// Paystack is always the one calculated here, so a guest cannot
// change the price by editing the request.
// Mirrors calculateCostBreakdown() in components/BookingModal.tsx.
// ============================================================

export type QuoteRequest = {
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  mealPlanId?: string | null;
  selectedExtras?: { extraId: string; quantity: number }[];
  promocode?: string | null;
};

export type QuoteLineExtra = {
  extraId: string;
  name: string;
  quantity: number;
  unitPriceUsd: number;
  unitPriceKes: number;
  totalUsd: number;
};

export type BookingQuote = {
  apartmentId: string;
  apartmentName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  nightlyRateUsd: number;
  totalRoomUsd: number;
  mealPlanId: string | null;
  mealPlanName: string | null;
  mealPlanRateUsd: number;
  mealPlanRateKes: number;
  totalMealPlanUsd: number;
  extras: QuoteLineExtra[];
  totalExtrasUsd: number;
  subtotalUsd: number;
  voucherCode: string | null;
  voucherId: string | null;
  discountUsd: number;
  totalUsd: number;
  availability: ApartmentAvailability;
};

export class QuoteError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function quoteApartmentStay(
  data: AvailabilityData,
  req: QuoteRequest,
  opts: { excludeBookingId?: string; skipPastDateCheck?: boolean } = {}
): Promise<BookingQuote> {
  const db = getDb();
  const { apartmentId, checkIn, checkOut } = req;
  const adults = Math.max(1, Math.floor(Number(req.adults) || 1));
  const children = Math.max(0, Math.floor(Number(req.children) || 0));

  if (!apartmentId) throw new QuoteError("Please choose an apartment.");
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut) || checkIn >= checkOut) {
    throw new QuoteError("Please choose a valid check-in and check-out date.");
  }
  if (!opts.skipPastDateCheck && checkIn < propertyToday()) {
    throw new QuoteError("Check-in date cannot be in the past.");
  }

  const apt = data.apartments.find((a) => a.id === apartmentId);
  if (!apt || !apt.isActive) throw new QuoteError("This apartment is not available for online booking.");
  if (adults + children > apt.maxGuests) {
    throw new QuoteError(`This apartment sleeps a maximum of ${apt.maxGuests} guests.`);
  }

  const availability = evaluateApartment(data, apartmentId, checkIn, checkOut, {
    excludeBookingId: opts.excludeBookingId,
  });
  const nights = availability.nights;
  const totalGuests = adults + children;

  // Room rate: an active seasonal override wins; otherwise the base rate less any apartment discount.
  const discountPct = apt.discountPercentage || 0;
  const discountedBase = discountPct > 0 ? Math.round(apt.pricePerNight * (1 - discountPct / 100)) : apt.pricePerNight;
  const nightlyRateUsd =
    availability.rateOverride && availability.rateOverride.rateUsd != null
      ? availability.rateOverride.rateUsd
      : discountedBase;
  const totalRoomUsd = nightlyRateUsd * nights;

  // Meal plan: rate × guests × nights. Falls back to the first active plan, like the booking form.
  const plans = (await db.select().from(mealPlans).orderBy(mealPlans.sortOrder)).filter((p) => p.isActive);
  const plan = plans.find((p) => p.id === req.mealPlanId) || plans[0] || null;
  const mealPlanRateUsd = plan?.pricePerPersonPerDayUsd || 0;
  const mealPlanRateKes = plan?.pricePerPersonPerDayKes || 0;
  const totalMealPlanUsd = mealPlanRateUsd * totalGuests * nights;

  // Extras
  const lines: QuoteLineExtra[] = [];
  const requested = Array.isArray(req.selectedExtras) ? req.selectedExtras : [];
  if (requested.length > 0) {
    const allExtras = await db.select().from(extras);
    for (const r of requested) {
      const qty = Math.floor(Number(r.quantity) || 0);
      if (qty <= 0) continue;
      const ext = allExtras.find((e) => e.id === r.extraId && e.isActive);
      if (!ext) continue;
      let total = ext.priceUsd * qty;
      if (ext.pricingUnit === "per_person") total = ext.priceUsd * totalGuests * qty;
      else if (ext.pricingUnit === "per_night") total = ext.priceUsd * nights * qty;
      lines.push({
        extraId: ext.id,
        name: ext.name,
        quantity: qty,
        unitPriceUsd: ext.priceUsd,
        unitPriceKes: ext.priceKes,
        totalUsd: total,
      });
    }
  }
  const totalExtrasUsd = lines.reduce((s, l) => s + l.totalUsd, 0);

  const subtotalUsd = totalRoomUsd + totalMealPlanUsd + totalExtrasUsd;

  // Voucher (same rules as the public voucher check, scoped to apartments)
  let discountUsd = 0;
  let voucherCode: string | null = null;
  let voucherId: string | null = null;
  if (req.promocode && req.promocode.trim()) {
    const result = await evaluateVoucher(req.promocode, { scope: "apartment", subtotalUsd });
    if (!result.valid) throw new QuoteError(result.error);
    discountUsd = result.discountAmountUsd;
    voucherCode = result.voucher.code;
    voucherId = result.voucher.id;
  }

  const totalUsd = round2(Math.max(0, subtotalUsd - discountUsd));

  return {
    apartmentId,
    apartmentName: apt.name,
    checkIn,
    checkOut,
    nights,
    adults,
    children,
    nightlyRateUsd,
    totalRoomUsd: round2(totalRoomUsd),
    mealPlanId: plan?.id || null,
    mealPlanName: plan?.name || null,
    mealPlanRateUsd,
    mealPlanRateKes,
    totalMealPlanUsd: round2(totalMealPlanUsd),
    extras: lines,
    totalExtrasUsd: round2(totalExtrasUsd),
    subtotalUsd: round2(subtotalUsd),
    voucherCode,
    voucherId,
    discountUsd,
    totalUsd,
    availability,
  };
}
