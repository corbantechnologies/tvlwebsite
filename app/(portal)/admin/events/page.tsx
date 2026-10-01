'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Calendar, Clock, MapPin, Ticket, Plus, Trash2, Edit3, 
  Save, X, RotateCw, ExternalLink, ShieldAlert, CheckCircle2, Lock, Loader2, Check 
} from 'lucide-react';
import toast from 'react-hot-toast';
import MediaDropzone from '@/components/ui/MediaDropzone';

interface AdminEvent {
  id: string;
  title: string;
  slug?: string;
  description: string;
  brand: 'tamarind_village' | 'tamarind_restaurant' | 'dawa_terrace' | 'tamarind_dhow' | 'golden_key' | string;
  venue: string;
  city: string;
  category?: string;
  startDate: string;
  endDate?: string | null;
  timeText: string;
  priceKes?: number;
  priceUsd?: number;
  image?: string;
  posterUrl?: string;
  maxCapacity?: number;
  paymentEnabled?: boolean;
  externalTicketUrl?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
}

const BRANDS = [
  { id: 'all', label: 'All Brands' },
  { id: 'tamarind_village', label: 'Tamarind Village', defaultVenue: 'Tamarind Village Clifftop' },
  { id: 'tamarind_restaurant', label: 'Tamarind Mombasa Restaurant', defaultVenue: 'Tamarind Restaurant Mombasa' },
  { id: 'dawa_terrace', label: 'Dawa Terrace', defaultVenue: 'Dawa Terrace Lounge' },
  { id: 'tamarind_dhow', label: 'Tamarind Dhow', defaultVenue: 'Tamarind Dhow (Nawalikoni / Babulkher)' },
  { id: 'golden_key', label: 'Golden Key Casino', defaultVenue: 'Golden Key Casino Mombasa' },
];

