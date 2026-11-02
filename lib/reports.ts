import type { apartmentInventory, bookings, eventTickets, inquiries, vouchers } from "@/lib/db/schema";
import { addDays, nightsBetween } from "@/lib/reportDates";

type Booking = typeof bookings.$inferSelect;
type Ticket = typeof eventTickets.$inferSelect;
type Inquiry = typeof inquiries.$inferSelect;
type Voucher = typeof vouchers.$inferSelect;
type Inventory = typeof apartmentInventory.$inferSelect;

// ============================================================
// Reporting maths, kept free of database access so it can be tested.
//
// Definitions (hotel-standard):
//   room nights sold  nights of paid, non-cancelled stays that fall in the period
//   occupancy         room nights sold / (units x days in period)
//   ADR               room revenue / room nights sold
//   RevPAR            room revenue / available room nights
// Revenue is in USD; KES payments convert at the booking's own rate.
// Stays that span the period edge count only the nights inside it.
// ============================================================

export const SOLD_STATUSES = ["confirmed", "arriving_today", "in_house", "departing_today", "checked_out"];

export type ReportInput = {
  from: string; // YYYY-MM-DD inclusive
  to: string; // YYYY-MM-DD inclusive
  bookings: Booking[];
  inventory: Inventory[];
  tickets: Ticket[];
  inquiries: Inquiry[];
  vouchers: Voucher[];
};

function overlapNights(checkIn: string, checkOut: string, from: string, toExclusive: string): number {
  const start = checkIn > from ? checkIn : from;
  const end = checkOut < toExclusive ? checkOut : toExclusive;
  return end > start ? nightsBetween(start, end) : 0;
}

const round = (n: number, dp = 0) => Math.round(n * 10 ** dp) / 10 ** dp;

