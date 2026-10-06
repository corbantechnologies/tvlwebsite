'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import GuestBookingTrackerModal from '@/components/GuestBookingTrackerModal';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Hotel, Key } from 'lucide-react';

function TrackContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || searchParams.get('ref') || '';

  return (
    <div className="min-h-screen bg-[#16100F] text-[#FAF6F0] flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-[#C59B27]/20 bg-[#1F1615]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 p-1 border border-[#C59B27]/40 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo.png" alt="Tamarind Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-serif font-bold text-sm tracking-wider text-white block">
              TAMARIND VILLAGE
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#C59B27] block">
              Guest Portal
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs text-[#C59B27] hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Main Site</span>
        </Link>
      </header>

      {/* Main Track Modal Displayed Inline */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl">
          <GuestBookingTrackerModal
            isOpen={true}
            onClose={() => { }}
            initialToken={token}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#1F1615] px-6 py-6 text-center text-xs text-white/50 space-y-1">
        <p className="font-serif text-[#C59B27]">Tamarind Village · Mombasa Clifftop Luxury</p>
        <p className="text-[11px]">
          Need immediate concierge assistance? Call +254 725 959 552 or email reservations.village@tamarind.co.ke
        </p>
      </footer>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#16100F] flex items-center justify-center text-white text-xs">
        Loading Guest Portal...
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
