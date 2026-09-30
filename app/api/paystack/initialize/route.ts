import { NextRequest, NextResponse } from "next/server";

// ============================================================
// POST /api/paystack/initialize
//
// Initializes a Paystack transaction and returns the
// authorization URL for the guest to complete payment.
//
// Body:
// {
//   email: string,
//   amount: number,        — in the currency's major unit (e.g. KES 5000, USD 120)
//   currency: "KES" | "USD",
//   reference: string,    — your booking/inquiry reference
//   metadata: { ... }     — arbitrary metadata passed back by Paystack on verify
// }
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      return NextResponse.json(
        { error: "Online payment is not configured. Please contact us to arrange payment directly." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { email, amount, currency, reference, metadata } = body;

    if (!email || !amount) {
      return NextResponse.json({ error: "email and amount are required" }, { status: 400 });
    }

    // Paystack amounts are in the smallest currency unit:
    //   KES: kobo (1 KES = 100 kobo)
    //   USD: cents (1 USD = 100 cents)
    //   GHS: pesewa (1 GHS = 100 pesewa)
    const amountInSmallestUnit = Math.round(Number(amount) * 100);

    // Supported currencies for Paystack (as of 2026)
    const supportedCurrencies = ["KES", "USD", "GHS", "ZAR", "NGN"];
    const paystackCurrency = (currency || "KES").toUpperCase();
    if (!supportedCurrencies.includes(paystackCurrency)) {
      return NextResponse.json(
        { error: `Currency ${paystackCurrency} is not supported by Paystack. Use KES or USD.` },
        { status: 400 }
      );
    }

    // Derive callback URL: POST-payment redirect to the booking confirmed page
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "";
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || `${origin}/booking-confirmed`;

    const paystackRef = reference || `TVL-${Date.now()}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInSmallestUnit,
        currency: paystackCurrency,
        reference: paystackRef,
        callback_url: callbackUrl,
        metadata: {
          ...(metadata || {}),
          tamarind_ref: paystackRef,
          currency: paystackCurrency,
        },
      }),
    });

    const data = (await res.json()) as any;

    if (!data.status || !data.data?.authorization_url) {
      console.error("[Paystack Init] Failed:", data.message);
      return NextResponse.json(
        { error: data.message || "Failed to initialize payment. Please try again or contact us." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (err: any) {
    console.error("[Paystack Init] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
