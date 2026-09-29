'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, Plus, Trash2, Edit, Save, X, RotateCw, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaDropzone from '@/components/ui/MediaDropzone';
import { ResortPackage } from '@/types';
import { DEFAULT_RESORT_PACKAGES } from '@/lib/data';

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<ResortPackage[]>(DEFAULT_RESORT_PACKAGES);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any | null>(null);

  const [newPkg, setNewPkg] = useState({
    name: '',
    subtitle: '',
    tier: 'Signature',
    nights: 3,
    priceKes: 110000,
    priceUsd: 850,
    description: '',
    heroImage: 'https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--2.jpg',
    isFeatured: true,
  });

  const [inclusionsList, setInclusionsList] = useState<string[]>([
    'Accommodation in Sea View Apartment',
    'Daily Clifftop Harbour Breakfast',
    'Complimentary Tamarind Dhow Sunset Cruise'
  ]);
  const [inclusionInput, setInclusionInput] = useState('');

  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/packages');
      const data = await res.json();
      if (data.packages && data.packages.length > 0) {
        setPackages(data.packages);
      }
    } catch {
      console.warn('Using local default packages');
    } finally {
      setLoading(false);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkg.name) {
      toast.error('Please specify a package name');
      return;
    }

    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPkg, features: inclusionsList }),
      });

      if (res.ok) {
        toast.success('Package added successfully!');
        setShowAddModal(false);
        loadPackages();
      } else {
        toast.error('Failed to create package');
      }
    } catch {
      toast.error('Network error creating package');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPkg) return;

    try {
      const res = await fetch(`/api/packages/${editingPkg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPkg),
      });

      if (res.ok) {
        toast.success('Package updated successfully!');
        setEditingPkg(null);
        loadPackages();
      } else {
        toast.error('Failed to update package');
      }
    } catch {
      toast.error('Network error updating package');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      const res = await fetch(`/api/packages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Package deleted.');
        loadPackages();
      } else {
        toast.error('Failed to delete package');
      }
    } catch {
      toast.error('Network error deleting package');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Tag className="w-3.5 h-3.5" /> Boarding &amp; Curated Stays
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Packages &amp; Special Experiences
          </h1>
          <p className="text-xs text-white/60">
            Create, edit, and organize seasonal packages, honeymoon getaways, and dining combos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPackages}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#1F1615] border border-[#C59B27]/25 text-[#C59B27] hover:bg-[#821124] hover:text-white transition-all cursor-pointer"
            title="Refresh Packages"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Package</span>
          </button>
        </div>
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
                  src={pkg.heroImage || pkg.image || 'https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--2.jpg'}
                  alt={pkg.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1F1615] via-transparent to-transparent" />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#821124] text-white text-[10px] font-bold uppercase tracking-wider shadow">
                  {pkg.tier || pkg.category || 'Package'}
                </div>
              </div>

              <div className="p-5 space-y-3">
                <h3 className="font-serif text-lg font-bold text-white">
                  {pkg.name}
                </h3>
                {pkg.subtitle && (
                  <p className="text-xs text-[#C59B27] font-medium">{pkg.subtitle}</p>
                )}
                <p className="text-xs text-white/70 line-clamp-3">
                  {pkg.description}
                </p>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-white/60">
                    Duration: <strong className="text-white">{pkg.nights || pkg.minimumNights || 1} Nights</strong>
                  </span>
                  <span className="font-bold text-[#C59B27]">
                    ${pkg.priceUsd || pkg.rateUsd || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-black/20 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingPkg({ ...pkg })}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Edit className="w-3 h-3" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => handleDelete(pkg.id, pkg.name)}
                className="p-1.5 text-white/50 hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Remove Package"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Package Modal */}
      {editingPkg && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1F1615] rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-[#C59B27]/40 shadow-2xl relative text-[#FAF6F0] space-y-4 my-8">
            <button
              onClick={() => setEditingPkg(null)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-2xl font-bold text-white">Edit Package Details</h2>

            <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  value={editingPkg.name}
                  onChange={(e) => setEditingPkg({ ...editingPkg, name: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-white/70 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={editingPkg.subtitle || ''}
                  onChange={(e) => setEditingPkg({ ...editingPkg, subtitle: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Price (USD)</label>
                  <input
                    type="number"
                    value={editingPkg.priceUsd ?? editingPkg.rateUsd ?? 0}
                    onChange={(e) => setEditingPkg({ ...editingPkg, priceUsd: parseInt(e.target.value) || 0, rateUsd: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Duration (Nights)</label>
                  <input
                    type="number"
                    value={editingPkg.nights ?? editingPkg.minimumNights ?? 1}
                    onChange={(e) => setEditingPkg({ ...editingPkg, nights: parseInt(e.target.value) || 1, minimumNights: parseInt(e.target.value) || 1 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-white/70 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingPkg.description || ''}
                  onChange={(e) => setEditingPkg({ ...editingPkg, description: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Hero Image (MinIO MAM)</label>
                <MediaDropzone
                  folder="packages"
                  currentUrl={editingPkg.heroImage || editingPkg.image}
                  onUploadComplete={(url) => setEditingPkg({ ...editingPkg, heroImage: url, image: url })}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingPkg(null)}
                  className="px-5 py-2.5 rounded-xl border border-white/20 text-white/70 text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Package Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1F1615] rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-[#C59B27]/40 shadow-2xl relative text-[#FAF6F0] space-y-4 my-8">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-2xl font-bold text-white">Create New Package</h2>

            <form onSubmit={handleCreate} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swahili Honeymoon Extravaganza"
                  value={newPkg.name}
                  onChange={(e) => setNewPkg({ ...newPkg, name: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-white/70 mb-1">Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. 4 Days of Luxury Sailing & Clifftop Seafood"
                  value={newPkg.subtitle}
                  onChange={(e) => setNewPkg({ ...newPkg, subtitle: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Price (USD)</label>
                  <input
                    type="number"
                    value={newPkg.priceUsd}
                    onChange={(e) => setNewPkg({ ...newPkg, priceUsd: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Nights</label>
                  <input
                    type="number"
                    value={newPkg.nights}
                    onChange={(e) => setNewPkg({ ...newPkg, nights: parseInt(e.target.value) || 1 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-white/70 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newPkg.description}
                  onChange={(e) => setNewPkg({ ...newPkg, description: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Hero Image (MinIO MAM)</label>
                <MediaDropzone
                  folder="packages"
                  currentUrl={newPkg.heroImage}
                  onUploadComplete={(url) => setNewPkg({ ...newPkg, heroImage: url })}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/20 text-white/70 text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#821124] text-white text-xs font-bold uppercase tracking-wider"
                >
                  Publish Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
