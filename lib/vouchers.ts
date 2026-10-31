import { getDb } from "@/lib/db/db";
import { vouchers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { propertyToday } from "@/lib/availability";

export const USD_TO_KES = 130;

export type VoucherScope = "apartment" | "event";

export type VoucherResult =
  | {
      valid: true;
      voucher: typeof vouchers.$inferSelect;
      discountAmountUsd: number;
      discountAmountKes: number;
    }
  | { valid: false; error: string };

/**
 * Validates a promo code and calculates its discount. Single source of truth
 * for the voucher API, apartment checkout and event ticket checkout.
 */
export async function evaluateVoucher(
  rawCode: string,
  opts: { scope?: VoucherScope | null; eventId?: string | null; subtotalUsd: number; subtotalKes?: number }
): Promise<VoucherResult> {
  const code = rawCode.trim().toUpperCase();
  const db = getDb();
  const [voucher] = await db.select().from(vouchers).where(eq(vouchers.code, code)).limit(1);

  if (!voucher || !voucher.isActive) return { valid: false, error: "Invalid or inactive promo code." };

  const today = propertyToday();
  if (voucher.validFrom && today < voucher.validFrom) {
    return { valid: false, error: `This promo code is not active until ${voucher.validFrom}.` };
  }
  if (voucher.validUntil && today > voucher.validUntil) {
    return { valid: false, error: `This promo code expired on ${voucher.validUntil}.` };
  }
  if (voucher.usageLimit != null && (voucher.usedCount || 0) >= voucher.usageLimit) {
    return { valid: false, error: "This promo code has reached its maximum redemption limit." };
  }

  const voucherScope = voucher.scope || "all";
  if (opts.scope === "event" && voucherScope === "apartment") {
    return { valid: false, error: "This voucher is only applicable to apartment bookings." };
  }
  if (opts.scope === "apartment" && voucherScope === "event") {
    return { valid: false, error: "This voucher is only applicable to event tickets." };
  }
  if (
    opts.scope === "event" &&
    Array.isArray(voucher.applicableEventIds) &&
    voucher.applicableEventIds.length > 0 &&
    (!opts.eventId || !voucher.applicableEventIds.includes(opts.eventId))
  ) {
    return { valid: false, error: "This promo code is not applicable to this specific event." };
  }

  const subtotalUsd = opts.subtotalUsd;
  const subtotalKes = opts.subtotalKes ?? subtotalUsd * USD_TO_KES;

  if (voucher.minSpendUsd && subtotalUsd < voucher.minSpendUsd) {
    return { valid: false, error: `Minimum total of $${voucher.minSpendUsd} USD required for this promo code.` };
  }

  let discountAmountUsd = 0;
  let discountAmountKes = 0;
  if (voucher.discountType === "percentage") {
    discountAmountUsd = (subtotalUsd * voucher.discountValue) / 100;
    discountAmountKes = (subtotalKes * voucher.discountValue) / 100;
    if (voucher.maxDiscountUsd) {
      discountAmountUsd = Math.min(discountAmountUsd, voucher.maxDiscountUsd);
      discountAmountKes = Math.min(discountAmountKes, voucher.maxDiscountUsd * USD_TO_KES);
    }
  } else if (voucher.discountType === "fixed_usd") {
    discountAmountUsd = Math.min(voucher.discountValue, subtotalUsd);
    discountAmountKes = Math.min(voucher.discountValue * USD_TO_KES, subtotalKes);
  } else if (voucher.discountType === "fixed_kes") {
    discountAmountKes = Math.min(voucher.discountValue, subtotalKes);
    discountAmountUsd = Math.min(voucher.discountValue / USD_TO_KES, subtotalUsd);
  }

  return {
    valid: true,
    voucher,
    discountAmountUsd: Math.round(discountAmountUsd * 100) / 100,
    discountAmountKes: Math.round(discountAmountKes),
  };
}

/** Records one redemption of a voucher after a successful payment. Never throws. */
export async function recordVoucherRedemption(code: string | null | undefined): Promise<void> {
  if (!code) return;
  try {
    await getDb()
      .update(vouchers)
      .set({ usedCount: sql`COALESCE(${vouchers.usedCount}, 0) + 1` })
      .where(eq(vouchers.code, code.trim().toUpperCase()));
  } catch (err: any) {
    console.warn("[Vouchers] Failed to record redemption:", err.message);
  }
}
