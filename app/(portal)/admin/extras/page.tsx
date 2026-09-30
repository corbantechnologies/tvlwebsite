'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Edit3, Trash2, Check, X, RotateCw, 
  DollarSign, Tag, Car, Gift, Wine, Compass, Eye, EyeOff 
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
  { id: 'experience', label: 'Dining & Nautical Experiences', icon: Sparkles },
  { id: 'excursion', label: 'Excursions & Tours', icon: Compass },
];

const PRICING_UNITS: Record<string, string> = {
  per_booking: 'Per Booking (Flat)',
  per_person: 'Per Person',
  per_night: 'Per Night',
  per_item: 'Per Item',
};

const DEFAULT_EXTRAS: Extra[] = [
  {
    id: 'ext_default_1',
    name: 'Moi International Airport (MBA) Transfer — Executive Sedan',
    description: 'Chauffeured private air-conditioned sedan transfer from Mombasa Airport directly to Tamarind Village clifftop lobby (up to 3 guests with luggage).',
    category: 'transfer',
    priceUsd: 35,
    priceKes: 4500,
    pricingUnit: 'per_booking',
    image: 'https://media.tamarind.co.ke/tvl-website-assets/transfer_sedan.jpg',
    isActive: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ext_default_2',
    name: 'Mombasa SGR Terminus Shuttle — Executive Van',
    description: 'Direct chauffeured transfer from Mombasa Miritini SGR railway station for families or groups (up to 7 passengers with luggage).',
    category: 'transfer',
    priceUsd: 50,
    priceKes: 6500,
    pricingUnit: 'per_booking',
    image: 'https://media.tamarind.co.ke/tvl-website-assets/transfer_van.jpg',
    isActive: true,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ext_default_3',
    name: 'Romantic Honeymoon & Anniversary Suite Setup',
    description: 'Hand-picked tropical bougainvillea flower arrangement, chilled sparkling champagne on arrival, and artisanal Swahili chocolates in-suite.',
    category: 'amenity',
    priceUsd: 65,
    priceKes: 8500,
    pricingUnit: 'per_booking',
    image: 'https://media.tamarind.co.ke/tvl-website-assets/honeymoon_setup.jpg',
    isActive: true,
    sortOrder: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ext_default_4',
    name: 'Tamarind Signature Chilled Seafood Welcome Platter',
    description: 'Platter of fresh Mombasa oysters, poached prawns, crab claws, and house dips delivered to your veranda at check-in.',
    category: 'fnb',
    priceUsd: 55,
    priceKes: 7200,
    pricingUnit: 'per_booking',
    image: 'https://media.tamarind.co.ke/tvl-website-assets/seafood_platter.jpg',
    isActive: true,
    sortOrder: 4,
    createdAt: new Date().toISOString(),
  },
];

