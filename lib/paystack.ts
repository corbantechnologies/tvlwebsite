import { resolvePaystackSubaccount } from "@/lib/paystackSubaccounts";

// ============================================================
// Thin wrappers around the Paystack REST API.
// ============================================================

export const SUPPORTED_PAYSTACK_CURRENCIES = ["KES", "USD", "GHS", "ZAR", "NGN"];

export function getSiteOrigin(req?: Request): string {
  return (
    req?.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://tamarindvillage.co.ke"
  ).replace(/\/$/, "");
}

/** Generates a unique Paystack/booking reference such as TVL-LZ4K2A-9QX1. */
export function generateReference(prefix: "TVL" | "TKT"): string {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${time}-${rand}`;
}

export type InitializeParams = {
  email: string;
  /** Amount in the currency's major unit (e.g. USD 120.50). */
  amount: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, any>;
  brand?: string;
  subaccount?: string | null;
};

export type InitializeResult =
  | { ok: true; authorizationUrl: string; accessCode: string; reference: string }
  | { ok: false; status: number; error: string };

export async function initializePaystackTransaction(p: InitializeParams): Promise<InitializeResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return {
      ok: false,
      status: 503,
      error: "Online payment is not configured. Please contact us to arrange payment directly.",
    };
  }

  const currency = (p.currency || "KES").toUpperCase();
  if (!SUPPORTED_PAYSTACK_CURRENCIES.includes(currency)) {
    return { ok: false, status: 400, error: `Currency ${currency} is not supported by Paystack. Use KES or USD.` };
  }

  const amountInSmallestUnit = Math.round(Number(p.amount) * 100);
  if (!Number.isFinite(amountInSmallestUnit) || amountInSmallestUnit <= 0) {
    return { ok: false, status: 400, error: "Invalid payment amount." };
  }

  const subaccount = p.subaccount || resolvePaystackSubaccount(p.brand, p.metadata?.subaccountCode);

  const payload: Record<string, any> = {
    email: p.email,
    amount: amountInSmallestUnit,
    currency,
    reference: p.reference,
    callback_url: p.callbackUrl,
    metadata: {
      ...p.metadata,
      tamarind_ref: p.reference,
      currency,
      subaccountCode: subaccount || undefined,
    },
  };
  if (subaccount) {
    payload.subaccount = subaccount;
    payload.bearer = "subaccount";
  }

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as any;
    if (!data.status || !data.data?.authorization_url) {
      console.error("[Paystack Init] Failed:", data.message);
      return {
        ok: false,
        status: 502,
        error: data.message || "Failed to initialize payment. Please try again or contact us.",
      };
    }
    return {
      ok: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  } catch (err: any) {
    console.error("[Paystack Init] Network error:", err.message);
    return { ok: false, status: 502, error: "Could not reach the payment gateway. Please try again." };
  }
}

/** Calls Paystack's verify endpoint. Returns the transaction data when it succeeded, else null + message. */
export async function verifyPaystackTransaction(
  reference: string
): Promise<{ ok: true; data: any } | { ok: false; status: number; error: string; paystackStatus?: string }> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return { ok: false, status: 500, error: "Payment verification unavailable: missing Paystack secret key." };
  }
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = (await res.json()) as any;
  if (!body.status || body.data?.status !== "success") {
    return {
      ok: false,
      status: 400,
      error: body.message || "Payment has not been confirmed by Paystack.",
      paystackStatus: body.data?.status,
    };
  }
  return { ok: true, data: body.data };
}
