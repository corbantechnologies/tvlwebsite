'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DINING } from '@/data';
import { DiningExperience } from '@/types';
import DiningDetail from '@/components/DiningDetail';
import BookingModal from '@/components/BookingModal';
import TransferModal from '@/components/TransferModal';
import GuestBookingTrackerModal from '@/components/GuestBookingTrackerModal';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Home } from 'lucide-react';

interface DiningPageProps {
  params: Promise<{ slug: string }>;
}

export default function DedicatedDiningPage({ params }: DiningPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const slug = resolvedParams.slug.toLowerCase();

  const venue: DiningExperience =
    DINING.find((d) => d.id.toLowerCase() === slug) ||
    DINING[0];

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  const handleSelectDining = (id: string) => {
    router.push(`/dining/${id}`);
  };

  return (
    <div className="min-h-screen bg-brand-sand font-sans text-brand-dark selection:bg-brand-teal selection:text-white flex flex-col w-full max-w-full overflow-x-hidden">
      <Navbar
        onNavigate={(sectionId) => router.push(`/#${sectionId}`)}
        onOpenBooking={() => setIsBookingOpen(true)}
        onOpenTransferModal={() => setIsTransferOpen(true)}
        onOpenTracking={() => setIsTrackingOpen(true)}
        activeView="dining"
        onGoHome={() => router.push('/')}
      />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <nav className="flex items-center gap-2 text-xs text-stone-500 font-medium">
            <Link href="/" className="hover:text-brand-teal flex items-center gap-1 transition-colors">
              <Home className="w-3.5 h-3.5" /> Home
            </Link>
            <span>/</span>
            <Link href="/#dining-section" className="hover:text-brand-teal transition-colors">
              Dining &amp; Dhow
            </Link>
            <span>/</span>
            <span className="text-brand-dark font-bold">{venue.name}</span>
          </nav>
        </div>

        <DiningDetail
          dining={venue}
          onBack={() => router.push('/#dining-section')}
          onSelectDining={handleSelectDining}
          allDinings={DINING}
        />
      </main>

      <Footer
        onNavigate={(sectionId) => router.push(`/#${sectionId}`)}
        onSelectApartment={(aptId) => router.push(`/apartments/${aptId}`)}
        onSelectDining={handleSelectDining}
        onGoHome={() => router.push('/')}
        onOpenStaffPinModal={() => { window.location.href = '/admin/login'; }}
        onOpenTracking={() => setIsTrackingOpen(true)}
      />

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
      />

      <GuestBookingTrackerModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
      />
    </div>
  );
}
