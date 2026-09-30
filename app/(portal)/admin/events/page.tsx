'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Calendar, Clock, MapPin, Ticket, Plus, Trash2, Edit3, 
  Save, X, RotateCw, ExternalLink, ShieldAlert, CheckCircle2, Lock 
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
  const [maxCapacity, setMaxCapacity] = useState(65);
  const [image, setImage] = useState('https://media.tamarind.co.ke/tvl-website-assets/dhow_sunset_cruise.jpg');
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [externalTicketUrl, setExternalTicketUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      console.warn('Using local default events');
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
    setPriceKes(evt.priceKes ?? 0);
    setPriceUsd(evt.priceUsd ?? 0);
    setMaxCapacity(evt.maxCapacity ?? 80);
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
    }
  };

  const filteredEvents = events.filter((e) => {
    if (brandFilter === 'all') return true;
    return e.brand === brandFilter;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Tamarind Mombasa Events Hub
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Events &amp; Culinary Experiences
          </h1>
          <p className="text-xs text-white/60">
            Publish and manage happenings across Tamarind Village, Tamarind Restaurant, Dawa Terrace, Tamarind Dhow, and Golden Key Casino.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadEvents}
            disabled={loading}
            className="p-2 rounded-lg bg-[#1F1615] border border-[#C59B27]/25 text-[#C59B27] hover:bg-[#821124] hover:text-white transition-all cursor-pointer"
            title="Refresh Events"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openAddModal}
            className="px-3.5 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              brandFilter === b.id
                ? 'bg-[#821124] text-white shadow-md'
                : 'bg-[#1F1615] text-white/70 hover:text-white border border-white/10'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Events Grid or Empty State */}
      {filteredEvents.length === 0 ? (
        <div className="p-16 text-center text-white/40 space-y-3 bg-[#1F1615] rounded-xl border border-[#C59B27]/25">
          <Sparkles className="w-10 h-10 mx-auto text-[#C59B27] opacity-30" />
          <p className="text-sm font-semibold text-white">No Events Published Yet</p>
          <p className="text-xs text-white/50 max-w-md mx-auto">
            {brandFilter === 'all'
              ? 'There are currently no events on the calendar. Click below to create your first event.'
              : `No events found for ${BRAND_DISPLAY[brandFilter] || brandFilter}.`}
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Event</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((evt) => {
            const brandName = BRAND_DISPLAY[evt.brand] || evt.brand || 'Tamarind Village';

            return (
              <div
                key={evt.id}
                className="bg-[#1F1615] rounded-xl border border-[#C59B27]/25 overflow-hidden shadow-lg flex flex-col justify-between hover:border-[#C59B27]/50 transition-all duration-300"
              >
                <div>
                  {/* Event Poster Header */}
                  <div className="relative h-44 w-full bg-black/40 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={evt.image || evt.posterUrl || 'https://media.tamarind.co.ke/tvl-website-assets/dhow_sunset_cruise.jpg'}
                      alt={evt.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1F1615] via-transparent to-transparent" />

                    {/* Brand Tag Top Left */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-[#C59B27] border border-[#C59B27]/40 shadow-sm">
                        {brandName}
                      </span>
                    </div>

                    {/* Payment Capability Badge Top Right */}
                    <div className="absolute top-2.5 right-2.5">
                      {evt.paymentEnabled ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Payments Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-neutral-900/80 text-neutral-300 border border-neutral-600/40 flex items-center gap-1 shadow-sm">
                          <Lock className="w-2.5 h-2.5 text-[#C59B27]" /> Inquiries Only
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-serif text-base font-bold text-white leading-snug">
                        {evt.title}
                      </h3>
                      <p className="text-xs text-white/60 mt-1 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    </div>

                    {/* Key metadata grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                        <span className="truncate">{evt.startDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Clock className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                        <span className="truncate">{evt.timeText || 'Evening'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                        <span className="truncate text-white/80">{evt.venue} · {evt.city || 'Mombasa'}</span>
                      </div>
                    </div>

                    {/* Ticket Price Box */}
                    <div className="bg-black/30 rounded-lg p-2.5 border border-white/5 flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-white/40 uppercase font-bold block">Ticket Admission</span>
                        <span className="text-sm font-serif font-bold text-[#C59B27]">
                          KES {Number(evt.priceKes || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right text-[11px] font-mono text-white/60">
                        ${evt.priceUsd || 0} USD
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 pt-0 flex items-center gap-2 border-t border-white/5 mt-2">
                  <button
                    onClick={() => openEditModal(evt)}
                    className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-[#821124] text-white font-semibold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Event</span>
                  </button>
                  <button
                    onClick={() => handleDelete(evt.id, evt.title)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-950/60 text-white/50 hover:text-red-400 border border-white/10 transition-colors cursor-pointer"
                    title="Remove event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal (Add / Edit) */}
      {(showAddModal || editingEvent) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1F1615] border border-[#C59B27]/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-serif font-bold text-white">
                {editingEvent ? `Edit Event: ${editingEvent.title}` : 'Publish New Tamarind Event'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEvent(null);
                }}
                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingEvent ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swahili Jazz Dhow Dinner Cruise"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                    Brand / Unit
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  >
                    <option value="tamarind_village">Tamarind Village</option>
                    <option value="tamarind_restaurant">Tamarind Mombasa Restaurant</option>
                    <option value="dawa_terrace">Dawa Terrace</option>
                    <option value="tamarind_dhow">Tamarind Dhow</option>
                    <option value="golden_key">Golden Key Casino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                    City Location
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  >
                    <option value="Mombasa">Mombasa</option>
                    <option value="Nairobi">Nairobi</option>
                    <option value="Nationwide">Nationwide</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                    Venue Description
                  </label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                    Event Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 18:30 – 22:30"
                    value={timeText}
                    onChange={(e) => setTimeText(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                    End Date (if multi-day festival)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                    Price (KES)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={priceKes}
                    onChange={(e) => setPriceKes(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={priceUsd}
                    onChange={(e) => setPriceUsd(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                  Poster Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://media.tamarind.co.ke/tvl-website-assets/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              {/* Payment capability switch with management note */}
              <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Online Booking &amp; Payment Gateway</span>
                    <span className="text-[11px] text-white/50 block">
                      Enables direct Paystack card &amp; M-Pesa checkouts for this event.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentEnabled}
                      onChange={(e) => setPaymentEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#821124]"></div>
                  </label>
                </div>
                {!paymentEnabled && (
                  <div className="flex items-center gap-1.5 text-[10px] text-[#C59B27] bg-[#C59B27]/10 p-2 rounded-lg">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Payment capability awaiting management approval. Public site will route guests to the inquiry form.</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                  External Ticketing Link (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://ticketsasa.com/events/..."
                  value={externalTicketUrl}
                  onChange={(e) => setExternalTicketUrl(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEvent(null);
                  }}
                  className="px-4 py-1.5 rounded-lg border border-white/20 text-white text-xs font-semibold hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingEvent ? 'Save Changes' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
