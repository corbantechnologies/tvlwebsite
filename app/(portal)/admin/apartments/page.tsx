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
import { ApartmentType } from '@/types';
import { APARTMENTS } from '@/data';

export default function AdminApartmentsPage() {
  const [apartments, setApartments] = useState<any[]>(APARTMENTS);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingApt, setEditingApt] = useState<any | null>(null);

  // Profitroom UpperBooking Live Rates
  const { liveRooms, getLivePrice } = useLiveRates();

  const loadApartments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/apartments');
      const data = await res.json();
      if (data.apartments && data.apartments.length > 0) {
        setApartments(data.apartments);
      }
    } catch {
      console.warn('Using baseline apartments');
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

  const [highlightInput, setHighlightInput] = useState('');
  const [amenityInput, setAmenityInput] = useState('');

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
            Full CRUD management for serviced residences, specs, Media Library imagery, and Profitroom UpperBooking synchronization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadApartments}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#1F1615] border border-[#C59B27]/25 text-[#C59B27] hover:bg-[#821124] hover:text-white transition-all cursor-pointer"
            title="Refresh Inventory"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Suite</span>
          </button>
        </div>
      </div>

      {/* Live Profitroom Sync Banner */}
      <div className="p-4 rounded-2xl bg-[#1F1615] border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
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
            <span key={r.id} className="bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/20">
              {r.name.split(' ')[0]}: ${r.minPrice}
            </span>
          ))}
        </div>
      </div>

      {/* Apartments Single Cards List (matching Dining & Dhow layout) */}
      <div className="space-y-6">
        {apartments.map((apt) => {
          const { price: livePrice, isLive } = getLivePrice(apt.id, apt.pricePerNight || 200);
          const prId = apt.profitroomRoomId || getProfitroomId(apt.id);

          return (
            <div
              key={apt.id}
              className="bg-[#1F1615] rounded-2xl border border-[#C59B27]/25 overflow-hidden shadow-xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
                {/* Image Column */}
                <div className="md:col-span-4 h-60 md:h-full min-h-[220px] rounded-xl overflow-hidden bg-black/40 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={apt.image}
                    alt={apt.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-[#821124] text-white text-[10px] font-bold uppercase tracking-wider shadow">
                      {apt.viewType}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white/90 text-[10px] font-mono border border-white/20">
                      ID: {apt.id}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Profitroom ID: {prId}
                    </span>
                  </div>
                </div>

                {/* Details Column */}
                <div className="md:col-span-8 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-2xl font-bold text-white">
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
                        <div className="text-2xl font-serif font-extrabold text-white">
                          ${isLive ? livePrice : apt.pricePerNight}
                          <span className="text-xs text-white/40 font-sans font-normal"> / night</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-white/70 mt-3 leading-relaxed">
                      {apt.description}
                    </p>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-4 gap-2.5 p-3 rounded-xl bg-black/40 border border-white/10 text-xs mt-4">
                      <div className="text-center">
                        <span className="text-white/40 text-[10px] block uppercase tracking-wider">Size</span>
                        <strong className="text-white font-mono">{apt.size}</strong>
                      </div>
                      <div className="text-center">
                        <span className="text-white/40 text-[10px] block uppercase tracking-wider">Beds</span>
                        <strong className="text-white">{apt.bedrooms} Bed</strong>
                      </div>
                      <div className="text-center">
                        <span className="text-white/40 text-[10px] block uppercase tracking-wider">Baths</span>
                        <strong className="text-white">{apt.bathrooms} Bath</strong>
                      </div>
                      <div className="text-center">
                        <span className="text-white/40 text-[10px] block uppercase tracking-wider">Guests</span>
                        <strong className="text-[#C59B27]">Max {apt.maxGuests}</strong>
                      </div>
                    </div>

                    {/* Highlights */}
                    {apt.highlights && apt.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {apt.highlights.map((hl: string, idx: number) => (
                          <span key={idx} className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-stone-300">
                            {hl}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
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
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Suite</span>
                      </button>

                      <button
                        onClick={() => handleDelete(apt.id, apt.name)}
                        className="p-2 text-white/40 hover:text-red-400 rounded-xl hover:bg-white/10 cursor-pointer transition-all"
                        title="Delete Suite"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE SUITE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1F1615] rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-[#C59B27]/40 shadow-2xl relative text-[#FAF6F0] space-y-5 my-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-2xl font-bold text-white">Add New Serviced Residence</h2>
              <p className="text-xs text-white/60">Configure suite metadata, specifications, and live Profitroom mapping.</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Suite Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4 Bedroom Executive Harbour Villa"
                    value={newApt.name}
                    onChange={(e) => setNewApt({ ...newApt, name: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Unique Slug / ID</label>
                  <input
                    type="text"
                    placeholder="auto-generated from name if blank"
                    value={newApt.id}
                    onChange={(e) => setNewApt({ ...newApt, id: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min="1"
                    value={newApt.bedrooms}
                    onChange={(e) => setNewApt({ ...newApt, bedrooms: parseInt(e.target.value) || 1 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    min="1"
                    value={newApt.bathrooms}
                    onChange={(e) => setNewApt({ ...newApt, bathrooms: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Max Guests</label>
                  <input
                    type="number"
                    min="1"
                    value={newApt.maxGuests}
                    onChange={(e) => setNewApt({ ...newApt, maxGuests: parseInt(e.target.value) || 2 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Size (m²)</label>
                  <input
                    type="text"
                    value={newApt.size}
                    onChange={(e) => setNewApt({ ...newApt, size: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Base Price (USD)</label>
                  <input
                    type="number"
                    value={newApt.pricePerNight}
                    onChange={(e) => setNewApt({ ...newApt, pricePerNight: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Base Price (KES)</label>
                  <input
                    type="number"
                    value={newApt.pricePerNightKes}
                    onChange={(e) => setNewApt({ ...newApt, pricePerNightKes: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-400 mb-1">Profitroom Room ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 427573"
                    value={newApt.profitroomRoomId}
                    onChange={(e) => setNewApt({ ...newApt, profitroomRoomId: e.target.value })}
                    className="w-full bg-black/50 border border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-white/70 mb-1">View Type</label>
                <input
                  type="text"
                  placeholder="e.g. Panoramic Ocean & Harbour View"
                  value={newApt.viewType}
                  onChange={(e) => setNewApt({ ...newApt, viewType: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-white/70 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Comprehensive description of residence layout, Swahili furniture, balconies, etc."
                  value={newApt.description}
                  onChange={(e) => setNewApt({ ...newApt, description: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-xs text-white"
                />
              </div>

              {/* Media Library Drag and Drop Media Upload */}
              <div>
                <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">
                  Main Photo (Media Library MAM Upload / Asset URL)
                </label>
                <MediaDropzone
                  folder="apartments"
                  currentUrl={newApt.image}
                  onUploadComplete={(url) => setNewApt({ ...newApt, image: url })}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/20 text-white/70 hover:text-white text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider"
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
          <div className="bg-[#1F1615] rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-[#C59B27]/40 shadow-2xl relative text-[#FAF6F0] space-y-5 my-8">
            <button
              onClick={() => setEditingApt(null)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-2xl font-bold text-white">Edit Suite Details: {editingApt.name}</h2>
              <p className="text-xs text-white/60">Modify specifications, base rates, imagery, and Profitroom PMS link.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Suite Name *</label>
                  <input
                    type="text"
                    required
                    value={editingApt.name}
                    onChange={(e) => setEditingApt({ ...editingApt, name: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">View Type</label>
                  <input
                    type="text"
                    value={editingApt.viewType || ''}
                    onChange={(e) => setEditingApt({ ...editingApt, viewType: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min="1"
                    value={editingApt.bedrooms}
                    onChange={(e) => setEditingApt({ ...editingApt, bedrooms: parseInt(e.target.value) || 1 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    min="1"
                    value={editingApt.bathrooms}
                    onChange={(e) => setEditingApt({ ...editingApt, bathrooms: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Max Guests</label>
                  <input
                    type="number"
                    min="1"
                    value={editingApt.maxGuests}
                    onChange={(e) => setEditingApt({ ...editingApt, maxGuests: parseInt(e.target.value) || 2 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Size</label>
                  <input
                    type="text"
                    value={editingApt.size}
                    onChange={(e) => setEditingApt({ ...editingApt, size: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Base Price (USD)</label>
                  <input
                    type="number"
                    value={editingApt.pricePerNight}
                    onChange={(e) => setEditingApt({ ...editingApt, pricePerNight: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Base Price (KES)</label>
                  <input
                    type="number"
                    value={editingApt.pricePerNightKes || 0}
                    onChange={(e) => setEditingApt({ ...editingApt, pricePerNightKes: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-400 mb-1">Profitroom Room ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 427573"
                    value={editingApt.profitroomRoomId || getProfitroomId(editingApt.id)}
                    onChange={(e) => setEditingApt({ ...editingApt, profitroomRoomId: e.target.value })}
                    className="w-full bg-black/50 border border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-white/70 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={editingApt.description}
                  onChange={(e) => setEditingApt({ ...editingApt, description: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-xs text-white"
                />
              </div>

              {/* Media Library Drag and Drop Media Upload */}
              <div>
                <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">
                  Main Photo (Media Library MAM Upload / Asset URL)
                </label>
                <MediaDropzone
                  folder="apartments"
                  currentUrl={editingApt.image}
                  onUploadComplete={(url) => setEditingApt({ ...editingApt, image: url })}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingApt(null)}
                  className="px-5 py-2.5 rounded-xl border border-white/20 text-white/70 hover:text-white text-xs font-bold uppercase"
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
    </div>
  );
}
