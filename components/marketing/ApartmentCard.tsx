'use client';

import React from 'react';
import { Users, Maximize2, Waves, Check, ArrowRight } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { ApartmentType } from '@/types';

interface ApartmentCardProps {
  apartment: ApartmentType;
  onSelect: (id: string) => void;
}

export default function ApartmentCard({ apartment, onSelect }: ApartmentCardProps) {
  const displayImage = (apartment.images && apartment.images[0]) || apartment.image || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b';
  const displayTitle = apartment.title || apartment.name;
  const displayPrice = apartment.pricePerNightKes || apartment.pricePerNight || 25000;
  const displayCapacity = apartment.capacity || apartment.maxGuests || 2;
  const displaySize = apartment.sizeSqMeters || apartment.size || '120';

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-[#C59B27]/25 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
      {/* Image Container with Badge */}
      <div className="relative h-64 w-full overflow-hidden">
        <OptimizedImage
          src={displayImage}
          alt={displayTitle}
          fill
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#821124] text-white text-[11px] font-semibold tracking-wider uppercase shadow-md">
          {apartment.bedrooms} Bedroom Suite
        </div>

        {/* Starting Price Pill */}
        <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-[#1F1615] text-xs font-bold shadow-lg">
          <span className="text-[10px] text-[#821124] block uppercase tracking-wider">From</span>
          KES {displayPrice.toLocaleString()} / night
        </div>
      </div>

      {/* Body Details */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#1F1615] group-hover:text-[#821124] transition-colors">
            {displayTitle}
          </h3>
          <p className="text-xs text-[#1F1615]/75 line-clamp-2 mt-1">
            {apartment.description}
          </p>

          {/* Quick Specs */}
          <div className="grid grid-cols-3 gap-2 py-4 border-y border-[#1F1615]/10 mt-4 text-xs text-[#1F1615]/80">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>{displayCapacity} Guests</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>{displaySize} m²</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Harbour View</span>
            </div>
          </div>

          {/* Key Amenities */}
          <div className="pt-3 flex flex-wrap gap-2">
            {(apartment.amenities || []).slice(0, 3).map((amenity, idx) => (
              <span key={idx} className="text-[11px] bg-[#FAF6F0] text-[#1F1615]/80 px-2.5 py-1 rounded-md border border-[#C59B27]/20 flex items-center gap-1">
                <Check className="w-3 h-3 text-[#821124]" /> {amenity}
              </span>
            ))}
          </div>
        </div>

        {/* Card Footer CTA */}
        <div className="pt-4 flex items-center gap-2">
          <button
            onClick={() => onSelect(apartment.id)}
            className="w-full py-3 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Reserve Suite</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
