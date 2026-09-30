'use client';

import React, { useState, useEffect } from 'react';
import { 
  Tag, Sparkles, Plus, Edit3, Trash2, Check, X, RotateCw, 
  DollarSign, Users, Calendar, AlertCircle, Image as ImageIcon,
  CheckCircle2, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import MediaDropzone from '@/components/ui/MediaDropzone';

interface MealPlan {
  id: string;
  name: string;
  shortName: string;
  description: string;
  pricePerPersonPerDayUsd: number;
  pricePerPersonPerDayKes: number;
  image?: string | null;
  highlights: string[];
  isActive: boolean;
  sortOrder: number;
}

export default function AdminMealPlansPage() {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null);

  // Form state
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formUsd, setFormUsd] = useState<number | ''>(0);
  const [formKes, setFormKes] = useState<number | ''>(0);
  const [formImage, setFormImage] = useState('');
  const [formHighlights, setFormHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState<number | ''>(1);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Formula Simulator state
  const [simGuests, setSimGuests] = useState(2);
  const [simNights, setSimNights] = useState(3);
  const [simSelectedPlanId, setSimSelectedPlanId] = useState<string>('');

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/meal-plans?active=false');
      const data = await res.json();
      if (data.success && Array.isArray(data.mealPlans)) {
        setPlans(data.mealPlans);
        if (data.mealPlans.length > 0 && !simSelectedPlanId) {
          setSimSelectedPlanId(data.mealPlans[0].id);
        }
      } else {
        setPlans([]);
      }
    } catch (err: any) {
      console.error('Failed to load meal plans:', err);
      toast.error('Unable to fetch meal plans from database');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormId('');
    setFormName('');
    setFormShortName('');
    setFormDesc('');
    setFormUsd(0);
    setFormKes(0);
    setFormImage('');
    setFormHighlights([]);
    setNewHighlight('');
    setFormIsActive(true);
    setFormSortOrder(plans.length + 1);
    setShowModal(true);
  };

  const openEditModal = (plan: MealPlan) => {
    setEditingPlan(plan);
    setFormId(plan.id);
    setFormName(plan.name);
    setFormShortName(plan.shortName);
    setFormDesc(plan.description);
    setFormUsd(plan.pricePerPersonPerDayUsd);
    setFormKes(plan.pricePerPersonPerDayKes);
    setFormImage(plan.image || '');
    setFormHighlights([...(plan.highlights || [])]);
    setNewHighlight('');
    setFormIsActive(plan.isActive);
    setFormSortOrder(plan.sortOrder || 1);
    setShowModal(true);
  };

  const handleAddHighlight = () => {
    if (!newHighlight.trim()) return;
    setFormHighlights(prev => [...prev, newHighlight.trim()]);
    setNewHighlight('');
  };

  const handleRemoveHighlight = (idx: number) => {
    setFormHighlights(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formShortName.trim()) {
      toast.error('Plan Name and Short Code are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        shortName: formShortName.trim().toUpperCase(),
        description: formDesc.trim(),
        pricePerPersonPerDayUsd: Number(formUsd) || 0,
        pricePerPersonPerDayKes: Number(formKes) || 0,
        image: formImage.trim() || null,
        highlights: formHighlights,
        isActive: formIsActive,
        sortOrder: Number(formSortOrder) || 1,
      };

      if (editingPlan) {
        // PATCH
        const res = await fetch(`/api/meal-plans/${editingPlan.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update plan');
        toast.success(`Updated "${payload.name}" successfully!`);
      } else {
        // POST
        const res = await fetch('/api/meal-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            id: formId.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create plan');
        toast.success(`Created "${payload.name}" successfully!`);
      }

      setShowModal(false);
      loadPlans();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan: MealPlan) => {
    if (!confirm(`Are you sure you want to permanently delete "${plan.name}"?`)) return;

    setDeletingId(plan.id);
    try {
      const res = await fetch(`/api/meal-plans/${plan.id}?hard=true`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast.success(`Deleted "${plan.name}"`);
      loadPlans();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete plan');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (plan: MealPlan) => {
    try {
      const res = await fetch(`/api/meal-plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      if (res.ok) {
        toast.success(`Plan ${plan.isActive ? 'paused' : 'activated'}`);
        loadPlans();
      }
    } catch (e) {
      toast.error('Failed to change status');
    }
  };

  // Selected plan for simulator
  const simPlan = plans.find(p => p.id === simSelectedPlanId) || plans[0];
  const simDailyUsd = simPlan ? simPlan.pricePerPersonPerDayUsd : 0;
  const simDailyKes = simPlan ? simPlan.pricePerPersonPerDayKes : 0;
  const simTotalUsd = simDailyUsd * simGuests * simNights;
  const simTotalKes = simDailyKes * simGuests * simNights;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C59B27]/20">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Tag className="w-3.5 h-3.5" /> Rate &amp; Boarding Engine
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
            Meal Plans &amp; Boarding Packages
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Configure Room Only, Bed &amp; Breakfast, Half Board, and custom meal plans with rates per person per night.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPlans}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh meal plans"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-3.5 py-1.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            id="btn-add-meal-plan"
          >
            <Plus className="w-4 h-4 text-[#C59B27]" />
            <span>Create Meal Plan</span>
          </button>
        </div>
      </div>

      {/* Grid of Meal Plans */}
      {loading ? (
        <div className="p-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
          <RotateCw className="w-4 h-4 animate-spin text-[#C59B27]" />
          <span>Loading meal plans from database...</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="p-12 text-center bg-[#1F1615] rounded-xl border border-dashed border-[#C59B27]/30 max-w-xl mx-auto space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#821124]/20 text-[#821124] flex items-center justify-center mx-auto">
            <Tag className="w-5 h-5 text-[#C59B27]" />
          </div>
          <h3 className="font-serif text-lg font-bold text-white">No Meal Plans Configured</h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            There are currently no meal plans stored in the database. Click below to add your first meal plan (e.g. Room Only, Bed &amp; Breakfast, or Half Board).
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#C59B27]" />
            <span>Add First Meal Plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((p) => {
            const isDeleting = deletingId === p.id;

            return (
              <div
                key={p.id}
                className={`bg-[#1F1615] rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-md ${
                  p.isActive 
                    ? 'border-[#C59B27]/25 hover:border-[#C59B27]/50' 
                    : 'border-white/10 opacity-75'
                }`}
                id={`plan-card-${p.id}`}
              >
                {/* Plan Image Header */}
                <div className="relative aspect-[16/9] w-full bg-stone-900 overflow-hidden border-b border-white/10">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-600 gap-1">
                      <ImageIcon className="w-8 h-8 opacity-40 text-[#C59B27]" />
                      <span className="text-[10px] text-stone-500 uppercase tracking-widest font-mono">No Image Added</span>
                    </div>
                  )}

                  {/* Badges on Image */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[11px] font-mono font-bold text-[#C59B27] border border-[#C59B27]/40 shadow-xs">
                      {p.shortName}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      p.isActive 
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-stone-800 text-stone-400'
                    }`}>
                      {p.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md text-right border border-white/10 shadow-sm">
                    <span className="font-serif font-bold text-sm text-white block">
                      ${p.pricePerPersonPerDayUsd}
                      <span className="text-[10px] font-sans text-stone-400 font-normal"> / adult / night</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#C59B27] block">
                      KES {p.pricePerPersonPerDayKes.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Plan Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif text-base font-bold text-white tracking-tight">
                      {p.name}
                    </h3>
                    <p className="text-xs text-stone-400 font-light leading-relaxed line-clamp-2">
                      {p.description}
                    </p>

                    {/* Highlights */}
                    <div className="pt-2 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                        Included Inclusions:
                      </span>
                      {p.highlights && p.highlights.length > 0 ? (
                        p.highlights.slice(0, 3).map((h, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-stone-300">
                            <Check className="w-3.5 h-3.5 text-[#C59B27] shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{h}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[11px] text-stone-500 italic block">No specific bullet inclusions.</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        p.isActive 
                          ? 'text-stone-400 hover:text-white hover:bg-white/5' 
                          : 'text-emerald-400 hover:bg-emerald-950/40'
                      }`}
                    >
                      {p.isActive ? 'Pause' : 'Activate'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(p)}
                        className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-stone-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        id={`btn-edit-plan-${p.id}`}
                      >
                        <Edit3 className="w-3 h-3 text-[#C59B27]" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={isDeleting}
                        className="p-1 rounded text-stone-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete meal plan"
                        id={`btn-delete-plan-${p.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Formula Calculator Simulator */}
      {plans.length > 0 && (
        <div className="p-4 sm:p-5 bg-[#1F1615] rounded-xl border border-[#C59B27]/25 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#C59B27] tracking-wider block">Formula Simulator</span>
              <h3 className="font-serif text-sm font-bold text-white">Live Booking Total Preview</h3>
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              Formula: (Meal Plan Rate × Total Guests × Nights)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div>
              <label className="text-[10px] text-stone-400 uppercase font-semibold block mb-1">Select Plan:</label>
              <select
                value={simSelectedPlanId}
                onChange={(e) => setSimSelectedPlanId(e.target.value)}
                className="w-full bg-[#16100F] border border-white/15 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#C59B27]"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (${p.pricePerPersonPerDayUsd})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-stone-400 uppercase font-semibold block mb-1">Total Guests:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={simGuests}
                onChange={(e) => setSimGuests(Math.max(1, Number(e.target.value)))}
                className="w-full bg-[#16100F] border border-white/15 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-400 uppercase font-semibold block mb-1">Nights:</label>
              <input
                type="number"
                min="1"
                max="30"
                value={simNights}
                onChange={(e) => setSimNights(Math.max(1, Number(e.target.value)))}
                className="w-full bg-[#16100F] border border-white/15 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#C59B27]"
              />
            </div>

            <div className="p-2.5 bg-[#16100F] rounded-lg border border-[#C59B27]/30 flex flex-col justify-center">
              <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold block">Calculated Meal Add-on</span>
              <span className="font-serif font-bold text-sm text-white">
                ${simTotalUsd.toLocaleString()} USD
              </span>
              <span className="text-[10px] font-mono text-[#C59B27]">
                KES {simTotalKes.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Meal Plan */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#1F1615] rounded-xl border border-[#C59B27]/30 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-white">
                  {editingPlan ? `Edit Meal Plan — ${editingPlan.shortName}` : 'Create New Meal Plan'}
                </h3>
                <p className="text-[11px] text-stone-400">
                  {editingPlan ? 'Update rates, image, and inclusions' : 'Add a new meal plan tier to the booking engine'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                    Plan Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stay & Dine — Half Board Deal"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#16100F] border border-white/15 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                    Short Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HB"
                    maxLength={6}
                    value={formShortName}
                    onChange={(e) => setFormShortName(e.target.value.toUpperCase())}
                    className="w-full bg-[#16100F] border border-white/15 rounded-lg px-3 py-2 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#C59B27] uppercase"
                  />
                </div>
              </div>

              {/* Pricing (USD & KES) */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#16100F] rounded-lg border border-white/10">
                <div>
                  <label className="text-[10px] uppercase font-bold text-stone-300 block mb-1">
                    Rate USD / Person / Night <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-500 font-mono">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={formUsd}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setFormUsd(val);
                        // Auto-calculate rough KES if KES is 0 or unedited (exchange ~130)
                        if (typeof val === 'number') {
                          setFormKes(Math.round(val * 130));
                        }
                      }}
                      className="w-full bg-black/40 border border-white/15 rounded-lg pl-7 pr-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-stone-300 block mb-1">
                    Rate KES / Person / Night <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-500 font-mono text-[10px]">KES</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      required
                      value={formKes}
                      onChange={(e) => setFormKes(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/15 rounded-lg pl-11 pr-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                </div>
              </div>

              {/* Image Input & Dropzone */}
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                  Cover Image URL
                </label>
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="https://media.tamarind.co.ke/tvl-website-assets/..."
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full bg-[#16100F] border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#C59B27]"
                  />
                  <div className="p-2 bg-black/30 rounded-lg border border-dashed border-white/10">
                    <span className="text-[10px] text-stone-400 block mb-1">Or drag &amp; drop an image file:</span>
                    <MediaDropzone
                      onUploadComplete={(url) => setFormImage(url)}
                      maxFiles={1}
                      accept="image/*"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain what is included in this boarding package..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-[#16100F] border border-white/15 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              {/* Highlights list */}
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                  Included Inclusions / Highlights
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Daily clifftop harbour breakfast"
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddHighlight();
                        }
                      }}
                      className="flex-1 bg-[#16100F] border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#C59B27]"
                    />
                    <button
                      type="button"
                      onClick={handleAddHighlight}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {formHighlights.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {formHighlights.map((hl, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 bg-black/40 rounded border border-white/10 text-xs text-stone-300">
                          <span className="truncate">{hl}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveHighlight(i)}
                            className="text-stone-400 hover:text-red-400 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Sort Order */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#821124] focus:ring-0 bg-stone-900 border-white/20"
                  />
                  <span className="text-xs text-stone-300 font-medium">Active (Visible in Booking Flow)</span>
                </label>

                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[11px] text-stone-400">Sort Order:</span>
                  <input
                    type="number"
                    min="1"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-16 bg-[#16100F] border border-white/15 rounded px-2 py-1 text-white text-xs text-center"
                  />
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  id="btn-save-meal-plan"
                >
                  {saving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-[#C59B27]" />}
                  <span>{editingPlan ? 'Save Changes' : 'Create Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
