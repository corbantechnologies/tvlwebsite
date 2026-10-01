'use client';

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { APARTMENTS } from "@/data";
import { useLiveRates } from "@/utils/profitroom";
import { 
  X, Calendar, CheckCircle, ArrowRight, DollarSign, Calculator, 
  Info, Sparkles, Plus, Minus, Check, Lock, CreditCard, ShieldCheck, Car, Gift, Wine, Compass 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BookingModalProps {
  preSelectedApartmentId?: string;
  preSelectedPkg?: string;
  isOpen: boolean;
  onClose: () => void;
  initialApartmentId?: string;
  initialPackageId?: string;
  apartmentsList?: any[];
}

interface ExtraItem {
  id: string;
  name: string;
  description: string;
  category: string;
  priceUsd: number;
  priceKes: number;
  pricingUnit: string;
  image?: string | null;
  isActive: boolean;
}

interface MealPlanItem {
  id: string;
  name: string;
  shortName: string;
  description: string;
  pricePerPersonPerDayUsd: number;
  pricePerPersonPerDayKes: number;
}

const DEFAULT_MEAL_PLANS: MealPlanItem[] = [
  {
    id: "room-only",
    name: "Flexible Rate — Room Only",
    shortName: "RO",
    description: "Accommodation only. Enjoy Tamarind at your own pace.",
    pricePerPersonPerDayUsd: 0,
    pricePerPersonPerDayKes: 0,
  },
  {
    id: "bed-breakfast",
    name: "Bed & Breakfast",
    shortName: "BB",
    description: "Celebrated clifftop harbour breakfast daily overlooking Tudor Creek.",
    pricePerPersonPerDayUsd: 21,
    pricePerPersonPerDayKes: 2730,
  },
  {
    id: "half-board",
    name: "Stay & Dine — Half Board Deal with Seafood",
    shortName: "HB",
    description: "Breakfast daily + nightly dinner at Tamarind Mombasa's iconic seafood restaurant.",
    pricePerPersonPerDayUsd: 41,
    pricePerPersonPerDayKes: 5330,
  },
];

export default function BookingModal({
  isOpen,
  onClose,
  initialApartmentId,
  initialPackageId,
  apartmentsList
}: BookingModalProps) {
  const activeApartments = apartmentsList || APARTMENTS;

  // Selected apartment (capacities: 1BR=2, 2BR=4, 3BR=6)
  const [apartmentId, setApartmentId] = useState(initialApartmentId || "1-bedroom");
  const selectedApartment = activeApartments.find(a => a.id === apartmentId) || activeApartments[0];

  // Meal plan
  const [mealPlanId, setMealPlanId] = useState(initialPackageId || "room-only");
  const [mealPlans, setMealPlans] = useState<MealPlanItem[]>(DEFAULT_MEAL_PLANS);

  // Booking mode: Direct Paystack or Inquiry (Pay on Arrival / Custom)
  const [bookingMode, setBookingMode] = useState<"paystack" | "inquiry">("paystack");

  // Dates & Guests
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0); // under 12 years old

  // Extras
  const [availableExtras, setAvailableExtras] = useState<ExtraItem[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({}); // extraId -> quantity

  // Contact info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [promocode, setPromocode] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [conditions, setConditions] = useState<any[]>([]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmedData, setConfirmedData] = useState<any | null>(null);

  // Live rates hook
  const { getLivePrice } = useLiveRates();
  const { price: livePrice } = getLivePrice(apartmentId, selectedApartment.pricePerNight);

  // Fetch meal plans, extras, and booking conditions on open
  useEffect(() => {
    if (isOpen) {
      if (initialApartmentId) {
        setApartmentId(initialApartmentId);
        const apt = activeApartments.find(a => a.id === initialApartmentId);
        if (apt) {
          setAdults(Math.min(2, apt.maxGuests));
          setChildren(0);
        }
      }
      if (initialPackageId) {
        setMealPlanId(initialPackageId);
      }

      // Fetch meal plans
      fetch('/api/meal-plans?active=true')
        .then(r => r.json())
        .then(d => {
          if (d.success && d.mealPlans?.length > 0) setMealPlans(d.mealPlans);
        })
        .catch(() => {});

      // Fetch extras
      fetch('/api/extras?active=true')
        .then(r => r.json())
        .then(d => {
          if (d.success && d.extras?.length > 0) setAvailableExtras(d.extras);
        })
        .catch(() => {});

      // Fetch dynamic booking conditions from database
      fetch('/api/booking-conditions')
        .then(r => r.json())
        .then(d => {
          if (d.success && d.conditions) setConditions(d.conditions);
        })
        .catch(() => {});
    }
  }, [isOpen, initialApartmentId, initialPackageId]);

  // Handle apartment change
  const handleApartmentChange = (id: string) => {
    setApartmentId(id);
    const apt = activeApartments.find(a => a.id === id);
    if (apt) {
      if (adults + children > apt.maxGuests) {
        setAdults(apt.maxGuests);
        setChildren(0);
      }
    }
  };

  // Toggle extra selection
  const toggleExtra = (extraId: string) => {
    setSelectedExtras(prev => {
      const next = { ...prev };
      if (next[extraId]) {
        delete next[extraId];
      } else {
        next[extraId] = 1;
      }
      return next;
    });
  };

  const updateExtraQty = (extraId: string, qty: number) => {
    if (qty <= 0) {
      setSelectedExtras(prev => {
        const next = { ...prev };
        delete next[extraId];
        return next;
      });
    } else {
      setSelectedExtras(prev => ({ ...prev, [extraId]: qty }));
    }
  };

  // Calculations
  const calculateCostBreakdown = () => {
    if (!checkIn || !checkOut) return null;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime <= 0) return null;

    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const totalGuests = adults + children;

    // Room cost
    const baseRoomUsd = livePrice * nights;

    // Meal plan cost: (rate × total guests × nights)
    const activeMealPlan = mealPlans.find(m => m.id === mealPlanId) || mealPlans[0];
    const mealPlanRateUsd = activeMealPlan ? activeMealPlan.pricePerPersonPerDayUsd : 0;
    const mealPlanTotalUsd = mealPlanRateUsd * totalGuests * nights;

    // Extras cost
    let extrasTotalUsd = 0;
    const extrasBreakdown: { name: string; costUsd: number; qty: number }[] = [];

    Object.entries(selectedExtras).forEach(([extId, qty]) => {
      const ext = availableExtras.find(e => e.id === extId);
      if (ext && qty > 0) {
        let itemCost = 0;
        if (ext.pricingUnit === 'per_person') {
          itemCost = ext.priceUsd * totalGuests * qty;
        } else if (ext.pricingUnit === 'per_night') {
          itemCost = ext.priceUsd * nights * qty;
        } else {
          // per_booking or per_item
          itemCost = ext.priceUsd * qty;
        }
        extrasTotalUsd += itemCost;
        extrasBreakdown.push({ name: ext.name, costUsd: itemCost, qty });
      }
    });

    const subtotal = baseRoomUsd + mealPlanTotalUsd + extrasTotalUsd;
    const totalKes = Math.round(subtotal * 130);

    return {
      nights,
      totalGuests,
      baseRoomUsd,
      mealPlanName: activeMealPlan?.name || "Room Only",
      mealPlanRateUsd,
      mealPlanTotalUsd,
      extrasTotalUsd,
      extrasBreakdown,
      totalUsd: subtotal,
      totalKes,
    };
  };

  const breakdown = calculateCostBreakdown();

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast.error("Please enter your name, email, and phone number.");
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error("Please select both check-in and check-out dates.");
      return;
    }
    if (conditions.some((c) => c.isMandatory) && !agreeTerms) {
      toast.error("Please agree to the booking conditions and policies to proceed.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    const activeMealPlan = mealPlans.find(m => m.id === mealPlanId) || mealPlans[0];

    const payload = {
      name,
      email,
      phone,
      checkIn,
      checkOut,
      adults,
      children,
      apartmentId: selectedApartment.id,
      apartmentName: selectedApartment.name,
      mealPlanId: activeMealPlan.id,
      mealPlanName: activeMealPlan.name,
      mealPlanRateUsd: activeMealPlan.pricePerPersonPerDayUsd,
      selectedExtras: Object.entries(selectedExtras).map(([extraId, quantity]) => {
        const extra = availableExtras.find(e => e.id === extraId);
        return {
          extraId,
          name: extra?.name || extraId,
          priceUsd: extra?.priceUsd || 0,
          quantity,
        };
      }),
      specialRequests,
      promocode: promocode || undefined,
      totalCostUsd: breakdown?.totalUsd || selectedApartment.pricePerNight,
      totalCostKes: breakdown?.totalKes || (selectedApartment.pricePerNight * 130),
      currency: "USD",
    };

    // Mode 1: Pay Online via Paystack
    if (bookingMode === "paystack") {
      try {
        const payRes = await fetch("/api/paystack/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            amount: breakdown?.totalUsd || selectedApartment.pricePerNight,
            currency: "USD",
            reference: `TVL-${Date.now()}`,
            metadata: {
              ...payload,
              guestName: name,
              guestEmail: email,
              guestPhone: phone,
              apartmentId: selectedApartment.id,
              apartmentName: selectedApartment.name,
              nights: breakdown?.nights || 1,
              roomRateUsd: livePrice,
              totalRoomUsd: breakdown?.baseRoomUsd || livePrice,
              totalMealPlanUsd: breakdown?.mealPlanTotalUsd || 0,
              totalExtrasUsd: breakdown?.extrasTotalUsd || 0,
            },
          }),
        });

        const payData = await payRes.json();
        if (payRes.ok && payData.authorizationUrl) {
          toast.success("Redirecting to Paystack secure checkout...");
          window.location.href = payData.authorizationUrl;
          return;
        } else {
          throw new Error(payData.error || "Failed to initialize online payment");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to connect to payment gateway. Switching to inquiry.");
        setSubmitError(err.message);
        setIsSubmitting(false);
        return;
      }
    }

    // Mode 2: Inquire & Pay at Hotel
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "apartment",
          venue: "village_apartment",
          payload,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit booking inquiry.");
      }

      setConfirmedData({
        ...payload,
        guestToken: data.guestToken,
      });
      toast.success("Reservation inquiry confirmed! Check your email for details.");
    } catch (err: any) {
      toast.error(err.message || "An error occurred submitting your request.");
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleClose = () => {
    setConfirmedData(null);
    setCheckIn("");
    setCheckOut("");
    setName("");
    setEmail("");
    setPhone("");
    setSpecialRequests("");
    setSelectedExtras({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto" id="booking-modal-overlay">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-3xl bg-[#1F1615] border border-[#C59B27]/40 shadow-2xl overflow-hidden rounded-2xl max-h-[92vh] flex flex-col"
          id="booking-modal-container"
        >
          {/* Header Banner */}
          <div className="bg-[#16100F] border-b border-[#C59B27]/25 px-6 py-4 flex items-center justify-between shrink-0">
            <div>
              <span className="text-[10px] font-mono text-[#C59B27] uppercase tracking-widest block">
                Direct Booking Engine
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white tracking-wide">
                Tamarind Village Mombasa
              </h3>
            </div>
            <button 
              onClick={handleClose}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!confirmedData ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin text-xs text-white">
              {/* Step 1: Apartment & Stay Dates */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#C59B27] uppercase tracking-wider">
                  <span className="w-4 h-4 rounded-full bg-[#C59B27] text-[#1F1615] flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Choose Suite &amp; Dates</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                      Apartment Type
                    </label>
                    <select
                      value={apartmentId}
                      onChange={(e) => handleApartmentChange(e.target.value)}
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                    >
                      {activeApartments.map(apt => (
                        <option key={apt.id} value={apt.id}>
                          {apt.name} (Max {apt.maxGuests} guests)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                      Check-In Date
                    </label>
                    <input
                      type="date"
                      required
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                      Check-Out Date
                    </label>
                    <input
                      type="date"
                      required
                      min={checkIn}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                </div>

                {/* Guest counter */}
                <div className="grid grid-cols-2 gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-[11px] font-bold text-white">Adults</span>
                      <span className="text-[10px] text-white/50">Age 13+ years</span>
                    </div>
                    <div className="flex items-center border border-white/15 rounded-lg overflow-hidden bg-black/40">
                      <button
                        type="button"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        className="px-2.5 py-1 text-white hover:bg-white/10"
                      >
                        -
                      </button>
                      <span className="px-2.5 font-bold font-mono">{adults}</span>
                      <button
                        type="button"
                        onClick={() => setAdults(Math.min(selectedApartment.maxGuests - children, adults + 1))}
                        className="px-2.5 py-1 text-white hover:bg-white/10"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-l border-white/10 pl-3">
                    <div>
                      <span className="block text-[11px] font-bold text-white">Children</span>
                      <span className="text-[10px] text-white/50">Up to 12 years</span>
                    </div>
                    <div className="flex items-center border border-white/15 rounded-lg overflow-hidden bg-black/40">
                      <button
                        type="button"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        className="px-2.5 py-1 text-white hover:bg-white/10"
                      >
                        -
                      </button>
                      <span className="px-2.5 font-bold font-mono">{children}</span>
                      <button
                        type="button"
                        onClick={() => setChildren(Math.min(selectedApartment.maxGuests - adults, children + 1))}
                        className="px-2.5 py-1 text-white hover:bg-white/10"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Meal Plan Selection */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#C59B27] uppercase tracking-wider">
                    <span className="w-4 h-4 rounded-full bg-[#C59B27] text-[#1F1615] flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Select Meal Plan</span>
                  </div>
                  <span className="text-[10px] text-white/50 font-mono">Applied per guest / night</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {mealPlans.map((mp) => {
                    const isSelected = mealPlanId === mp.id;
                    return (
                      <div
                        key={mp.id}
                        onClick={() => setMealPlanId(mp.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#821124]/30 border-[#C59B27] ring-1 ring-[#C59B27]'
                            : 'bg-black/30 border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-white/10 text-[#C59B27]">
                              {mp.shortName}
                            </span>
                            <span className="font-serif font-bold text-[#C59B27]">
                              {mp.pricePerPersonPerDayUsd === 0 ? 'Included' : `+$${mp.pricePerPersonPerDayUsd}/p`}
                            </span>
                          </div>
                          <span className="font-bold text-white block leading-snug">{mp.name}</span>
                          <p className="text-[10px] text-white/60 mt-1 line-clamp-2 leading-relaxed">
                            {mp.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Optional Extras & Add-ons (Task 4.1) */}
              {availableExtras.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#C59B27] uppercase tracking-wider">
                      <span className="w-4 h-4 rounded-full bg-[#C59B27] text-[#1F1615] flex items-center justify-center text-[10px] font-bold">3</span>
                      <span>Enhance Your Stay (Optional Extras)</span>
                    </div>
                    <span className="text-[10px] text-white/50">Airport pickup, wine, setups</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {availableExtras.map((extra) => {
                      const isSelected = !!selectedExtras[extra.id];
                      const qty = selectedExtras[extra.id] || 0;

                      return (
                        <div
                          key={extra.id}
                          className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#821124]/20 border-[#C59B27]/80'
                              : 'bg-black/30 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white block">{extra.name}</span>
                            </div>
                            <p className="text-[10px] text-white/60 line-clamp-2 leading-relaxed">
                              {extra.description}
                            </p>
                            <div className="text-[11px] font-mono text-[#C59B27] font-bold">
                              ${extra.priceUsd} USD <span className="text-white/40 text-[9px] font-normal font-sans">({extra.pricingUnit.replace('_', ' ')})</span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => toggleExtra(extra.id)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#821124] text-white'
                                  : 'bg-white/10 hover:bg-white/20 text-white/80'
                              }`}
                            >
                              {isSelected ? 'Added ✓' : '+ Add'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 4: Contact & Requests */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#C59B27] uppercase tracking-wider">
                  <span className="w-4 h-4 rounded-full bg-[#C59B27] text-[#1F1615] flex items-center justify-center text-[10px] font-bold">4</span>
                  <span>Lead Guest Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone / WhatsApp"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <textarea
                  rows={2}
                  placeholder="Special requests: honeymoon bed setup, late check-in time, dietary needs, or oceanfront floor preference..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27] resize-none"
                />
              </div>

              {/* Running Breakdown Banner */}
              {breakdown && (
                <div className="bg-gradient-to-r from-black/60 to-black/40 p-4 rounded-xl border border-[#C59B27]/30 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="font-bold text-[#C59B27] uppercase text-[10px] tracking-wider">
                      Stay Calculation Breakdown
                    </span>
                    <span className="font-mono text-white/50 text-[10px]">
                      {breakdown.nights} night{breakdown.nights !== 1 ? 's' : ''} · {breakdown.totalGuests} guests
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-white/70">
                    <div className="flex justify-between">
                      <span>{selectedApartment.name} (${livePrice}/night)</span>
                      <span className="font-mono text-white">${breakdown.baseRoomUsd} USD</span>
                    </div>
                    {breakdown.mealPlanRateUsd > 0 && (
                      <div className="flex justify-between">
                        <span>{breakdown.mealPlanName} (${breakdown.mealPlanRateUsd}pp × {breakdown.totalGuests}g × {breakdown.nights}n)</span>
                        <span className="font-mono text-white">${breakdown.mealPlanTotalUsd} USD</span>
                      </div>
                    )}
                    {breakdown.extrasTotalUsd > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Selected Extras ({breakdown.extrasBreakdown.length} items)</span>
                        <span className="font-mono">+${breakdown.extrasTotalUsd} USD</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-baseline justify-between font-serif font-bold text-white text-base">
                    <span>Total Investment</span>
                    <div className="text-right">
                      <span className="text-[#C59B27] text-lg font-bold">${breakdown.totalUsd} USD</span>
                      <span className="text-white/50 text-xs font-mono font-normal block">
                        ≈ KES {breakdown.totalKes.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Mode Chooser */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingMode("paystack")}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    bookingMode === "paystack"
                      ? 'bg-[#821124] text-white border-[#C59B27] shadow-lg'
                      : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1" />
                  <span className="font-bold text-xs block">Pay Online Now</span>
                  <span className="text-[10px] opacity-70 block">Cards &amp; M-Pesa (Instant Confirmation)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBookingMode("inquiry")}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    bookingMode === "inquiry"
                      ? 'bg-[#821124] text-white border-[#C59B27] shadow-lg'
                      : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-[#C59B27]" />
                  <span className="font-bold text-xs block">Inquire / Pay at Resort</span>
                  <span className="text-[10px] opacity-70 block">Hold request + portal management link</span>
                </button>
              </div>

              {/* Dynamic Booking Conditions Block (Loaded from Database CRUD) */}
              {conditions.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Booking Conditions &amp; Policies
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-white/70">
                    {conditions.map((c) => (
                      <div key={c.id} className="flex items-start gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-white">{c.title}</strong>
                            {c.badge && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold">
                                {c.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-white/70 text-[10px] leading-snug block">{c.summary}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {conditions.some((c) => c.content) && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowFullTerms(!showFullTerms)}
                        className="text-[11px] text-[#C59B27] hover:text-white underline transition-colors cursor-pointer"
                      >
                        {showFullTerms ? "Hide detailed policy conditions ▲" : "Read full policy details ▼"}
                      </button>

                      {showFullTerms && (
                        <div className="mt-2 p-3 rounded-lg bg-black/60 border border-white/10 text-[10px] text-white/75 space-y-2.5 max-h-52 overflow-y-auto scrollbar-thin">
                          {conditions.map((c, idx) => (
                            <div key={c.id}>
                              <p className="font-bold text-white uppercase tracking-wider text-[9px] text-[#C59B27]">
                                {idx + 1}. {c.title}
                              </p>
                              <p className="mt-0.5 whitespace-pre-line">{c.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Consent Checkbox for mandatory policies */}
                  {conditions.some((c) => c.isMandatory) && (
                    <label className="flex items-start gap-2.5 pt-2 border-t border-white/10 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-white/30 text-[#821124] focus:ring-[#C59B27] bg-black/40 accent-[#821124] cursor-pointer"
                        id="checkbox-agree-terms"
                      />
                      <span className="text-[11px] text-white/90 leading-snug">
                        I acknowledge and agree to the <span className="text-[#C59B27] font-semibold">Tamarind Village Booking Conditions &amp; Policies</span>.
                      </span>
                    </label>
                  )}
                </div>
              )}

              {submitError && (
                <div className="p-3 bg-red-950/60 border border-red-500/30 text-red-300 text-xs rounded-xl">
                  {submitError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Best Rate Guaranteed Directly with Tamarind</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <span>
                      {isSubmitting
                        ? "Processing..."
                        : bookingMode === "paystack"
                        ? "Proceed to Paystack Payment"
                        : "Submit Reservation Request"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Confirmation Screen */
            <div className="p-8 text-center space-y-6 overflow-y-auto">
              <div className="w-14 h-14 bg-emerald-950/80 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-serif text-2xl text-white font-bold">Reservation Inquiry Received!</h4>
                <p className="text-white/60 text-xs mt-1">
                  Our reservations desk has received your stay request. A confirmation email has been dispatched.
                </p>
              </div>

              <div className="p-5 bg-black/40 border border-[#C59B27]/30 rounded-xl text-xs text-left space-y-2 text-white/80 max-w-md mx-auto">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/50">Guest Reference:</span>
                  <span className="font-mono font-bold text-[#C59B27]">{confirmedData.guestToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Suite:</span>
                  <span className="font-bold text-white">{confirmedData.apartmentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Stay Dates:</span>
                  <span className="font-mono">{confirmedData.checkIn} → {confirmedData.checkOut}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Meal Plan:</span>
                  <span>{confirmedData.mealPlanName}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 font-bold text-white">
                  <span>Estimated Total:</span>
                  <span className="text-[#C59B27]">${confirmedData.totalCostUsd} USD</span>
                </div>
              </div>

              {/* Guest Portal Tracking Callout */}
              <div className="p-4 bg-[#821124]/20 border border-[#C59B27]/40 rounded-xl max-w-md mx-auto text-left space-y-2">
                <span className="text-[11px] font-bold text-[#C59B27] uppercase tracking-wider block">
                  Secure No-Login Guest Portal Link
                </span>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Use your reference code to view updates, add special requests (honeymoon setups, dietary needs), or cancel your booking anytime without signing up.
                </p>
                <a
                  href={`/track?token=${confirmedData.guestToken}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#821124] hover:bg-[#680e1c] px-4 py-2 rounded-lg transition-colors"
                >
                  <span>Open Your Guest Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 cursor-pointer"
              >
                Close &amp; Return to Website
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
