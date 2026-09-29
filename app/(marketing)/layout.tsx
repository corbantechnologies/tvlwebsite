'use client';

import React, { useState } from 'react';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import MobileBookingBar from '@/components/marketing/MobileBookingBar';
import BookingModal from '@/components/marketing/BookingModal';
import GuestBookingTrackerModal from '@/components/marketing/GuestBookingTrackerModal';
import { Toaster } from 'react-hot-toast';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<string>('ro');
  const [selectedApartment, setSelectedApartment] = useState<string>('1-bedroom');

  const openBooking = (pkgId?: string, aptId?: string) => {
    if (pkgId) setSelectedPkg(pkgId);
    if (aptId) setSelectedApartment(aptId);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] text-[#1F1615]">
      <Toaster position="top-right" />
      <Navbar 
        onOpenBooking={() => openBooking()} 
        onOpenTracking={() => setIsTrackingOpen(true)} 
      />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <MobileBookingBar onOpenBooking={() => openBooking()} />

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preSelectedPkg={selectedPkg}
        preSelectedApartmentId={selectedApartment}
      />

      <GuestBookingTrackerModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
      />
    </div>
  );
}