export default function AdminExtrasPage() {
  const [extrasList, setExtrasList] = useState<Extra[]>(DEFAULT_EXTRAS);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'transfer' | 'amenity' | 'excursion' | 'fnb' | 'experience'>('transfer');
  const [priceUsd, setPriceUsd] = useState(0);
  const [priceKes, setPriceKes] = useState(0);
  const [pricingUnit, setPricingUnit] = useState<'per_booking' | 'per_person' | 'per_night' | 'per_item'>('per_booking');
  const [image, setImage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const loadExtras = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/extras?active=false');
      const data = await res.json();
      if (data.success && data.extras && data.extras.length > 0) {
        setExtrasList(data.extras);
      } else {
        setExtrasList(DEFAULT_EXTRAS);
      }
    } catch {
      console.warn('Using default extras fallback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExtras();
  }, []);

  const openAddModal = () => {
    setName('');
    setDescription('');
    setCategory('transfer');
    setPriceUsd(35);
    setPriceKes(4500);
    setPricingUnit('per_booking');
    setImage('');
    setIsActive(true);
    setSortOrder(extrasList.length + 1);
    setShowAddModal(true);
  };

  const openEditModal = (ext: Extra) => {
    setEditingExtra(ext);
    setName(ext.name);
    setDescription(ext.description);
    setCategory(ext.category as any);
    setPriceUsd(ext.priceUsd);
    setPriceKes(ext.priceKes);
    setPricingUnit(ext.pricingUnit as any);
    setImage(ext.image || '');
    setIsActive(ext.isActive);
    setSortOrder(ext.sortOrder);
  };

  const handleCreateExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Extra name is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/extras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          priceUsd: Number(priceUsd),
          priceKes: Number(priceKes),
          pricingUnit,
          image: image.trim() || null,
          isActive,
          sortOrder: Number(sortOrder),
        }),
      });

      if (res.ok) {
        toast.success('Extra added successfully!');
        setShowAddModal(false);
        loadExtras();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to create extra');
      }
    } catch {
      toast.error('Network error creating extra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExtra) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/extras/${editingExtra.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          priceUsd: Number(priceUsd),
          priceKes: Number(priceKes),
          pricingUnit,
          image: image.trim() || null,
          isActive,
          sortOrder: Number(sortOrder),
        }),
      });

      if (res.ok) {
        toast.success('Extra updated successfully!');
        setEditingExtra(null);
        loadExtras();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to update extra');
      }
    } catch {
      toast.error('Network error updating extra');
    } finally {
      setSubmitting(false);
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
        toast.success(`Extra ${!ext.isActive ? 'activated' : 'deactivated'}`);
        loadExtras();
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (ext: Extra) => {
    if (!confirm(`Are you sure you want to deactivate or remove "${ext.name}"?`)) return;
    try {
      const res = await fetch(`/api/extras/${ext.id}?hard=false`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Extra deactivated');
        loadExtras();
      } else {
        toast.error('Failed to remove extra');
      }
    } catch {
      toast.error('Network error removing extra');
    }
  };

  const filteredExtras = extrasList.filter((e) => {
    if (categoryFilter === 'all') return true;
    return e.category === categoryFilter;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Guest Enhancements &amp; Add-ons
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Extras &amp; Optional Add-ons
          </h1>
          <p className="text-xs text-white/60">
            Create and manage optional guest upgrades (transfers, wine, honeymoons, excursions) presented during the booking flow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadExtras}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#1F1615] border border-[#C59B27]/25 text-[#C59B27] hover:bg-[#821124] hover:text-white transition-all cursor-pointer"
            title="Refresh Extras"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Extra</span>
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === cat.id
                ? 'bg-[#821124] text-white shadow-md'
                : 'bg-[#1F1615] text-white/70 hover:text-white border border-white/10'
            }`}
          >
            {cat.icon && <cat.icon className="w-3.5 h-3.5" />}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Extras Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExtras.map((ext) => (
          <div
            key={ext.id}
            className={`bg-[#1F1615] rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xl ${
              ext.isActive ? 'border-[#C59B27]/25 hover:border-[#C59B27]/60' : 'border-white/10 opacity-55'
            }`}
          >
            <div>
              {/* Image banner if present */}
              {ext.image && (
                <div className="h-40 w-full overflow-hidden bg-black/40 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ext.image} alt={ext.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1F1615] via-transparent to-transparent" />
                </div>
              )}

              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/10 text-[#C59B27]">
                    {ext.category}
                  </span>
                  <button
                    onClick={() => handleToggleActive(ext)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                      ext.isActive
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-950/60 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {ext.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{ext.isActive ? 'Active' : 'Hidden'}</span>
                  </button>
                </div>

                <div>
                  <h3 className="font-serif text-base font-bold text-white leading-snug">
                    {ext.name}
                  </h3>
                  <p className="text-xs text-white/60 mt-1.5 line-clamp-3 leading-relaxed">
                    {ext.description}
                  </p>
                </div>

                {/* Price block */}
                <div className="bg-black/30 rounded-xl p-3.5 border border-white/5 space-y-0.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-serif font-bold text-[#C59B27]">
                      ${ext.priceUsd} USD
                    </span>
                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                      {PRICING_UNITS[ext.pricingUnit] || ext.pricingUnit}
                    </span>
                  </div>
                  <div className="text-xs text-white/60 font-mono">
                    KES {Number(ext.priceKes).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="p-5 pt-0 flex items-center gap-2 border-t border-white/5 mt-2">
              <button
                onClick={() => openEditModal(ext)}
                className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-[#821124] text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(ext)}
                className="p-2 rounded-xl bg-white/5 hover:bg-red-950/60 text-white/50 hover:text-red-400 border border-white/10 transition-colors cursor-pointer"
                title="Deactivate extra"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal (Add / Edit) */}
      {(showAddModal || editingExtra) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1F1615] border border-[#C59B27]/40 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-serif font-bold text-white">
                {editingExtra ? `Edit: ${editingExtra.name}` : 'Create New Extra'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingExtra(null);
                }}
                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingExtra ? handleUpdateExtra : handleCreateExtra} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                  Extra Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chilled Champagne & Tropical Fruit Platter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  >
                    <option value="transfer">Airport &amp; SGR Transfers</option>
                    <option value="amenity">Room Setup &amp; Amenities</option>
                    <option value="fnb">Food &amp; Beverage</option>
                    <option value="experience">Dining &amp; Nautical Experiences</option>
                    <option value="excursion">Excursions &amp; Tours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                    Pricing Unit
                  </label>
                  <select
                    value={pricingUnit}
                    onChange={(e) => setPricingUnit(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  >
                    <option value="per_booking">Per Booking (Flat Rate)</option>
                    <option value="per_person">Per Person</option>
                    <option value="per_night">Per Night</option>
                    <option value="per_item">Per Item</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={priceUsd}
                    onChange={(e) => setPriceUsd(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                    Price (KES)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={priceKes}
                    onChange={(e) => setPriceKes(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain what is included in this upgrade..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                  Image URL / Asset Path
                </label>
                <input
                  type="text"
                  placeholder="https://media.tamarind.co.ke/tvl-website-assets/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-white/90">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-[#821124]"
                  />
                  <span>Active &amp; selectable by guests on website</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingExtra(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-white/20 text-white text-xs font-bold hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingExtra ? 'Save Changes' : 'Create Extra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
