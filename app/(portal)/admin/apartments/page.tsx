'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Sparkles, Plus, Trash2, Edit, Save, X, 
  RotateCw, ShieldCheck, Check, Layers, Users, Maximize2, 
  DollarSign, CheckCircle2, AlertCircle, ExternalLink, Loader2,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import MediaDropzone from '@/components/ui/MediaDropzone';

export default function AdminApartmentsPage() {
  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingApt, setEditingApt] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [editGalleryUrl, setEditGalleryUrl] = useState('');

  const loadApartments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/apartments?all=true');
      const data = await res.json();
      if (data.apartments) {
        const sorted = [...data.apartments].sort(
          (a: any, b: any) => (Number(a.rank) || 99) - (Number(b.rank) || 99)
        );
        setApartments(sorted);
      }
    } catch {
      toast.error('Failed to load apartments inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApartments();
  }, []);

  // Quick 1-click active/inactive toggle
  const handleToggleActive = async (apt: any) => {
    const nextState = apt.isActive === false ? true : false;
    setTogglingId(apt.id);
    try {
      const res = await fetch(`/api/apartments/${apt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextState })
      });
      if (res.ok) {
        toast.success(`${apt.name} is now ${nextState ? 'Active (Live on Website)' : 'Inactive / Draft (Hidden from Public)'}`);
        setApartments(prev => prev.map(a => a.id === apt.id ? { ...a, isActive: nextState } : a));
      } else {
        toast.error('Failed to update apartment status');
      }
    } catch {
      toast.error('Network error updating status');
    } finally {
      setTogglingId(null);
    }
  };

  // Quick inline rank updater
  const handleQuickRankChange = async (aptId: string, newRank: number) => {
    try {
      const res = await fetch(`/api/apartments/${aptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rank: newRank })
      });
      if (res.ok) {
        toast.success(`Display order rank set to #${newRank}`);
        setApartments(prev =>
          prev.map(a => a.id === aptId ? { ...a, rank: newRank } : a)
              .sort((a, b) => (Number(a.rank) || 99) - (Number(b.rank) || 99))
        );
      } else {
        toast.error('Failed to update rank');
      }
    } catch {
      toast.error('Network error updating rank');
    }
  };

  // Quick inline discount updater
  const handleQuickDiscountChange = async (aptId: string, newDiscount: number) => {
    try {
      const res = await fetch(`/api/apartments/${aptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountPercentage: newDiscount })
      });
      if (res.ok) {
        toast.success(`Promotional discount set to ${newDiscount}%`);
        setApartments(prev =>
          prev.map(a => a.id === aptId ? { ...a, discountPercentage: newDiscount } : a)
        );
      } else {
        toast.error('Failed to update discount');
      }
    } catch {
      toast.error('Network error updating discount');
    }
  };

  // Form state for creating a new apartment
  const [newApt, setNewApt] = useState<any>({
    id: '',
    name: '',
    viewType: 'Ocean View',
    rank: 1,
    discountPercentage: 0,
    pricePerNight: 213,
    pricePerNightKes: 27500,
    size: '85 m²',
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    bedConfig: '1 King Bed',
    image: 'https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--2.jpg',
    gallery: [] as string[],
    description: '',
    profitroomRoomId: '',
    isActive: true,
    highlights: ['Panoramic ocean & harbour views', 'Fully equipped chef kitchen', 'Private balcony with daybed'],
    amenities: ['Air Conditioning', 'Free High-Speed Wi-Fi', 'Room Service Dining', 'Daily Housekeeping', 'Smart TV']
  });

  // Handle Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApt.name) {
      toast.error('Please enter a suite name');
      return;
    }

    setCreating(true);
    const aptId = newApt.id.trim() || newApt.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const payload = {
      ...newApt,
      id: aptId,
      rank: Number(newApt.rank) || 0,
      discountPercentage: Number(newApt.discountPercentage) || 0,
      pricePerNight: Number(newApt.pricePerNight) || 0,
      pricePerNightKes: Number(newApt.pricePerNightKes) || 0,
      bedrooms: Number(newApt.bedrooms) || 1,
      bathrooms: Number(newApt.bathrooms) || 1,
      maxGuests: Number(newApt.maxGuests) || 2,
      gallery: Array.isArray(newApt.gallery) ? newApt.gallery : [],
      isActive: newApt.isActive !== false
    };

    try {
      const res = await fetch('/api/apartments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(`Suite ${newApt.name} created successfully!`);
        setShowCreateModal(false);
        loadApartments();
      } else {
        toast.error('Failed to create suite');
      }
    } catch {
      toast.error('Network error creating suite');
    } finally {
      setCreating(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt) return;

    setUpdating(true);
    const payload = {
      ...editingApt,
      rank: Number(editingApt.rank) || 0,
      discountPercentage: Number(editingApt.discountPercentage) || 0,
      pricePerNight: Number(editingApt.pricePerNight) || 0,
      pricePerNightKes: Number(editingApt.pricePerNightKes) || 0,
      bedrooms: Number(editingApt.bedrooms) || 1,
      bathrooms: Number(editingApt.bathrooms) || 1,
      maxGuests: Number(editingApt.maxGuests) || 2,
      gallery: Array.isArray(editingApt.gallery) ? editingApt.gallery : [],
      isActive: editingApt.isActive !== false
    };

    try {
      const res = await fetch(`/api/apartments/${editingApt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(`Suite ${editingApt.name} updated successfully!`);
        setEditingApt(null);
        loadApartments();
      } else {
        toast.error('Failed to update suite');
      }
    } catch {
      toast.error('Network error updating suite');
    } finally {
      setUpdating(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${name}?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/apartments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`${name} removed.`);
        setApartments(prev => prev.filter(a => a.id !== id));
      } else {
        toast.error('Failed to delete suite');
      }
    } catch {
      toast.error('Network error deleting suite');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#821124] font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" /> Suites &amp; Residences Master Config
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Apartment Inventory &amp; Live Rates
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Database-backed serviced residences, specifications, imagery, and Direct Booking PMS management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadApartments}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh Inventory"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add New Suite</span>
          </button>
        </div>
      </div>

      {/* Apartments Single Cards List */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs space-y-2 bg-white rounded-xl border border-slate-200 shadow-xs">
          <RotateCw className="w-6 h-6 animate-spin mx-auto text-[#821124]" />
          <p>Loading serviced suites from database...</p>
        </div>
      ) : apartments.length === 0 ? (
        <div className="p-16 text-center text-slate-500 space-y-3 bg-white rounded-xl border border-dashed border-slate-300 max-w-xl mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-[#821124] flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-900">No Suites Found in Database</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your suites inventory is completely clear. Click below to add your first serviced apartment.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Suite</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {apartments.map((apt) => {
            const isDeleting = deletingId === apt.id;

            return (
              <div
                key={apt.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5">
                  {/* Image Column */}
                  <div className="md:col-span-4 h-48 md:h-full min-h-[220px] rounded-lg overflow-hidden bg-slate-100 relative border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={apt.image}
                      alt={apt.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#821124] text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                        {apt.viewType}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-slate-900 text-[10px] font-mono border border-slate-200">
                        {apt.id}
                      </span>
                    </div>
                  </div>

                  {/* Details Column */}
                  <div className="md:col-span-8 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-serif text-xl font-bold text-slate-900">
                              {apt.name}
                            </h3>
                            {apt.isActive !== false ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active (Public)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Inactive / Draft (Hidden)
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#821124]/10 text-[#821124] border border-[#821124]/20 shadow-xs" title="Arrangement Display Order Rank">
                              Rank #{apt.rank ?? 0}
                            </span>
                            {Number(apt.discountPercentage) > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300 shadow-xs animate-pulse">
                                {apt.discountPercentage}% OFF
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#821124] font-medium block mt-0.5">
                            Tamarind Luxury Serviced Suite
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">
                            Nightly Rate
                          </span>
                          {Number(apt.discountPercentage) > 0 ? (
                            <div>
                              <span className="text-xs text-slate-400 line-through mr-1">${apt.pricePerNight}</span>
                              <span className="text-xl font-serif font-bold text-rose-700">
                                ${Math.round(apt.pricePerNight * (1 - Number(apt.discountPercentage) / 100))}
                              </span>
                              <span className="text-xs text-slate-500 font-sans font-normal"> / night</span>
                            </div>
                          ) : (
                            <div className="text-xl font-serif font-bold text-slate-900">
                              ${apt.pricePerNight}
                              <span className="text-xs text-slate-500 font-sans font-normal"> / night</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mt-2.5 leading-relaxed line-clamp-2">
                        {apt.description}
                      </p>

                      {/* Specs Grid */}
                      <div className="grid grid-cols-4 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs mt-3">
                        <div className="text-center">
                          <span className="text-slate-500 text-[9px] block uppercase tracking-wider">Size</span>
                          <strong className="text-slate-900 font-mono text-[11px]">{apt.size}</strong>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-500 text-[9px] block uppercase tracking-wider">Beds</span>
                          <strong className="text-slate-900 text-[11px]">{apt.bedrooms} Bed</strong>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-500 text-[9px] block uppercase tracking-wider">Baths</span>
                          <strong className="text-slate-900 text-[11px]">{apt.bathrooms} Bath</strong>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-500 text-[9px] block uppercase tracking-wider">Guests</span>
                          <strong className="text-[#821124] text-[11px]">Max {apt.maxGuests}</strong>
                        </div>
                      </div>

                      {/* Highlights */}
                      {apt.highlights && apt.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {apt.highlights.map((hl: string, idx: number) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                              {hl}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={`/apartments/${apt.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#821124] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Preview Public Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <div className="flex items-center gap-2">
                        {/* Inline Rank Selector */}
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200" title="Arrangement Display Order Rank (1 appears first)">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rank</span>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            defaultValue={apt.rank ?? 0}
                            key={`rank-${apt.id}-${apt.rank}`}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              if (val !== (apt.rank ?? 0)) {
                                handleQuickRankChange(apt.id, val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-11 h-6 text-xs text-center font-bold text-[#821124] bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#821124] focus:outline-none"
                          />
                        </div>

                        {/* Inline Discount Control */}
                        <div className="flex items-center gap-1.5 bg-rose-50/60 px-2 py-1 rounded-lg border border-rose-200" title="Promotional Discount % (0 for none)">
                          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Disc%</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            defaultValue={apt.discountPercentage ?? 0}
                            key={`disc-${apt.id}-${apt.discountPercentage}`}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              if (val !== (apt.discountPercentage ?? 0)) {
                                handleQuickDiscountChange(apt.id, val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-11 h-6 text-xs text-center font-bold text-rose-700 bg-white border border-rose-300 rounded focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(apt)}
                          disabled={togglingId === apt.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border ${
                            apt.isActive !== false
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                          title={apt.isActive !== false ? 'Click to make Inactive (hidden from public)' : 'Click to make Active (visible to public)'}
                        >
                          {togglingId === apt.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <span className={`w-2 h-2 rounded-full ${apt.isActive !== false ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          )}
                          <span>{apt.isActive !== false ? 'Active' : 'Inactive'}</span>
                        </button>

                        <button
                          onClick={() => {
                            const cloned = JSON.parse(JSON.stringify(apt));
                            cloned.gallery = Array.isArray(cloned.gallery) ? cloned.gallery : [];
                            setEditingApt(cloned);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200"
                        >
                          <Edit className="w-3 h-3 text-slate-500" />
                          <span>Edit Suite</span>
                        </button>

                        <button
                          onClick={() => handleDelete(apt.id, apt.name)}
                          disabled={isDeleting}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors disabled:opacity-50"
                          title="Delete Suite"
                        >
                          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE SUITE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl relative text-slate-900 space-y-4 my-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">Add New Serviced Residence</h2>
              <p className="text-xs text-slate-500">Configure suite metadata, specifications, and live Profitroom mapping.</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
              {/* Status / Visibility Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-900 cursor-pointer" htmlFor="create-is-active">
                      Suite Status (Public Visibility)
                    </label>
                    {newApt.isActive !== false ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-md">
                        ● Active (Live)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-md">
                        ○ Inactive / Test Unit (Hidden)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {newApt.isActive !== false
                      ? 'Visible to public guests on the website and available in the booking engine.'
                      : 'Hidden from public visitors. You can safely test booking flows without public guests seeing this apartment.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    id="create-is-active"
                    type="checkbox"
                    checked={newApt.isActive !== false}
                    onChange={(e) => setNewApt({ ...newApt, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Suite Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4 Bedroom Executive Harbour Villa"
                    value={newApt.name}
                    onChange={(e) => setNewApt({ ...newApt, name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unique Slug / ID</label>
                  <input
                    type="text"
                    placeholder="auto-generated from name if blank"
                    value={newApt.id}
                    onChange={(e) => setNewApt({ ...newApt, id: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min="1"
                    value={newApt.bedrooms ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewApt({ ...newApt, bedrooms: val === '' ? '' : Number(val) });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={newApt.bathrooms ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewApt({ ...newApt, bathrooms: val === '' ? '' : Number(val) });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Guests</label>
                  <input
                    type="number"
                    min="1"
                    value={newApt.maxGuests ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewApt({ ...newApt, maxGuests: val === '' ? '' : Number(val) });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Size (m²)</label>
                  <input
                    type="text"
                    value={newApt.size}
                    onChange={(e) => setNewApt({ ...newApt, size: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Base Price (USD)</label>
                  <input
                    type="number"
                    value={newApt.pricePerNight ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewApt({ ...newApt, pricePerNight: val === '' ? '' : Number(val) });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Base Price (KES)</label>
                  <input
                    type="number"
                    value={newApt.pricePerNightKes ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewApt({ ...newApt, pricePerNightKes: val === '' ? '' : Number(val) });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#821124] mb-1">Display Rank</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={newApt.rank ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewApt({ ...newApt, rank: val === '' ? '' : Number(val) });
                    }}
                    className="w-full bg-white border border-[#821124]/30 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono font-bold focus:ring-1 focus:ring-[#821124]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-rose-700 mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={newApt.discountPercentage ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewApt({ ...newApt, discountPercentage: val === '' ? '' : Number(val) });
                    }}
                    className="w-full bg-white border border-rose-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono font-bold focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">View Type</label>
                <input
                  type="text"
                  placeholder="e.g. Panoramic Ocean &amp; Harbour View"
                  value={newApt.viewType}
                  onChange={(e) => setNewApt({ ...newApt, viewType: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Comprehensive description of residence layout, Swahili furniture, balconies, etc."
                  value={newApt.description}
                  onChange={(e) => setNewApt({ ...newApt, description: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>

              {/* Media Library Drag and Drop Media Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Main Cover Photo (Featured Image)
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <MediaDropzone
                    folder="apartments"
                    currentUrl={newApt.image}
                    onUploadComplete={(url) => setNewApt({ ...newApt, image: url })}
                  />
                </div>
              </div>

              {/* Gallery Photos Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#821124]" />
                      <span>Additional Gallery Photos</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Upload multiple images for the suite carousel (bedroom, living room, terrace, bath).
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                    {(newApt.gallery || []).length} photos
                  </span>
                </div>

                {/* Thumbnails Grid */}
                {(newApt.gallery || []).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    {newApt.gallery.map((imgUrl: string, idx: number) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[4/3] bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          <button
                            type="button"
                            title="Set as Main Cover Photo"
                            onClick={() => {
                              const oldMain = newApt.image;
                              const updatedGallery = newApt.gallery.filter((_: any, i: number) => i !== idx);
                              if (oldMain) updatedGallery.unshift(oldMain);
                              setNewApt({ ...newApt, image: imgUrl, gallery: updatedGallery });
                              toast.success('Promoted to main cover image');
                            }}
                            className="px-2 py-1 rounded bg-white text-slate-900 text-[10px] font-bold hover:bg-slate-100 cursor-pointer"
                          >
                            Cover
                          </button>
                          <button
                            type="button"
                            title="Remove Photo"
                            onClick={() => {
                              const updatedGallery = newApt.gallery.filter((_: any, i: number) => i !== idx);
                              setNewApt({ ...newApt, gallery: updatedGallery });
                              toast.success('Removed from gallery');
                            }}
                            className="p-1 rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload to Gallery Dropzone */}
                <div>
                  <MediaDropzone
                    folder="apartments/gallery"
                    label="Upload photo to suite gallery"
                    onUploadComplete={(url) => {
                      const existing = Array.isArray(newApt.gallery) ? newApt.gallery : [];
                      setNewApt({ ...newApt, gallery: [...existing, url] });
                      toast.success('Photo added to gallery!');
                    }}
                  />
                </div>

                {/* Add by Direct URL */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Or paste direct image URL (https://...)"
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newGalleryUrl.trim()) return;
                      const existing = Array.isArray(newApt.gallery) ? newApt.gallery : [];
                      setNewApt({ ...newApt, gallery: [...existing, newGalleryUrl.trim()] });
                      setNewGalleryUrl('');
                      toast.success('Photo added to gallery!');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#821124] text-white text-xs font-semibold shrink-0 hover:bg-[#680e1c] cursor-pointer"
                  >
                    + Add to Gallery
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Create Residence</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SUITE MODAL */}
      {editingApt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl relative text-slate-900 space-y-4 my-8">
            <button
              onClick={() => setEditingApt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">Edit Suite Details: {editingApt.name}</h2>
              <p className="text-xs text-slate-500">Modify specifications, base rates, imagery, and Profitroom PMS link.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
              {/* Status / Visibility Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-900 cursor-pointer" htmlFor="edit-is-active">
                      Suite Status (Public Visibility)
                    </label>
                    {editingApt.isActive !== false ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-md">
                        ● Active (Live)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-md">
                        ○ Inactive / Test Unit (Hidden)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {editingApt.isActive !== false
                      ? 'Visible to public guests on the website and available in the booking engine.'
                      : 'Hidden from public visitors. You can safely test booking flows without public guests seeing this apartment.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    id="edit-is-active"
                    type="checkbox"
                    checked={editingApt.isActive !== false}
                    onChange={(e) => setEditingApt({ ...editingApt, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Suite Name *</label>
                  <input
                    type="text"
                    required
                    value={editingApt.name}
                    onChange={(e) => setEditingApt({ ...editingApt, name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">View Type</label>
                  <input
                    type="text"
                    value={editingApt.viewType || ''}
                    onChange={(e) => setEditingApt({ ...editingApt, viewType: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min="1"
                    value={editingApt.bedrooms ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingApt({ ...editingApt, bedrooms: val === '' ? '' : Number(val) });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={editingApt.bathrooms ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingApt({ ...editingApt, bathrooms: val === '' ? '' : Number(val) });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Guests</label>
                  <input
                    type="number"
                    min="1"
                    value={editingApt.maxGuests ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingApt({ ...editingApt, maxGuests: val === '' ? '' : Number(val) });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Size</label>
                  <input
                    type="text"
                    value={editingApt.size}
                    onChange={(e) => setEditingApt({ ...editingApt, size: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Base Price (USD)</label>
                  <input
                    type="number"
                    value={editingApt.pricePerNight ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingApt({ ...editingApt, pricePerNight: val === '' ? '' : Number(val) });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Base Price (KES)</label>
                  <input
                    type="number"
                    value={editingApt.pricePerNightKes ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingApt({ ...editingApt, pricePerNightKes: val === '' ? '' : Number(val) });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#821124] mb-1">Display Rank</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={editingApt.rank ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingApt({ ...editingApt, rank: val === '' ? '' : Number(val) });
                    }}
                    className="w-full bg-white border border-[#821124]/30 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono font-bold focus:ring-1 focus:ring-[#821124]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-rose-700 mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={editingApt.discountPercentage ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingApt({ ...editingApt, discountPercentage: val === '' ? '' : Number(val) });
                    }}
                    className="w-full bg-white border border-rose-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono font-bold focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingApt.description}
                  onChange={(e) => setEditingApt({ ...editingApt, description: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>

              {/* Media Library Drag and Drop Media Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Main Cover Photo (Featured Image)
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <MediaDropzone
                    folder="apartments"
                    currentUrl={editingApt.image}
                    onUploadComplete={(url) => setEditingApt({ ...editingApt, image: url })}
                  />
                </div>
              </div>

              {/* Gallery Photos Section in Edit Modal */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#821124]" />
                      <span>Additional Gallery Photos</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Upload multiple images for the suite carousel (bedroom, living room, terrace, bath).
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                    {(editingApt.gallery || []).length} photos
                  </span>
                </div>

                {/* Thumbnails Grid */}
                {(editingApt.gallery || []).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    {editingApt.gallery.map((imgUrl: string, idx: number) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[4/3] bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          <button
                            type="button"
                            title="Set as Main Cover Photo"
                            onClick={() => {
                              const oldMain = editingApt.image;
                              const updatedGallery = editingApt.gallery.filter((_: any, i: number) => i !== idx);
                              if (oldMain) updatedGallery.unshift(oldMain);
                              setEditingApt({ ...editingApt, image: imgUrl, gallery: updatedGallery });
                              toast.success('Promoted to main cover image');
                            }}
                            className="px-2 py-1 rounded bg-white text-slate-900 text-[10px] font-bold hover:bg-slate-100 cursor-pointer"
                          >
                            Cover
                          </button>
                          <button
                            type="button"
                            title="Remove Photo"
                            onClick={() => {
                              const updatedGallery = editingApt.gallery.filter((_: any, i: number) => i !== idx);
                              setEditingApt({ ...editingApt, gallery: updatedGallery });
                              toast.success('Removed from gallery');
                            }}
                            className="p-1 rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload to Gallery Dropzone */}
                <div>
                  <MediaDropzone
                    folder="apartments/gallery"
                    label="Upload photo to suite gallery"
                    onUploadComplete={(url) => {
                      const existing = Array.isArray(editingApt.gallery) ? editingApt.gallery : [];
                      setEditingApt({ ...editingApt, gallery: [...existing, url] });
                      toast.success('Photo added to gallery!');
                    }}
                  />
                </div>

                {/* Add by Direct URL */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Or paste direct image URL (https://...)"
                    value={editGalleryUrl}
                    onChange={(e) => setEditGalleryUrl(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!editGalleryUrl.trim()) return;
                      const existing = Array.isArray(editingApt.gallery) ? editingApt.gallery : [];
                      setEditingApt({ ...editingApt, gallery: [...existing, editGalleryUrl.trim()] });
                      setEditGalleryUrl('');
                      toast.success('Photo added to gallery!');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#821124] text-white text-xs font-semibold shrink-0 hover:bg-[#680e1c] cursor-pointer"
                  >
                    + Add to Gallery
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingApt(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
