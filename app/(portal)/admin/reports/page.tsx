'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Report } from '@/lib/reports';
import { addDays, propertyToday } from '@/lib/dates';

type Preset = 'mtd' | 'last30' | 'lastMonth' | 'ytd' | 'next30' | 'custom';

function presetRange(p: Preset): { from: string; to: string } {
  const today = propertyToday();
  switch (p) {
    case 'last30':
      return { from: addDays(today, -29), to: today };
    case 'lastMonth': {
      const firstThis = today.slice(0, 8) + '01';
      const lastPrev = addDays(firstThis, -1);
      return { from: lastPrev.slice(0, 8) + '01', to: lastPrev };
    }
    case 'ytd':
      return { from: today.slice(0, 5) + '01-01', to: today };
    case 'next30':
      return { from: today, to: addDays(today, 29) };
    default:
      return { from: today.slice(0, 8) + '01', to: today };
  }
}

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;
const BRAND_NAMES: Record<string, string> = {
  tamarind_village: 'Tamarind Village',
  tamarind_restaurant: 'Tamarind Restaurant',
  tamarind_dhow: 'Tamarind Dhow',
  dawa_terrace: 'Dawa Terrace',
  golden_key: 'Golden Key',
};

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <div className="text-2xl font-serif font-bold text-slate-900 mt-1">{value}</div>
      {hint && <span className="text-[10px] text-slate-400 block mt-0.5">{hint}</span>}
    </div>
  );
}

function Card({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <h3 className="font-serif text-base font-bold text-slate-900 mb-3">{title}</h3>
      {children}
      {note && <p className="text-[10px] text-slate-400 mt-3">{note}</p>}
    </section>
  );
}