export function computeReport(input: ReportInput) {
  const { from, to } = input;
  const toExclusive = addDays(to, 1);
  const days = nightsBetween(from, toExclusive);
  const totalUnits = input.inventory.reduce((s, i) => s + Math.max(0, i.totalUnits || 0), 0) || 1;
  const availableRoomNights = totalUnits * days;

  const sold = input.bookings.filter((b) => b.paymentStatus === "paid" && SOLD_STATUSES.includes(b.bookingStatus));

  let roomNights = 0;
  let roomRevenue = 0;
  let mealRevenue = 0;
  let extrasRevenue = 0;
  const byApartment = new Map<string, { name: string; nights: number; revenue: number; bookings: number }>();

  for (const b of sold) {
    const stayNights = Math.max(1, b.nights || nightsBetween(b.checkIn, b.checkOut));
    const inPeriod = overlapNights(b.checkIn, b.checkOut, from, toExclusive);
    if (inPeriod === 0) continue;
    const share = inPeriod / stayNights;
    const room = (Number(b.totalRoomUsd) || Math.max(0, Number(b.totalAmount) - Number(b.totalMealPlanUsd || 0) - Number(b.totalExtrasUsd || 0))) * share;
    roomNights += inPeriod;
    roomRevenue += room;
    mealRevenue += Number(b.totalMealPlanUsd || 0) * share;
    extrasRevenue += Number(b.totalExtrasUsd || 0) * share;
    const a = byApartment.get(b.apartmentId) || { name: b.apartmentName, nights: 0, revenue: 0, bookings: 0 };
    a.nights += inPeriod;
    a.revenue += room;
    a.bookings += 1;
    byApartment.set(b.apartmentId, a);
  }

  // Bookings MADE in the period (pace / sales view).
  const madeInPeriod = input.bookings.filter((b) => {
    const d = (b.createdAt || "").slice(0, 10);
    return d >= from && d <= to;
  });
  const paidMade = madeInPeriod.filter((b) => b.paymentStatus === "paid" && b.bookingStatus !== "cancelled");
  const leadTimes = paidMade.map((b) => nightsBetween((b.createdAt || b.checkIn).slice(0, 10), b.checkIn)).filter((n) => n >= 0);
  const lengths = paidMade.map((b) => Math.max(1, b.nights || nightsBetween(b.checkIn, b.checkOut)));
  const byCurrency: Record<string, number> = {};
  const byMethod: Record<string, number> = {};
  for (const b of paidMade) {
    const cur = (b.chargeCurrency || b.currency || "USD").toUpperCase();
    byCurrency[cur] = (byCurrency[cur] || 0) + 1;
    const m = (b.paymentMethod || "paystack").toLowerCase();
    byMethod[m] = (byMethod[m] || 0) + 1;
  }

  // Last 12 months of paid room revenue, by stay month.
  const months: { month: string; revenue: number; nights: number }[] = [];
  const end = new Date(to + "T00:00:00Z");
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    const mStart = d.toISOString().slice(0, 10);
    const mEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
    let revenue = 0;
    let nights = 0;
    for (const b of sold) {
      const n = overlapNights(b.checkIn, b.checkOut, mStart, mEnd);
      if (!n) continue;
      const stayNights = Math.max(1, b.nights || nightsBetween(b.checkIn, b.checkOut));
      revenue += Number(b.totalAmount || 0) * (n / stayNights);
      nights += n;
    }
    months.push({ month: mStart.slice(0, 7), revenue: round(revenue), nights });
  }

  // Events (KES) by brand, for events dated in the period.
  const ticketsInPeriod = input.tickets.filter((t) => t.eventDate >= from && t.eventDate <= to && t.paymentStatus === "paid");
  const eventsByBrand = new Map<string, { tickets: number; revenueKes: number }>();
  for (const t of ticketsInPeriod) {
    const e = eventsByBrand.get(t.brand) || { tickets: 0, revenueKes: 0 };
    e.tickets += t.ticketCount || 1;
    e.revenueKes += t.totalAmountKes || 0;
    eventsByBrand.set(t.brand, e);
  }

  const inquiriesInPeriod = input.inquiries.filter((q) => {
    const d = (q.createdAt || "").slice(0, 10);
    return d >= from && d <= to;
  });
  const bookedInquiries = inquiriesInPeriod.filter((q) => ["booked", "confirmed"].includes(String(q.status).toLowerCase())).length;

  return {
    period: { from, to, days, totalUnits },
    rooms: {
      roomNightsSold: roomNights,
      availableRoomNights,
      occupancyPct: round((roomNights / availableRoomNights) * 100, 1),
      adrUsd: roomNights ? round(roomRevenue / roomNights) : 0,
      revparUsd: round(roomRevenue / availableRoomNights, 2),
      roomRevenueUsd: round(roomRevenue),
      mealPlanRevenueUsd: round(mealRevenue),
      extrasRevenueUsd: round(extrasRevenue),
      totalRevenueUsd: round(roomRevenue + mealRevenue + extrasRevenue),
    },
    byApartment: Array.from(byApartment.entries())
      .map(([id, a]) => ({ id, ...a, revenue: round(a.revenue), occupancyPct: round((a.nights / ((input.inventory.find((i) => i.id === id)?.totalUnits || 1) * days)) * 100, 1) }))
      .sort((x, y) => y.revenue - x.revenue),
    sales: {
      bookingsMade: paidMade.length,
      cancelled: madeInPeriod.filter((b) => b.bookingStatus === "cancelled").length,
      refunded: madeInPeriod.filter((b) => b.refundStatus === "refunded").length,
      abandonedCheckouts: madeInPeriod.filter((b) => ["expired", "payment_failed"].includes(b.bookingStatus) && b.paymentStatus !== "paid").length,
      avgLeadTimeDays: leadTimes.length ? round(leadTimes.reduce((s, n) => s + n, 0) / leadTimes.length, 1) : 0,
      avgLengthOfStay: lengths.length ? round(lengths.reduce((s, n) => s + n, 0) / lengths.length, 1) : 0,
      onlineCheckInPct: paidMade.length ? round((paidMade.filter((b) => b.checkInDetails).length / paidMade.length) * 100) : 0,
      byCurrency,
      byMethod,
    },
    monthly: months,
    events: {
      ticketsSold: ticketsInPeriod.reduce((s, t) => s + (t.ticketCount || 1), 0),
      revenueKes: ticketsInPeriod.reduce((s, t) => s + (t.totalAmountKes || 0), 0),
      byBrand: Array.from(eventsByBrand.entries()).map(([brand, v]) => ({ brand, ...v })).sort((a, b) => b.revenueKes - a.revenueKes),
    },
    inquiries: {
      received: inquiriesInPeriod.length,
      booked: bookedInquiries,
      conversionPct: inquiriesInPeriod.length ? round((bookedInquiries / inquiriesInPeriod.length) * 100, 1) : 0,
    },
    vouchers: input.vouchers
      .filter((v) => (v.usedCount || 0) > 0)
      .map((v) => ({ code: v.code, used: v.usedCount || 0, limit: v.usageLimit, active: v.isActive }))
      .sort((a, b) => b.used - a.used)
      .slice(0, 10),
  };
}

export type Report = ReturnType<typeof computeReport>;
