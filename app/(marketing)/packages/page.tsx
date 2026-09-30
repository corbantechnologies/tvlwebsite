'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Check, ArrowRight, Utensils, Coffee, Heart, ShieldCheck, Tag } from 'lucide-react';
import BookingModal from '@/components/BookingModal';

interface MealPlan {
  id: string;
  name: string;
  shortName: string;
  description: string;
  pricePerPersonPerDayUsd: number;
  pricePerPersonPerDayKes: number;
  highlights: string[];
}

const DEFAULT_MEAL_PLANS: MealPlan[] = [
  {
    id: 'room-only',
    name: 'Flexible Rate — Room Only',
    shortName: 'RO',
    description: 'Accommodation only. Complete flexibility to explore Mombasa’s finest dining at your own leisure.',
    pricePerPersonPerDayUsd: 0,
    pricePerPersonPerDayKes: 0,
    highlights: [
      'Self-catering granite Swahili kitchen access',
      'Complimentary welcome arrival cocktail',
      'Full resident access to Harbour Restaurant & 2 Clifftop Pools',
      'No meal commitments'
    ],
  },
  {
    id: 'bed-breakfast',
    name: 'Bed & Breakfast',
    shortName: 'BB',
    description: 'Start every morning with our celebrated clifftop harbour breakfast overlooking the tranquil Indian Ocean.',
    pricePerPersonPerDayUsd: 21,
    pricePerPersonPerDayKes: 2730,
    highlights: [
      'Daily clifftop harbour breakfast at Harbour Restaurant',
      'Fresh tropical coastal juices & Swahili pastries',
      'À la carte hot breakfast selections made to order',
      'Creekside morning ocean views'
    ],
  },
  {
    id: 'half-board',
    name: 'Stay & Dine — Half Board Deal with Seafood',
    shortName: 'HB',
    description: 'The ultimate Tamarind experience. Breakfast each morning, plus nightly dinner at Tamarind Mombasa’s legendary seafood restaurant.',
    pricePerPersonPerDayUsd: 41,
    pricePerPersonPerDayKes: 5330,
    highlights: [
      'Daily clifftop harbour breakfast',
      'Nightly dinner at Tamarind Mombasa Restaurant',
      'World-famous fresh East African seafood specialties',
      'Resident priority creekside table placement',
      'Guest favourite & best value'
    ],
  },
];

export default function PackagesPage() {
  const [plans, setPlans] = useState<MealPlan[]>(DEFAULT_MEAL_PLANS);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('half-board');

  useEffect(() => {
    fetch('/api/meal-plans?active=true')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.mealPlans && d.mealPlans.length > 0) setPlans(d.mealPlans);
      })
      .catch(() => {});
  }, []);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setIsBookingOpen(true);
  };

  return (
    <div className="pt-28 pb-20 bg-[#FAF6F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C59B27]/20 text-[#821124] text-xs font-bold uppercase tracking-widest">
            <Tag className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Apartment Boarding Plans</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#1F1615]">
            Boarding Plans &amp; Meal Inclusions
          </h1>
          <p className="text-sm text-[#1F1615]/75 leading-relaxed">
            Choose how you wish to dine during your stay at Tamarind Village.
            Meal plans apply per guest per day on top of the apartment suite base rate.
          </p>
        </div>

        {/* 3 Core Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isFeatured = plan.id === 'half-board';

            return (
              <div
                key={plan.id}
                className={`rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                  isFeatured
                    ? 'border-[#821124] shadow-2xl ring-2 ring-[#821124]/30 bg-white relative'
                    : 'border-[#C59B27]/30 shadow-lg hover:shadow-xl bg-white'
                }`}
              >
                {isFeatured && (
                  <div className="bg-[#821124] text-white text-[10px] font-bold uppercase tracking-widest py-1.5 text-center">
                    Most Popular · Signature Seafood Experience
                  </div>
                )}

                <div className="p-8 sm:p-10 space-y-6">
                  {/* Badge & Title */}
                  <div className="space-y-2">
                    <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FAF6F0] text-[#821124] border border-[#C59B27]/30">
                      {plan.shortName} Plan
                    </span>
                    <h2 className="font-serif text-2xl font-bold text-[#1F1615]">
                      {plan.name}
                    </h2>
                    <p className="text-xs text-[#1F1615]/70 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Pricing Box */}
                  <div className="bg-[#FAF6F0] rounded-2xl p-5 border border-[#C59B27]/25 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#1F1615]/50 tracking-wider block">
                      Boarding Rate
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-3xl font-bold text-[#821124]">
                        {plan.pricePerPersonPerDayUsd === 0 ? 'Included' : `$${plan.pricePerPersonPerDayUsd}`}
                      </span>
                      {plan.pricePerPersonPerDayUsd > 0 && (
                        <span className="text-xs text-[#1F1615]/60 font-medium">USD / guest / day</span>
                      )}
                    </div>
                    {plan.pricePerPersonPerDayKes > 0 && (
                      <span className="text-xs font-mono text-[#C59B27] font-semibold block">
                        ≈ KES {plan.pricePerPersonPerDayKes.toLocaleString()} / guest / day
                      </span>
                    )}
                  </div>

                  {/* Inclusions List */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F1615] block">
                      What is Included:
                    </span>
                    <div className="space-y-2.5">
                      {(plan.highlights || []).map((highlight, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start text-xs text-[#1F1615]/80">
                          <Check className="w-4 h-4 text-[#C59B27] flex-shrink-0 mt-0.5" />
                          <span className="leading-snug">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-8 sm:p-10 pt-0">
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                      isFeatured
                        ? 'bg-[#821124] hover:bg-[#680e1c] text-white'
                        : 'bg-[#1F1615] hover:bg-[#821124] text-white'
                    }`}
                  >
                    <span>Book With This Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing Explanation Footer Banner */}
        <div className="mt-16 bg-white rounded-2xl p-8 border border-[#C59B27]/30 text-center max-w-3xl mx-auto space-y-2 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-widest text-[#821124] block">
            Transparent Pricing Formula
          </span>
          <p className="font-mono text-sm text-[#1F1615] font-semibold">
            Total Stay Cost = (Apartment Base Rate × Nights) + (Meal Plan Rate × Total Guests × Nights) + Optional Extras
          </p>
          <p className="text-xs text-[#1F1615]/60 max-w-xl mx-auto">
            Children up to 12 years are accommodated within capacity limits. All suites include granite kitchens, oceanfront verandas, and daily housekeeping.
          </p>
        </div>
      </div>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialPackageId={selectedPlanId}
      />
    </div>
  );
}
