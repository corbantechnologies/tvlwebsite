/**
 * End-to-end tests against a real Postgres database.
 *
 *   TEST_DATABASE_URL=postgres://user@localhost:5432/tvl_test npm run test:integration
 *
 * The database should be empty: migrations and seed data are applied by the test.
 * Paystack is replaced by a fake `fetch`; no email is sent (RESEND_API_KEY is unset).
 */
import { before, after, describe, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

const DB_URL = process.env.TEST_DATABASE_URL;
process.env.DATABASE_URL = DB_URL || "";
process.env.PAYSTACK_SECRET_KEY = "sk_test_integration";
process.env.CRON_SECRET = "cron_test_secret";
process.env.NEXT_PUBLIC_USD_TO_KES_RATE = "130";
delete process.env.RESEND_API_KEY;

// ---------------------------------------------------------------
// Fake Paystack
// ---------------------------------------------------------------
const paystack = {
  inits: [] as any[],
  refunds: [] as any[],
  listed: [] as any[],
};
const realFetch = global.fetch;
global.fetch = (async (url: any, init: any) => {
  const u = String(url);
  if (u.includes("api.paystack.co/transaction/initialize")) {
    const body = JSON.parse(init.body);
    paystack.inits.push(body);
    return new Response(JSON.stringify({ status: true, data: { authorization_url: "https://checkout.paystack.com/x", access_code: "a", reference: body.reference } }));
  }
  if (u.includes("api.paystack.co/refund")) {
    const body = JSON.parse(init.body);
    paystack.refunds.push(body);
    return new Response(JSON.stringify({ status: true, data: { id: 9001, status: "pending" } }));
  }
  if (u.includes("api.paystack.co/transaction?")) {
    return new Response(JSON.stringify({ status: true, data: paystack.listed, meta: { pageCount: 1 } }));
  }
  return realFetch(url, init);
}) as typeof fetch;

const day = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().split("T")[0];
let ipCounter = 1;
const freshIp = () => `10.0.${Math.floor(ipCounter / 250)}.${ipCounter++ % 250}`;

describe("platform (integration)", { skip: !DB_URL && "TEST_DATABASE_URL not set" }, () => {
  let NextRequest: typeof import("next/server").NextRequest;
  let db: any;
  let schema: typeof import("@/lib/db/schema");
  let eq: typeof import("drizzle-orm").eq;
  let checkout: (req: any) => Promise<Response>;
  let fulfillApartmentBooking: typeof import("@/lib/bookingPaymentService").fulfillApartmentBooking;

  const post = (body: any) =>
    checkout(
      new NextRequest("http://localhost/api/bookings/checkout", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { origin: "http://localhost:3000", "x-forwarded-for": freshIp() },
      })
    );
  const guest = { name: "Test Guest", email: "t@example.com", phone: "0712345678", adults: 2, children: 0 };

  /** Inserts a paid booking directly and returns it. */
  async function paidBooking(over: Record<string, unknown> = {}) {
    const id = "bkg_" + crypto.randomUUID().slice(0, 8);
    const token = "TVL-" + crypto.randomUUID().slice(0, 6).toUpperCase();
    const row = {
      id,
      bookingReference: "TVL-T-" + id.slice(4),
      apartmentId: "3-bedroom",
      apartmentName: "Three Bedroom",
      guestName: "Paid Guest",
      guestEmail: "p@example.com",
      guestPhone: "0700000000",
      checkIn: day(60),
      checkOut: day(62),
      nights: 2,
      totalAmount: 500,
      totalRoomUsd: 500,
      currency: "USD",
      chargeCurrency: "USD",
      chargeAmount: 500,
      amountPaid: 500,
      paymentStatus: "paid",
      paymentMethod: "card",
      paymentReference: "PSK-" + id,
      bookingStatus: "confirmed",
      guestToken: token,
      staffNotes: [{ text: "internal note", author: "Staff", timestamp: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      ...over,
    };
    await db.insert(schema.bookings).values(row);
    return row;
  }

  before(async () => {
    ({ NextRequest } = await import("next/server"));
    const { ensureDatabaseSeeded } = await import("@/lib/db/seed");
    await ensureDatabaseSeeded();
    db = (await import("@/lib/db/db")).getDb();
    schema = await import("@/lib/db/schema");
    ({ eq } = await import("drizzle-orm"));
    checkout = (await import("@/app/api/bookings/checkout/route")).POST;
    ({ fulfillApartmentBooking } = await import("@/lib/bookingPaymentService"));
  });

  after(async () => {
    const { getClient } = await import("@/lib/db/db");
    await getClient().end();
  });

  test("migrations are recorded once", async () => {
    const { runMigrations, MIGRATIONS } = await import("@/lib/db/migrations");
    assert.deepEqual(await runMigrations(db), []);
    const rows = await db.execute((await import("drizzle-orm")).sql`SELECT id FROM schema_migrations ORDER BY id`);
    assert.deepEqual(rows.map((r: any) => r.id), MIGRATIONS.map((m) => m.id));
  });

  test("blocked dates are refused; block end date is the reopening day", async () => {
    await db.insert(schema.availabilityBlocks).values({ id: "blk_it", apartmentId: "2-bedroom", startDate: day(10), endDate: day(13), reason: "Maintenance", blockType: "hard_block", createdAt: new Date().toISOString() });
    assert.equal((await post({ ...guest, apartmentId: "2-bedroom", checkIn: day(11), checkOut: day(12) })).status, 409);
    assert.equal((await post({ ...guest, apartmentId: "2-bedroom", checkIn: day(13), checkOut: day(14) })).status, 200);
  });

  test("a pending checkout holds the last unit", async () => {
    await db.insert(schema.apartments).values({ id: "apt_it", name: "IT Suite", description: "", size: "1", maxGuests: 2, pricePerNight: 100, image: "x", gallery: [], amenities: [], bedrooms: 1, bathrooms: 1, highlights: [], bedConfig: "", viewType: "" } as any);
    assert.equal((await post({ ...guest, apartmentId: "apt_it", checkIn: day(30), checkOut: day(32) })).status, 200);
    assert.equal((await post({ ...guest, apartmentId: "apt_it", checkIn: day(31), checkOut: day(33) })).status, 409);
  });

  test("server sets the price; webhook and verify racing confirm once", async () => {
    paystack.inits = [];
    const r = await post({ ...guest, apartmentId: "1-bedroom", checkIn: day(40), checkOut: day(43), amount: 1, mealPlanId: "room-only" });
    const body = await r.json();
    assert.equal(r.status, 200);
    assert.ok(paystack.inits[0].amount > 100, "client amount ignored");
    const init = paystack.inits[0];
    const tx = { reference: body.reference, amount: init.amount, currency: "USD", channel: "card", metadata: init.metadata };
    const [a, b] = await Promise.all([fulfillApartmentBooking(body.reference, tx, { notifyGuest: false }), fulfillApartmentBooking(body.reference, tx, { notifyGuest: false })]);
    assert.equal([a, b].filter((x) => !x.alreadyPaid).length, 1);
    const [row] = await db.select().from(schema.bookings).where(eq(schema.bookings.bookingReference, body.reference));
    assert.equal(row.paymentStatus, "paid");
    assert.equal(row.amountPaid, init.amount / 100);
    assert.ok(!(row.staffNotes as any[]).some((n) => String(n.text).startsWith("ACTION NEEDED")));
  });

  test("KES checkout charges converted shillings and accepts the KES payment", async () => {
    paystack.inits = [];
    const r = await post({ ...guest, apartmentId: "1-bedroom", checkIn: day(70), checkOut: day(72), mealPlanId: "room-only", payCurrency: "KES" });
    const body = await r.json();
    assert.equal(r.status, 200);
    const init = paystack.inits[0];
    assert.equal(init.currency, "KES");
    assert.equal(init.amount, Math.ceil(body.totalUsd * 130) * 100);
    const res = await fulfillApartmentBooking(body.reference, { reference: body.reference, amount: init.amount, currency: "KES", channel: "mobile_money", metadata: init.metadata }, { notifyGuest: false });
    assert.ok(!res.needsReview, "exact KES payment needs no review");
    assert.equal(res.booking!.chargeCurrency, "KES");
  });

  test("a short KES payment is flagged for staff", async () => {
    paystack.inits = [];
    const r = await post({ ...guest, apartmentId: "1-bedroom", checkIn: day(80), checkOut: day(82), mealPlanId: "room-only", payCurrency: "KES" });
    const body = await r.json();
    const init = paystack.inits[0];
    const res = await fulfillApartmentBooking(body.reference, { reference: body.reference, amount: init.amount - 50000, currency: "KES", metadata: init.metadata }, { notifyGuest: false, notifyStaff: false });
    assert.ok(res.needsReview);
  });

  test("unmatched payments are logged, not turned into bookings", async () => {
    const res = await fulfillApartmentBooking("RANDOM-1", { reference: "RANDOM-1", amount: 100, currency: "KES", metadata: {} });
    assert.ok(res.unmatched);
  });

  test("webhook checks the Paystack signature", async () => {
    const webhook = (await import("@/app/api/paystack/webhook/route")).POST;
    const body = JSON.stringify({ event: "charge.success", data: { reference: "RANDOM-2", amount: 100, currency: "KES", metadata: {} } });
    const sig = crypto.createHmac("sha512", "sk_test_integration").update(body).digest("hex");
    assert.equal((await webhook(new NextRequest("http://localhost/api/paystack/webhook", { method: "POST", body, headers: { "x-paystack-signature": "bad" } }))).status, 401);
    assert.equal((await webhook(new NextRequest("http://localhost/api/paystack/webhook", { method: "POST", body, headers: { "x-paystack-signature": sig } }))).status, 200);
  });

  test("guest lookup hides staff notes and payment internals", async () => {
    const b = await paidBooking();
    const { GET } = await import("@/app/api/guest/inquiry/[token]/route");
    const res = await GET(new NextRequest(`http://localhost/api/guest/inquiry/${b.guestToken}`, { headers: { "x-forwarded-for": freshIp() } }), { params: Promise.resolve({ token: b.guestToken }) });
    const data = await res.json();
    assert.equal(data.booking.bookingReference, b.bookingReference);
    assert.equal(data.booking.staffNotes, undefined);
    assert.equal(data.booking.paymentReference, undefined);
  });

  test("cancellation policy: free period, late request, unpaid", async () => {
    const { DELETE } = await import("@/app/api/guest/inquiry/[token]/route");
    const cancel = (token: string) =>
      DELETE(new NextRequest(`http://localhost/api/guest/inquiry/${token}`, { method: "DELETE", headers: { "x-forwarded-for": freshIp() } }), { params: Promise.resolve({ token }) });

    const early = await paidBooking({ checkIn: day(30), checkOut: day(32) });
    let res = await cancel(early.guestToken);
    assert.equal(res.status, 200);
    let [row] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, early.id));
    assert.equal(row.bookingStatus, "cancelled");
    assert.equal(row.refundStatus, "due");

    const late = await paidBooking({ checkIn: day(1), checkOut: day(3) });
    res = await cancel(late.guestToken);
    assert.equal((await res.json()).pending, true);
    [row] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, late.id));
    assert.equal(row.bookingStatus, "confirmed");
    assert.equal(row.changeRequest.type, "cancel");

    const unpaid = await paidBooking({ paymentStatus: "unpaid", checkIn: day(1), checkOut: day(2) });
    res = await cancel(unpaid.guestToken);
    [row] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, unpaid.id));
    assert.equal(row.bookingStatus, "cancelled");
    assert.equal(row.refundStatus, null);
  });

  test("online check-in and date-change request", async () => {
    const checkinRoute = (await import("@/app/api/guest/booking/[token]/checkin/route")).POST;
    const changeRoute = (await import("@/app/api/guest/booking/[token]/change/route")).POST;
    const b = await paidBooking();
    const send = (fn: any, path: string, body: unknown, token = b.guestToken) =>
      fn(new NextRequest(`http://localhost/api/guest/booking/${token}/${path}`, { method: "POST", body: JSON.stringify(body), headers: { "x-forwarded-for": freshIp() } }), { params: Promise.resolve({ token }) });

    assert.equal((await send(checkinRoute, "checkin", { fullName: "Paid Guest" })).status, 400);
    const ok = await send(checkinRoute, "checkin", { fullName: "Paid Guest", nationality: "Kenyan", idType: "national_id", idNumber: "12345678", arrivalTime: "15:00" });
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).booking.checkInDone, true);

    const unpaid = await paidBooking({ paymentStatus: "unpaid" });
    assert.equal((await send(checkinRoute, "checkin", { fullName: "x", nationality: "y", idNumber: "z" }, unpaid.guestToken)).status, 409);

    const ch = await send(changeRoute, "change", { newCheckIn: day(90), newCheckOut: day(93), message: "Flight moved" });
    assert.equal(ch.status, 200);
    const [row] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, b.id));
    assert.equal(row.changeRequest.newCheckIn, day(90));
    assert.equal(row.checkIn, b.checkIn, "dates do not change until staff accept");
  });

  test("refund goes to Paystack and the webhook marks it refunded", async () => {
    const { issueRefund, applyRefundEvent } = await import("@/lib/refunds");
    const b = await paidBooking({ chargeCurrency: "KES", chargeAmount: 65000, amountPaid: 65000 });
    paystack.refunds = [];
    assert.equal((await issueRefund(b.id, { amount: 70000, staffName: "M", staffRole: "manager" })).ok, false, "cannot refund more than paid");
    const r = await issueRefund(b.id, { staffName: "M", staffRole: "manager", reason: "Cancelled" });
    assert.ok(r.ok);
    assert.equal(paystack.refunds[0].amount, 6500000);
    assert.equal(paystack.refunds[0].transaction, b.paymentReference);
    await applyRefundEvent("refund.processed", { transaction_reference: b.paymentReference });
    const [row] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, b.id));
    assert.equal(row.refundStatus, "refunded");
    assert.equal(row.paymentStatus, "refunded");
  });

  test("nightly jobs: recover a missed payment, expire stale checkouts", async () => {
    const stale = await paidBooking({ paymentStatus: "unpaid", bookingStatus: "pending_payment", createdAt: new Date(Date.now() - 8 * 3600000).toISOString() });
    paystack.listed = [
      {
        reference: "TVL-MISSED-1",
        amount: 40000,
        currency: "USD",
        channel: "card",
        status: "success",
        customer: { email: "m@example.com" },
        metadata: { type: "apartment_booking", apartmentId: "2-bedroom", apartmentName: "Two Bedroom", guestName: "Missed", guestEmail: "m@example.com", checkIn: day(100), checkOut: day(102), nights: 2 },
      },
    ];
    const cron = (await import("@/app/api/cron/daily/route")).GET;
    assert.equal((await cron(new NextRequest("http://localhost/api/cron/daily"))).status, 401);
    const res = await cron(new NextRequest("http://localhost/api/cron/daily", { headers: { authorization: "Bearer cron_test_secret" } }));
    const data = await res.json();
    assert.equal(res.status, 200, JSON.stringify(data));
    assert.equal(data.recovered, 1);
    const [missed] = await db.select().from(schema.bookings).where(eq(schema.bookings.bookingReference, "TVL-MISSED-1"));
    assert.equal(missed.paymentStatus, "paid");
    const [exp] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, stale.id));
    assert.equal(exp.bookingStatus, "expired");
    assert.ok(exp.abandonedNotifiedAt);
  });

  test("login is rate limited per IP", async () => {
    const login = (await import("@/app/api/auth/login/route")).POST;
    let last = 0;
    for (let i = 0; i < 11; i++) {
      const res = await login(new NextRequest("http://localhost/api/auth/login", { method: "POST", body: JSON.stringify({ email: "nobody@example.com", password: "x" }), headers: { "x-forwarded-for": "10.9.9.9" } }));
      last = res.status;
    }
    assert.equal(last, 429);
  });

  test("password reset with a valid token, then the token is spent", async () => {
    const { newResetToken } = await import("@/lib/auth/passwordReset");
    const [user] = await db.select().from(schema.users).limit(1);
    const { token, hash } = newResetToken();
    await db.insert(schema.passwordResets).values({ id: "pwr_it", userId: user.id, token: hash, expiresAt: new Date(Date.now() + 600000).toISOString(), used: false, createdAt: new Date().toISOString() });
    const reset = (await import("@/app/api/auth/reset-password/route")).POST;
    const call = () => reset(new NextRequest("http://localhost/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, newPassword: "NewPassword2026" }), headers: { "x-forwarded-for": freshIp() } }));
    assert.equal((await call()).status, 200);
    assert.equal((await call()).status, 400);
  });

  test("e-reservation PDF and reports build", async () => {
    const b = await paidBooking();
    const { buildEReservationPdf } = await import("@/lib/eReservation");
    const pdf = await buildEReservationPdf(b as any);
    assert.equal(pdf.subarray(0, 4).toString(), "%PDF");

    const reports = (await import("@/app/api/reports/route")).GET;
    const res = await reports(new NextRequest(`http://localhost/api/reports?from=${day(0)}&to=${day(120)}`));
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.ok(data.report.rooms.roomNightsSold > 0);
  });
});
