'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Clock, MapPin, Ticket, Plus, Trash2, Edit, Save, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ResortEvent } from '@/types';
import { DEFAULT_EVENTS } from '@/lib/data';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<ResortEvent[]>(DEFAULT_EVENTS);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    venue: 'Tamarind Dhow',
    eventDate: '',
    eventTime: '18:30 - 22:30',
    ticketPriceKes: 8500,
    ticketPriceUsd: 65,
    capacity: 65,
    posterUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
  });

  const loadEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.events && data.events.length > 0) {
        setEvents(data.events);
      }
    } catch {
      console.warn('Using local default events');
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

    setLoading(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });

      if (res.ok) {
        toast.success('New event published to village & dhow calendar!');
        setShowAddModal(false);
        setNewEvent({
          title: '',
          description: '',
          venue: 'Tamarind Dhow',
          eventDate: '',
          eventTime: '18:30 - 22:30',
          ticketPriceKes: 8500,
          ticketPriceUsd: 65,
          capacity: 65,
          posterUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
        });
        loadEvents();
      } else {
        toast.error('Failed to create event.');
      }
    } catch {
      toast.error('Network error creating event.');
    } finally {
      setLoading(false);
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
    <div className="space-y-6 max-w-7xl mx-auto">
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
            Publish and manage special theme nights, live jazz dhow cruises, and clifftop culinary showcases.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Incoming Event</span>
        </button>
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
                  src={evt.posterUrl || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5'}
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
                    <Calendar className="w-3.5 h-3.5" /> {evt.eventDate}
                  </span>
                  {evt.eventTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {evt.eventTime}
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
                    Capacity: <strong className="text-white">{evt.capacity || 60}</strong>
                  </span>
                  <span className="font-bold text-[#C59B27]">
                    KES {evt.ticketPriceKes?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-black/20 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                onClick={() => handleDelete(evt.id)}
                className="p-2 text-white/50 hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1F1615] rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-[#C59B27]/40 shadow-2xl relative text-[#FAF6F0] space-y-4 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-xl font-bold text-white">
                Add Incoming Event or Dhow Charter
              </h2>
              <p className="text-xs text-white/60">
                Will appear immediately on the public marketing calendar and homepage.
              </p>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Moon Seafood Jazz &amp; Dhow Cruise"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Venue
                  </label>
                  <select
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  >
                    <option value="Tamarind Dhow">Tamarind Dhow (Tudor Creek)</option>
                    <option value="Tamarind Restaurant">Tamarind Restaurant (Clifftop)</option>
                    <option value="Village Clifftop & Pool">Village Clifftop &amp; Pool</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEvent.eventDate}
                    onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    placeholder="18:30 - 22:30"
                    value={newEvent.eventTime}
                    onChange={(e) => setNewEvent({ ...newEvent, eventTime: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Ticket (KES)
                  </label>
                  <input
                    type="number"
                    value={newEvent.ticketPriceKes}
                    onChange={(e) => setNewEvent({ ...newEvent, ticketPriceKes: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={newEvent.capacity}
                    onChange={(e) => setNewEvent({ ...newEvent, capacity: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                  Poster Image URL
                </label>
                <input
                  type="url"
                  value={newEvent.posterUrl}
                  onChange={(e) => setNewEvent({ ...newEvent, posterUrl: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                  Event Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide details on live bands, menu inclusions, dress code..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Publish Event to Village Platform</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