const BRAND_DISPLAY: Record<string, string> = {
  tamarind_village: 'Tamarind Village',
  tamarind_restaurant: 'Tamarind Mombasa Restaurant',
  dawa_terrace: 'Dawa Terrace',
  tamarind_dhow: 'Tamarind Dhow',
  golden_key: 'Golden Key Casino',
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [brandFilter, setBrandFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('tamarind_village');
  const [venue, setVenue] = useState('Tamarind Village Clifftop');
  const [city, setCity] = useState('Mombasa');
  const [category, setCategory] = useState('dining_gala');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('');
  const [timeText, setTimeText] = useState('18:30 – 22:30');
  const [priceKes, setPriceKes] = useState<number | ''>(8500);
  const [priceUsd, setPriceUsd] = useState<number | ''>(65);
  const [maxCapacity, setMaxCapacity] = useState<number | ''>(65);
  const [image, setImage] = useState('https://media.tamarind.co.ke/tvl-website-assets/dhow_sunset_cruise.jpg');
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [externalTicketUrl, setExternalTicketUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.events && data.events.length > 0) {
        setEvents(data.events);
      } else {
        setEvents([]);
      }
    } catch {
      console.warn('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const openAddModal = () => {
    setTitle('');
    setDescription('');
    setBrand('tamarind_village');
    setVenue('Tamarind Village Clifftop');
    setCity('Mombasa');
    setCategory('dining_gala');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setTimeText('18:30 – 22:30');
    setPriceKes(8500);
    setPriceUsd(65);
    setMaxCapacity(80);
    setImage('https://media.tamarind.co.ke/tvl-website-assets/dhow_sunset_cruise.jpg');
    setPaymentEnabled(false);
    setExternalTicketUrl('');
    setShowAddModal(true);
  };

  const openEditModal = (evt: AdminEvent) => {
    setEditingEvent(evt);
    setTitle(evt.title);
    setDescription(evt.description);
    setBrand(evt.brand || 'tamarind_village');
    setVenue(evt.venue || '');
    setCity(evt.city || 'Mombasa');
    setCategory(evt.category || 'dining_gala');
    setStartDate(evt.startDate);
    setEndDate(evt.endDate || '');
    setTimeText(evt.timeText || '18:30 – 22:30');
    setPriceKes(evt.priceKes ?? '');
    setPriceUsd(evt.priceUsd ?? '');
    setMaxCapacity(evt.maxCapacity ?? '');
    setImage(evt.image || evt.posterUrl || '');
    setPaymentEnabled(evt.paymentEnabled === true);
    setExternalTicketUrl(evt.externalTicketUrl || '');
  };

  const handleBrandChange = (newBrand: string) => {
    setBrand(newBrand);
    const match = BRANDS.find((b) => b.id === newBrand);
    if (match && match.defaultVenue) {
      setVenue(match.defaultVenue);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) {
      toast.error('Title and start date are required');
      return;
    }
    setSubmitting(true);
    try {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug,
          description: description.trim(),
          brand,
          venue,
          city,
          category,
          startDate,
          endDate: endDate || null,
          timeText,
          priceKes: Number(priceKes || 0),
          priceUsd: Number(priceUsd || 0),
          maxCapacity: Number(maxCapacity || 80),
          image,
          posterUrl: image,
          paymentEnabled,
          externalTicketUrl: externalTicketUrl.trim() || null,
        }),
      });

      if (res.ok) {
        toast.success('Event published to Tamarind calendar!');
        setShowAddModal(false);
        loadEvents();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to create event');
      }
    } catch {
      toast.error('Network error creating event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          brand,
          venue,
          city,
          category,
          startDate,
          endDate: endDate || null,
          timeText,
          priceKes: Number(priceKes || 0),
          priceUsd: Number(priceUsd || 0),
          maxCapacity: Number(maxCapacity || 80),
          image,
          posterUrl: image,
          paymentEnabled,
          externalTicketUrl: externalTicketUrl.trim() || null,
        }),
      });

      if (res.ok) {
        toast.success('Event details updated!');
        setEditingEvent(null);
        loadEvents();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to update event');
      }
    } catch {
      toast.error('Network error updating event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the calendar?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Event removed');
        loadEvents();
      } else {
        toast.error('Failed to remove event');
      }
    } catch {
      toast.error('Network error deleting event');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (brandFilter === 'all') return true;
    return e.brand === brandFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#821124] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Tamarind Mombasa Events Hub
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Events &amp; Culinary Experiences
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Publish and manage happenings across Tamarind Village, Tamarind Restaurant, Dawa Terrace, Tamarind Dhow, and Golden Key Casino.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadEvents}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh Events"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-3.5 py-1.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {/* Brand Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {BRANDS.map((b) => (
          <button
            key={b.id}
            onClick={() => setBrandFilter(b.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              brandFilter === b.id
                ? 'bg-[#821124] text-white shadow-xs font-semibold'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Events Grid or Empty State */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs space-y-2 bg-white rounded-xl border border-slate-200 shadow-xs">
          <RotateCw className="w-6 h-6 animate-spin mx-auto text-[#821124]" />
          <p>Loading events from database...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-16 text-center text-slate-500 space-y-3 bg-white rounded-xl border border-dashed border-slate-300 max-w-xl mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-[#821124] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-900">No Events Published</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {brandFilter === 'all'
              ? 'There are currently no events on the calendar. (Per policy, event placeholders are hidden on the public site).'
              : `No events found for ${BRAND_DISPLAY[brandFilter] || brandFilter}.`}
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((evt) => {
            const brandName = BRAND_DISPLAY[evt.brand] || evt.brand || 'Tamarind Village';
            const isDeleting = deletingId === evt.id;

            return (
              <div
                key={evt.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Event Poster Header */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden border-b border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={evt.image || evt.posterUrl || 'https://media.tamarind.co.ke/tvl-website-assets/dhow_sunset_cruise.jpg'}
                      alt={evt.title}
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-white/95 backdrop-blur-xs text-[10px] font-bold text-slate-900 uppercase tracking-wider border border-slate-200 shadow-xs">
                      {brandName}
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-white/95 backdrop-blur-xs text-right border border-slate-200 shadow-xs">
                      <span className="font-serif font-bold text-xs text-slate-900">
                        {evt.priceKes ? `KES ${evt.priceKes.toLocaleString()}` : evt.priceUsd ? `$${evt.priceUsd}` : 'Free Entry'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-serif text-base font-bold text-slate-900 line-clamp-1">
                        {evt.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                        {evt.description}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#821124] shrink-0" />
                        <span>{evt.startDate} {evt.endDate ? `to ${evt.endDate}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{evt.timeText}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{evt.venue}, {evt.city}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Cap: {evt.maxCapacity || 80}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(evt)}
                      className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                    >
                      <Edit3 className="w-3 h-3 text-slate-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(evt.id, evt.title)}
                      disabled={isDeleting}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete Event"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Event Modal */}
      {(showAddModal || editingEvent) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl relative text-slate-900 space-y-4 my-8">
            <button
              onClick={() => {
                setShowAddModal(false);
                setEditingEvent(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">
                {editingEvent ? 'Edit Experience' : 'Publish New Experience'}
              </h2>
              <p className="text-xs text-slate-500">Coordinate event dates, ticketing, and venue details.</p>
            </div>

            <form onSubmit={editingEvent ? handleUpdate : handleCreate} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swahili Sunset Seafood Gala"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Entity</label>
                  <select
                    value={brand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  >
                    {BRANDS.filter((b) => b.id !== 'all').map((b) => (
                      <option key={b.id} value={b.id}>{b.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Venue Location</label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date (Opt)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Text</label>
                  <input
                    type="text"
                    placeholder="18:30 – 22:30"
                    value={timeText}
                    onChange={(e) => setTimeText(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Price (KES)</label>
                  <input
                    type="number"
                    value={priceKes}
                    onChange={(e) => setPriceKes(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Price (USD)</label>
                  <input
                    type="number"
                    value={priceUsd}
                    onChange={(e) => setPriceUsd(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Max Guests</label>
                  <input
                    type="number"
                    value={maxCapacity ?? ''}
                    onChange={(e) => setMaxCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Outline dinner courses, musical guests, entertainment schedule..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Poster Photo (Media Library)</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <MediaDropzone
                    folder="events"
                    currentUrl={image}
                    onUploadComplete={(url) => setImage(url)}
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEvent(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{editingEvent ? 'Save Changes' : 'Publish Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
