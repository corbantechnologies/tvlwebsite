// ============================================================
// Currency for apartment payments.
//
// Stays are priced in USD. Guests may pay in USD (card) or in KES
// (M-Pesa or card); M-Pesa on Paystack only accepts KES. The KES
// amount uses NEXT_PUBLIC_USD_TO_KES_RATE (one value for the server and
// the booking form; update it in Vercel when the rate moves)
// and is rounded up to the next whole shilling.
// ============================================================

export type PayCurrency = "USD" | "KES";

export const DEFAULT_USD_TO_KES = 130;

export function usdToKesRate(): number {
  // Written out in full so Next.js inlines it into the browser bundle too.
  const fromEnv = Number(process.env.NEXT_PUBLIC_USD_TO_KES_RATE);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_USD_TO_KES;
}

export function normalizePayCurrency(value: unknown): PayCurrency {
  return String(value || "").toUpperCase() === "KES" ? "KES" : "USD";
}

/** What Paystack should charge for a USD total in the guest's chosen currency. */
export function chargeFor(totalUsd: number, currency: PayCurrency, rate = usdToKesRate()) {
  if (currency === "KES") {
    return { currency, amount: Math.ceil(totalUsd * rate), fxRate: rate };
  }
  return { currency, amount: Math.round(totalUsd * 100) / 100, fxRate: null as number | null };
}
