'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Save, Percent, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPricingPage() {
  const [markupMultiplier, setMarkupMultiplier] = useState(1.0);
  const [taxRate, setTaxRate] = useState(8);
  const [seasonalFactor, setSeasonalFactor] = useState('regular');
  const [exchangeRate, setExchangeRate] = useState(128.5);

  useEffect(() => {
    fetch('/api/pricing')
      .then((r) => r.json())
      .then((d) => {
        if (d.pricing) {
          setMarkupMultiplier(d.pricing.markupMultiplier || 1.0);
          setTaxRate(d.pricing.taxRate || 8);
          setSeasonalFactor(d.pricing.seasonalFactor || 'regular');
          setExchangeRate(d.pricing.exchangeRate || 128.5);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markupMultiplier,
          taxRate,
          seasonalFactor,
          exchangeRate,
        }),
      });

      if (res.ok) {
        toast.success('Pricing rules saved successfully!');
      } else {
        toast.error('Failed to save pricing configuration.');
      }
    } catch {
      toast.error('Network error saving pricing.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
          <DollarSign className="w-3.5 h-3.5" /> Revenue &amp; Yield Management
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
          Dynamic Pricing Engine
        </h1>
        <p className="text-xs text-white/60">
          Apply global rate multipliers, manage seasonal factors, and configure VAT/Tourism Levy percentages.
        </p>
      </div>

      <div className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#C59B27] mb-1">
              Global Markup Multiplier
            </label>
            <input
              type="number"
              step="0.05"
              value={markupMultiplier}
              onChange={(e) => setMarkupMultiplier(Number(e.target.value))}
              className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#C59B27]"
            />
            <span className="text-[10px] text-white/50 mt-1 block">1.0 = Base rates, 1.15 = 15% increase</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#C59B27] mb-1">
              Seasonal Factor
            </label>
            <select
              value={seasonalFactor}
              onChange={(e) => setSeasonalFactor(e.target.value)}
              className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#C59B27]"
            >
              <option value="low">Low Season (Coastal Breeze Special)</option>
              <option value="regular">Regular Season</option>
              <option value="peak">Peak Season (December / Easter Holidays)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#C59B27] mb-1">
              Tourism Catering Levy &amp; Tax (%)
            </label>
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#C59B27]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#C59B27] mb-1">
              USD to KES Pegged Exchange Rate
            </label>
            <input
              type="number"
              step="0.5"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(Number(e.target.value))}
              className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#C59B27]"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Update Dynamic Rates</span>
          </button>
        </div>
      </div>
    </div>
  );
}
