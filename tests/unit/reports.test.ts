import { test } from "node:test";
import assert from "node:assert/strict";
import { computeReport } from "@/lib/reports";

const base = {
  apartmentId: "1-bedroom",
  apartmentName: "One Bedroom",
  paymentStatus: "paid",
  bookingStatus: "confirmed",
  totalMealPlanUsd: 0,
  totalExtrasUsd: 0,
  currency: "USD",
  createdAt: "2026-11-01T08:00:00Z",
} as const;

test("occupancy, ADR and RevPAR count only nights inside the period", () => {
  const r = computeReport({
    from: "2026-11-01",
    to: "2026-11-10", // 10 days
    inventory: [{ id: "1-bedroom", totalUnits: 2 } as any],
    bookings: [
      // 4 nights, all inside: Nov 2-6
      { ...base, id: "a", checkIn: "2026-11-02", checkOut: "2026-11-06", nights: 4, totalRoomUsd: 400, totalAmount: 400 } as any,
      // spans the end: Nov 9-13, only 2 of 4 nights in period
      { ...base, id: "b", checkIn: "2026-11-09", checkOut: "2026-11-13", nights: 4, totalRoomUsd: 800, totalAmount: 800 } as any,
      // cancelled and unpaid stays never count
      { ...base, id: "c", checkIn: "2026-11-03", checkOut: "2026-11-04", nights: 1, totalRoomUsd: 999, totalAmount: 999, bookingStatus: "cancelled" } as any,
      { ...base, id: "d", checkIn: "2026-11-03", checkOut: "2026-11-04", nights: 1, totalRoomUsd: 999, totalAmount: 999, paymentStatus: "unpaid", bookingStatus: "pending_payment" } as any,
    ],
    tickets: [],
    inquiries: [],
    vouchers: [],
  });
  assert.equal(r.rooms.roomNightsSold, 6);
  assert.equal(r.rooms.availableRoomNights, 20);
  assert.equal(r.rooms.occupancyPct, 30);
  assert.equal(r.rooms.roomRevenueUsd, 800); // 400 + half of 800
  assert.equal(r.rooms.adrUsd, 133);
  assert.equal(r.rooms.revparUsd, 40);
  assert.equal(r.sales.bookingsMade, 2);
});
