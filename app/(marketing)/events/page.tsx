'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Ticket, Ship, Sparkles, ArrowRight, Filter, ExternalLink, Lock, CheckCircle2 } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import BookingModal from '@/components/BookingModal';
import { DEFAULT_EVENTS } from '@/lib/data';

interface EventItem {
  id: string;
  title: string;
  slug?: string;
  description: string;
  brand?: string;
  venue: string;
  city?: string;
  category?: string;
  startDate?: string;
  endDate?: string | null;
  eventDate?: string;
  timeText?: string;
  eventTime?: string;
  priceKes?: number;
  ticketPriceKes?: number;
  priceUsd?: number;
  image?: string;
  posterUrl?: string;
  maxCapacity?: number;
  capacity?: number;
  paymentEnabled?: boolean;
  externalTicketUrl?: string | null;
  isActive?: boolean;
}

const BRAND_FILTERS = [
  { id: 'all', label: 'All Happenings' },
  { id: 'tamarind_village', label: 'Tamarind Village' },
  { id: 'tamarind_restaurant', label: 'Tamarind Restaurant' },
  { id: 'dawa_terrace', label: 'Dawa Terrace' },
  { id: 'tamarind_dhow', label: 'Tamarind Dhow' },
  { id: 'golden_key', label: 'Golden Key Casino' },
];

const BRAND_DISPLAY: Record<string, string> = {
  tamarind_village: 'Tamarind Village',
  tamarind_restaurant: 'Tamarind Restaurant',
  dawa_terrace: 'Dawa Terrace',
  tamarind_dhow: 'Tamarind Dhow',
  golden_key: 'Golden Key Casino',
};

