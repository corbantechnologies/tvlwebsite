'use client';

import React from 'react';
import Script from 'next/script';
import { PROFITROOM_WIDGET_SRC } from '@/lib/profitroomBooking';
import OfferPopup from '@/components/OfferPopup';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-sand font-sans text-brand-dark selection:bg-brand-teal selection:text-white flex flex-col w-full max-w-full overflow-x-hidden">
      {children}
      <OfferPopup />
      {/* ProfitRoom's Booking.js, which provides Booking.Open() for the offer buttons. */}
      {PROFITROOM_WIDGET_SRC && <Script src={PROFITROOM_WIDGET_SRC} strategy="lazyOnload" />}
    </div>
  );
}
