'use client';

import React, { useState, useEffect } from 'react';
import { APARTMENTS } from '@/lib/data';
import { ApartmentType } from '@/types';
import ApartmentCard from '@/components/marketing/ApartmentCard';
import BookingModal from '@/components/marketing/BookingModal';
import { Sparkles, ShieldCheck, Check, Waves } from 'lucide-react';

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<ApartmentType[]>(APARTMENTS);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedApartmentId, setSelectedApartmentId] = useState('1-bedroom');

  useEffect(() => {
    fetch('/api/apartments')
      .then((r) => r.json())
      .then((d) => {
        if (d.apartments && d.apartments.length > 0) setApartments(d.apartments);
      })
      .catch(() => {});
  }, []);

  const handleSelect = (id: string) => {
    setSelectedApartmentId(id);
    setIsBookingOpen(true);
  };

  return (
    <div className="pt-28 pb-20 bg-[#FAF6F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#821124]/10 text-[#821124] text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Coastal Accommodations</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#1F1615]">
            Sea-Facing Suites &amp; Private Villas
          </h1>
          <p className="text-sm text-[#1F1615]/75">
            Designed in authentic Swahili style with modern luxury touches. Every suite features air-conditioned bedrooms, 
            a private harbour-view verandah, high-speed Wi-Fi, fully equipped kitchen, and 24-hour room service.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {apartments.map((apt) => (
            <ApartmentCard
              key={apt.id}
              apartment={apt}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preSelectedApartmentId={selectedApartmentId}
      />
    </div>
  );
}
