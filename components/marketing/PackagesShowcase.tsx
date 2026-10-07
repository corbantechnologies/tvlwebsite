'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { ResortPackage } from '@/types';

interface PackagesShowcaseProps {
  packages: ResortPackage[];
  onSelectPackage: (pkg: ResortPackage) => void;
}

export default function PackagesShowcase({ packages, onSelectPackage }: PackagesShowcaseProps) {
  const activePackages = packages.filter(p => p.isActive !== false).slice(0, 3);

  return (
    <section className="py-20 bg-white relative" id="packages">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C59B27]/20 text-[#821124] text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Curated Coastal Experiences</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1F1615] font-bold">
            Signature All-Inclusive Packages
          </h2>
          <p className="text-sm text-[#1F1615]/75">
            Designed for romantic honeymoons, executive coastal retreats, and immersive Swahili Dhow voyages.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {activePackages.map((pkg) => {
            const imageSrc = pkg.heroImage || pkg.image || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef';
            const tierStr = pkg.tier || pkg.category || 'Signature';
            const nightsCount = pkg.nights || pkg.minimumNights || 2;
            const pKes = pkg.priceKes || pkg.rateKes || 0;
            const pUsd = pkg.priceUsd || pkg.rateUsd;
            const incs = pkg.inclusions || pkg.features || [];

            return (
              <div
                key={pkg.id}
                className={`rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                  pkg.isFeatured
                    ? 'border-[#821124] shadow-2xl ring-2 ring-[#821124]/30 relative bg-[#FAF6F0]'
                    : 'border-[#C59B27]/30 shadow-lg hover:shadow-xl bg-white'
                }`}
              >
                {pkg.isFeatured && (
                  <div className="bg-[#821124] text-white text-[10px] font-bold uppercase tracking-widest py-1.5 text-center">
                    Most Popular Resort Experience
                  </div>
                )}

                <div className="relative h-48 w-full overflow-hidden">
                  <OptimizedImage
                    src={imageSrc}
                    alt={pkg.name}
                    fill
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#C59B27]">
                      {tierStr} Tier
                    </span>
                    <span className="text-xs font-medium bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {nightsCount} Nights Stay
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#1F1615]">
                        {pkg.name}
                      </h3>
                      {pkg.subtitle && (
                        <p className="text-xs text-[#821124] font-medium mt-0.5">
                          {pkg.subtitle}
                        </p>
                      )}
                    </div>

                    {pkg.description && (
                      <p className="text-xs text-[#1F1615]/70">
                        {pkg.description}
                      </p>
                    )}

                    <div className="pt-2">
                      <span className="text-[10px] text-[#1F1615]/60 uppercase tracking-wider block">Package Total</span>
                      {pKes > 0 ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-[#821124] font-serif">
                            KES {pKes.toLocaleString()}
                          </span>
                          {pUsd && (
                            <span className="text-xs text-[#1F1615]/60">
                              (approx. ${pUsd} USD)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-[#821124] font-serif">
                          Inquire for Bespoke Quotation
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#1F1615]/10">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F1615]/80 block">
                        Curated Inclusions:
                      </span>
                      {incs.slice(0, 5).map((inc: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-[#1F1615]/85">
                          <Check className="w-3.5 h-3.5 text-[#821124] shrink-0 mt-0.5" />
                          <span>{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectPackage(pkg)}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      pkg.isFeatured
                        ? 'bg-[#821124] hover:bg-[#680e1c] text-white'
                        : 'bg-[#1F1615] hover:bg-black text-white'
                    }`}
                  >
                    <span>Book This Package</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/packages"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#821124] text-[#821124] font-semibold text-xs uppercase tracking-wider hover:bg-[#821124] hover:text-white transition-all"
          >
            <span>Explore All Tamarind Packages &amp; Corporate Retreats</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
