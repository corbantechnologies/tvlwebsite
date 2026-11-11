'use client';

import React from "react";
import { Calendar, ShieldCheck } from "lucide-react";
import { isProfitroomBookingActive, openProfitroomBooking } from "@/lib/profitroomBooking";

interface MobileBookingBarProps {
  onOpenBooking: () => void;
  startingPrice?: number;
  isLive?: boolean;
}

export default function MobileBookingBar({ onOpenBooking, startingPrice = 160, isLive = false }: MobileBookingBarProps) {
  const profitroomActive = isProfitroomBookingActive();
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-300 px-4 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider">
          <div className="flex items-center gap-1 text-emerald-700 font-bold">
            <ShieldCheck className="w-3 h-3" />
            <span>Direct Guarantee</span>
          </div>
          {isLive && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[8px] font-bold text-white bg-emerald-600 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live Rate
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[11px] text-stone-500 font-light">From</span>
          <span className="font-serif text-lg font-bold text-brand-dark">${startingPrice}</span>
          <span className="text-[10px] text-stone-400 font-mono">/ night</span>
        </div>
      </div>

      {profitroomActive && (
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); onOpenBooking(); }}
          className="text-[10px] font-semibold uppercase tracking-wider text-stone-600 underline underline-offset-4 decoration-stone-300 whitespace-nowrap cursor-pointer"
          id="mobile-sticky-booking-direct"
        >
          Pay Here
        </a>
      )}
      <button
        onClick={() => (profitroomActive ? openProfitroomBooking() : onOpenBooking())}
        className="flex-1 max-w-[200px] py-2.5 px-4 bg-brand-teal hover:bg-brand-teal-dark active:scale-98 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        id="mobile-sticky-booking-btn"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>{profitroomActive ? "Book Now" : "Check Rates"}</span>
      </button>
    </div>
  );
}