function getBrandUrl(brand?: string, venue?: string): string {
  const b = (brand || '').toLowerCase();
  const v = (venue || '').toLowerCase();
  if (b.includes('restaurant') || v.includes('restaurant')) return '/dining/tamarind-restaurant';
  if (b.includes('dhow') || v.includes('dhow')) return '/dining/tamarind-dhow';
  if (b.includes('dawa') || v.includes('dawa')) return '/dining/dawa-terrace';
  if (b.includes('village') || v.includes('village')) return '/apartments';
  return '/dining';
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedEventForModal, setSelectedEventForModal] = useState<EventItem | null>(null);

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((d) => {
        if (d.events && d.events.length > 0) setEvents(d.events);
      })
      .catch(() => {});
  }, []);

  const filtered = events.filter((e) => {
    if (selectedBrand === 'all') return true;
    if (e.brand) return e.brand === selectedBrand;
    // Fallback: match venue substring
    return e.venue?.toLowerCase().includes(selectedBrand.replace('tamarind_', '').toLowerCase());
  });

  const handleAction = (evt: EventItem) => {
    if (evt.externalTicketUrl) {
      window.open(evt.externalTicketUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setSelectedEventForModal(evt);
    setIsBookingOpen(true);
  };

  return (
    <div className="pt-28 pb-20 bg-[#FAF6F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#821124]/10 text-[#821124] text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Tamarind Mombasa Events &amp; Experiences</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#1F1615]">
            Culinary Experiences &amp; Events Calendar
          </h1>
          <p className="text-sm text-[#1F1615]/75 leading-relaxed">
            Discover upcoming live jazz dhow cruises past Mombasa Old Harbour, clifftop seafood tastings, 
            sunset cocktail sessions at Dawa Terrace, and gala evenings across the Tamarind Mombasa group.
          </p>

          {/* Brand Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {BRAND_FILTERS.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBrand(b.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedBrand === b.id
                    ? 'bg-[#821124] text-white shadow-md'
                    : 'bg-white text-[#1F1615] border border-[#C59B27]/30 hover:bg-white/80'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid or Clean Empty Notification */}
        {filtered && filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filtered.map((evt) => {
            const poster = evt.image || evt.posterUrl || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5';
            const priceKes = evt.priceKes || evt.ticketPriceKes || 0;
            const priceUsd = evt.priceUsd || 0;
            const dateStr = evt.startDate || evt.eventDate || 'Coming Soon';
            const timeStr = evt.timeText || evt.eventTime || 'Evening';
            const brandLabel = BRAND_DISPLAY[evt.brand || ''] || evt.brand || 'Tamarind Mombasa';

            return (
              <div
                key={evt.id}
                className="bg-white rounded-2xl overflow-hidden border border-[#C59B27]/30 shadow-md hover:shadow-2xl transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-56 w-full overflow-hidden bg-black/40">
                    <OptimizedImage
                      src={poster}
                      alt={evt.title}
                      fill
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                    
                    {/* Brand Pill */}
                    <Link
                      href={getBrandUrl(evt.brand, evt.venue)}
                      className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#821124] hover:bg-[#680e1c] text-white text-[10px] font-bold tracking-wider uppercase shadow transition-colors cursor-pointer"
                    >
                      {brandLabel}
                    </Link>

                    {/* Price Badge */}
                    {priceKes > 0 && (
                      <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-xs font-bold text-[#821124] shadow flex items-baseline gap-1">
                        <span>KES {priceKes.toLocaleString()}</span>
                        {priceUsd > 0 && <span className="text-[10px] font-mono text-[#1F1615]/60">(${priceUsd})</span>}
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <div className="flex items-center gap-4 text-xs text-[#1F1615]/70 mb-2">
                        <span className="flex items-center gap-1 font-semibold text-[#821124]">
                          <Calendar className="w-4 h-4 text-[#C59B27]" /> {dateStr}
                        </span>
                        {timeStr && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#C59B27]" /> {timeStr}
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif text-xl font-bold text-[#1F1615] group-hover:text-[#821124] transition-colors leading-snug">
                        {evt.title}
                      </h3>

                      <div className="mt-1">
                        <Link
                          href={getBrandUrl(evt.brand, evt.venue)}
                          className="inline-flex items-center gap-1 text-[11px] text-[#821124] hover:text-[#C59B27] font-semibold transition-colors"
                        >
                          <MapPin className="w-3 h-3 text-[#C59B27]" />
                          <span>Hosted at {evt.venue} · {evt.city || 'Mombasa'}</span>
                          <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                        </Link>
                      </div>

                      <p className="text-xs text-[#1F1615]/75 mt-3 leading-relaxed line-clamp-3">
                        {evt.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0 border-t border-[#1F1615]/10 mt-4 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[#1F1615]/60 flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5 text-[#C59B27]" />
                    {evt.maxCapacity || evt.capacity ? `Capacity: ${evt.maxCapacity || evt.capacity}` : 'RSVP'}
                  </span>

                  {evt.externalTicketUrl ? (
                    <button
                      onClick={() => handleAction(evt)}
                      className="px-4 py-2 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Buy Tickets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  ) : evt.paymentEnabled ? (
                    <button
                      onClick={() => handleAction(evt)}
                      className="px-4 py-2 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Book Online</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(evt)}
                      className="px-4 py-2 rounded-xl bg-[#1F1615] hover:bg-[#821124] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Inquire / RSVP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        ) : (
          <div className="max-w-xl mx-auto text-center py-16 px-6 bg-white rounded-2xl border border-[#C59B27]/30 shadow-sm space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#821124]/10 text-[#821124] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#C59B27]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1F1615]">
              No Events Currently Scheduled
            </h3>
            <p className="text-xs text-[#1F1615]/70 leading-relaxed">
              We are currently curating upcoming live jazz cruises, clifftop tastings, and special gatherings. Please check back soon or inquire with our team directly.
            </p>
            <div className="pt-2">
              <Link
                href="/#dining-section"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>Explore Dining &amp; Dhow</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setSelectedEventForModal(null);
        }}
      />
    </div>
  );
}
