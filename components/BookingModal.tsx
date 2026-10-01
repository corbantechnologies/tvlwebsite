'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Calendar, 
  Users, 
  ShieldCheck, 
  CheckCircle, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Lock, 
  Check, 
  HelpCircle,
  Clock,
  Download,
  Printer,
  ChevronDown,
  Building,
  Info,
  Ticket
} from "lucide-react";
import { APARTMENTS } from "@/lib/data";
import toast from "react-hot-toast";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialApartmentId?: string;
  initialPackageId?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialAdults?: number;
  initialChildren?: number;
  initialPromocode?: string;
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

const normalizeMealPlanId = (id?: string) => {
  if (!id) return "room-only";
  if (id === "ro") return "room-only";
  if (id === "bb") return "bed-breakfast";
  if (id === "hb") return "half-board";
  return id;
};

const formatDisplayDate = (dStr: string) => {
  if (!dStr) return '';
  try {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return dStr;
  } catch {
    return dStr;
  }
};

export default function BookingModal({
  isOpen,
  onClose,
  initialApartmentId,
  initialPackageId,
  initialCheckIn,
  initialCheckOut,
  initialAdults,
  initialChildren,
  initialPromocode,
  apartmentsList
}: BookingModalProps) {
  const activeApartments = (apartmentsList || APARTMENTS).filter(a => a.isActive !== false);

  // Selected apartment
  const [apartmentId, setApartmentId] = useState(initialApartmentId || (activeApartments[0]?.id || "1-bedroom"));
  const selectedApartment = activeApartments.find(a => a.id === apartmentId) || activeApartments[0] || APARTMENTS[0];

  // Meal plan
  const [mealPlanId, setMealPlanId] = useState(normalizeMealPlanId(initialPackageId));
  const [mealPlans, setMealPlans] = useState<MealPlanItem[]>([]);
  const selectedMealPlan = mealPlans.find(m => m.id === mealPlanId) || mealPlans[0];

  // Dates & Guests
  const [checkIn, setCheckIn] = useState(initialCheckIn || "");
  const [checkOut, setCheckOut] = useState(initialCheckOut || "");
  const [adults, setAdults] = useState(initialAdults || 2);
  const [children, setChildren] = useState(initialChildren || 0);

  // Flow control: if dates are already chosen, show confirmed stay card and jump to extras / payment
  const hasPreselectedDates = Boolean(initialCheckIn && initialCheckOut);
  const [isEditingStay, setIsEditingStay] = useState(false);

  // Extras
  const [availableExtras, setAvailableExtras] = useState<ExtraItem[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});

  // Contact info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [promocode, setPromocode] = useState(initialPromocode || "");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [conditions, setConditions] = useState<any[]>([]);

  // Promo code & voucher state
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    description?: string;
    discountType: string;
    discountValue: number;
    discountAmountUsd: number;
  } | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmedData, setConfirmedData] = useState<any | null>(null);

  const livePrice = selectedApartment?.pricePerNight || 120;

  // Fetch meal plans, extras, and booking conditions on open
  useEffect(() => {
    if (isOpen) {
      if (initialApartmentId) {
        setApartmentId(initialApartmentId);
        const apt = activeApartments.find(a => a.id === initialApartmentId);
        if (apt && !initialAdults) {
          setAdults(Math.min(2, apt.maxGuests));
          setChildren(0);
        }
      }
      if (initialAdults !== undefined && initialAdults > 0) {
        setAdults(initialAdults);
      }
      if (initialChildren !== undefined) {
        setChildren(initialChildren);
      }
      if (initialCheckIn) setCheckIn(initialCheckIn);
      if (initialCheckOut) setCheckOut(initialCheckOut);
      if (initialPromocode) setPromocode(initialPromocode);
      if (initialPackageId) {
        setMealPlanId(normalizeMealPlanId(initialPackageId));
      }
      setIsEditingStay(false);

      // Fetch dynamic meal plans directly from database records
      fetch('/api/meal-plans?active=true')
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.mealPlans) && d.mealPlans.length > 0) {
            setMealPlans(d.mealPlans);
            if (!initialPackageId) {
              setMealPlanId(d.mealPlans[0].id);
            }
          }
        })
        .catch(() => {});

      // Fetch dynamic extras
      fetch('/api/extras')
        .then(r => r.json())
        .then(d => {
          if (d.extras && d.extras.length > 0) {
            setAvailableExtras(d.extras.filter((e: any) => e.isActive));
          }
        })
        .catch(() => {});

      // Fetch dynamic booking conditions
      fetch('/api/booking-conditions')
        .then(r => r.json())
        .then(d => {
          if (d.success && d.conditions) setConditions(d.conditions);
        })
        .catch(() => {});
    }
  }, [isOpen, initialApartmentId, initialPackageId, initialCheckIn, initialCheckOut, initialAdults, initialChildren, initialPromocode]);

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
          itemCost = ext.priceUsd * qty;
        }
        extrasTotalUsd += itemCost;
        extrasBreakdown.push({ name: ext.name, costUsd: itemCost, qty });
      }
    });

    const subtotal = baseRoomUsd + mealPlanTotalUsd + extrasTotalUsd;
    let discountUsd = 0;
    if (appliedVoucher) {
      if (appliedVoucher.discountType === "percentage") {
        discountUsd = (subtotal * appliedVoucher.discountValue) / 100;
      } else {
        discountUsd = Math.min(appliedVoucher.discountAmountUsd, subtotal);
      }
    }
    discountUsd = Math.round(discountUsd * 100) / 100;
    const finalTotalUsd = Math.max(0, subtotal - discountUsd);
    const totalKes = Math.round(finalTotalUsd * 130);

    return {
      nights,
      totalGuests,
      baseRoomUsd,
      mealPlanName: activeMealPlan?.name || "Room Only",
      mealPlanRateUsd,
      mealPlanTotalUsd,
      extrasTotalUsd,
      extrasBreakdown,
      subtotalUsd: subtotal,
      discountUsd,
      appliedVoucherCode: appliedVoucher?.code,
      totalUsd: finalTotalUsd,
      totalKes,
    };
  };

  const breakdown = calculateCostBreakdown();

  const handleApplyVoucher = async () => {
    if (!promocode.trim()) {
      toast.error("Please enter a voucher code.");
      return;
    }
    setVoucherLoading(true);
    setVoucherError("");
    try {
      const currentSubtotal = breakdown ? (breakdown.baseRoomUsd + breakdown.mealPlanTotalUsd + breakdown.extrasTotalUsd) : livePrice;
      const res = await fetch(`/api/vouchers?code=${encodeURIComponent(promocode.trim())}&amount=${currentSubtotal}`);
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setVoucherError(data.error || "Invalid promo code.");
        setAppliedVoucher(null);
        toast.error(data.error || "Invalid promo code.");
      } else {
        setAppliedVoucher(data.voucher);
        setVoucherError("");
        toast.success(`Promo code '${data.voucher.code}' applied! Saved $${data.voucher.discountAmountUsd} USD.`);
      }
    } catch {
      toast.error("Failed to validate voucher code.");
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setPromocode("");
    setVoucherError("");
    toast.success("Promo code removed.");
  };

  // Submit Handler — Direct Online Payment
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
        toast.success("Connecting to secure payment gateway...");
        window.location.href = payData.authorizationUrl;
        return;
      } else {
        throw new Error(payData.error || "Failed to initialize payment gateway");
      }
    } catch (err: any) {
      console.error("Payment init error:", err);
      toast.error(err.message || "Unable to proceed to payment. Please try again.");
      setSubmitError(err.message);
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-[#FDFBF7] text-stone-900 overflow-y-auto flex flex-col min-h-screen"
        id="fullscreen-checkout-view"
      >
        {/* Top Sticky Header */}
        <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30 px-4 sm:px-8 py-3.5 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#821124]/10 p-1.5 border border-[#821124]/20 flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/logo.png" alt="Tamarind Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-serif font-bold text-sm tracking-wider text-stone-900 block leading-tight">
                  TAMARIND VILLAGE
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#821124] font-semibold block">
                  Direct Reservation Engine · Mombasa
                </span>
              </div>
            </div>

            {/* Middle Step Progress Indicator */}
            <div className="hidden md:flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span className="text-stone-900 font-bold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#821124] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                Review Stay &amp; Extras
              </span>
              <span className="text-stone-300">→</span>
              <span className="text-stone-900 font-bold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#821124] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                Guest Information
              </span>
              <span className="text-stone-300">→</span>
              <span className="text-stone-500 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-[10px] font-bold">3</span>
                Payment
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-stone-500 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-medium">256-Bit SSL Encrypted</span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-1.5 rounded-none border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                id="btn-close-checkout"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Stay</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
          {!confirmedData ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column (8 cols): Guest Details & Customization */}
                <div className="lg:col-span-7 space-y-6">

                  {/* Confirmed Stay Card vs Manual Selection */}
                  {hasPreselectedDates && !isEditingStay ? (
                    <div className="bg-white border border-stone-200 p-5 rounded-none shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none bg-[#821124]/10 text-[#821124] text-[10px] font-bold uppercase tracking-wider">
                          <Check className="w-3 h-3" />
                          <span>Selected Residence</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingStay(true)}
                          className="text-xs text-[#821124] hover:underline font-semibold cursor-pointer"
                        >
                          Modify Dates / Suite
                        </button>
                      </div>

                      <div className="flex items-start gap-4 pt-1">
                        {selectedApartment.image && (
                          <div className="w-20 h-20 rounded-none overflow-hidden shrink-0 border border-stone-200 bg-stone-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={selectedApartment.image} 
                              alt={selectedApartment.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="space-y-1">
                          <h3 className="font-serif text-lg font-bold text-stone-900">
                            {selectedApartment.name}
                          </h3>
                          <p className="text-xs text-stone-600 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span className="font-semibold text-stone-800">
                              {formatDisplayDate(checkIn)} — {formatDisplayDate(checkOut)}
                            </span>
                            <span className="text-stone-300">·</span>
                            <span>{breakdown?.nights || 1} Night{(breakdown?.nights || 1) !== 1 ? 's' : ''}</span>
                          </p>
                          <p className="text-xs text-stone-600 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-stone-400" />
                            <span>{adults} Adult{adults !== 1 ? 's' : ''}{children > 0 ? `, ${children} Child${children !== 1 ? 'ren' : ''}` : ''}</span>
                            <span className="text-stone-300">·</span>
                            <span className="font-medium text-[#821124]">
                              {selectedMealPlan?.name || "Flexible Rate — Room Only"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-stone-200 p-6 rounded-none shadow-xs space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-[#821124]" />
                          <h3 className="font-serif text-base font-bold text-stone-900">
                            Choose Residence &amp; Dates
                          </h3>
                        </div>
                        {hasPreselectedDates && isEditingStay && (
                          <button
                            type="button"
                            onClick={() => setIsEditingStay(false)}
                            className="text-xs text-stone-600 hover:text-stone-900 underline cursor-pointer"
                          >
                            Done Editing ✓
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                            Apartment Suite
                          </label>
                          <select
                            value={apartmentId}
                            onChange={(e) => handleApartmentChange(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-300 rounded-none px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-[#821124] focus:bg-white"
                          >
                            {activeApartments.map(apt => (
                              <option key={apt.id} value={apt.id}>
                                {apt.name} (Max {apt.maxGuests})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                            Check-In Date
                          </label>
                          <input
                            type="date"
                            required
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-300 rounded-none px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-[#821124] focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                            Check-Out Date
                          </label>
                          <input
                            type="date"
                            required
                            min={checkIn}
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-300 rounded-none px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-[#821124] focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Guest counter */}
                      <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 border border-stone-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="block text-xs font-bold text-stone-800">Adults</span>
                            <span className="text-[10px] text-stone-500">Age 13+ years</span>
                          </div>
                          <div className="flex items-center border border-stone-300 rounded-none overflow-hidden bg-white">
                            <button
                              type="button"
                              onClick={() => setAdults(Math.max(1, adults - 1))}
                              className="px-3 py-1 text-stone-600 hover:bg-stone-100 font-bold text-xs"
                            >
                              -
                            </button>
                            <span className="px-3 font-bold text-xs">{adults}</span>
                            <button
                              type="button"
                              onClick={() => setAdults(Math.min(selectedApartment.maxGuests - children, adults + 1))}
                              className="px-3 py-1 text-stone-600 hover:bg-stone-100 font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-l border-stone-200 pl-4">
                          <div>
                            <span className="block text-xs font-bold text-stone-800">Children</span>
                            <span className="text-[10px] text-stone-500">Up to 12 years</span>
                          </div>
                          <div className="flex items-center border border-stone-300 rounded-none overflow-hidden bg-white">
                            <button
                              type="button"
                              onClick={() => setChildren(Math.max(0, children - 1))}
                              className="px-3 py-1 text-stone-600 hover:bg-stone-100 font-bold text-xs"
                            >
                              -
                            </button>
                            <span className="px-3 font-bold text-xs">{children}</span>
                            <button
                              type="button"
                              onClick={() => setChildren(Math.min(selectedApartment.maxGuests - adults, children + 1))}
                              className="px-3 py-1 text-stone-600 hover:bg-stone-100 font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Meal Plan Selection */}
                      <div className="space-y-3 pt-3 border-t border-stone-200">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-800">
                            Boarding &amp; Dining Package
                          </label>
                          <span className="text-[10px] text-stone-500">Per guest / night</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {mealPlans.length === 0 ? (
                            <div className="sm:col-span-3 py-4 text-center text-xs text-stone-500 bg-stone-50 border border-stone-200">
                              Loading boarding packages...
                            </div>
                          ) : (
                            mealPlans.map((mp) => {
                              const isSelected = mealPlanId === mp.id;
                              return (
                                <div
                                  key={mp.id}
                                  onClick={() => setMealPlanId(mp.id)}
                                  className={`p-3.5 rounded-none border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                                    isSelected
                                      ? 'bg-[#821124]/5 border-[#821124] ring-1 ring-[#821124]'
                                      : 'bg-white border-stone-200 hover:border-stone-300'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 font-bold text-stone-700">
                                        {mp.shortName}
                                      </span>
                                      <span className="text-xs font-bold text-[#821124]">
                                        {mp.pricePerPersonPerDayUsd === 0 ? "Included ($0)" : `+$${mp.pricePerPersonPerDayUsd}/guest/day`}
                                      </span>
                                    </div>
                                    <h4 className="font-serif font-bold text-xs text-stone-900 mb-1 leading-snug">
                                      {mp.name}
                                    </h4>
                                    <p className="text-[10px] text-stone-500 leading-tight">
                                      {mp.description}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhance Your Stay (Optional Extras) */}
                  <div className="bg-white border border-stone-200 p-6 rounded-none shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#821124]" />
                        <h3 className="font-serif text-base font-bold text-stone-900">
                          Enhance Your Coastal Stay (Optional Extras)
                        </h3>
                      </div>
                      <span className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold">
                        Add to Booking
                      </span>
                    </div>

                    {availableExtras.length === 0 ? (
                      <div className="p-4 bg-stone-50 border border-stone-200 text-stone-500 text-xs text-center">
                        Loading resort services and luxury experiences...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableExtras.map((extra) => {
                          const qty = selectedExtras[extra.id] || 0;
                          const isSelected = qty > 0;
                          return (
                            <div
                              key={extra.id}
                              className={`p-3.5 border rounded-none transition-all flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-[#821124]/5 border-[#821124] shadow-xs'
                                  : 'bg-white border-stone-200 hover:border-stone-300'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {extra.image && (
                                  <div className="w-12 h-12 rounded-none overflow-hidden shrink-0 border border-stone-200 bg-stone-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={extra.image} alt={extra.name} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <h4 className="font-serif font-bold text-xs text-stone-900 truncate">
                                      {extra.name}
                                    </h4>
                                    <span className="text-xs font-bold text-[#821124] shrink-0 font-mono">
                                      +${extra.priceUsd}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-stone-500 line-clamp-2 leading-relaxed">
                                    {extra.description}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-3 mt-2 border-t border-stone-100">
                                <span className="text-[9px] uppercase tracking-wider text-stone-400 font-semibold">
                                  {extra.pricingUnit.replace('_', ' ')}
                                </span>
                                {isSelected ? (
                                  <div className="flex items-center border border-[#821124]/40 bg-white">
                                    <button
                                      type="button"
                                      onClick={() => updateExtraQty(extra.id, qty - 1)}
                                      className="px-2 py-0.5 text-stone-700 hover:bg-stone-100 font-bold text-xs"
                                    >
                                      -
                                    </button>
                                    <span className="px-2 text-xs font-bold text-[#821124]">{qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => updateExtraQty(extra.id, qty + 1)}
                                      className="px-2 py-0.5 text-stone-700 hover:bg-stone-100 font-bold text-xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => toggleExtra(extra.id)}
                                    className="px-2.5 py-1 text-[11px] font-semibold text-[#821124] border border-[#821124]/30 hover:bg-[#821124] hover:text-white transition-colors cursor-pointer"
                                  >
                                    + Add to Stay
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Lead Guest Details */}
                  <div className="bg-white border border-stone-200 p-6 rounded-none shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#821124]" />
                        <h3 className="font-serif text-base font-bold text-stone-900">
                          Lead Guest Contact Details
                        </h3>
                      </div>
                      <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                        Required for Booking Confirmation
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-300 rounded-none px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-[#821124] focus:bg-white"
                          id="guest-name"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. guest@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-300 rounded-none px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-[#821124] focus:bg-white"
                            id="guest-email"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                            Phone / WhatsApp *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="e.g. +254 700 000 000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-300 rounded-none px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-[#821124] focus:bg-white"
                            id="guest-phone"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                          Special Requests or Arrival Notes (Optional)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Honeymoon setup, late check-in time, dietary preferences, or oceanfront floor preference..."
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-300 rounded-none px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-[#821124] focus:bg-white resize-none"
                          id="guest-special-requests"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                          Promo / Voucher Code
                        </label>
                        <div className="flex items-center gap-2 max-w-sm">
                          <input
                            type="text"
                            placeholder="e.g. SPECIAL2026"
                            value={promocode}
                            disabled={Boolean(appliedVoucher)}
                            onChange={(e) => {
                              setPromocode(e.target.value.toUpperCase());
                              setVoucherError("");
                            }}
                            className={`flex-1 bg-stone-50 border border-stone-300 rounded-none px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#821124] focus:bg-white uppercase font-mono ${
                              appliedVoucher ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold" : ""
                            }`}
                            id="guest-promocode"
                          />
                          {appliedVoucher ? (
                            <button
                              type="button"
                              onClick={handleRemoveVoucher}
                              className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={voucherLoading || !promocode.trim()}
                              onClick={handleApplyVoucher}
                              className="px-4 py-2 bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                            >
                              {voucherLoading ? "Checking..." : "Apply"}
                            </button>
                          )}
                        </div>
                        {appliedVoucher && (
                          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                            ✓ Promo code active: {appliedVoucher.description || `${appliedVoucher.code} applied`}
                          </p>
                        )}
                        {voucherError && (
                          <p className="text-[11px] text-rose-600 font-medium mt-1">
                            {voucherError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Booking Conditions & Cancellation Policies */}
                  {conditions.length > 0 && (
                    <div className="bg-white border border-stone-200 p-6 rounded-none shadow-xs space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-stone-200">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-serif text-base font-bold text-stone-900">
                          Booking Conditions &amp; Policies
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {conditions.map((c) => (
                          <div key={c.id} className="p-3 bg-stone-50 border border-stone-200/80 rounded-none space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <strong className="text-stone-900 text-xs">{c.title}</strong>
                              {c.badge && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold">
                                  {c.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-stone-600 text-[11px] leading-snug">
                              {c.summary}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded-none accent-[#821124] cursor-pointer"
                            id="check-agree-terms"
                          />
                          <span className="text-xs text-stone-700 leading-snug">
                            I acknowledge and agree to Tamarind Village Mombasa&apos;s booking conditions, payment terms, and cancellation policies.
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {submitError && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-700 text-xs font-medium">
                      {submitError}
                    </div>
                  )}
                </div>

                {/* Right Column (5 cols): Sticky Reservation Summary */}
                <div className="lg:col-span-5 relative">
                  <div className="bg-white border border-stone-200 rounded-none p-6 shadow-sm sticky top-20 space-y-5">
                    <div className="pb-3 border-b border-stone-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#821124] block">
                        Live Rate Summary
                      </span>
                      <h3 className="font-serif text-xl font-bold text-stone-900">
                        Reservation Breakdown
                      </h3>
                    </div>

                    {/* Suite Mini Card */}
                    <div className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200">
                      {selectedApartment.image && (
                        <div className="w-16 h-12 rounded-none overflow-hidden shrink-0 border border-stone-200 bg-stone-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={selectedApartment.image} alt={selectedApartment.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-serif font-bold text-xs text-stone-900">
                          {selectedApartment.name}
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          {adults} Adults {children > 0 ? `· ${children} Children` : ''} · {breakdown?.nights || 1} Night{(breakdown?.nights || 1) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Itemized Calculation */}
                    {breakdown ? (
                      <div className="space-y-2.5 text-xs text-stone-600">
                        <div className="flex justify-between">
                          <span>
                            Suite Base ({breakdown.nights} nights x ${livePrice})
                          </span>
                          <span className="font-semibold text-stone-900 font-mono">
                            ${breakdown.baseRoomUsd}
                          </span>
                        </div>

                        {breakdown.mealPlanTotalUsd > 0 && (
                          <div className="flex justify-between">
                            <span className="truncate pr-2">
                              {breakdown.mealPlanName} ({breakdown.totalGuests} guests × {breakdown.nights} nights @ ${breakdown.mealPlanRateUsd}/day)
                            </span>
                            <span className="font-semibold text-stone-900 font-mono shrink-0">
                              +${breakdown.mealPlanTotalUsd}
                            </span>
                          </div>
                        )}

                        {breakdown.extrasBreakdown.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-stone-500">
                            <span className="truncate pr-2">
                              + {item.name} {item.qty > 1 ? `(x${item.qty})` : ''}
                            </span>
                            <span className="font-semibold text-stone-800 font-mono shrink-0">
                              +${item.costUsd}
                            </span>
                          </div>
                        ))}

                        {breakdown.discountUsd > 0 && (
                          <div className="flex justify-between items-center text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 border border-emerald-200">
                            <span className="font-semibold text-xs flex items-center gap-1.5">
                              <Ticket className="w-3.5 h-3.5" />
                              Voucher ({breakdown.appliedVoucherCode})
                            </span>
                            <span className="font-mono font-bold text-xs">
                              -${breakdown.discountUsd}
                            </span>
                          </div>
                        )}

                        <div className="border-t border-stone-200 pt-3 flex items-baseline justify-between">
                          <div>
                            <span className="font-serif text-base font-bold text-stone-900 block">
                              Total Amount
                            </span>
                            <span className="text-[11px] text-stone-400 font-mono block">
                              ≈ KES {breakdown.totalKes.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-serif text-2xl font-bold text-[#821124]">
                              ${breakdown.totalUsd} <span className="text-xs font-sans font-normal text-stone-500">USD</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-stone-50 text-stone-500 text-xs text-center border border-stone-200">
                        Please select check-in and check-out dates to calculate stay pricing.
                      </div>
                    )}

                    {/* Payment CTA Button */}
                    <div className="space-y-3 pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting || !checkIn || !checkOut}
                        className={`w-full py-4 font-bold text-xs uppercase tracking-widest transition-colors duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                          !checkIn || !checkOut || isSubmitting
                            ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                            : "bg-[#821124] text-white hover:bg-[#680e1c]"
                        }`}
                        id="btn-proceed-payment"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>
                          {isSubmitting ? "Connecting to Secure Gateway..." : "Proceed to Payment"}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      {/* Trust Highlights */}
                      <div className="pt-3 border-t border-stone-200 space-y-2 text-[11px] text-stone-500">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Direct Hotel Guarantee: Best rate booked directly with Tamarind</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Zero booking fees · Card &amp; M-Pesa instant confirmation</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Official confirmation voucher generated immediately</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </form>
          ) : (
            /* Confirmation Voucher Screen */
            <div className="max-w-2xl mx-auto bg-white border border-stone-200 p-8 sm:p-10 shadow-sm space-y-6 text-center">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-serif text-3xl font-bold text-stone-900">
                  Reservation Confirmed!
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
                  Your reservation at Tamarind Village Mombasa is officially confirmed. A copy has been emailed to <strong>{confirmedData.email}</strong>.
                </p>
              </div>

              <div className="p-5 bg-stone-50 border border-stone-200 text-xs text-left space-y-2 text-stone-700">
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Guest Reference:</span>
                  <span className="font-mono font-bold text-[#821124]">{confirmedData.guestToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Suite:</span>
                  <span className="font-bold text-stone-900">{confirmedData.apartmentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Stay Dates:</span>
                  <span className="font-mono font-semibold">{confirmedData.checkIn} → {confirmedData.checkOut}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Meal Plan:</span>
                  <span>{confirmedData.mealPlanName}</span>
                </div>
                <div className="flex justify-between border-t border-stone-200 pt-2 font-bold text-stone-900">
                  <span>Total Amount Paid:</span>
                  <span className="text-[#821124]">${confirmedData.totalCostUsd} USD</span>
                </div>
              </div>

              {/* Action Buttons: Download Voucher / Print / Close */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                  id="btn-download-confirmed-voucher"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Voucher (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close &amp; Return to Website
                </button>
              </div>
            </div>
          )}
        </main>
      </motion.div>
    </AnimatePresence>
  );
}
