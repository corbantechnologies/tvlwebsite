'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, Edit3, Check, X, RotateCw, DollarSign, Users, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface MealPlan {
  id: string;
  name: string;
  shortName: string;
  description: string;
  pricePerPersonPerDayUsd: number;
  pricePerPersonPerDayKes: number;
  highlights: string[];
  isActive: boolean;
  sortOrder: number;
}

const DEFAULT_MEAL_PLANS: MealPlan[] = [
  {
    id: 'room-only',
    name: 'Flexible Rate — Room Only',
    shortName: 'RO',
    description: 'Accommodation only. Enjoy Tamarind Village at your own pace — dine at our Harbour Restaurant, Tamarind Mombasa Restaurant, Dawa Terrace, or order in.',
    pricePerPersonPerDayUsd: 0,
    pricePerPersonPerDayKes: 0,
    highlights: ['No meal commitment', 'Flexible dining options', 'Complimentary welcome drink'],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'bed-breakfast',
    name: 'Bed & Breakfast',
    shortName: 'BB',
    description: 'Start every morning with our celebrated clifftop harbour breakfast overlooking the Indian Ocean. Freshly prepared continental and hot selections daily.',
    pricePerPersonPerDayUsd: 21,
    pricePerPersonPerDayKes: 2730,
    highlights: ['Daily clifftop harbour breakfast', 'Ocean views at breakfast', 'À la carte hot options'],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'half-board',
    name: 'Stay & Dine — Half Board Deal with Seafood',
    shortName: 'HB',
    description: 'The ultimate Tamarind experience. Breakfast each morning, plus a nightly dinner at Tamarind Mombasa’s legendary seafood restaurant — one of East Africa’s finest.',
    pricePerPersonPerDayUsd: 41,
    pricePerPersonPerDayKes: 5330,
    highlights: [
      'Daily clifftop harbour breakfast',
      'Nightly dinner at Tamarind Mombasa Restaurant',
      'Tamarind’s legendary East African seafood',
      'Most popular choice',
    ],
    isActive: true,
    sortOrder: 3,
  },
];

