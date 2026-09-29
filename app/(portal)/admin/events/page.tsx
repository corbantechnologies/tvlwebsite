'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Clock, MapPin, Ticket, Plus, Trash2, Edit, Save, X, RotateCw, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaDropzone from '@/components/ui/MediaDropzone';
import { ResortEvent } from '@/types';
import { DEFAULT_EVENTS } from '@/lib/data';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<ResortEvent[]>(DEFAULT_EVENTS);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    venue: 'Tamarind Dhow',
    eventDate: '2026-10-10',
    eventTime: '18:30 - 22:30',
    ticketPriceKes: 8500,
    ticketPriceUsd: 65,
    capacity: 65,
    posterUrl: 'https://media.tamarind.co.ke/tvl-website-assets/dhow_sunset_cruise.jpg',
  });

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.events && data.events.length > 0) {
        setEvents(data.events);
      }
    } catch {
      console.warn('Using local default events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.eventDate) {
      toast.error('Please specify an event title and date.');
      return;
    }

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });

      if (res.ok) {
        toast.success('New event published to village & dhow calendar!');
        setShowAddModal(false);
        loadEvents();
      } else {
        toast.error('Failed to create event.');
      }
    } catch {
      toast.error('Network error creating event.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEvent),
      });

      if (res.ok) {
        toast.success('Event updated successfully!');
        setEditingEvent(null);
        loadEvents();
      } else {
        toast.error('Failed to update event.');
      }
    } catch {
      toast.error('Network error updating event.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this event from the calendar?')) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Event removed.');
        loadEvents();
      } else {
        toast.error('Failed to delete event.');
      }
    } catch {
      toast.error('Network error deleting event.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Village, Restaurant &amp; Dhow Happenings
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Incoming Events Management
          </h1>
          <p className="text-xs text-white/60">
            Publish, edit, and organize special theme nights, live jazz dhow cruises, and clifftop culinary showcases.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadEvents}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#1F1615] border border-[#C59B27]/25 text-[#C59B27] hover:bg-[#821124] hover:text-white transition-all cursor-pointer"
            title="Refresh Events"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Incoming Event</span>
          </button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="bg-[#1F1615] rounded-2xl border border-[#C59B27]/25 overflow-hidden shadow-xl flex flex-col justify-between"
          >
            <div>
              {/* Event Poster Header */}
              <div className="relative h-44 w-full bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={evt.posterUrl || evt.image || 'https://media.tamarind.co.ke/tvl-website-assets/dhow_sunset_cruise.jpg'}
                  alt={evt.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1F1615] via-transparent to-transparent" />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#821124] text-white text-[10px] font-bold uppercase tracking-wider shadow">
                  {evt.venue}
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3 text-xs text-white/60">
                  <span className="flex items-center gap-1 font-semibold text-[#C59B27]">
                    <Calendar className="w-3.5 h-3.5" /> {evt.eventDate || evt.startDate}
                  </span>
                  {(evt.eventTime || evt.timeText) && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {evt.eventTime || evt.timeText}
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-lg font-bold text-white">
                  {evt.title}
                </h3>

                <p className="text-xs text-white/70 line-clamp-3">
                  {evt.description}
                </p>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-white/60">
                    Capacity: <strong className="text-white">{evt.capacity || evt.maxCapacity || 60}</strong>
                  </span>
                  <span className="font-bold text-[#C59B27]">
                    {evt.ticketPriceKes ? `KES ${evt.ticketPriceKes.toLocaleString()}` : `$${evt.priceUsd || 50}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-black/20 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingEvent({ ...evt })}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Edit className="w-3 h-3" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => handleDelete(evt.id)}
                className="p-1.5 text-white/50 hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Remove Event"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1F1615] rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-[#C59B27]/40 shadow-2xl relative text-[#FAF6F0] space-y-4 my-8">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-2xl font-bold text-white">Create Incoming Event</h2>

            <form onSubmit={handleCreateEvent} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swahili Coast Full Moon Dhow Cruise"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Venue</label>
                  <select
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Tamarind Dhow">Tamarind Dhow</option>
                    <option value="Tamarind Restaurant">Tamarind Restaurant</option>
                    <option value="Clifftop Harbour Lawn">Clifftop Harbour Lawn</option>
                    <option value="Poolside Terrace">Poolside Terrace</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newEvent.eventDate}
                    onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Price (KES)</label>
                  <input
                    type="number"
                    value={newEvent.ticketPriceKes}
                    onChange={(e) => setNewEvent({ ...newEvent, ticketPriceKes: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Price (USD)</label>
                  <input
                    type="number"
                    value={newEvent.ticketPriceUsd}
                    onChange={(e) => setNewEvent({ ...newEvent, ticketPriceUsd: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-white/70 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Event Poster Image (Media Library MAM)</label>
                <MediaDropzone
                  folder="events"
                  currentUrl={newEvent.posterUrl}
                  onUploadComplete={(url) => setNewEvent({ ...newEvent, posterUrl: url })}
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
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1F1615] rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-[#C59B27]/40 shadow-2xl relative text-[#FAF6F0] space-y-4 my-8">
            <button
              onClick={() => setEditingEvent(null)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-2xl font-bold text-white">Edit Event Details</h2>

            <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Venue</label>
                  <select
                    value={editingEvent.venue}
                    onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Tamarind Dhow">Tamarind Dhow</option>
                    <option value="Tamarind Restaurant">Tamarind Restaurant</option>
                    <option value="Clifftop Harbour Lawn">Clifftop Harbour Lawn</option>
                    <option value="Poolside Terrace">Poolside Terrace</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Date</label>
                  <input
                    type="date"
                    value={editingEvent.eventDate || editingEvent.startDate || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, eventDate: e.target.value, startDate: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Price (KES)</label>
                  <input
                    type="number"
                    value={editingEvent.ticketPriceKes ?? editingEvent.priceKes ?? 0}
                    onChange={(e) => setEditingEvent({ ...editingEvent, ticketPriceKes: parseInt(e.target.value) || 0, priceKes: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">Price (USD)</label>
                  <input
                    type="number"
                    value={editingEvent.ticketPriceUsd ?? editingEvent.priceUsd ?? 0}
                    onChange={(e) => setEditingEvent({ ...editingEvent, ticketPriceUsd: parseInt(e.target.value) || 0, priceUsd: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-white/70 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#C59B27] mb-1">Event Poster Image (Media Library MAM)</label>
                <MediaDropzone
                  folder="events"
                  currentUrl={editingEvent.posterUrl || editingEvent.image}
                  onUploadComplete={(url) => setEditingEvent({ ...editingEvent, posterUrl: url, image: url })}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
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
    </div>
  );
}
