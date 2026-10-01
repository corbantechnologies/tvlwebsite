'use client';

import React, { useState } from 'react';
import { Ship, Utensils, Sparkles, Clock, MapPin, Users, Phone, ArrowRight } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import DiningInquiryModal from '@/components/marketing/DiningInquiryModal';
import { DINING } from '@/lib/data';

export default function DiningPage() {
  const [isDiningInquiryOpen, setIsDiningInquiryOpen] = useState(false);
  const [selectedVenueKey, setSelectedVenueKey] = useState<'restaurant' | 'dawa_terrace' | 'dhow' | 'golden_key'>('restaurant');
  const [selectedVenueTitle, setSelectedVenueTitle] = useState('');

  const handleOpenInquiry = (venueId: string, title: string) => {
    const map: Record<string, 'restaurant' | 'dawa_terrace' | 'dhow' | 'golden_key'> = {
      'tamarind-restaurant': 'restaurant',
      'dawa-terrace': 'dawa_terrace',
      'tamarind-dhow': 'dhow',
      'golden-key': 'golden_key',
    };
    setSelectedVenueKey(map[venueId] || 'restaurant');
    setSelectedVenueTitle(title);
    setIsDiningInquiryOpen(true);
  };

  return (
    <div className="pt-28 pb-20 bg-[#FAF6F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#821124]/10 text-[#821124] text-xs font-bold uppercase tracking-widest">
            <Utensils className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>World-Class Culinary Excellence</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#1F1615]">
            Tamarind Mombasa &amp; The Tamarind Dhow
          </h1>
          <p className="text-sm text-[#1F1615]/75">
            Indulge in freshly caught seafood on our coral clifftop or embark on an unforgettable lunch or dinner sailing 
            cruise aboard our traditional Arab dhow along Mombasa’s Tudor Creek.
          </p>
        </div>

        {/* Venues Grid */}
        <div className="space-y-12">
          {DINING.map((venue, idx) => (
            <div
              key={venue.id}
              className={`bg-white rounded-3xl overflow-hidden border border-[#C59B27]/30 shadow-xl grid grid-cols-1 lg:grid-cols-2 items-center ${
                idx % 2 === 1 ? 'lg:grid-flow-dense' : ''
              }`}
            >
              <div className={`relative h-80 lg:h-full min-h-[360px] ${idx % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                <OptimizedImage
                  src={venue.image || "https://images.unsplash.com/photo-1544551763-46a013bb70d5"}
                  alt={venue.title || venue.name || "Dining Experience"}
                  fill
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>

              <div className="p-8 sm:p-12 space-y-6">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#821124] font-bold block mb-1">
                    {venue.cuisine}
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-[#1F1615]">
                    {venue.title}
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-[#1F1615]/80 leading-relaxed">
                  {venue.description}
                </p>

                <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-[#1F1615]/10">
                  <div>
                    <span className="text-[#1F1615]/60 block mb-0.5">Operating Hours:</span>
                    <span className="font-semibold text-[#1F1615]">{venue.hours}</span>
                  </div>
                  <div>
                    <span className="text-[#1F1615]/60 block mb-0.5">Dress Code:</span>
                    <span className="font-semibold text-[#1F1615]">{venue.dressCode}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1F1615]/70 block">
                    Signature Specialties:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(venue.signatureDishes || []).map((dish, i) => (
                      <span key={i} className="text-xs bg-[#FAF6F0] text-[#821124] px-3 py-1 rounded-full border border-[#C59B27]/30 font-medium">
                        {dish}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleOpenInquiry(venue.id, venue.title || venue.name)}
                    className="px-6 py-3 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Reserve Table / Dhow Cruise</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DiningInquiryModal
        isOpen={isDiningInquiryOpen}
        onClose={() => setIsDiningInquiryOpen(false)}
        defaultVenue={selectedVenueKey}
        venueName={selectedVenueTitle}
      />
    </div>
  );
}
