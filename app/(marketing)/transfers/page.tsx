'use client';

import React, { useState } from 'react';
import { Car, Plane, Train, Sparkles, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import BookingModal from '@/components/marketing/BookingModal';

export default function TransfersPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const fleet = [
    {
      name: 'VIP Executive Toyota Alphard',
      capacity: '4 Passengers with full luggage',
      features: ['Air conditioning', 'Reclining leather captain seats', 'Wi-Fi onboard', 'Bottled mineral water'],
      routes: [
        { from: 'Moi International Airport (MBA)', to: 'Tamarind Village', kes: 4500, usd: 35 },
        { from: 'Mombasa SGR Terminus (Miritini)', to: 'Tamarind Village', kes: 5500, usd: 45 }
      ]
    },
    {
      name: 'Mercedes Benz E-Class / C-Class',
      capacity: '2-3 Passengers with executive luggage',
      features: ['Premium sound system', 'Chauffeur in full uniform', 'Cold mint towels', 'Flight tracking'],
      routes: [
        { from: 'Moi International Airport (MBA)', to: 'Tamarind Village', kes: 6000, usd: 50 },
        { from: 'Mombasa SGR Terminus (Miritini)', to: 'Tamarind Village', kes: 7000, usd: 55 }
      ]
    },
    {
      name: 'Luxury Toyota HiAce Safari Van',
      capacity: 'Up to 7 Passengers with bulk luggage',
      features: ['High roof clearance', 'Panoramic windows', 'Ideal for families & retreats', 'Ample luggage space'],
      routes: [
        { from: 'Moi International Airport (MBA)', to: 'Tamarind Village', kes: 6500, usd: 52 },
        { from: 'Mombasa SGR Terminus (Miritini)', to: 'Tamarind Village', kes: 7500, usd: 60 }
      ]
    }
  ];

  return (
    <div className="pt-28 pb-20 bg-[#FAF6F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#821124]/10 text-[#821124] text-xs font-bold uppercase tracking-widest">
            <Car className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>VIP Chauffeur Service</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#1F1615]">
            Mombasa Airport &amp; SGR VIP Transfers
          </h1>
          <p className="text-sm text-[#1F1615]/75">
            Begin your Tamarind experience the moment you touch down or arrive at the terminal. 
            Our dedicated chauffeurs provide seamless, flight-tracked transfers directly to your clifftop suite.
          </p>
        </div>

        {/* Fleet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {fleet.map((car, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-[#C59B27]/30 shadow-lg flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#821124]/10 text-[#821124] flex items-center justify-center">
                  <Car className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="font-serif text-xl font-bold text-[#1F1615]">{car.name}</h3>
                  <span className="text-xs text-[#821124] font-medium">{car.capacity}</span>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#1F1615]/10">
                  {car.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[#1F1615]/80">
                      <Check className="w-3.5 h-3.5 text-[#821124]" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-[#1F1615]/10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F1615]/60 block">
                    Fixed Rates:
                  </span>
                  {car.routes.map((rt, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-[#FAF6F0] flex items-center justify-between text-xs">
                      <span className="text-[#1F1615]/80 font-medium">{rt.from.split('(')[0]}</span>
                      <span className="font-bold text-[#821124]">KES {rt.kes.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setIsBookingOpen(true)}
                className="w-full py-3 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                Book VIP Transfer
              </button>
            </div>
          ))}
        </div>
      </div>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}
