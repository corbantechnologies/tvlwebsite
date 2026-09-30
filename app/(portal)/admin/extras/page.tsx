'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Edit3, Trash2, Check, X, RotateCw, 
  DollarSign, Tag, Car, Gift, Wine, Compass, Eye, EyeOff,
  Image as ImageIcon, Filter, CheckCircle2
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

  const handleDelete = async (ext: Extra) => {
    if (!confirm(`Are you sure you want to delete "${ext.name}"?`)) return;

    setDeletingId(ext.id);
    try {
      const res = await fetch(`/api/extras/${ext.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast.success(`Deleted "${ext.name}"`);
      loadExtras();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete extra');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (ext: Extra) => {
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
    }
  };

  const filtered = extrasList.filter(e => {
    if (categoryFilter === 'all') return true;
    return e.category === categoryFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C59B27]/20">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Guest Enhancements Engine
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
            Extras &amp; Optional Add-ons
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Create and manage optional guest upgrades (transfers, wine, honeymoons, excursions) presented during online booking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadExtras}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-3.5 py-1.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            id="btn-add-extra"
          >
            <Plus className="w-4 h-4 text-[#C59B27]" />
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
                  : 'bg-[#1F1615] text-stone-300 border border-white/10 hover:bg-white/5'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5 text-[#C59B27]" />}
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                categoryFilter === cat.id ? 'bg-black/30 text-white' : 'bg-white/10 text-stone-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Extras Grid or Clean Empty State */}
      {loading ? (
        <div className="p-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
          <RotateCw className="w-4 h-4 animate-spin text-[#C59B27]" />
          <span>Loading extras from database...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-[#1F1615] rounded-xl border border-dashed border-[#C59B27]/30 max-w-xl mx-auto space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#821124]/20 text-[#821124] flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5 text-[#C59B27]" />
          </div>
          <h3 className="font-serif text-lg font-bold text-white">No Extras Created Yet</h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            {categoryFilter !== 'all' 
              ? `There are no extras in the "${CATEGORIES.find(c => c.id === categoryFilter)?.label}" category.`
              : 'The extras catalog is empty. Click below to add your first custom add-on (e.g. VIP Airport Transfer, Champagne, or Honeymoon Setup).'}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#C59B27]" />
            <span>Create First Extra</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(ext => {
            const isDeleting = deletingId === ext.id;

            return (
              <div
                key={ext.id}
                className={`bg-[#1F1615] rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-md ${
                  ext.isActive 
                    ? 'border-[#C59B27]/25 hover:border-[#C59B27]/50' 
                    : 'border-white/10 opacity-75'
                }`}
                id={`extra-card-${ext.id}`}
              >
                {/* Image */}
                <div className="relative aspect-[16/9] w-full bg-stone-900 overflow-hidden border-b border-white/10">
                  {ext.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ext.image}
                      alt={ext.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-600 gap-1">
                      <ImageIcon className="w-8 h-8 opacity-40 text-[#C59B27]" />
                      <span className="text-[10px] text-stone-500 uppercase tracking-widest font-mono">No Image</span>
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] uppercase font-semibold text-[#C59B27] border border-[#C59B27]/40 shadow-xs">
                      {ext.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      ext.isActive 
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-stone-800 text-stone-400'
                    }`}>
                      {ext.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md text-right border border-white/10 shadow-sm">
                    <span className="font-serif font-bold text-sm text-white block">
                      ${ext.priceUsd}
                      <span className="text-[10px] font-sans text-stone-400 font-normal"> / {PRICING_UNITS[ext.pricingUnit]?.split(' ')[1] || ext.pricingUnit}</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#C59B27] block">
                      KES {ext.priceKes.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif text-sm font-bold text-white tracking-tight">
                      {ext.name}
                    </h3>
                    <p className="text-xs text-stone-400 font-light leading-relaxed line-clamp-2 mt-1">
                      {ext.description}
                    </p>
                    <span className="text-[10px] font-mono text-stone-500 block mt-2">
                      Pricing: {PRICING_UNITS[ext.pricingUnit] || ext.pricingUnit}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleActive(ext)}
                      className={`text-[11px] font-medium px-2 py-1 rounded transition-colors cursor-pointer ${
                        ext.isActive 
                          ? 'text-stone-400 hover:text-white' 
                          : 'text-emerald-400 hover:bg-emerald-950/40'
                      }`}
                    >
                      {ext.isActive ? 'Pause' : 'Activate'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(ext)}
                        className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-stone-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        id={`btn-edit-extra-${ext.id}`}
                      >
                        <Edit3 className="w-3 h-3 text-[#C59B27]" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(ext)}
                        disabled={isDeleting}
                        className="p-1 rounded text-stone-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete extra"
                        id={`btn-delete-extra-${ext.id}`}
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

      {/* Modal: Create or Edit Extra */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#1F1615] rounded-xl border border-[#C59B27]/30 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-white">
                  {editingExtra ? `Edit Extra — ${editingExtra.name}` : 'Create New Extra'}
                </h3>
                <p className="text-[11px] text-stone-400">
                  {editingExtra ? 'Modify price, unit, or description' : 'Add a new selectable upgrade for guests during booking'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                  Extra / Upgrade Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Airport Chauffeur Transfer (Alphard)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#16100F] border border-white/15 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#16100F] border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#C59B27]"
                  >
                    <option value="transfer">Airport &amp; SGR Transfer</option>
                    <option value="amenity">Room Setup / Amenity</option>
                    <option value="fnb">Food &amp; Beverage</option>
                    <option value="experience">Dining / Dhow Experience</option>
                    <option value="excursion">Excursion / Tour</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                    Pricing Unit <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={pricingUnit}
                    onChange={(e) => setPricingUnit(e.target.value as any)}
                    className="w-full bg-[#16100F] border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#C59B27]"
                  >
                    <option value="per_booking">Per Booking (Flat Fee)</option>
                    <option value="per_person">Per Person</option>
                    <option value="per_night">Per Night</option>
                    <option value="per_item">Per Item / Bottle</option>
                  </select>
                </div>
              </div>

              {/* Pricing (USD & KES) */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#16100F] rounded-lg border border-white/10">
                <div>
                  <label className="text-[10px] uppercase font-bold text-stone-300 block mb-1">
                    Price USD ($) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-500 font-mono">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={priceUsd}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setPriceUsd(val);
                        if (typeof val === 'number') {
                          setPriceKes(Math.round(val * 130));
                        }
                      }}
                      className="w-full bg-black/40 border border-white/15 rounded-lg pl-7 pr-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-stone-300 block mb-1">
                    Price KES (KES) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-500 font-mono text-[10px]">KES</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      required
                      value={priceKes}
                      onChange={(e) => setPriceKes(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/15 rounded-lg pl-11 pr-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                  Photo / Thumbnail URL
                </label>
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="https://media.tamarind.co.ke/tvl-website-assets/..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full bg-[#16100F] border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#C59B27]"
                  />
                  <div className="p-2 bg-black/30 rounded-lg border border-dashed border-white/10">
                    <MediaDropzone
                      onUploadComplete={(url) => setImage(url)}
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
                  placeholder="Detail what is provided, passenger limits, vehicle models, or vintage details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#16100F] border border-white/15 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#821124] focus:ring-0 bg-stone-900 border-white/20"
                  />
                  <span className="text-xs text-stone-300 font-medium">Active (Visible in Booking Flow)</span>
                </label>

                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[11px] text-stone-400">Sort Order:</span>
                  <input
                    type="number"
                    min="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-16 bg-[#16100F] border border-white/15 rounded px-2 py-1 text-white text-xs text-center"
                  />
                </div>
              </div>

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
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  id="btn-save-extra"
                >
                  {submitting ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-[#C59B27]" />}
                  <span>{editingExtra ? 'Save Changes' : 'Create Extra'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
