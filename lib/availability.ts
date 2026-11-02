import { getDb } from "@/lib/db/db";
import {
  apartmentInventory,
  availabilityBlocks,
  bookings,
  rateOverrides,
  apartments,
} from "@/lib/db/schema";
import { usdToKesRate } from "@/lib/fx";

// ============================================================
// Shared availability logic.
//
// Used by the public availability API (for display), by checkout
// (to refuse blocked / sold-out dates BEFORE payment is taken) and
// by payment fulfillment (to flag conflicts for staff review).
// ============================================================

/** Booking statuses that never hold inventory. */
export const NON_OCCUPYING_STATUSES = ["cancelled", "checked_out", "no_show", "expired", "payment_failed"];

/** An unpaid checkout holds its unit for this long while the guest is on Paystack. */
export const PENDING_PAYMENT_HOLD_MINUTES = 30;

export type AvailabilityData = {
  blocks: (typeof availabilityBlocks.$inferSelect)[];
  inventory: (typeof apartmentInventory.$inferSelect)[];
  bookings: (typeof bookings.$inferSelect)[];
  rateOverrides: (typeof rateOverrides.$inferSelect)[];
  apartments: (typeof apartments.$inferSelect)[];
};

type DbLike = Pick<ReturnType<typeof getDb>, "select">;

export async function loadAvailabilityData(db: DbLike = getDb()): Promise<AvailabilityData> {
  const [blocks, inventory, allBookings, allRateOverrides, allApartments] = await Promise.all([
    db.select().from(availabilityBlocks),
    db.select().from(apartmentInventory),
    db.select().from(bookings),
    db.select().from(rateOverrides),
    db.select().from(apartments),
  ]);
  return {
    blocks,
    inventory,
    bookings: allBookings,
    rateOverrides: allRateOverrides,
    apartments: allApartments,
  };
}

/** Half-open interval overlap: [aStart, aEnd) vs [bStart, bEnd). Dates are YYYY-MM-DD strings. */
export function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.ceil(ms / 86400000));
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(new Date(value).getTime());
}

export { propertyToday } from "@/lib/dates";

/** Whether a booking currently takes up a unit. Unpaid checkouts only hold for a short window. */
export function bookingOccupiesInventory(b: typeof bookings.$inferSelect, now = Date.now()): boolean {
  if (NON_OCCUPYING_STATUSES.includes(b.bookingStatus)) return false;
  if (b.bookingStatus === "pending_payment") {
    const created = new Date(b.createdAt).getTime();
    if (isNaN(created)) return false;
    return now - created < PENDING_PAYMENT_HOLD_MINUTES * 60 * 1000;
  }
  return true;
}

export type ApartmentAvailability = {
  apartmentId: string;
  apartmentName: string;
  totalUnits: number;
  occupiedUnits: number;
  availableUnits: number;
  available: boolean;
  /** Human-readable reason when not available. */
  reason: string | null;
  propertyBlocked: boolean;
  blockReason: string | null;
  rateHold: { reason: string | null } | null;
  rateOverride: {
    id: string;
    rateUsd: number | null;
    rateKes: number | null;
    minNights: number | null;
    label: string | null;
  } | null;
  effectiveRateUsd: number;
  effectiveRateKes: number;
  minNights: number;
  meetsMinNights: boolean;
  nights: number;
  estimatedTotalUsd: number;
};

/**
 * Evaluates availability for one apartment type.
 *
 * Fails closed: an apartment with no inventory row is treated as having a
 * single unit (so blocks and existing bookings still apply), rather than
 * being skipped as before.
 */