export default function AdminMealPlansPage() {
  const [plans, setPlans] = useState<MealPlan[]>(DEFAULT_MEAL_PLANS);
  const [loading, setLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null);

  // Edit form state
  const [formName, setFormName] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formUsd, setFormUsd] = useState(0);
  const [formKes, setFormKes] = useState(0);
  const [formHighlights, setFormHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState('');
  const [saving, setSaving] = useState(false);

  // Formula Simulator state
  const [simGuests, setSimGuests] = useState(4);
  const [simNights, setSimNights] = useState(3);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/meal-plans?active=false');
      const data = await res.json();
      if (data.success && data.mealPlans && data.mealPlans.length > 0) {
        setPlans(data.mealPlans);
      } else {
        setPlans(DEFAULT_MEAL_PLANS);
      }
    } catch {
      console.warn('Using default meal plans fallback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openEditModal = (plan: MealPlan) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormShortName(plan.shortName);
    setFormDesc(plan.description);
    setFormUsd(plan.pricePerPersonPerDayUsd);
    setFormKes(plan.pricePerPersonPerDayKes);
    setFormHighlights(Array.isArray(plan.highlights) ? [...plan.highlights] : []);
    setNewHighlight('');
  };

  const handleToggleActive = async (plan: MealPlan) => {
    try {
      const res = await fetch(`/api/meal-plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      if (res.ok) {
        toast.success(`Plan ${!plan.isActive ? 'activated' : 'deactivated'}`);
        loadPlans();
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Network error updating status');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/meal-plans/${editingPlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          shortName: formShortName,
          description: formDesc,
          pricePerPersonPerDayUsd: Number(formUsd),
          pricePerPersonPerDayKes: Number(formKes),
          highlights: formHighlights,
        }),
      });

      if (res.ok) {
        toast.success('Meal plan rates & details updated!');
        setEditingPlan(null);
        loadPlans();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to update meal plan');
      }
    } catch {
      toast.error('Network error saving meal plan');
    } finally {
      setSaving(false);
    }
  };

  const addHighlightItem = () => {
    if (newHighlight.trim()) {
      setFormHighlights([...formHighlights, newHighlight.trim()]);
      setNewHighlight('');
    }
  };

  const removeHighlightItem = (idx: number) => {
    setFormHighlights(formHighlights.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Tag className="w-3.5 h-3.5" /> Boarding &amp; Packages Engine
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Meal Plans &amp; Boarding Rates
          </h1>
          <p className="text-xs text-white/60">
            Tamarind Village meal plans are calculated per guest per day on top of the apartment base rate.
          </p>
        </div>

        <button
          onClick={loadPlans}
          disabled={loading}
          className="p-2.5 rounded-xl bg-[#1F1615] border border-[#C59B27]/25 text-[#C59B27] hover:bg-[#821124] hover:text-white transition-all cursor-pointer self-start sm:self-auto"
          title="Refresh Plans"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Pricing Formula Explainer Banner */}
      <div className="bg-gradient-to-r from-[#1F1615] to-[#2A1D1C] rounded-2xl p-6 border border-[#C59B27]/30 shadow-xl space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#C59B27] uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Hotel PMS Meal Plan Calculation Formula
            </div>
            <p className="text-sm font-mono text-white/90">
              Total Stay = (Apartment Base Rate × Nights) + (Meal Plan Rate × Total Guests × Nights) + Optional Extras
            </p>
            <p className="text-xs text-white/50">
              The apartment suite rate remains constant regardless of guest count up to max capacity. The meal plan adjusts dynamically with guest count and duration.
            </p>
          </div>

          {/* Quick simulator inputs */}
          <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-3">
            <div>
              <span className="block text-[10px] text-white/50 uppercase font-bold">Simulator Guests</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Users className="w-3.5 h-3.5 text-[#C59B27]" />
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={simGuests}
                  onChange={(e) => setSimGuests(Math.max(1, Number(e.target.value)))}
                  className="w-12 bg-transparent text-sm font-bold text-white focus:outline-none"
                />
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <span className="block text-[10px] text-white/50 uppercase font-bold">Nights</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={simNights}
                  onChange={(e) => setSimNights(Math.max(1, Number(e.target.value)))}
                  className="w-12 bg-transparent text-sm font-bold text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Meal Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const simTotalUsd = plan.pricePerPersonPerDayUsd * simGuests * simNights;
          const simTotalKes = plan.pricePerPersonPerDayKes * simGuests * simNights;

          return (
            <div
              key={plan.id}
              className={`bg-[#1F1615] rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative shadow-xl ${
                plan.id === 'half-board'
                  ? 'border-[#C59B27] ring-1 ring-[#C59B27]/40'
                  : 'border-[#C59B27]/25 hover:border-[#C59B27]/50'
              } ${!plan.isActive ? 'opacity-60' : ''}`}
            >
              {/* Top Banner if Half Board */}
              {plan.id === 'half-board' && (
                <div className="bg-[#821124] text-[#FAF6F0] text-[10px] uppercase tracking-widest font-bold py-1 px-4 text-center">
                  Guest Favourite · Iconic Seafood Experience
                </div>
              )}

              <div className="p-6 space-y-5">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/10 text-[#C59B27] mb-2">
                      {plan.shortName} Plan
                    </span>
                    <h3 className="font-serif text-lg font-bold text-white leading-snug">
                      {plan.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleToggleActive(plan)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                      plan.isActive
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/60'
                        : 'bg-red-950/60 text-red-400 border border-red-500/30 hover:bg-red-900/60'
                    }`}
                  >
                    {plan.isActive ? 'Active' : 'Disabled'}
                  </button>
                </div>

                {/* Rate Display */}
                <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-serif font-bold text-[#C59B27]">
                      {plan.pricePerPersonPerDayUsd === 0
                        ? 'Included ($0)'
                        : `$${plan.pricePerPersonPerDayUsd}`}
                    </span>
                    <span className="text-[10px] uppercase text-white/50 tracking-wider">
                      / person / day
                    </span>
                  </div>
                  <div className="text-xs text-white/60 font-mono">
                    {plan.pricePerPersonPerDayKes === 0
                      ? 'Room Rate Only'
                      : `KES ${plan.pricePerPersonPerDayKes.toLocaleString()} / person / day`}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-white/70 leading-relaxed min-h-[48px]">
                  {plan.description}
                </p>

                {/* Highlights / Inclusions */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-[10px] uppercase font-bold text-[#C59B27] tracking-wider block">
                    Inclusions &amp; Highlights:
                  </span>
                  <ul className="space-y-1.5">
                    {(plan.highlights || []).map((h, i) => (
                      <li key={i} className="text-xs text-white/80 flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#C59B27] shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Simulation & Action */}
              <div className="p-6 pt-0 space-y-4">
                {/* Simulation preview */}
                <div className="bg-[#16100F] rounded-xl p-3 border border-white/5 text-[11px] space-y-1">
                  <div className="text-white/40 uppercase text-[9px] font-bold tracking-wider">
                    {simGuests} Guests × {simNights} Nights Surcharge
                  </div>
                  <div className="flex justify-between items-center text-white font-mono font-bold">
                    <span>+${simTotalUsd.toLocaleString()} USD</span>
                    <span className="text-white/60">+KES {simTotalKes.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => openEditModal(plan)}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-[#821124] text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update Rates &amp; Details</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1F1615] border border-[#C59B27]/40 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono text-[#C59B27] uppercase tracking-wider">
                  ID: {editingPlan.id}
                </span>
                <h2 className="text-lg font-serif font-bold text-white">
                  Edit {editingPlan.name}
                </h2>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                  Plan Display Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                    Rate per Person / Day (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={0}
                      step="any"
                      required
                      value={formUsd}
                      onChange={(e) => setFormUsd(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/15 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                    Rate per Person / Day (KES)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={formKes}
                    onChange={(e) => setFormKes(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                  Plan Description
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              {/* Inclusions / Highlights builder */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27]">
                  Included Perks &amp; Highlights
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Daily clifftop harbour breakfast"
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addHighlightItem();
                      }
                    }}
                    className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                  <button
                    type="button"
                    onClick={addHighlightItem}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  {formHighlights.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 text-xs text-white/80"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => removeHighlightItem(idx)}
                        className="text-white/40 hover:text-red-400 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-xl border border-white/20 text-white text-xs font-bold hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Plan Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
