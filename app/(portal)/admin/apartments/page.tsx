'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Sparkles, Plus, Trash2, Edit, Save, X, 
  RotateCw, ShieldCheck, Check, Layers, Users, Maximize2, 
  DollarSign, CheckCircle2, AlertCircle, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import MediaDropzone from '@/components/ui/MediaDropzone';
import { useLiveRates } from '@/utils/profitroom';

export default function AdminApartmentsPage() {
  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingApt, setEditingApt] = useState<any | null>(null);

  // Profitroom UpperBooking Live Rates
  const { liveRooms, getLivePrice } = useLiveRates();

  const loadApartments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/apartments');
      const data = await res.json();
      if (data.apartments) {
        setApartments(data.apartments);
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

  // Form state for creating a new apartment
  const [newApt, setNewApt] = useState({
    id: '',
    name: '',
    viewType: 'Ocean View',
    pricePerNight: 213,
    pricePerNightKes: 27500,
    size: '85 m²',
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    bedConfig: '1 King Bed',
    image: 'https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--2.jpg',
    description: '',
    profitroomRoomId: '',
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

    const aptId = newApt.id.trim() || newApt.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
      const res = await fetch('/api/apartments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newApt, id: aptId })
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
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt) return;

    try {
      const res = await fetch(`/api/apartments/${editingApt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingApt)
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
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${name}?`)) return;

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
    }
  };

  // Map apartment to known Profitroom UpperBooking IDs
  const getProfitroomId = (aptId: string) => {
    const clean = aptId.toLowerCase();
    if (clean.includes('1') || clean.includes('one')) return '427573';
    if (clean.includes('2') || clean.includes('two')) return '427575';
    if (clean.includes('3') || clean.includes('three')) return '427577';
    return '427573';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" /> Suites &amp; Residences Master Config
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Apartment Inventory &amp; Live Rates
          </h1>
          <p className="text-xs text-white/60">
            Database-backed serviced residences, specifications, imagery, and Profitroom UpperBooking synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadApartments}
            disabled={loading}
            className="p-2 rounded-lg bg-[#1F1615] border border-[#C59B27]/25 text-[#C59B27] hover:bg-[#821124] hover:text-white transition-all cursor-pointer"
            title="Refresh Inventory"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Suite</span>
          </button>
        </div>
      </div>

      {/* Live Profitroom Sync Banner */}
      <div className="p-3.5 rounded-xl bg-[#1F1615] border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <div>
            <span className="font-bold text-white block">
              Profitroom UpperBooking Live XML Feed Active
            </span>
            <span className="text-white/60 text-[11px]">
              Direct PMS Proxy: wis.upperbooking.com/tamarindvillage/Rooms.xml ({liveRooms.length} room types streaming)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400">
          {liveRooms.map(r => (
            <span key={r.id} className="bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
              {r.name.split(' ')[0]}: ${r.minPrice}
            </span>
          ))}
        </div>
      </div>

      {/* Apartments Single Cards List */}
      {loading ? (
        <div className="py-20 text-center text-white/50 text-xs space-y-2">
          <RotateCw className="w-6 h-6 animate-spin mx-auto text-[#C59B27]" />
          <p>Loading serviced suites from database...</p>
        </div>
      ) : apartments.length === 0 ? (
        <div className="p-16 text-center text-white/40 space-y-3 bg-[#1F1615] rounded-xl border border-[#C59B27]/25">
          <Building2 className="w-10 h-10 mx-auto text-[#C59B27] opacity-30" />
          <p className="text-sm font-semibold text-white">No Suites Found in Database</p>
          <p className="text-xs text-white/50 max-w-md mx-auto">
            Your suites inventory is completely clear. Click below to add your first serviced apartment.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Suite</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {apartments.map((apt) => {
            const { price: livePrice, isLive } = getLivePrice(apt.id, apt.pricePerNight || 200);
            const prId = apt.profitroomRoomId || getProfitroomId(apt.id);

            return (
              <div
                key={apt.id}
                className="bg-[#1F1615] rounded-xl border border-[#C59B27]/25 overflow-hidden shadow-lg"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5">
                  {/* Image Column */}
                  <div className="md:col-span-4 h-48 md:h-full min-h-[200px] rounded-lg overflow-hidden bg-black/40 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={apt.image}
                      alt={apt.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#821124] text-white text-[10px] font-bold uppercase tracking-wider shadow">
                        {apt.viewType}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white/90 text-[10px] font-mono border border-white/20">
                        {apt.id}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        PMS ID: {prId}
                      </span>
                    </div>
                  </div>

                  {/* Details Column */}
                  <div className="md:col-span-8 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-serif text-xl font-bold text-white">
                            {apt.name}
                          </h3>
                          <span className="text-xs text-[#C59B27] font-semibold block mt-0.5">
                            Tamarind Luxury Serviced Suite
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] uppercase font-bold text-[#C59B27] block">
                            {isLive ? 'Live Profitroom' : 'Base Rate'}
                          </span>
                          <div className="text-xl font-serif font-bold text-white">
                            ${isLive ? livePrice : apt.pricePerNight}
                            <span className="text-xs text-white/40 font-sans font-normal"> / night</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-white/70 mt-2.5 leading-relaxed line-clamp-2">
                        {apt.description}
                      </p>

                      {/* Specs Grid */}
                      <div className="grid grid-cols-4 gap-2 p-2.5 rounded-lg bg-black/40 border border-white/10 text-xs mt-3">
                        <div className="text-center">
                          <span className="text-white/40 text-[9px] block uppercase tracking-wider">Size</span>
                          <strong className="text-white font-mono text-[11px]">{apt.size}</strong>
                        </div>
                        <div className="text-center">
                          <span className="text-white/40 text-[9px] block uppercase tracking-wider">Beds</span>
                          <strong className="text-white text-[11px]">{apt.bedrooms} Bed</strong>
                        </div>
                        <div className="text-center">
                          <span className="text-white/40 text-[9px] block uppercase tracking-wider">Baths</span>
                          <strong className="text-white text-[11px]">{apt.bathrooms} Bath</strong>
                        </div>
                        <div className="text-center">
                          <span className="text-white/40 text-[9px] block uppercase tracking-wider">Guests</span>
                          <strong className="text-[#C59B27] text-[11px]">Max {apt.maxGuests}</strong>
                        </div>
                      </div>

                      {/* Highlights */}
                      {apt.highlights && apt.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {apt.highlights.map((hl: string, idx: number) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-stone-300">
                              {hl}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <a
                        href={`/apartments/${apt.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#C59B27] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Preview Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingApt(JSON.parse(JSON.stringify(apt)))}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit Suite</span>
                        </button>

                        <button
                          onClick={() => handleDelete(apt.id, apt.name)}
                          className="p-1.5 text-white/40 hover:text-red-400 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                          title="Delete Suite"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1F1615] rounded-xl max-w-2xl w-full p-6 border border-[#C59B27]/40 shadow-2xl relative text-[#FAF6F0] space-y-4 my-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-xl font-bold text-white">Add New Serviced Residence</h2>
              <p className="text-xs text-white/60">Configure suite metadata, specifications, and live Profitroom mapping.</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#C59B27] mb-1">Suite Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4 Bedroom Executive Harbour Villa"
                    value={newApt.name}
                    onChange={(e) => setNewApt({ ...newApt, name: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#C59B27] mb-1">Unique Slug / ID</label>
                  <input
                    type="text"
                    placeholder="auto-generated from name if blank"
                    value={newApt.id}
                    onChange={(e) => setNewApt({ ...newApt, id: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min="1"
                    value={newApt.bedrooms}
                    onChange={(e) => setNewApt({ ...newApt, bedrooms: parseInt(e.target.value) || 1 })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    min="1"
                    value={newApt.bathrooms}
                    onChange={(e) => setNewApt({ ...newApt, bathrooms: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">Max Guests</label>
                  <input
                    type="number"
                    min="1"
                    value={newApt.maxGuests}
                    onChange={(e) => setNewApt({ ...newApt, maxGuests: parseInt(e.target.value) || 2 })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">Size (m²)</label>
                  <input
                    type="text"
                    value={newApt.size}
                    onChange={(e) => setNewApt({ ...newApt, size: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#C59B27] mb-1">Base Price (USD)</label>
                  <input
                    type="number"
                    value={newApt.pricePerNight}
                    onChange={(e) => setNewApt({ ...newApt, pricePerNight: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">Base Price (KES)</label>
                  <input
                    type="number"
                    value={newApt.pricePerNightKes}
                    onChange={(e) => setNewApt({ ...newApt, pricePerNightKes: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-emerald-400 mb-1">Profitroom Room ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 427573"
                    value={newApt.profitroomRoomId}
                    onChange={(e) => setNewApt({ ...newApt, profitroomRoomId: e.target.value })}
                    className="w-full bg-black/50 border border-emerald-500/40 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">View Type</label>
                <input
                  type="text"
                  placeholder="e.g. Panoramic Ocean & Harbour View"
                  value={newApt.viewType}
                  onChange={(e) => setNewApt({ ...newApt, viewType: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Comprehensive description of residence layout, Swahili furniture, balconies, etc."
                  value={newApt.description}
                  onChange={(e) => setNewApt({ ...newApt, description: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              {/* Media Library Drag and Drop Media Upload */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#C59B27] mb-1">
                  Main Photo (Media Library MAM Upload / Asset URL)
                </label>
                <MediaDropzone
                  folder="apartments"
                  currentUrl={newApt.image}
                  onUploadComplete={(url) => setNewApt({ ...newApt, image: url })}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-1.5 rounded-lg border border-white/20 text-white/70 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold"
                >
                  Create Residence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SUITE MODAL */}
      {editingApt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1F1615] rounded-xl max-w-2xl w-full p-6 border border-[#C59B27]/40 shadow-2xl relative text-[#FAF6F0] space-y-4 my-8">
            <button
              onClick={() => setEditingApt(null)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-xl font-bold text-white">Edit Suite Details: {editingApt.name}</h2>
              <p className="text-xs text-white/60">Modify specifications, base rates, imagery, and Profitroom PMS link.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#C59B27] mb-1">Suite Name *</label>
                  <input
                    type="text"
                    required
                    value={editingApt.name}
                    onChange={(e) => setEditingApt({ ...editingApt, name: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">View Type</label>
                  <input
                    type="text"
                    value={editingApt.viewType || ''}
                    onChange={(e) => setEditingApt({ ...editingApt, viewType: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min="1"
                    value={editingApt.bedrooms}
                    onChange={(e) => setEditingApt({ ...editingApt, bedrooms: parseInt(e.target.value) || 1 })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    min="1"
                    value={editingApt.bathrooms}
                    onChange={(e) => setEditingApt({ ...editingApt, bathrooms: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">Max Guests</label>
                  <input
                    type="number"
                    min="1"
                    value={editingApt.maxGuests}
                    onChange={(e) => setEditingApt({ ...editingApt, maxGuests: parseInt(e.target.value) || 2 })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">Size</label>
                  <input
                    type="text"
                    value={editingApt.size}
                    onChange={(e) => setEditingApt({ ...editingApt, size: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#C59B27] mb-1">Base Price (USD)</label>
                  <input
                    type="number"
                    value={editingApt.pricePerNight}
                    onChange={(e) => setEditingApt({ ...editingApt, pricePerNight: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">Base Price (KES)</label>
                  <input
                    type="number"
                    value={editingApt.pricePerNightKes || 0}
                    onChange={(e) => setEditingApt({ ...editingApt, pricePerNightKes: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-emerald-400 mb-1">Profitroom Room ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 427573"
                    value={editingApt.profitroomRoomId || getProfitroomId(editingApt.id)}
                    onChange={(e) => setEditingApt({ ...editingApt, profitroomRoomId: e.target.value })}
                    className="w-full bg-black/50 border border-emerald-500/40 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingApt.description}
                  onChange={(e) => setEditingApt({ ...editingApt, description: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              {/* Media Library Drag and Drop Media Upload */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#C59B27] mb-1">
                  Main Photo (Media Library MAM Upload / Asset URL)
                </label>
                <MediaDropzone
                  folder="apartments"
                  currentUrl={editingApt.image}
                  onUploadComplete={(url) => setEditingApt({ ...editingApt, image: url })}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingApt(null)}
                  className="px-4 py-1.5 rounded-lg border border-white/20 text-white/70 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
