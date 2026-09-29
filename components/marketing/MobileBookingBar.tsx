'use client';

import React from 'react';
import { Calendar, Phone, MessageSquare } from 'lucide-react';

interface MobileBookingBarProps {
  onOpenBooking: () => void;
}

export default function MobileBookingBar({ onOpenBooking }: MobileBookingBarProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-t border-[#C59B27]/30 px-4 py-3 flex items-center justify-between shadow-2xl">
      <div>
        <span className="text-[10px] uppercase tracking-wider text-[#821124] block font-bold">
          Direct Luxury Suites
        </span>
        <span className="text-xs font-bold text-[#1F1615]">
          From KES 25,000 <span className="text-[10px] text-[#1F1615]/60 font-normal">/ night</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <a
          href="https://wa.me/254722205138?text=Hello%20Tamarind%20Village,%20I%20would%20like%20to%20inquire%20about%20a%20stay"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700 transition-colors"
          aria-label="WhatsApp Concierge"
        >
          <MessageSquare className="w-4 h-4" />
        </a>

        <button
          onClick={onOpenBooking}
          className="px-5 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Now</span>
        </button>
      </div>
    </div>
  );
}
