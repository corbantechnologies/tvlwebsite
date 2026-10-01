'use client';

import React, { useState, useEffect } from 'react';
import { 
  Tag, Plus, Edit3, Trash2, Check, X, RotateCw, 
  DollarSign, Users, Calendar, AlertCircle, Image as ImageIcon,
  CheckCircle2, ArrowRight, Loader2, Sparkles
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
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Formula Simulator state
  const [simGuests, setSimGuests] = useState<number | ''>(2);
  const [simNights, setSimNights] = useState<number | ''>(3);
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
        const res = await fetch(`/api/meal-plans/${editingPlan.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update plan');
        toast.success(`Updated "${payload.name}" successfully!`);
      } else {
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
    setTogglingId(plan.id);
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
    } catch {
      toast.error('Failed to change status');
    } finally {
      setTogglingId(null);
    }
  };

  const simPlan = plans.find(p => p.id === simSelectedPlanId) || plans[0];
  const simDailyUsd = simPlan ? simPlan.pricePerPersonPerDayUsd : 0;
  const simDailyKes = simPlan ? simPlan.pricePerPersonPerDayKes : 0;
  const simTotalUsd = simDailyUsd * Number(simGuests || 1) * Number(simNights || 1);
  const simTotalKes = simDailyKes * Number(simGuests || 1) * Number(simNights || 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#821124] font-bold uppercase tracking-wider mb-1">
            <Tag className="w-3.5 h-3.5" /> Rate &amp; Boarding Engine
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Meal Plans &amp; Boarding Packages
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Room Only, Bed &amp; Breakfast, Half Board, and custom meal plans with rates per person per night.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPlans}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
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
            <Plus className="w-4 h-4 text-white" />
            <span>Create Meal Plan</span>
          </button>
        </div>
      </div>

      {/* Grid of Meal Plans */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2 bg-white rounded-xl border border-slate-200 shadow-xs">
          <RotateCw className="w-4 h-4 animate-spin text-[#821124]" />
          <span>Loading meal plans from database...</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 max-w-xl mx-auto space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-[#821124] flex items-center justify-center mx-auto">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-900">No Meal Plans Configured</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            There are currently no meal plans stored in the database. Click below to add your first meal plan (e.g. Room Only, Bed &amp; Breakfast, or Half Board).
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Meal Plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((p) => {
            const isDeleting = deletingId === p.id;
            const isToggling = togglingId === p.id;

            return (
              <div
                key={p.id}
                className={`bg-white rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  p.isActive 
                    ? 'border-slate-200' 
                    : 'border-slate-200 opacity-60'
                }`}
                id={`plan-card-${p.id}`}
              >
                {/* Plan Image Header */}
                <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden border-b border-slate-200">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                      <ImageIcon className="w-8 h-8 opacity-40 text-slate-400" />
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">No Image Added</span>
                    </div>
                  )}

                  {/* Badges on Image */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-white/90 backdrop-blur-md text-[11px] font-mono font-bold text-slate-900 border border-slate-200 shadow-xs">
                      {p.shortName}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      p.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {p.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded bg-white/95 backdrop-blur-md text-right border border-slate-200 shadow-xs">
                    <span className="font-serif font-bold text-sm text-slate-900 block">
                      ${p.pricePerPersonPerDayUsd}
                      <span className="text-[10px] font-sans text-slate-500 font-normal"> / person / day</span>
                    </span>
                    <span className="text-[10px] font-mono font-medium text-[#821124] block">
                      KES {p.pricePerPersonPerDayKes.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Plan Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif text-base font-bold text-slate-900 tracking-tight">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-2">
                      {p.description || 'Standard meal plan arrangement for Tamarind Village residents.'}
                    </p>

                    {/* Highlights */}
                    <div className="pt-2 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Included Inclusions:
                      </span>
                      {p.highlights && p.highlights.length > 0 ? (
                        p.highlights.slice(0, 3).map((h, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{h}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic block">No specific bullet inclusions.</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleActive(p)}
                      disabled={isToggling}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                        p.isActive 
                          ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' 
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {isToggling ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      <span>{p.isActive ? 'Pause' : 'Activate'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(p)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        id={`btn-edit-plan-${p.id}`}
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={isDeleting}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete meal plan"
                        id={`btn-delete-plan-${p.id}`}
                      >
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" /> : <Trash2 className="w-3.5 h-3.5" />}
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
        <div className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#821124] tracking-wider block">Formula Simulator</span>
              <h3 className="font-serif text-sm font-bold text-slate-900">Live Booking Total Preview</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Formula: (Meal Plan Rate × Total Guests × Nights)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div>
              <label className="text-[10px] text-slate-600 uppercase font-semibold block mb-1">Select Plan:</label>
              <select
                value={simSelectedPlanId}
                onChange={(e) => setSimSelectedPlanId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs focus:outline-none focus:border-[#821124]"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (${p.pricePerPersonPerDayUsd})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-600 uppercase font-semibold block mb-1">Total Guests:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={simGuests ?? ''}
                onChange={(e) => setSimGuests(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs focus:outline-none focus:border-[#821124]"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-600 uppercase font-semibold block mb-1">Nights:</label>
              <input
                type="number"
                min="1"
                max="30"
                value={simNights ?? ''}
                onChange={(e) => setSimNights(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs focus:outline-none focus:border-[#821124]"
              />
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-center text-right">
              <span className="text-[10px] text-slate-500 uppercase font-medium">Estimated Add-on Total</span>
              <span className="font-serif font-bold text-sm text-slate-900">
                ${simTotalUsd}
                <span className="text-xs font-sans text-slate-500 font-normal"> (KES {simTotalKes.toLocaleString()})</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-serif text-lg font-bold text-slate-900">
                {editingPlan ? 'Edit Meal Plan' : 'Create New Meal Plan'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4">
              {/* Name & Short Code */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Plan Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Half Board (Breakfast &amp; Dinner)"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Short Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HB"
                    maxLength={6}
                    value={formShortName}
                    onChange={(e) => setFormShortName(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124] uppercase"
                  />
                </div>
              </div>

              {/* Pricing (USD & KES) */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                    Rate USD / Person / Night <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={formUsd ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setFormUsd(val);
                        if (typeof val === 'number') {
                          setFormKes(Math.round(val * 130));
                        }
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                    Rate KES / Person / Night <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-mono text-[10px]">KES</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={formKes ?? ''}
                      onChange={(e) => setFormKes(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-11 pr-3 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                    />
                  </div>
                </div>
              </div>

              {/* Image Input & Dropzone */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Cover Image URL
                </label>
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="https://media.tamarind.co.ke/tvl-website-assets/..."
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 text-xs focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                  />
                  <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <span className="text-[11px] text-slate-500 font-medium block mb-1.5">Or upload an image file:</span>
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain what is included in this boarding package..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                />
              </div>

              {/* Highlights list */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Inclusions / Highlights
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
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 text-xs focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                    />
                    <button
                      type="button"
                      onClick={handleAddHighlight}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200"
                    >
                      Add
                    </button>
                  </div>

                  {formHighlights.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {formHighlights.map((hl, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                          <span className="truncate">{hl}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveHighlight(i)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
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
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#821124] focus:ring-0 border-slate-300"
                  />
                  <span className="text-xs text-slate-700 font-medium">Active (Visible in Booking Flow)</span>
                </label>

                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs text-slate-500">Sort Order:</span>
                  <input
                    type="number"
                    min="1"
                    value={formSortOrder ?? ''}
                    onChange={(e) => setFormSortOrder(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-xs text-center"
                  />
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  id="btn-save-meal-plan"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-white" />}
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
