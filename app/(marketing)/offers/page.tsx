'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BookingModal from '@/components/BookingModal';
import TransferModal from '@/components/TransferModal';
import GuestBookingTrackerModal from '@/components/GuestBookingTrackerModal';
import SpecialOffers from '@/components/SpecialOffers';
import { Home, Tag } from 'lucide-react';

export default function OffersPage() {
  const router = useRouter();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

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
          <nav className="flex items-center gap-2 text-xs text-stone-500 font-medium mb-8">
            <Link href="/" className="hover:text-brand-teal flex items-center gap-1 transition-colors">
              <Home className="w-3.5 h-3.5" /> Home
            </Link>
            <span>/</span>
            <span className="text-brand-dark font-bold">Special Offers</span>
          </nav>

          <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C59B27]/20 text-[#821124] text-xs font-bold uppercase tracking-widest">
              <Tag className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Stay &amp; Save</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#1F1615]">Special Offers</h1>
            <p className="text-stone-600 font-light text-sm leading-relaxed">
              Seasonal deals and stay packages at Tamarind Village. Prices update automatically from our booking engine.
            </p>
          </div>

          <SpecialOffers variant="light" />
        </div>
      </main>

      <Footer
        onNavigate={(sectionId) => router.push(`/#${sectionId}`)}
        onSelectDining={(dId) => router.push(`/dining/${dId}`)}
        onGoHome={() => router.push('/')}
        onOpenStaffPinModal={() => router.push('/admin/login')}
        onOpenTracking={() => setIsTrackingOpen(true)}
      />

      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
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
