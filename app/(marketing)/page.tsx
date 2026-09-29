'use client';

import React, { useState, useEffect } from 'react';
import HeroSection from '@/components/marketing/HeroSection';
import ApartmentCard from '@/components/marketing/ApartmentCard';
import EventsHighlight from '@/components/marketing/EventsHighlight';
import PackagesShowcase from '@/components/marketing/PackagesShowcase';
import BookingModal from '@/components/marketing/BookingModal';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { APARTMENTS, DEFAULT_EVENTS, DEFAULT_RESORT_PACKAGES, DINING, FACILITIES, REVIEWS } from '@/lib/data';
import { ApartmentType, ResortEvent, ResortPackage } from '@/types';
import { Waves, Ship, Utensils, Sparkles, Star, MapPin, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [apartments, setApartments] = useState<ApartmentType[]>(APARTMENTS);
  const [events, setEvents] = useState<ResortEvent[]>(DEFAULT_EVENTS);
  const [packages, setPackages] = useState<ResortPackage[]>(DEFAULT_RESORT_PACKAGES);
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedApartmentId, setSelectedApartmentId] = useState('1-bedroom');
  const [selectedPkgId, setSelectedPkgId] = useState('ro');

  useEffect(() => {
    // Fetch live inventory, events, and packages
    const loadData = async () => {
      try {
        const [aptRes, evtRes, pkgRes] = await Promise.all([
          fetch('/api/apartments').catch(() => null),
          fetch('/api/events').catch(() => null),
          fetch('/api/packages').catch(() => null),
        ]);

        if (aptRes && aptRes.ok) {
          const d = await aptRes.json();
          if (d.apartments && d.apartments.length > 0) setApartments(d.apartments);
        }
        if (evtRes && evtRes.ok) {
          const d = await evtRes.json();
          if (d.events && d.events.length > 0) setEvents(d.events);
        }
        if (pkgRes && pkgRes.ok) {
          const d = await pkgRes.json();
          if (d.packages && d.packages.length > 0) setPackages(d.packages);
        }
      } catch (err) {
        console.warn('Using static fallback resort data:', err);
      }
    };
    loadData();
  }, []);

  const handleOpenBooking = (pkgId?: string, aptId?: string) => {
    if (pkgId) setSelectedPkgId(pkgId);
    if (aptId) setSelectedApartmentId(aptId);
    setIsBookingModalOpen(true);
  };

  return (
    <div>
      {/* 1. Hero Section */}
      <HeroSection onOpenBooking={(pkg) => handleOpenBooking(pkg)} />

      {/* 2. Direct Perks Banner */}
      <section className="bg-[#821124] text-white py-6 border-y border-[#C59B27]/40 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 text-xs tracking-wider">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C59B27]" />
            <span className="font-bold">Direct Booking Perks:</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#C59B27]" />
            <span>Complimentary Sunset Welcome Cocktail</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#C59B27]" />
            <span>Priority Seating on Tamarind Dhow</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#C59B27]" />
            <span>Guaranteed Best Rates &amp; Flexible Check-In</span>
          </div>
        </div>
      </section>

      {/* 3. Luxury Accommodations Showcase */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6" id="accommodations">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#821124]/10 text-[#821124] text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Coastal Sanctuaries</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1F1615] font-bold">
              Private Sea-Facing Suites &amp; Villas
            </h2>
            <p className="text-sm text-[#1F1615]/75 max-w-xl">
              Spacious Swahili architecture with private verandahs, handcrafted Lamu furniture, modern kitchens, and direct clifftop breeze.
            </p>
          </div>

          <Link
            href="/apartments"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#821124] hover:text-[#680e1c] group"
          >
            <span>Explore All 3 Categories</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {apartments.map((apt) => (
            <ApartmentCard
              key={apt.id}
              apartment={apt}
              onSelect={(id) => handleOpenBooking(undefined, id)}
            />
          ))}
        </div>
      </section>

      {/* 4. Dining & Dhow Experience Feature */}
      <section className="py-20 bg-[#1F1615] text-[#FAF6F0] relative overflow-hidden" id="dining">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C59B27]/20 border border-[#C59B27]/40 text-[#C59B27] text-xs font-semibold tracking-widest uppercase">
              <Ship className="w-3.5 h-3.5" />
              <span>The Legend of Mombasa Gastronomy</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white leading-tight">
              Tamarind Mombasa &amp; The Legendary Dhow Cruise
            </h2>

            <p className="text-sm sm:text-base text-white/80 leading-relaxed font-light">
              Perched on a coral cliff overlooking the picturesque Old Harbour of Mombasa, Tamarind Restaurant is renowned as one of Africa’s finest seafood destinations. 
              Pair your stay with a romantic sunset cruise aboard our authentic Arab sailing dhow, drifting under starlit skies with live music and fresh lobster.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <Utensils className="w-5 h-5 text-[#C59B27] mb-2" />
                <h4 className="font-serif font-bold text-white text-base">Tamarind Restaurant</h4>
                <p className="text-xs text-white/70 mt-1">Clifftop dining, mangrove crab, and fresh daily catch.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <Ship className="w-5 h-5 text-[#C59B27] mb-2" />
                <h4 className="font-serif font-bold text-white text-base">Tamarind Dhow</h4>
                <p className="text-xs text-white/70 mt-1">Lunch &amp; dinner sailing charters along Tudor Creek.</p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/dining"
                className="px-6 py-3.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-all flex items-center gap-2"
              >
                <span>View Menus &amp; Sailings</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Dining Photography */}
          <div className="relative h-[480px] rounded-3xl overflow-hidden shadow-2xl border border-[#C59B27]/30">
            <OptimizedImage
              src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80"
              alt="Tamarind Dhow Sailing at Sunset"
              fill
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 5. Incoming Events Section */}
      <EventsHighlight
        events={events}
        onBookEvent={() => handleOpenBooking()}
      />

      {/* 6. Signature Packages Section */}
      <PackagesShowcase
        packages={packages}
        onSelectPackage={(pkg) => handleOpenBooking(pkg.id)}
      />

      {/* 7. Guest Reviews & Heritage */}
      <section className="py-20 bg-[#FAF6F0] border-t border-[#C59B27]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <div className="flex justify-center gap-1 text-[#C59B27] mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#C59B27]" />
              ))}
            </div>
            <h2 className="font-serif text-3xl font-bold text-[#1F1615]">
              Celebrated by Discerning Guests
            </h2>
            <p className="text-xs text-[#1F1615]/70">
              Moments of magic captured from travellers across the globe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((rev, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-[#C59B27]/25 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-1 text-[#C59B27]">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#C59B27]" />
                  ))}
                </div>
                <p className="text-xs text-[#1F1615]/80 italic leading-relaxed">
                  &ldquo;{rev.quote}&rdquo;
                </p>
                <div className="pt-2 border-t border-[#1F1615]/10 flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1F1615]">{rev.author}</span>
                  <span className="text-[#1F1615]/50">{rev.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        preSelectedApartmentId={selectedApartmentId}
        preSelectedPkg={selectedPkgId}
      />
    </div>
  );
}
