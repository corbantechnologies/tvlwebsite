'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Edit3, Trash2, Check, X, RotateCw, 
  DollarSign, Tag, Car, Gift, Wine, Compass, Eye, EyeOff,
  Image as ImageIcon, Filter, CheckCircle2, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import MediaDropzone from '@/components/ui/MediaDropzone';

interface Extra {
  id: string;
  name: string;
  description: string;
  category: 'transfer' | 'amenity' | 'excursion' | 'fnb' | 'experience' | string;
  priceUsd: number;
  priceKes: number;
  pricingUnit: 'per_booking' | 'per_person' | 'per_night' | 'per_item' | string;
  image?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All Extras' },
  { id: 'transfer', label: 'Airport & SGR Transfers', icon: Car },
  { id: 'amenity', label: 'Room Setups & Amenities', icon: Gift },
  { id: 'fnb', label: 'Food & Beverage', icon: Wine },
  { id: 'experience', label: 'Dining & Experiences', icon: Sparkles },
  { id: 'excursion', label: 'Excursions & Tours', icon: Compass },
];

const PRICING_UNITS: Record<string, string> = {
  per_booking: 'Per Booking (Flat)',
  per_person: 'Per Person',
  per_night: 'Per Night',
  per_item: 'Per Item',
};

export default function AdminExtrasPage() {
  const [extrasList, setExtrasList] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'transfer' | 'amenity' | 'excursion' | 'fnb' | 'experience'>('transfer');
  const [priceUsd, setPriceUsd] = useState<number | ''>(0);
  const [priceKes, setPriceKes] = useState<number | ''>(0);
  const [pricingUnit, setPricingUnit] = useState<'per_booking' | 'per_person' | 'per_night' | 'per_item'>('per_booking');
  const [image, setImage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number | ''>(1);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Extra | null>(null);

  const loadExtras = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/extras?active=false');
      const data = await res.json();
      if (data.success && Array.isArray(data.extras)) {
        setExtrasList(data.extras);
      } else {
        setExtrasList([]);
      }
    } catch (err) {
      console.error('Failed to load extras:', err);
      toast.error('Unable to fetch extras from database');
      setExtrasList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExtras();
  }, []);

  const openCreateModal = () => {
    setEditingExtra(null);
    setName('');
    setDescription('');
    setCategory('transfer');
    setPriceUsd(0);
    setPriceKes(0);
    setPricingUnit('per_booking');
    setImage('');
    setIsActive(true);
    setSortOrder(extrasList.length + 1);
    setShowModal(true);
  };

  const openEditModal = (ext: Extra) => {
    setEditingExtra(ext);
    setName(ext.name);
    setDescription(ext.description || '');
    setCategory(ext.category as any);
    setPriceUsd(ext.priceUsd);
    setPriceKes(ext.priceKes);
    setPricingUnit(ext.pricingUnit as any);
    setImage(ext.image || '');
    setIsActive(ext.isActive);
    setSortOrder(ext.sortOrder || 1);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please provide an extra name');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        category,
        priceUsd: Number(priceUsd) || 0,
        priceKes: Number(priceKes) || 0,
        pricingUnit,
        image: image.trim() || null,
        isActive,
        sortOrder: Number(sortOrder) || 1,
      };

      if (editingExtra) {
        const res = await fetch(`/api/extras/${editingExtra.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update extra');
        toast.success(`Updated "${payload.name}" successfully!`);
      } else {
        const res = await fetch('/api/extras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create extra');
        toast.success(`Created "${payload.name}" successfully!`);
      }

      setShowModal(false);
      loadExtras();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteExtra = async () => {
    if (!itemToDelete) return;

    setDeletingId(itemToDelete.id);
    try {
      const res = await fetch(`/api/extras/${itemToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast.success(`Deleted "${itemToDelete.name}" successfully!`);
      setItemToDelete(null);
      loadExtras();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete extra');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (ext: Extra) => {
    setTogglingId(ext.id);
    try {
      const res = await fetch(`/api/extras/${ext.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !ext.isActive }),
      });
      if (res.ok) {
        toast.success(`Extra ${ext.isActive ? 'paused' : 'activated'}`);
        loadExtras();
      }
    } catch {
      toast.error('Failed to change status');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = extrasList.filter(e => {
    if (categoryFilter === 'all') return true;
    return e.category === categoryFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#821124] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Guest Enhancements Engine
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Extras &amp; Optional Add-ons
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create and manage optional guest upgrades (transfers, wine, honeymoons, excursions) presented during online booking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadExtras}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-3.5 py-1.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            id="btn-add-extra"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create Extra</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const count = cat.id === 'all' 
            ? extrasList.length 
            : extrasList.filter(e => e.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-[#821124] text-white shadow-xs font-semibold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                categoryFilter === cat.id ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Extras Grid or Clean Empty State */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2 bg-white rounded-xl border border-slate-200 shadow-xs">
          <RotateCw className="w-4 h-4 animate-spin text-[#821124]" />
          <span>Loading extras from database...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 max-w-xl mx-auto space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-[#821124] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-900">No Extras Configured</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {categoryFilter !== 'all' 
              ? `There are no extras in the "${CATEGORIES.find(c => c.id === categoryFilter)?.label}" category.`
              : 'The extras catalog is empty. Click below to add your first custom add-on (e.g. VIP Airport Transfer, Champagne, or Honeymoon Setup).'}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Extra</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(ext => {
            const isDeleting = deletingId === ext.id;
            const isToggling = togglingId === ext.id;

            return (
              <div
                key={ext.id}
                className={`bg-white rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  ext.isActive 
                    ? 'border-slate-200' 
                    : 'border-slate-200 opacity-60'
                }`}
                id={`extra-card-${ext.id}`}
              >
                {/* Image */}
                <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden border-b border-slate-200">
                  {ext.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ext.image}
                      alt={ext.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                      <ImageIcon className="w-8 h-8 opacity-40 text-slate-400" />
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">No Image</span>
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-white/90 backdrop-blur-md text-[10px] uppercase font-semibold text-slate-900 border border-slate-200 shadow-xs">
                      {ext.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      ext.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {ext.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded bg-white/95 backdrop-blur-md text-right border border-slate-200 shadow-xs">
                    <span className="font-serif font-bold text-sm text-slate-900 block">
                      ${ext.priceUsd}
                      <span className="text-[10px] font-sans text-slate-500 font-normal"> / {PRICING_UNITS[ext.pricingUnit]?.split(' ')[1] || ext.pricingUnit}</span>
                    </span>
                    <span className="text-[10px] font-mono font-medium text-[#821124] block">
                      KES {ext.priceKes.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif text-sm font-bold text-slate-900 tracking-tight">
                      {ext.name}
                    </h3>
                    <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-2 mt-1">
                      {ext.description || 'Optional guest amenity available upon request.'}
                    </p>
                    <span className="text-[11px] font-mono text-slate-500 block mt-2">
                      Pricing: {PRICING_UNITS[ext.pricingUnit] || ext.pricingUnit}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleActive(ext)}
                      disabled={isToggling}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                        ext.isActive 
                          ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' 
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {isToggling ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      <span>{ext.isActive ? 'Pause' : 'Activate'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(ext)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        id={`btn-edit-extra-${ext.id}`}
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setItemToDelete(ext)}
                        disabled={deletingId === ext.id}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete extra"
                        id={`btn-delete-extra-${ext.id}`}
                      >
                        {deletingId === ext.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create or Edit Extra */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-slate-900">
                  {editingExtra ? `Edit Extra — ${editingExtra.name}` : 'Create New Extra'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingExtra ? 'Modify price, unit, or description' : 'Add a new selectable upgrade for guests during booking'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Extra / Upgrade Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Airport Chauffeur Transfer (Alphard)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-[#821124]"
                  >
                    <option value="transfer">Airport &amp; SGR Transfer</option>
                    <option value="amenity">Room Setup / Amenity</option>
                    <option value="fnb">Food &amp; Beverage</option>
                    <option value="experience">Dining / Dhow Experience</option>
                    <option value="excursion">Excursions &amp; Tours</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Pricing Unit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={pricingUnit}
                    onChange={(e) => setPricingUnit(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-[#821124]"
                  >
                    <option value="per_booking">Per Booking (Flat Fee)</option>
                    <option value="per_person">Per Person</option>
                    <option value="per_night">Per Night</option>
                    <option value="per_item">Per Item / Request</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                    Price USD <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={priceUsd ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setPriceUsd(val);
                        if (typeof val === 'number') {
                          setPriceKes(Math.round(val * 130));
                        }
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                    Price KES <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-mono text-[10px]">KES</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={priceKes ?? ''}
                      onChange={(e) => setPriceKes(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-11 pr-3 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Cover Image URL
                </label>
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="https://media.tamarind.co.ke/tvl-website-assets/..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 text-xs focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                  />
                  <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <span className="text-[11px] text-slate-500 font-medium block mb-1.5">Or upload an image file:</span>
                    <MediaDropzone
                      onUploadComplete={(url) => setImage(url)}
                      maxFiles={1}
                      accept="image/*"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain what the guest receives with this upgrade..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#821124] focus:ring-0 border-slate-300"
                  />
                  <span className="text-xs text-slate-700 font-medium">Active (Visible in Booking Flow)</span>
                </label>

                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs text-slate-500">Sort Order:</span>
                  <input
                    type="number"
                    min="1"
                    value={sortOrder ?? ''}
                    onChange={(e) => setSortOrder(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-xs text-center"
                  />
                </div>
              </div>

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
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  id="btn-save-extra"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-white" />}
                  <span>{editingExtra ? 'Save Changes' : 'Create Extra'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Extra (Modern in-app confirmation replacing browser confirm) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-slate-900">Delete Extra &amp; Add-on</h3>
                <p className="text-xs text-slate-500">Permanent removal from database</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900">&quot;{itemToDelete.name}&quot;</strong>? This item will be removed from all future booking flows immediately.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={confirmDeleteExtra}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deletingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Extra</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
