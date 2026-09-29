'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, Sparkles, MapPin, ArrowRight, ShieldCheck, Ship, Utensils, Star, Users } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface HeroSectionProps {
  onOpenBooking: (pkgId?: string) => void;
}

export default function HeroSection({ onOpenBooking }: HeroSectionProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [suiteType, setSuiteType] = useState('any');

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenBooking();
  };

  return (
    <section className="relative min-h-[92vh] sm:min-h-screen flex flex-col justify-between pt-28 pb-12 sm:pb-16 overflow-hidden">
      {/* Background with subtle luxury overlay */}
      <div className="absolute inset-0 -z-10">
        <OptimizedImage
          src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2000&q=85"
          alt="Tamarind Village Mombasa Clifftop Pool and Harbour"
          fill
          priority
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F1615] via-transparent to-black/50" />
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full my-auto py-10">
        <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C59B27]/20 border border-[#C59B27]/40 text-[#C59B27] backdrop-blur-md text-xs font-semibold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mombasa Old Harbour • Nyali Waterfront Sanctuary</span>
          </div>

          {/* Heading */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-white font-bold leading-tight tracking-tight drop-shadow-md">
            Coastal Grandeur &amp; Private Luxury Suites Overlooking Tudor Creek
          </h1>

          {/* Subheading */}
          <p className="text-white/85 text-base sm:text-lg sm:leading-relaxed font-light max-w-2xl">
            Experience Mombasa’s most iconic sanctuary. Elegant Swahili-styled oceanfront apartments, 
            world-renowned fresh seafood at Tamarind Restaurant, and unforgettable sunset voyages aboard the Tamarind Dhow.
          </p>

          {/* Direct CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onOpenBooking()}
              className="px-7 py-4 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white font-semibold text-sm uppercase tracking-wider shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Reserve Your Stay</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <Link
              href="/dining"
              className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-medium text-sm backdrop-blur-md transition-all flex items-center gap-2"
            >
              <Ship className="w-4 h-4 text-[#C59B27]" />
              <span>Tamarind Dhow &amp; Dining</span>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-white/70">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
              <span>Direct Booking Rate Guarantee</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-[#C59B27] fill-[#C59B27]" />
              <span>4.8/5 Guest Satisfaction</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-[#C59B27]" />
              <span>Award-Winning Seafood</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Availability Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <form
          onSubmit={handleQuickSearch}
          className="bg-[#FAF6F0] rounded-2xl p-4 sm:p-5 shadow-2xl border border-[#C59B27]/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-[#1F1615]"
        >
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#821124] mb-1">
              Check-In Date
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full text-xs sm:text-sm font-medium bg-white border border-[#1F1615]/20 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#821124]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#821124] mb-1">
              Check-Out Date
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full text-xs sm:text-sm font-medium bg-white border border-[#1F1615]/20 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#821124]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#821124] mb-1">
              Apartment Type
            </label>
            <select
              value={suiteType}
              onChange={(e) => setSuiteType(e.target.value)}
              className="w-full text-xs sm:text-sm font-medium bg-white border border-[#1F1615]/20 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#821124]"
            >
              <option value="any">All Suites &amp; Apartments</option>
              <option value="1-bedroom">1-Bedroom Sea View Suite</option>
              <option value="2-bedroom">2-Bedroom Garden/Sea View</option>
              <option value="3-bedroom">3-Bedroom Grand Villa</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#821124] mb-1">
              Guests
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full text-xs sm:text-sm font-medium bg-white border border-[#1F1615]/20 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#821124]"
            >
              <option value="1">1 Guest</option>
              <option value="2">2 Guests</option>
              <option value="4">4 Guests</option>
              <option value="6">6+ Guests (Family Villa)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 h-[42px] cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Check Rates</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
