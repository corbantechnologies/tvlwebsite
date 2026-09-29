'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Ticket, Ship, Sparkles, ArrowRight } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { ResortEvent } from '@/types';

interface EventsHighlightProps {
  events: ResortEvent[];
  onBookEvent?: (event: ResortEvent) => void;
}

export default function EventsHighlight({ events, onBookEvent }: EventsHighlightProps) {
  const activeEvents = events.filter(e => e.isActive !== false).slice(0, 3);

  return (
    <section className="py-20 bg-[#FAF6F0] relative overflow-hidden" id="events">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#821124]/10 text-[#821124] text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Village Happenings &amp; Dhow Cruises</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1F1615] font-bold">
              Upcoming Events &amp; Experiences
            </h2>
            <p className="text-sm text-[#1F1615]/75 max-w-xl">
              From candlelit dhow jazz cruises under full coastal moons to clifftop seafood tastings at Tamarind Restaurant.
            </p>
          </div>

          <Link
            href="/events"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#821124] hover:text-[#680e1c] group"
          >
            <span>View Complete Events Calendar</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeEvents.map((evt) => {
            const poster = evt.posterUrl || evt.image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5';
            const price = evt.ticketPriceKes || evt.priceKes;
            const dateStr = evt.eventDate || evt.startDate;
            const timeStr = evt.eventTime || evt.timeText;
            const cap = evt.capacity || evt.maxCapacity;

            return (
              <div
                key={evt.id}
                className="bg-white rounded-2xl overflow-hidden border border-[#C59B27]/30 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <OptimizedImage
                    src={poster}
                    alt={evt.title}
                    fill
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#821124] text-white text-[10px] font-bold tracking-wider uppercase shadow">
                    {evt.venue}
                  </div>

                  {price && (
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-bold text-[#821124]">
                      KES {price.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-4 text-[11px] text-[#1F1615]/60 mb-2">
                      {dateStr && (
                        <span className="flex items-center gap-1 font-semibold text-[#821124]">
                          <Calendar className="w-3.5 h-3.5 text-[#C59B27]" /> {dateStr}
                        </span>
                      )}
                      {timeStr && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {timeStr}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-lg font-bold text-[#1F1615] group-hover:text-[#821124] transition-colors">
                      {evt.title}
                    </h3>

                    <p className="text-xs text-[#1F1615]/75 line-clamp-2 mt-1.5">
                      {evt.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#1F1615]/10 flex items-center justify-between">
                    <span className="text-[11px] text-[#1F1615]/60 flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5 text-[#C59B27]" />
                      {cap ? `Capacity: ${cap} seats` : 'Limited Seating'}
                    </span>

                    <button
                      onClick={() => onBookEvent ? onBookEvent(evt) : null}
                      className="px-3.5 py-1.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Reserve
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
