import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { fulfillApartmentBooking } from "@/lib/bookingPaymentService";
import { fulfillEventTicket, isEventTicketPayment } from "@/lib/eventTicketService";
import { writeAuditLog } from "@/lib/audit";

// ============================================================
// POST /api/paystack/webhook
// Configure in Paystack dashboard → Settings → API Keys & Webhooks:
//   https://<site>/api/paystack/webhook
//
// Returns 500 on failure so Paystack retries; every failure is also
// written to the audit log so staff can see payments that need help.
// ============================================================
export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "No Paystack secret key configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) {
    console.warn("[Paystack Webhook] Invalid signature received.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const txData = payload.data;
  if (payload.event !== "charge.success" || !txData?.reference) {
    return NextResponse.json({ received: true });
  }

  const reference: string = txData.reference;
  try {
    await ensureDatabaseSeeded();
    if (isEventTicketPayment(reference, txData.metadata)) {
      await fulfillEventTicket(reference, txData, { actor: "Paystack Webhook" });
    } else {
      await fulfillApartmentBooking(reference, txData, { actor: "Paystack Webhook" });
    }
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`[Paystack Webhook] Fulfillment failed for ${reference}:`, err.message);
    await writeAuditLog({
      actor: "Paystack Webhook",
      actorRole: "system",
      category: "payment_error",
      action: "Payment Fulfillment Failed",
      details: `Paystack payment ${reference} (${txData.currency} ${txData.amount / 100}) was received but could not be recorded: ${err.message}`,
      targetId: reference,
      metadata: { reference, error: err.message },
    });
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }
}
