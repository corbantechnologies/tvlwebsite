import { test } from "node:test";
import assert from "node:assert/strict";
import { chargeFor, normalizePayCurrency } from "@/lib/fx";
import { addDays, msUntilCheckIn } from "@/lib/dates";
import { toWhatsAppNumber, whatsappLink } from "@/lib/contact";
import { passwordProblem, hashResetToken, newResetToken } from "@/lib/auth/passwordReset";
import { paidLabel } from "@/lib/bookingFormat";

test("KES charge rounds up to the next shilling; USD keeps cents", () => {
  assert.deepEqual(chargeFor(199.99, "KES", 129.5), { currency: "KES", amount: 25899, fxRate: 129.5 });
  assert.deepEqual(chargeFor(199.999, "USD"), { currency: "USD", amount: 200, fxRate: null });
  assert.equal(normalizePayCurrency("kes"), "KES");
  assert.equal(normalizePayCurrency("EUR"), "USD");
});

test("check-in cut-off is 2 pm Mombasa time (11:00 UTC)", () => {
  const at = Date.parse("2026-12-10T11:00:00Z");
  assert.equal(msUntilCheckIn("2026-12-10", at), 0);
  assert.equal(msUntilCheckIn("2026-12-12", at), 48 * 3600 * 1000);
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("phone numbers convert to WhatsApp format", () => {
  assert.equal(toWhatsAppNumber("0712 345 678"), "254712345678");
  assert.equal(toWhatsAppNumber("+254 712 345678"), "254712345678");
  assert.equal(toWhatsAppNumber("712345678"), "254712345678");
  assert.equal(toWhatsAppNumber("+44 7700 900123"), "447700900123");
  assert.equal(toWhatsAppNumber("123"), null);
  assert.equal(whatsappLink("Hi & bye", "254700000000"), "https://wa.me/254700000000?text=Hi%20%26%20bye");
});

test("password rules and reset tokens", () => {
  assert.ok(passwordProblem("short1"));
  assert.ok(passwordProblem("longbutnodigits"));
  assert.equal(passwordProblem("Tamarind2026x"), null);
  const { token, hash } = newResetToken();
  assert.equal(hashResetToken(token), hash);
  assert.notEqual(token, hash);
});

test("paid label shows the KES amount and the USD price", () => {
  const b = { currency: "USD", totalAmount: 200, chargeCurrency: "KES", amountPaid: 26000, chargeAmount: 26000 } as any;
  assert.equal(paidLabel(b), "KES 26,000 (USD 200)");
  assert.equal(paidLabel({ currency: "USD", totalAmount: 200, chargeCurrency: "USD", amountPaid: 200 } as any), "USD 200");
});