export function evaluateApartment(
  data: AvailabilityData,
  apartmentId: string,
  checkIn: string,
  checkOut: string,
  opts: { excludeBookingId?: string } = {}
): ApartmentAvailability {
  const nights = nightsBetween(checkIn, checkOut);
  const inv = data.inventory.find((i) => i.id === apartmentId);
  const aptRecord = data.apartments.find((a) => a.id === apartmentId);
  const totalUnits = inv ? Math.max(0, inv.totalUnits ?? 0) : 1;
  const now = Date.now();

  const propertyBlock = data.blocks.find(
    (b) => b.apartmentId === "all" && b.blockType === "hard_block" && datesOverlap(b.startDate, b.endDate, checkIn, checkOut)
  );
  const hardBlock = data.blocks.find(
    (b) => b.apartmentId === apartmentId && b.blockType === "hard_block" && datesOverlap(b.startDate, b.endDate, checkIn, checkOut)
  );

  const overlappingBookings = data.bookings.filter(
    (b) =>
      b.apartmentId === apartmentId &&
      b.id !== opts.excludeBookingId &&
      bookingOccupiesInventory(b, now) &&
      datesOverlap(b.checkIn, b.checkOut, checkIn, checkOut)
  ).length;

  const blocked = Boolean(propertyBlock || hardBlock);
  const occupiedUnits = blocked ? totalUnits : Math.min(totalUnits, overlappingBookings);
  const availableUnits = blocked ? 0 : Math.max(0, totalUnits - overlappingBookings);

  // Rate override: apartment-specific beats "all", then the latest start date wins.
  const applicableOverrides = data.rateOverrides
    .filter(
      (ro) =>
        (ro.apartmentId === apartmentId || ro.apartmentId === "all") &&
        datesOverlap(ro.startDate, ro.endDate, checkIn, checkOut)
    )
    .sort((a, b) => {
      if (a.apartmentId !== "all" && b.apartmentId === "all") return -1;
      if (a.apartmentId === "all" && b.apartmentId !== "all") return 1;
      return a.startDate > b.startDate ? -1 : 1;
    });
  const activeOverride = applicableOverrides[0] || null;

  const baseRateUsd = aptRecord ? aptRecord.pricePerNight : 0;
  const effectiveRateUsd = activeOverride?.rateUsd ?? baseRateUsd;
  const effectiveRateKes = activeOverride?.rateKes ?? baseRateUsd * usdToKesRate();
  const minNights = activeOverride?.minNights ?? 1;
  const meetsMinNights = nights >= minNights;

  const rateHoldBlock = data.blocks.find(
    (b) => b.apartmentId === apartmentId && b.blockType === "rate_hold" && datesOverlap(b.startDate, b.endDate, checkIn, checkOut)
  );

  let reason: string | null = null;
  if (propertyBlock) reason = "The property is not accepting reservations during this period.";
  else if (hardBlock) reason = "This apartment is not available for the selected dates.";
  else if (availableUnits <= 0) reason = "Selected apartment type is fully booked for these dates.";
  else if (!meetsMinNights) reason = `A minimum stay of ${minNights} nights is required for this seasonal period.`;

  return {
    apartmentId,
    apartmentName: aptRecord?.name || apartmentId,
    totalUnits,
    occupiedUnits,
    availableUnits,
    available: reason === null,
    reason,
    propertyBlocked: Boolean(propertyBlock),
    blockReason: hardBlock?.reason || propertyBlock?.reason || null,
    rateHold: rateHoldBlock ? { reason: rateHoldBlock.reason } : null,
    rateOverride: activeOverride
      ? {
          id: activeOverride.id,
          rateUsd: activeOverride.rateUsd,
          rateKes: activeOverride.rateKes,
          minNights: activeOverride.minNights,
          label: activeOverride.label,
        }
      : null,
    effectiveRateUsd,
    effectiveRateKes,
    minNights,
    meetsMinNights,
    nights,
    estimatedTotalUsd: effectiveRateUsd * nights,
  };
}

/** All apartment type ids known to the system (apartments table ∪ inventory table). */
export function allApartmentIds(data: AvailabilityData): string[] {
  const ids = new Set<string>();
  data.apartments.forEach((a) => ids.add(a.id));
  data.inventory.forEach((i) => ids.add(i.id));
  return Array.from(ids);
}
