import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      return NextResponse.json({ error: "Paystack is not configured. Please contact us directly." }, { status: 503 });
    }
    const { email, amount, currency, reference, metadata } = await req.json();
    const amountInCents = Math.round(Number(amount) * 100);
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || `${req.headers.get("origin")}/booking-confirmed`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: amountInCents,
        currency: currency || "USD",
        reference: reference || `TV-${Date.now()}`,
        callback_url: callbackUrl,
        metadata: metadata || {}
      }),
    });
    const data = await res.json() as any;
    if (!data.status) {
      return NextResponse.json({ error: data.message || "Failed to initialize transaction" }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
