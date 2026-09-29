'use client';

import React, { useState, useEffect } from 'react';
import { Utensils, Ship, Clock, Users, Sparkles, Plus, Trash2, Edit, Save, X, RotateCw, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaDropzone from '@/components/ui/MediaDropzone';
import { DINING } from '@/lib/data';

export default function AdminDiningPage() {
  const [venues, setVenues] = useState<any[]>(DINING);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<any | null>(null);

  const [newVenue, setNewVenue] = useState({
    name: '',
    cuisine: 'International & Seafood',
    description: '',
    hours: '12:00 PM - 11:00 PM',
    dressCode: 'Smart Casual',
    maxCapacity: 120,
    image: 'https://media.tamarind.co.ke/tvl-website-assets/tamarind_restaurant.jpg',
    reservationLinkText: 'Book Table',
    highlights: ['Oceanfront seating', 'Live music on weekends', 'Full bar & cellar']
  });

  const loadVenues = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dining');
      const data = await res.json();
      if (data.dining && data.dining.length > 0) {
        setVenues(data.dining);
      }
    } catch {
      console.warn('Using default dining venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenues();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenue.name) {
      toast.error('Please enter venue name');
      return;
    }

    try {
      const res = await fetch('/api/dining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVenue),
      });

      if (res.ok) {
        toast.success('Dining venue added!');
        setShowAddModal(false);
        loadVenues();
      } else {
        toast.error('Failed to create venue');
      }
    } catch {
      toast.error('Network error creating venue');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVenue) return;

    try {
      const res = await fetch(`/api/dining/${editingVenue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingVenue),
      });

      if (res.ok) {
        toast.success('Venue details updated!');
        setEditingVenue(null);
        loadVenues();
      } else {
        toast.error('Failed to update venue');
      }
    } catch {
      toast.error('Network error updating venue');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      const res = await fetch(`/api/dining/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Venue removed.');
        loadVenues();
      } else {
        toast.error('Failed to delete venue');
      }
    } catch {
      toast.error('Network error deleting venue');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Utensils className="w-3.5 h-3.5" /> Gastronomy &amp; Charters Master Config
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Tamarind Restaurant &amp; Dhow Venues
          </h1>
          <p className="text-xs text-white/60">
            Manage operational hours, capacity limits, dhow cruise sailings, menus, and media.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadVenues}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#1F1615] border border-[#C59B27]/25 text-[#C59B27] hover:bg-[#821124] hover:text-white transition-all cursor-pointer"
            title="Refresh Venues"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Venue</span>
          </button>
        </div>
      </div>

      {/* Venues List */}
      <div className="space-y-6">
        {venues.map((venue) => (
          <div
            key={venue.id}
            className="bg-[#1F1615] rounded-2xl border border-[#C59B27]/25 overflow-hidden shadow-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
              <div className="md:col-span-4 h-56 rounded-xl overflow-hidden bg-black/40 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={venue.image}
                  alt={venue.title || venue.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#821124] text-white text-[10px] font-bold uppercase tracking-wider shadow">
                  {venue.cuisine || 'Cuisine'}
                </div>
              </div>

              <div className="md:col-span-8 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-white">
                        {venue.title || venue.name}
                      </h3>
                      <span className="text-xs text-[#C59B27] font-semibold block mt-0.5">
                        {venue.hours || 'Open Daily'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingVenue({ ...venue, name: venue.title || venue.name })}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Venue</span>
                      </button>

                      <button
                        onClick={() => handleDelete(venue.id, venue.title || venue.name)}
                        className="p-2 text-white/40 hover:text-red-400 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                        title="Delete Venue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-white/70 mt-3 leading-relaxed">
                    {venue.description}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-black/40 border border-white/10 text-xs">
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">Service Hours:</span>
                    <span className="font-semibold text-white truncate block">{venue.hours || '12:00 - 23:00'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">Dress Code:</span>
                    <span className="font-semibold text-white">{venue.dressCode || 'Smart Casual'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">Capacity:</span>
                    <span className="font-semibold text-[#C59B27]">{venue.maxCapacity || 120} Guests</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Venue Modal */}
      {editingVenue && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1F1615] rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-[#C59B27]/40 shadow-2xl relative text-[#FAF6F0] space-y-4 my-8">
            <button
              onClick={() => setEditingVenue(null)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-2xl font-bold text-white">Edit Dining Venue</h2>

            <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Venue Title *</label>
                <input
                  type="text"
                  required
                  value={editingVenue.name || editingVenue.title}
                  onChange={(e) => setEditingVenue({ ...editingVenue, name: e.target.value, title: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Cuisine / Category</label>
                  <input
                    type="text"
                    value={editingVenue.cuisine || ''}
                    onChange={(e) => setEditingVenue({ ...editingVenue, cuisine: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={editingVenue.maxCapacity || 100}
                    onChange={(e) => setEditingVenue({ ...editingVenue, maxCapacity: parseInt(e.target.value) || 100 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-white/70 mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={editingVenue.hours || ''}
                  onChange={(e) => setEditingVenue({ ...editingVenue, hours: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-white/70 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingVenue.description || ''}
                  onChange={(e) => setEditingVenue({ ...editingVenue, description: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Venue Photo (MinIO MAM)</label>
                <MediaDropzone
                  folder="dining"
                  currentUrl={editingVenue.image}
                  onUploadComplete={(url) => setEditingVenue({ ...editingVenue, image: url })}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingVenue(null)}
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

      {/* Add Venue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1F1615] rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-[#C59B27]/40 shadow-2xl relative text-[#FAF6F0] space-y-4 my-8">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-2xl font-bold text-white">Create Dining Venue</h2>

            <form onSubmit={handleCreate} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Venue Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tamarind Harbour Wine & Cigar Lounge"
                  value={newVenue.name}
                  onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Cuisine / Category</label>
                  <input
                    type="text"
                    value={newVenue.cuisine}
                    onChange={(e) => setNewVenue({ ...newVenue, cuisine: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={newVenue.maxCapacity}
                    onChange={(e) => setNewVenue({ ...newVenue, maxCapacity: parseInt(e.target.value) || 100 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-white/70 mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={newVenue.hours}
                  onChange={(e) => setNewVenue({ ...newVenue, hours: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-white/70 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newVenue.description}
                  onChange={(e) => setNewVenue({ ...newVenue, description: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Venue Photo (MinIO MAM)</label>
                <MediaDropzone
                  folder="dining"
                  currentUrl={newVenue.image}
                  onUploadComplete={(url) => setNewVenue({ ...newVenue, image: url })}
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
                  Create Venue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
