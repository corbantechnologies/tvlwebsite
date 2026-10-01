'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Save, Percent, RefreshCw, Calendar, Tag, 
  TrendingUp, Plus, Trash2, ShieldCheck, CheckCircle2, Loader2, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SeasonalPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  multiplier: number;
  minNights: number;
}

interface PromoCode {
  code: string;
  discountPercent: number;
  label: string;
  active: boolean;
}

export default function AdminPricingPage() {
  const [markupMultiplier, setMarkupMultiplier] = useState<number | string>(1.0);
  const [taxRate, setTaxRate] = useState<number | string>(8);
  const [seasonalFactor, setSeasonalFactor] = useState('regular');
  const [exchangeRate, setExchangeRate] = useState<number | string>(128.5);
  const [weekendSurcharge, setWeekendSurcharge] = useState<number | string>(5);
  const [vatPercent, setVatPercent] = useState<number | string>(16);
  const [cateringLevy, setCateringLevy] = useState<number | string>(2);

  const [seasonalPeriods, setSeasonalPeriods] = useState<SeasonalPeriod[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New promo form
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState<number | string>(10);
  const [newPromoLabel, setNewPromoLabel] = useState('');

  // New season period form
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonStart, setNewSeasonStart] = useState('');
  const [newSeasonEnd, setNewSeasonEnd] = useState('');
  const [newSeasonMultiplier, setNewSeasonMultiplier] = useState<number | string>(1.15);
  const [newSeasonMinNights, setNewSeasonMinNights] = useState<number | string>(2);

  const loadPricing = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pricing');
      const data = await res.json();
      if (data.pricing) {
        setMarkupMultiplier(data.pricing.markupMultiplier || 1.0);
        setTaxRate(data.pricing.taxRate || 8);
        setSeasonalFactor(data.pricing.seasonalFactor || 'regular');
        setExchangeRate(data.pricing.exchangeRate || 128.5);
        setWeekendSurcharge(data.pricing.weekendSurchargePercent ?? 5);
        setVatPercent(data.pricing.vatPercent ?? 16);
        setCateringLevy(data.pricing.cateringLevyPercent ?? 2);
        setSeasonalPeriods(data.pricing.seasonalPeriods || []);
        setPromoCodes(data.pricing.promoCodes || []);
      }
    } catch {
      toast.error('Failed to load pricing configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPricing();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markupMultiplier: Number(markupMultiplier) || 1.0,
          taxRate: Number(taxRate) || 8,
          seasonalFactor,
          exchangeRate: Number(exchangeRate) || 128.5,
          weekendSurchargePercent: Number(weekendSurcharge) || 0,
          vatPercent: Number(vatPercent) || 16,
          cateringLevyPercent: Number(cateringLevy) || 2,
          seasonalPeriods,
          promoCodes,
        }),
      });

      if (res.ok) {
        toast.success('Dynamic yield & pricing rules updated!');
      } else {
        toast.error('Failed to save pricing configuration');
      }
    } catch {
      toast.error('Network error saving pricing rules');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) return;
    const cleanCode = newPromoCode.trim().toUpperCase();
    if (promoCodes.some((p) => p.code === cleanCode)) {
      toast.error('A code with this name already exists');
      return;
    }
    setPromoCodes([
      ...promoCodes,
      {
        code: cleanCode,
        discountPercent: Number(newPromoDiscount) || 10,
        label: newPromoLabel.trim() || 'Direct Privilege',
        active: true,
      },
    ]);
    setNewPromoCode('');
    setNewPromoLabel('');
    toast.success(`Promo code ${cleanCode} added. Click Save to persist.`);
  };

  const handleRemovePromo = (code: string) => {
    setPromoCodes(promoCodes.filter((p) => p.code !== code));
  };

  const handleAddSeason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeasonName.trim() || !newSeasonStart || !newSeasonEnd) {
      toast.error('Please specify season name and dates');
      return;
    }
    setSeasonalPeriods([
      ...seasonalPeriods,
      {
        id: 'sp_' + Date.now(),
        name: newSeasonName.trim(),
        startDate: newSeasonStart,
        endDate: newSeasonEnd,
        multiplier: Number(newSeasonMultiplier) || 1.0,
        minNights: Number(newSeasonMinNights) || 1,
      },
    ]);
    setNewSeasonName('');
    setNewSeasonStart('');
    setNewSeasonEnd('');
    toast.success('Seasonal rule added. Click Save to persist.');
  };

  const handleRemoveSeason = (id: string) => {
    setSeasonalPeriods(seasonalPeriods.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#821124] font-semibold uppercase tracking-wider mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> Yield &amp; Revenue Operations
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Revenue, Dynamic Pricing &amp; Seasonal Rules
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure global markup multipliers, seasonal rate rules, weekend surcharges, and direct booking promo codes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadPricing}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            title="Reload Rules"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#6b0d1d] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Applying Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Apply &amp; Save Pricing</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Global Rates & Financial Parameters */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-serif text-base font-bold text-slate-900">
            Global Rate Multipliers &amp; Currency Peg
          </h3>
          <p className="text-xs text-slate-500">
            Base multipliers applied dynamically across direct reservations and online checkouts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Global Rate Multiplier
            </label>
            <input
              type="number"
              step="0.05"
              value={markupMultiplier ?? ''}
              onChange={(e) => setMarkupMultiplier(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">1.0 = Base, 1.15 = +15% yield</span>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Pegged USD → KES Exchange Rate
            </label>
            <input
              type="number"
              step="0.5"
              value={exchangeRate ?? ''}
              onChange={(e) => setExchangeRate(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">M-Pesa checkout conversion</span>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Weekend Stay Surcharge (%)
            </label>
            <input
              type="number"
              step="1"
              value={weekendSurcharge ?? ''}
              onChange={(e) => setWeekendSurcharge(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Friday &amp; Saturday nights</span>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Tourism Catering Levy (%)
            </label>
            <input
              type="number"
              value={cateringLevy ?? ''}
              onChange={(e) => setCateringLevy(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Statutory Kenya Tourism Board</span>
          </div>
        </div>
      </div>

      {/* Seasonal Period Rules */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-slate-900">
              Seasonal Period Multipliers
            </h3>
            <p className="text-xs text-slate-500">
              Set automated price lifts and minimum stay durations for holiday seasons (Easter, Festive, Coastal Low Season).
            </p>
          </div>
        </div>

        {/* Existing seasons */}
        {seasonalPeriods.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">No custom seasonal rules configured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Season Name</th>
                  <th className="py-2.5 px-3">Date Window</th>
                  <th className="py-2.5 px-3">Multiplier</th>
                  <th className="py-2.5 px-3">Min Stay</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {seasonalPeriods.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{s.name}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {s.startDate} → {s.endDate}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-[#821124]">{s.multiplier}x</span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({s.multiplier > 1 ? `+${Math.round((s.multiplier - 1) * 100)}%` : `${Math.round((s.multiplier - 1) * 100)}%`})
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{s.minNights} night(s)</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleRemoveSeason(s.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Season Inline Form */}
        <form onSubmit={handleAddSeason} className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          <input
            type="text"
            required
            placeholder="Season Title (e.g. Easter Holiday 2026)"
            value={newSeasonName}
            onChange={(e) => setNewSeasonName(e.target.value)}
            className="sm:col-span-2 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
          />
          <input
            type="text"
            required
            placeholder="Start MM-DD (e.g. 04-10)"
            value={newSeasonStart}
            onChange={(e) => setNewSeasonStart(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
          />
          <input
            type="text"
            required
            placeholder="End MM-DD (e.g. 04-18)"
            value={newSeasonEnd}
            onChange={(e) => setNewSeasonEnd(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Rule
          </button>
        </form>
      </div>

      {/* Promotional Codes & Direct Booking Privileges */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-slate-900">
              Direct Booking Promo Codes
            </h3>
            <p className="text-xs text-slate-500">
              Promo codes redeemable by guests in the checkout drawer for instant rate deductions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {promoCodes.map((p) => (
            <div
              key={p.code}
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between"
            >
              <div>
                <span className="font-mono font-bold text-slate-900 text-xs block">{p.code}</span>
                <span className="text-[11px] text-slate-500">{p.label}</span>
                <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                  {p.discountPercent}% Off Total Stay
                </span>
              </div>
              <button
                onClick={() => handleRemovePromo(p.code)}
                className="text-slate-400 hover:text-rose-600 p-1.5"
                title="Remove Promo Code"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Promo Inline Form */}
        <form onSubmit={handleAddPromo} className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            required
            placeholder="PROMO CODE (e.g. VIP2026)"
            value={newPromoCode}
            onChange={(e) => setNewPromoCode(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono uppercase"
          />
          <input
            type="number"
            min="1"
            max="70"
            placeholder="Discount %"
            value={newPromoDiscount ?? ''}
            onChange={(e) => setNewPromoDiscount(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-28 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
          />
          <input
            type="text"
            placeholder="Label (e.g. Returning Guest Loyalty)"
            value={newPromoLabel}
            onChange={(e) => setNewPromoLabel(e.target.value)}
            className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add Code
          </button>
        </form>
      </div>
    </div>
  );
}
