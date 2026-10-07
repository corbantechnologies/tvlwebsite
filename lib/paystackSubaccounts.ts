/**
 * Resolves the Paystack subaccount code for a business unit or event.
 * If an explicit subaccount code is set on the event, it takes precedence.
 * Otherwise, maps the brand slug to the corresponding environment variable.
 * If no subaccount is configured, returns undefined (deposits to main account).
 */
export function resolvePaystackSubaccount(
  brand?: string,
  eventSubaccountOverride?: string | null
): string | undefined {
  if (eventSubaccountOverride && eventSubaccountOverride.trim().startsWith("ACCT_")) {
    return eventSubaccountOverride.trim();
  }

  const brandNormalized = (brand || "").toLowerCase().trim();

  switch (brandNormalized) {
    case "tamarind_restaurant":
    case "restaurant":
      return process.env.PAYSTACK_SUBACCOUNT_RESTAURANT || undefined;

    case "tamarind_dhow":
    case "dhow":
      return process.env.PAYSTACK_SUBACCOUNT_DHOW || undefined;

    case "dawa_terrace":
    case "dawa":
      return process.env.PAYSTACK_SUBACCOUNT_DAWA || undefined;

    case "golden_key":
    case "casino":
      return process.env.PAYSTACK_SUBACCOUNT_CASINO || undefined;

    case "tamarind_village":
    case "village":
      return process.env.PAYSTACK_SUBACCOUNT_VILLAGE || undefined;

    default:
      return undefined;
  }
}
