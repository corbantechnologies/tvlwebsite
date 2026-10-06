'use client';

import React, { useState, useEffect } from 'react';
import {
  Utensils, Ship, Clock, Users, Sparkles, Plus, Trash2, Edit, Save, X,
  RotateCw, ExternalLink, Mail, Shield, Info, Loader2, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import MediaDropzone from '@/components/ui/MediaDropzone';

export default function AdminDiningPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newVenue, setNewVenue] = useState<{
    name: string;
    cuisine: string;
    description: string;
    hours: string;
    dressCode: string;
    maxCapacity: number | '';
    image: string;
    reservationLinkText: string;
    highlights: string[];
  }>({
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
      if (data.dining) {
        setVenues(data.dining);
      }
    } catch {
      toast.error('Failed to load dining venues from database');
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

    setCreating(true);
    try {
      const res = await fetch('/api/dining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newVenue,
          maxCapacity: Number(newVenue.maxCapacity) || 50,
        }),
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
    } finally {
      setCreating(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVenue) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/dining/${editingVenue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingVenue,
          maxCapacity: Number(editingVenue.maxCapacity) || 100,
        }),
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
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;
    setDeletingId(id);
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
            <Utensils className="w-3.5 h-3.5" /> Gastronomy &amp; Charters Master Config
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Tamarind Restaurant &amp; Dhow Venues
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Database-backed management for operational hours, capacity limits, dhow cruise sailings, and menus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadVenues}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh Venues"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add Venue</span>
          </button>
        </div>
      </div>

      {/* Venue Inquiry Email Routing Panel */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#821124]" />
          <h2 className="font-serif text-sm font-bold text-slate-900">
            Dedicated Venue Inquiry Dispatch &amp; Routing
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Guest inquiries submitted across the public platform are automatically routed to each venue’s dedicated reservation desk for prompt response:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-0.5 shadow-2xs">
            <span className="text-[10px] text-[#821124] uppercase font-bold tracking-wider block">
              Tamarind Mombasa Restaurant
            </span>
            <div className="text-xs font-mono text-slate-800 truncate">
              reservations.mombasa@tamarind.co.ke
            </div>
            <span className="text-[10px] text-slate-500 block">Table Inquiries</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-0.5 shadow-2xs">
            <span className="text-[10px] text-[#821124] uppercase font-bold tracking-wider block">
              The Dawa Terrace Lounge
            </span>
            <div className="text-xs font-mono text-slate-800 truncate">
              reservations.mombasa@tamarind.co.ke
            </div>
            <span className="text-[10px] text-slate-500 block">Lounge &amp; Sundowner Inquiries</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-0.5 shadow-2xs">
            <span className="text-[10px] text-[#821124] uppercase font-bold tracking-wider block">
              Tamarind Dhow (Mombasa)
            </span>
            <div className="text-xs font-mono text-slate-800 truncate">
              reservations.dhow@tamarind.co.ke
            </div>
            <span className="text-[10px] text-slate-500 block">Cruises &amp; Private Charters</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-0.5 shadow-2xs">
            <span className="text-[10px] text-[#821124] uppercase font-bold tracking-wider block">
              Golden Key Casino
            </span>
            <div className="text-xs font-mono text-slate-800 truncate">
              goldenkey.casino@tamarind.co.ke
            </div>
            <span className="text-[10px] text-slate-500 block">VIP &amp; Gaming Inquiries</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-0.5 shadow-2xs">
            <span className="text-[10px] text-[#821124] uppercase font-bold tracking-wider block">
              Tamarind Village Apartments
            </span>
            <div className="text-xs font-mono text-slate-800 truncate">
              reservations.village@tamarind.co.ke
            </div>
            <span className="text-[10px] text-emerald-700 font-bold block">Online Booking &amp; Front Desk</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-0.5 shadow-2xs">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
              Harbour Restaurant &amp; Pools
            </span>
            <div className="text-xs font-semibold text-slate-800">
              Residents Only
            </div>
            <span className="text-[10px] text-slate-500 block">Private amenity for staying guests</span>
          </div>
        </div>
      </div>

      {/* Venues List */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs space-y-2 bg-white rounded-xl border border-slate-200 shadow-xs">
          <RotateCw className="w-6 h-6 animate-spin mx-auto text-[#821124]" />
          <p>Loading dining venues from database...</p>
        </div>
      ) : venues.length === 0 ? (
        <div className="p-16 text-center text-slate-500 space-y-3 bg-white rounded-xl border border-dashed border-slate-300 max-w-xl mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-[#821124] flex items-center justify-center mx-auto">
            <Utensils className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-900">No Dining Venues Found</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your dining inventory is clear. Add restaurants, bars, or dhow experiences using the button below.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Venue</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {venues.map((venue) => {
            const isDeleting = deletingId === venue.id;

            return (
              <div
                key={venue.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5">
                  <div className="md:col-span-4 h-48 rounded-lg overflow-hidden bg-slate-100 relative border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={venue.image}
                      alt={venue.title || venue.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-[#821124] text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                      {venue.cuisine || 'Cuisine'}
                    </div>
                  </div>

                  <div className="md:col-span-8 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-serif text-xl font-bold text-slate-900">
                            {venue.title || venue.name}
                          </h3>
                          <span className="text-xs text-[#821124] font-medium block mt-0.5">
                            {venue.hours || 'Open Daily'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingVenue({ ...venue, name: venue.title || venue.name })}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                          >
                            <Edit className="w-3 h-3 text-slate-500" />
                            <span>Edit Venue</span>
                          </button>

                          <button
                            onClick={() => handleDelete(venue.id, venue.title || venue.name)}
                            disabled={isDeleting}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete Venue"
                          >
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                        {venue.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">Service Hours:</span>
                        <span className="font-semibold text-slate-900 truncate block text-[11px]">{venue.hours || '12:00 - 23:00'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">Dress Code:</span>
                        <span className="font-semibold text-slate-900 text-[11px]">{venue.dressCode || 'Smart Casual'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">Capacity:</span>
                        <span className="font-semibold text-[#821124] text-[11px]">{venue.maxCapacity || 120} Guests</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Venue Modal */}
      {editingVenue && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative text-slate-900 space-y-3.5 my-8">
            <button
              onClick={() => setEditingVenue(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-xl font-bold text-slate-900">Edit Dining Venue</h2>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Venue Title *</label>
                <input
                  type="text"
                  required
                  value={editingVenue.name || editingVenue.title}
                  onChange={(e) => setEditingVenue({ ...editingVenue, name: e.target.value, title: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cuisine / Category</label>
                  <input
                    type="text"
                    value={editingVenue.cuisine || ''}
                    onChange={(e) => setEditingVenue({ ...editingVenue, cuisine: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={editingVenue.maxCapacity ?? ''}
                    onChange={(e) => setEditingVenue({ ...editingVenue, maxCapacity: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={editingVenue.hours || ''}
                  onChange={(e) => setEditingVenue({ ...editingVenue, hours: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingVenue.description || ''}
                  onChange={(e) => setEditingVenue({ ...editingVenue, description: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Venue Photo (Media Library MAM)</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <MediaDropzone
                    folder="dining"
                    currentUrl={editingVenue.image}
                    onUploadComplete={(url) => setEditingVenue({ ...editingVenue, image: url })}
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVenue(null)}
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

      {/* Add Venue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative text-slate-900 space-y-3.5 my-8">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-xl font-bold text-slate-900">Add New Dining Venue</h2>

            <form onSubmit={handleCreate} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Venue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tamarind Wine Cellar &amp; Tasting Room"
                  value={newVenue.name}
                  onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cuisine / Category</label>
                  <input
                    type="text"
                    value={newVenue.cuisine}
                    onChange={(e) => setNewVenue({ ...newVenue, cuisine: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={newVenue.maxCapacity ?? ''}
                    onChange={(e) => setNewVenue({ ...newVenue, maxCapacity: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={newVenue.hours}
                  onChange={(e) => setNewVenue({ ...newVenue, hours: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Atmosphere, culinary highlights, special events..."
                  value={newVenue.description}
                  onChange={(e) => setNewVenue({ ...newVenue, description: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Venue Photo</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <MediaDropzone
                    folder="dining"
                    currentUrl={newVenue.image}
                    onUploadComplete={(url) => setNewVenue({ ...newVenue, image: url })}
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Create Venue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
