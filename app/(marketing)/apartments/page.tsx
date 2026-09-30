'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APARTMENTS } from '@/data';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BookingModal from '@/components/BookingModal';
import TransferModal from '@/components/TransferModal';
import GuestBookingTrackerModal from '@/components/GuestBookingTrackerModal';
import OptimizedImage from '@/components/OptimizedImage';
import { useLiveRates } from '@/utils/profitroom';
import { ShieldCheck, Maximize2, Users, CheckCircle2, ArrowRight, Home } from 'lucide-react';

export default function ApartmentsIndexPage() {
  const router = useRouter();
  const { getLivePrice } = useLiveRates();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [selectedApartmentId, setSelectedApartmentId] = useState('1-bedroom');

  // Slug converter e.g. "1-bedroom" -> "one-bedroom"
  const getSlug = (id: string) => {
    return id
      .replace('1-bedroom', 'one-bedroom')
      .replace('2-bedroom', 'two-bedroom')
      .replace('3-bedroom', 'three-bedroom');
  };

  return (
    <div className="min-h-screen bg-brand-sand font-sans text-brand-dark selection:bg-brand-teal selection:text-white flex flex-col w-full max-w-full overflow-x-hidden">
      <Navbar
        onNavigate={(sectionId) => router.push(`/#${sectionId}`)}
        onOpenBooking={() => setIsBookingOpen(true)}
        onOpenTransferModal={() => setIsTransferOpen(true)}
        onOpenTracking={() => setIsTrackingOpen(true)}
        activeView="home"
        onGoHome={() => router.push('/')}
      />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-stone-500 font-medium mb-8">
            <Link href="/" className="hover:text-brand-teal flex items-center gap-1 transition-colors">
              <Home className="w-3.5 h-3.5" /> Home
            </Link>
            <span>/</span>
            <span className="text-brand-dark font-bold">Accommodations</span>
          </nav>

          {/* Heading */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-teal/10 border border-brand-teal/25 text-brand-teal text-xs font-bold uppercase tracking-widest mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />
              <span>Coastal Swahili Luxury</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-dark tracking-tight">
              Our Luxury Serviced Residences
            </h1>
            <p className="text-stone-600 font-light mt-4 text-sm sm:text-base leading-relaxed">
              Explore our collection of spacious, fully serviced ocean-view apartments perched on Nyali's coral cliff overlooking Tudor Creek.
            </p>
          </div>

          {/* Apartments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center justify-center">
            {APARTMENTS.map((apt, index) => {
              const { price: livePrice, isLive } = getLivePrice(apt.id, apt.pricePerNight);
              const slug = getSlug(apt.id);

              return (
                <div
                  key={apt.id}
                  className="bg-white border border-stone-200 rounded-none overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group w-full max-w-sm"
                  id={`card-${apt.id}`}
                >
                  <Link href={`/apartments/${slug}`} className="block relative aspect-[16/10] overflow-hidden bg-stone-100">
                    <OptimizedImage
                      src={apt.image}
                      preset="card"
                      alt={apt.name}
                      className="w-full h-full object-cover transform duration-500 group-hover:scale-103"
                    />
                    <div className="absolute top-4 right-4 bg-brand-dark/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                      {apt.viewType.split(' ')[0]} View
                    </div>
                  </Link>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <div>
                      <Link href={`/apartments/${slug}`}>
                        <h2 className="font-serif text-xl text-brand-dark group-hover:text-brand-teal transition-colors mb-2">
                          {apt.name}
                        </h2>
                      </Link>

                      <p className="text-stone-500 text-xs font-light leading-relaxed mb-4 line-clamp-3">
                        {apt.description}
                      </p>

                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-stone-200 text-stone-600 font-medium">
                        <div className="flex items-center gap-1.5 justify-center">
                          <Maximize2 className="w-4 h-4 text-brand-teal" />
                          <span className="text-[11px] font-mono">{apt.size}</span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-center">
                          <Users className="w-4 h-4 text-brand-teal" />
                          <span className="text-[11px] font-mono">Max {apt.maxGuests}</span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-center">
                          <span className="text-[11px] font-serif font-bold text-brand-teal">{apt.bedrooms} Bed</span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">Key Highlights:</span>
                        {apt.highlights.slice(0, 2).map((hl: string, idx: number) => (
                          <div key={idx} className="flex gap-2 items-start text-[11px] text-stone-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal flex-shrink-0 mt-0.5" />
                            <span className="font-light">{hl}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                            {isLive ? 'Live Rate' : 'Base Rate'}
                          </span>
                          {isLive && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 text-[8px] font-bold text-white bg-emerald-600 rounded-none uppercase tracking-wider">
                              ● Live
                            </span>
                          )}
                        </div>
                        <p className="text-xl font-serif text-brand-dark font-extrabold">
                          ${livePrice} <span className="text-xs font-sans text-stone-500 font-light">/ night</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/apartments/${slug}`}
                          className="px-3 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-none text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer text-center inline-flex items-center gap-1"
                          id={`btn-view-${apt.id}`}
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedApartmentId(apt.id);
                            setIsBookingOpen(true);
                          }}
                          className="px-4 py-2 bg-brand-dark hover:bg-brand-teal text-white rounded-none text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer text-center inline-flex items-center gap-1"
                          id={`btn-book-${apt.id}`}
                        >
                          <span>Book</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer
        onNavigate={(sectionId) => router.push(`/#${sectionId}`)}
        onSelectApartment={(id) => router.push(`/apartments/${getSlug(id)}`)}
        onSelectDining={(dId) => router.push(`/dining/${dId}`)}
        onGoHome={() => router.push('/')}
        onOpenStaffPinModal={() => { window.location.href = '/admin/login'; }}
        onOpenTracking={() => setIsTrackingOpen(true)}
      />

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialApartmentId={selectedApartmentId}
        apartmentsList={APARTMENTS}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
      />

      <GuestBookingTrackerModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        onOpenBookingModal={() => {
          setIsTrackingOpen(false);
          setIsBookingOpen(true);
        }}
      />
    </div>
  );
}