export default function ReportsAnalyticsPage() {
  const [preset, setPreset] = useState<Preset>('mtd');
  const [range, setRange] = useState(presetRange('mtd'));
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r: { from: string; to: string }) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?from=${r.from}&to=${r.to}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load report');
      setReport(data.report);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [load, range]);

  const choose = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') setRange(presetRange(p));
  };

  const maxMonth = Math.max(1, ...(report?.monthly.map((m) => m.revenue) || [1]));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-2 sm:px-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#821124] font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-3.5 h-3.5" /> Reports
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">Occupancy, revenue and sales</h1>
          <p className="text-xs text-slate-500 mt-0.5">Website bookings only. Revenue in USD; KES payments convert at the rate used when the guest paid.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {([
            ['mtd', 'Month to date'],
            ['lastMonth', 'Last month'],
            ['last30', 'Last 30 days'],
            ['ytd', 'Year to date'],
            ['next30', 'Next 30 days (on the books)'],
            ['custom', 'Custom'],
          ] as [Preset, string][]).map(([p, label]) => (
            <button
              key={p}
              onClick={() => choose(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${preset === p ? 'bg-[#821124] text-white border-[#821124]' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
          {preset === 'custom' && (
            <span className="flex items-center gap-1 text-xs">
              <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} className="border border-slate-200 rounded-lg px-2 py-1" />
              <span>to</span>
              <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} className="border border-slate-200 rounded-lg px-2 py-1" />
            </span>
          )}
          <button onClick={() => load(range)} disabled={loading} className="p-2 rounded-lg bg-white border border-slate-200" aria-label="Refresh">
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {!report ? (
        <p className="text-sm text-slate-500 py-12 text-center">{loading ? 'Loading report...' : 'No data.'}</p>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            {report.period.from} to {report.period.to} · {report.period.days} days · {report.period.totalUnits} units
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Kpi label="Occupancy" value={`${report.rooms.occupancyPct}%`} hint={`${report.rooms.roomNightsSold} of ${report.rooms.availableRoomNights} room nights`} />
            <Kpi label="ADR" value={usd(report.rooms.adrUsd)} hint="Average daily rate" />
            <Kpi label="RevPAR" value={usd(report.rooms.revparUsd)} hint="Room revenue per available night" />
            <Kpi label="Stay revenue" value={usd(report.rooms.totalRevenueUsd)} hint={`Rooms ${usd(report.rooms.roomRevenueUsd)} · meals ${usd(report.rooms.mealPlanRevenueUsd)} · extras ${usd(report.rooms.extrasRevenueUsd)}`} />
            <Kpi label="Event tickets" value={`KES ${report.events.revenueKes.toLocaleString()}`} hint={`${report.events.ticketsSold} tickets`} />
          </div>

          <Card title="Stay revenue by month (last 12 months)" note="Paid stays, counted in the month the nights fall in.">
            <div className="flex items-end gap-1.5 h-40" role="img" aria-label="Monthly revenue bar chart">
              {report.monthly.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full group">
                  <span className="text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 mb-0.5">{usd(m.revenue)}</span>
                  <div className="w-full bg-[#821124] rounded-t" style={{ height: `${(m.revenue / maxMonth) * 100}%`, minHeight: m.revenue ? 2 : 0 }} title={`${m.month}: ${usd(m.revenue)}, ${m.nights} nights`} />
                  <span className="text-[9px] text-slate-500 mt-1">{m.month.slice(5)}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="By apartment type">
              {report.byApartment.length === 0 ? (
                <p className="text-xs text-slate-400">No paid stays in this period.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-slate-500 text-left">
                    <tr><th className="py-1">Apartment</th><th className="text-right">Nights</th><th className="text-right">Occupancy</th><th className="text-right">Room revenue</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.byApartment.map((a) => (
                      <tr key={a.id}><td className="py-1.5">{a.name}</td><td className="text-right">{a.nights}</td><td className="text-right">{a.occupancyPct}%</td><td className="text-right font-mono">{usd(a.revenue)}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="Bookings made in this period">
              <dl className="grid grid-cols-2 gap-y-2 text-xs">
                <dt className="text-slate-500">Paid bookings</dt><dd className="text-right font-bold">{report.sales.bookingsMade}</dd>
                <dt className="text-slate-500">Cancelled</dt><dd className="text-right">{report.sales.cancelled}</dd>
                <dt className="text-slate-500">Refunded</dt><dd className="text-right">{report.sales.refunded}</dd>
                <dt className="text-slate-500">Abandoned checkouts</dt><dd className="text-right">{report.sales.abandonedCheckouts}</dd>
                <dt className="text-slate-500">Average lead time</dt><dd className="text-right">{report.sales.avgLeadTimeDays} days</dd>
                <dt className="text-slate-500">Average stay</dt><dd className="text-right">{report.sales.avgLengthOfStay} nights</dd>
                <dt className="text-slate-500">Checked in online</dt><dd className="text-right">{report.sales.onlineCheckInPct}%</dd>
                <dt className="text-slate-500">Paid in</dt>
                <dd className="text-right">{Object.entries(report.sales.byCurrency).map(([c, n]) => `${c} ${n}`).join(' · ') || '—'}</dd>
                <dt className="text-slate-500">Method</dt>
                <dd className="text-right">{Object.entries(report.sales.byMethod).map(([m, n]) => `${m} ${n}`).join(' · ') || '—'}</dd>
              </dl>
            </Card>

            <Card title="Events by brand" note="Paid tickets for events dated in this period.">
              {report.events.byBrand.length === 0 ? (
                <p className="text-xs text-slate-400">No ticket sales for events in this period.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-slate-500 text-left"><tr><th className="py-1">Brand</th><th className="text-right">Tickets</th><th className="text-right">Revenue</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.events.byBrand.map((e) => (
                      <tr key={e.brand}><td className="py-1.5">{BRAND_NAMES[e.brand] || e.brand}</td><td className="text-right">{e.tickets}</td><td className="text-right font-mono">KES {e.revenueKes.toLocaleString()}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="Inquiries and promo codes">
              <p className="text-xs text-slate-700 mb-3">
                {report.inquiries.received} inquiries received, {report.inquiries.booked} booked ({report.inquiries.conversionPct}% conversion).
              </p>
              {report.vouchers.length === 0 ? (
                <p className="text-xs text-slate-400">No promo codes used yet.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-slate-500 text-left"><tr><th className="py-1">Code</th><th className="text-right">Times used (all time)</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.vouchers.map((v) => (
                      <tr key={v.code}><td className="py-1.5 font-mono">{v.code}{!v.active && <span className="text-slate-400"> (inactive)</span>}</td><td className="text-right">{v.used}{v.limit ? ` / ${v.limit}` : ''}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
