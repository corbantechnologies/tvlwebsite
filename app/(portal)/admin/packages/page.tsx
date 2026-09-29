'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, Plus, Trash2, Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaDropzone from '@/components/ui/MediaDropzone';
import { ResortPackage } from '@/types';
import { DEFAULT_RESORT_PACKAGES } from '@/lib/data';

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<ResortPackage[]>(DEFAULT_RESORT_PACKAGES);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New package form state
  const [newPkg, setNewPkg] = useState({
    name: '',
    subtitle: '',
    tier: 'Signature',
    nights: 3,
    priceKes: 110000,
    priceUsd: 850,
    description: '',
    heroImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
    isFeatured: true,
  });

  const [inclusionsList, setInclusionsList] = useState<string[]>([
    'Accommodation in Sea View Apartment',
    'Daily Clifftop Harbour Breakfast',
    'Complimentary Tamarind Dhow Sunset Cruise'
  ]);
  const [inclusionInput, setInclusionInput] = useState('');

  const loadPackages = async () => {
    try {
      const res = await fetch('/api/packages');
      const data = await res.json();
      if (data.packages && data.packages.length > 0) {
        setPackages(data.packages);
      }
    } catch {
      console.warn('Using local default packages');
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const addInclusion = () => {
    if (inclusionInput.trim()) {
      setInclusionsList([...inclusionsList, inclusionInput.trim()]);
      setInclusionInput('');
    }
  };

  const removeInclusion = (idx: number) => {
    setInclusionsList(inclusionsList.filter((_, i) => i !== idx));
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkg.name) {
      toast.error('Please specify a package name.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPkg,
          inclusions: inclusionsList,
        }),
      });

      if (res.ok) {
        toast.success('Curated resort package created successfully!');
        setShowAddModal(false);
        loadPackages();
      } else {
        toast.error('Failed to create package.');
      }
    } catch {
      toast.error('Network error creating package.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this package?')) return;
    try {
      const res = await fetch(`/api/packages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Package deleted.');
        loadPackages();
      } else {
        toast.error('Failed to delete package.');
      }
    } catch {
      toast.error('Network error deleting package.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Tag className="w-3.5 h-3.5" /> Robust Lifestyle Engine
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Curated Resort Packages
          </h1>
          <p className="text-xs text-white/60">
            Create multi-tier experiences bundling stays, Tamarind Dhow sailings, fine dining, and VIP transfers.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Experience Package</span>
        </button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-[#1F1615] rounded-2xl border border-[#C59B27]/25 overflow-hidden shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 w-full bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pkg.heroImage || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef'}
                  alt={pkg.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1F1615] via-transparent to-transparent" />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#821124] text-white text-[10px] font-bold uppercase tracking-wider">
                  {pkg.tier} • {pkg.nights} Nights
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    {pkg.name}
                  </h3>
                  <span className="text-xs text-[#C59B27] font-medium block mt-0.5">
                    {pkg.subtitle}
                  </span>
                </div>

                <div className="text-sm font-bold text-white font-serif">
                  KES {pkg.priceKes?.toLocaleString()} <span className="text-xs text-white/50 font-normal">(${pkg.priceUsd} USD)</span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <span className="text-[10px] uppercase font-bold text-white/50 block">Inclusions:</span>
                  {(pkg.inclusions || []).slice(0, 4).map((inc, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-white/80">
                      <Check className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                      <span className="truncate">{inc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-black/20 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                onClick={() => handleDelete(pkg.id)}
                className="p-2 text-white/50 hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Remove Package"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Package Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1F1615] rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-[#C59B27]/40 shadow-2xl relative text-[#FAF6F0] space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-xl font-bold text-white">
                Create Curated Resort Package
              </h2>
              <p className="text-xs text-white/60">
                Bundle accommodation, romantic dhow cruises, and special dining.
              </p>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                  Package Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swahili Coast &amp; Dhow Experience"
                  value={newPkg.name}
                  onChange={(e) => setNewPkg({ ...newPkg, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 Nights in Sea View Suite + Sunset Dhow Dining"
                  value={newPkg.subtitle}
                  onChange={(e) => setNewPkg({ ...newPkg, subtitle: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Tier
                  </label>
                  <select
                    value={newPkg.tier}
                    onChange={(e) => setNewPkg({ ...newPkg, tier: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  >
                    <option value="Signature">Signature</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Executive">Executive</option>
                    <option value="Seasonal">Seasonal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Nights
                  </label>
                  <input
                    type="number"
                    value={newPkg.nights}
                    onChange={(e) => setNewPkg({ ...newPkg, nights: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Price (KES)
                  </label>
                  <input
                    type="number"
                    value={newPkg.priceKes}
                    onChange={(e) => setNewPkg({ ...newPkg, priceKes: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              {/* Dynamic Inclusions */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                  Package Inclusions
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add item (e.g. VIP Airport Alphard Transfer)"
                    value={inclusionInput}
                    onChange={(e) => setInclusionInput(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addInclusion}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold uppercase"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1">
                  {inclusionsList.map((inc, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-black/30 px-3 py-1 rounded-lg">
                      <span>{inc}</span>
                      <button
                        type="button"
                        onClick={() => removeInclusion(idx)}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <MediaDropzone
                value={newPkg.heroImage}
                onChange={(url) => setNewPkg({ ...newPkg, heroImage: url })}
                folder="packages"
                label="Package Hero Imagery (MinIO)"
                helperText="Drag & drop high-res suite/dhow image or paste MinIO link"
              />

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newPkg.description}
                  onChange={(e) => setNewPkg({ ...newPkg, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                  <span>Save Curated Package</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
