'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Check, ArrowRight, ShieldCheck, Heart, Ship, Briefcase } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import BookingModal from '@/components/marketing/BookingModal';
import { DEFAULT_RESORT_PACKAGES } from '@/lib/data';
import { ResortPackage } from '@/types';

export default function PackagesPage() {
  const [packages, setPackages] = useState<ResortPackage[]>(DEFAULT_RESORT_PACKAGES);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState('dhow_stay');

  useEffect(() => {
    fetch('/api/packages')
      .then((r) => r.json())
      .then((d) => {
        if (d.packages && d.packages.length > 0) setPackages(d.packages);
      })
      .catch(() => {});
  }, []);

  const handleSelect = (pkgId: string) => {
    setSelectedPkg(pkgId);
    setIsBookingOpen(true);
  };

  return (
    <div className="pt-28 pb-20 bg-[#FAF6F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C59B27]/20 text-[#821124] text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Robust Multi-Tier Packages</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#1F1615]">
            Curated Resort Experiences &amp; Escapes
          </h1>
          <p className="text-sm text-[#1F1615]/75">
            Designed for honeymoons, coastal staycations, executive retreats, and family rejuvenation. 
            All packages include luxury accommodation, dining, and signature Tamarind experiences.
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                pkg.isFeatured
                  ? 'border-[#821124] shadow-2xl ring-2 ring-[#821124]/30 bg-white'
                  : 'border-[#C59B27]/30 shadow-lg hover:shadow-xl bg-white'
              }`}
            >
              {pkg.isFeatured && (
                <div className="bg-[#821124] text-white text-[10px] font-bold uppercase tracking-widest py-1.5 text-center">
                  Recommended Signature Experience
                </div>
              )}

              <div className="relative h-56 w-full overflow-hidden">
                <OptimizedImage
                  src={pkg.heroImage || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef'}
                  alt={pkg.name}
                  fill
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                  <span className="text-xs uppercase tracking-wider font-semibold text-[#C59B27]">
                    {pkg.tier}
                  </span>
                  <span className="text-xs font-medium bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {pkg.nights} Nights
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#1F1615]">
                      {pkg.name}
                    </h3>
                    <p className="text-xs text-[#821124] font-medium mt-0.5">
                      {pkg.subtitle}
                    </p>
                  </div>

                  <p className="text-xs text-[#1F1615]/75 leading-relaxed">
                    {pkg.description}
                  </p>

                  <div className="pt-2">
                    <span className="text-[10px] text-[#1F1615]/60 uppercase tracking-wider block">Package Investment</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-[#821124] font-serif">
                        KES {pkg.priceKes?.toLocaleString()}
                      </span>
                      {pkg.priceUsd && (
                        <span className="text-xs text-[#1F1615]/60">
                          (approx. ${pkg.priceUsd} USD)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-[#1F1615]/10">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1F1615]/80 block">
                      Package Inclusions:
                    </span>
                    {(pkg.inclusions || []).map((inc, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#1F1615]/85">
                        <Check className="w-3.5 h-3.5 text-[#821124] shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleSelect(pkg.id)}
                  className="w-full py-3.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Inquire / Book This Package</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preSelectedPkg={selectedPkg}
      />
    </div>
  );
}
