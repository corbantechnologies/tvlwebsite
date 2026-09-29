'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Ticket, Ship, Sparkles, ArrowRight, Filter } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import BookingModal from '@/components/marketing/BookingModal';
import { DEFAULT_EVENTS } from '@/lib/data';
import { ResortEvent } from '@/types';

export default function EventsPage() {
  const [events, setEvents] = useState<ResortEvent[]>(DEFAULT_EVENTS);
  const [filterVenue, setFilterVenue] = useState('all');
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((d) => {
        if (d.events && d.events.length > 0) setEvents(d.events);
      })
      .catch(() => {});
  }, []);

  const filtered = events.filter((e) => {
    if (filterVenue === 'all') return true;
    return e.venue.toLowerCase().includes(filterVenue.toLowerCase());
  });

  return (
    <div className="pt-28 pb-20 bg-[#FAF6F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#821124]/10 text-[#821124] text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Village &amp; Dhow Happenings</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#1F1615]">
            Events &amp; Dhow Dining Calendar
          </h1>
          <p className="text-sm text-[#1F1615]/75">
            Discover upcoming live jazz evenings, full-moon dhow charters, Swahili cultural feasts, 
            and clifftop culinary showcases across Tamarind Village.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setFilterVenue('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterVenue === 'all'
                  ? 'bg-[#821124] text-white shadow-md'
                  : 'bg-white text-[#1F1615] border border-[#C59B27]/30 hover:bg-white/80'
              }`}
            >
              All Happenings
            </button>
            <button
              onClick={() => setFilterVenue('dhow')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterVenue === 'dhow'
                  ? 'bg-[#821124] text-white shadow-md'
                  : 'bg-white text-[#1F1615] border border-[#C59B27]/30 hover:bg-white/80'
              }`}
            >
              Tamarind Dhow
            </button>
            <button
              onClick={() => setFilterVenue('restaurant')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterVenue === 'restaurant'
                  ? 'bg-[#821124] text-white shadow-md'
                  : 'bg-white text-[#1F1615] border border-[#C59B27]/30 hover:bg-white/80'
              }`}
            >
              Tamarind Restaurant
            </button>
            <button
              onClick={() => setFilterVenue('village')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterVenue === 'village'
                  ? 'bg-[#821124] text-white shadow-md'
                  : 'bg-white text-[#1F1615] border border-[#C59B27]/30 hover:bg-white/80'
              }`}
            >
              Village Clifftop &amp; Pool
            </button>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filtered.map((evt) => (
            <div
              key={evt.id}
              className="bg-white rounded-2xl overflow-hidden border border-[#C59B27]/30 shadow-md hover:shadow-2xl transition-all flex flex-col justify-between group"
            >
              <div className="relative h-56 w-full overflow-hidden">
                <OptimizedImage
                  src={evt.posterUrl || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5'}
                  alt={evt.title}
                  fill
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#821124] text-white text-[10px] font-bold tracking-wider uppercase shadow">
                  {evt.venue}
                </div>

                {evt.ticketPriceKes && (
                  <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-xs font-bold text-[#821124] shadow">
                    KES {evt.ticketPriceKes.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-4 text-xs text-[#1F1615]/70 mb-2">
                    <span className="flex items-center gap-1 font-semibold text-[#821124]">
                      <Calendar className="w-4 h-4 text-[#C59B27]" /> {evt.eventDate}
                    </span>
                    {evt.eventTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {evt.eventTime}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-xl font-bold text-[#1F1615] group-hover:text-[#821124] transition-colors">
                    {evt.title}
                  </h3>

                  <p className="text-xs text-[#1F1615]/75 mt-2 leading-relaxed">
                    {evt.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#1F1615]/10 flex items-center justify-between">
                  <span className="text-xs text-[#1F1615]/60 flex items-center gap-1">
                    <Ticket className="w-4 h-4 text-[#C59B27]" />
                    {evt.capacity ? `Capacity: ${evt.capacity} guests` : 'RSVP Required'}
                  </span>

                  <button
                    onClick={() => setIsBookingOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Reserve Seats
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}
