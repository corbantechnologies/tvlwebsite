'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, 
  X, Save, RotateCw, FileText, Clock, Users, Ban, CreditCard, 
  Check, Eye, EyeOff, Sparkles, MoveVertical
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BookingCondition {
  id: string;
  title: string;
  type: string;
  summary: string;
  content: string;
  badge: string | null;
  isMandatory: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

const CONDITION_TYPES = [
  { id: 'cancellation', label: 'Cancellation & Refund', icon: Clock },
  { id: 'check_in_out', label: 'Check-In & Check-Out', icon: Clock },
  { id: 'occupancy', label: 'Occupancy & Children', icon: Users },
  { id: 'house_rules', label: 'House Rules & Sanctuary', icon: Ban },
  { id: 'payment', label: 'Taxes & Payment', icon: CreditCard },
  { id: 'general', label: 'General Terms', icon: FileText },
];

export default function AdminPoliciesPage() {
  const [conditions, setConditions] = useState<BookingCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCondition, setEditingCondition] = useState<BookingCondition | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState('cancellation');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [badge, setBadge] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);
  const [sortOrder, setSortOrder] = useState<number | ''>(1);
  const [isActive, setIsActive] = useState(true);

  const fetchConditions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/booking-conditions?all=true');
      const data = await res.json();
      if (data.success && data.conditions) {
        setConditions(data.conditions);
      } else {
        setConditions([]);
      }
    } catch {
      toast.error('Failed to load booking conditions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConditions();
  }, []);

  const openAddModal = () => {
    setTitle('');
    setType('cancellation');
    setSummary('');
    setContent('');
    setBadge('48h Free Cancellation');
    setIsMandatory(true);
    setSortOrder(conditions.length + 1);
    setIsActive(true);
    setShowAddModal(true);
  };

  const openEditModal = (c: BookingCondition) => {
    setEditingCondition(c);
    setTitle(c.title);
    setType(c.type);
    setSummary(c.summary);
    setContent(c.content);
    setBadge(c.badge || '');
    setIsMandatory(c.isMandatory);
    setSortOrder(c.sortOrder ?? 0);
    setIsActive(c.isActive);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !content.trim()) {
      toast.error('Please complete title, summary, and detailed content');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/booking-conditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          type,
          summary: summary.trim(),
          content: content.trim(),
          badge: badge.trim() || null,
          isMandatory,
          sortOrder: Number(sortOrder || 0),
          isActive,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Condition created successfully!');
        setShowAddModal(false);
        fetchConditions();
      } else {
        toast.error(data.error || 'Failed to create condition');
      }
    } catch {
      toast.error('Network error creating condition');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCondition) return;
    if (!title.trim() || !summary.trim() || !content.trim()) {
      toast.error('Please complete title, summary, and detailed content');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/booking-conditions/${editingCondition.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          type,
          summary: summary.trim(),
          content: content.trim(),
          badge: badge.trim() || null,
          isMandatory,
          sortOrder: Number(sortOrder || 0),
          isActive,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Condition updated!');
        setEditingCondition(null);
        fetchConditions();
      } else {
        toast.error(data.error || 'Failed to update condition');
      }
    } catch {
      toast.error('Network error updating condition');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (c: BookingCondition) => {
    try {
      const res = await fetch(`/api/booking-conditions/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      if (res.ok) {
        toast.success(c.isActive ? 'Condition deactivated' : 'Condition published to guests');
        setConditions(conditions.map((item) => (item.id === c.id ? { ...item, isActive: !item.isActive } : item)));
      } else {
        toast.error('Failed to toggle status');
      }
    } catch {
      toast.error('Network error updating status');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/booking-conditions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Condition deleted');
        setConditions(conditions.filter((item) => item.id !== id));
      } else {
        toast.error('Failed to delete condition');
      }
    } catch {
      toast.error('Network error deleting condition');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredConditions = conditions.filter(
    (c) => typeFilter === 'all' || c.type === typeFilter
  );

  const activeCount = conditions.filter((c) => c.isActive).length;
  const mandatoryCount = conditions.filter((c) => c.isMandatory && c.isActive).length;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#821124]">
            <ShieldCheck className="w-4 h-4" />
            <span>Guest Terms &amp; Conditions Governance</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
            Booking Conditions &amp; Policies
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Create, edit, and reorder the cancellation guarantees, stay conditions, and house rules shown dynamically to guests during online booking and checkout.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Condition</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Defined Policies</span>
          <p className="font-serif text-2xl font-bold text-slate-900">{conditions.length}</p>
          <span className="text-[10px] text-slate-400">Managed in database</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active on Checkout</span>
          <p className="font-serif text-2xl font-bold text-emerald-600">{activeCount}</p>
          <span className="text-[10px] text-slate-400">Currently visible to guests</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mandatory Acknowledgments</span>
          <p className="font-serif text-2xl font-bold text-[#821124]">{mandatoryCount}</p>
          <span className="text-[10px] text-slate-400">Requires guest consent checkbox</span>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            typeFilter === 'all'
              ? 'bg-[#821124] text-white shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          All Categories ({conditions.length})
        </button>

        {CONDITION_TYPES.map((t) => {
          const count = conditions.filter((c) => c.type === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                typeFilter === t.id
                  ? 'bg-[#821124] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>{t.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${typeFilter === t.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Conditions List */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs space-y-2 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <RotateCw className="w-6 h-6 animate-spin mx-auto text-[#821124]" />
          <p>Loading conditions from database...</p>
        </div>
      ) : filteredConditions.length === 0 ? (
        <div className="p-16 text-center text-slate-500 space-y-4 bg-white rounded-2xl border border-dashed border-slate-300 max-w-xl mx-auto shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-[#821124] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">No Booking Conditions Found</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {typeFilter === 'all'
                ? 'No booking conditions or cancellation policies have been created yet. Click "+ Add Condition" to create one.'
                : `No conditions found in this category.`}
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Condition</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredConditions.map((c) => {
            const isDeleting = deletingId === c.id;

            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl border p-5 space-y-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                  c.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif font-bold text-base text-slate-900">
                          {c.title}
                        </h3>
                        {c.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            {c.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                        Category: {CONDITION_TYPES.find((t) => t.id === c.type)?.label || c.type} · Priority: {c.sortOrder}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleActive(c)}
                        title={c.isActive ? 'Click to deactivate' : 'Click to activate'}
                        className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {c.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Checkout Summary Pill
                    </span>
                    <p className="text-xs text-slate-700 leading-snug font-medium">
                      {c.summary}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Full Legal / Policy Details
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-slate-100 max-h-32 overflow-y-auto scrollbar-thin">
                      {c.content}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {c.isMandatory ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                        <Check className="w-3 h-3" />
                        <span>Mandatory Consent</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                        Advisory
                      </span>
                    )}

                    <span className={`text-[10px] font-semibold ${c.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {c.isActive ? '● Published' : '○ Draft'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(c)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.title)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs cursor-pointer transition-colors disabled:opacity-50"
                      title="Delete condition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#821124]">
                  New Policy Rule
                </span>
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Add Booking Condition
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Condition Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 48-Hour Free Cancellation Guarantee"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  >
                    {CONDITION_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pill Badge (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 48h Guarantee, Smoke-Free"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Summary (Displayed directly on Checkout Card) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cancel without penalty up to 48 hours prior to check-in for a 100% refund."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Detailed Policy Text *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Complete policy clauses, cancellation timelines, penalties, exceptions..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Display Priority
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={sortOrder ?? ''}
                    onChange={(e) => setSortOrder(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="add-mandatory"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#821124] focus:ring-[#821124]"
                  />
                  <label htmlFor="add-mandatory" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Mandatory Consent
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="add-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#821124] focus:ring-[#821124]"
                  />
                  <label htmlFor="add-active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Publish Immediately
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : 'Create Condition'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingCondition && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#821124]">
                  Modify Policy Rule
                </span>
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Edit Booking Condition
                </h3>
              </div>
              <button
                onClick={() => setEditingCondition(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Condition Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  >
                    {CONDITION_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pill Badge (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 48h Guarantee, Smoke-Free"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Summary (Displayed directly on Checkout Card) *
                </label>
                <input
                  type="text"
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Detailed Policy Text *
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Display Priority
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={sortOrder ?? ''}
                    onChange={(e) => setSortOrder(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="edit-mandatory"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#821124] focus:ring-[#821124]"
                  />
                  <label htmlFor="edit-mandatory" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Mandatory Consent
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="edit-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#821124] focus:ring-[#821124]"
                  />
                  <label htmlFor="edit-active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Publish Immediately
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCondition(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : 'Update Condition'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
