'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Clock, Calendar, Users, ArrowLeft, Utensils, CheckCircle2,
  MapPin, Sparkles, Wine, Compass, Sunset, Anchor, ArrowRight,
  Info, Star, GlassWater, ChefHat, AlertCircle, RefreshCw, Ticket
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DiningExperience } from "@/types";
import OptimizedImage from "./OptimizedImage";

interface DiningDetailProps {
  dining: DiningExperience;
  onBack: () => void;
  onSelectDining: (id: string) => void;
  allDinings: DiningExperience[];
}

export default function DiningDetail({ dining, onBack, onSelectDining, allDinings }: DiningDetailProps) {
  if (!dining) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-12 text-center bg-stone-50 border border-stone-200">
        <p className="text-stone-500 font-light text-sm">Dining experience details are temporarily unavailable. Please try again later.</p>
        <button onClick={onBack} className="mt-4 px-6 py-2 bg-brand-teal text-white text-xs uppercase tracking-widest font-bold">
          Go Back
        </button>
      </div>
    );
  }

  // Gallery images based on dining ID to make it extremely immersive
  const getDiningGallery = (id: string) => {
    switch (id) {
      case "tamarind-restaurant":
        return [
          "https://media.tamarind.co.ke/tvl-website-assets/mr6.jpg",
          "https://media.tamarind.co.ke/tvl-website-assets/mr1.jpg",
          "https://media.tamarind.co.ke/tvl-website-assets/mr2.jpg"
        ];
      case "dawa-terrace":
        return [
          "https://media.tamarind.co.ke/tvl-website-assets/t1.jpg",
          "https://media.tamarind.co.ke/tvl-website-assets/t2.jpg",
          "https://media.tamarind.co.ke/tvl-website-assets/dawa.jpg"
        ];
      case "tamarind-dhow":
        return [
          "https://media.tamarind.co.ke/tvl-website-assets/d2.jpg",
          "https://media.tamarind.co.ke/tvl-website-assets/d1.jpg",
          "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--2.jpg"
        ];
      default:
        return [dining.image];
    }
  };

  const gallery = getDiningGallery(dining.id);
  const [activeImage, setActiveImage] = useState(gallery[0]);

  // Form states
  const [reserveDate, setReserveDate] = useState("");
  const [reserveTime, setReserveTime] = useState("");
  const [reserveGuests, setReserveGuests] = useState(2);
  const [seatingPreference, setSeatingPreference] = useState("creekside");
  const [cruiseType, setCruiseType] = useState("dinner"); // for dhow cruise
  const [charterType, setCharterType] = useState("shared"); // shared or private
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [dietary, setDietary] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isDiningSubmitting, setIsDiningSubmitting] = useState(false);
  const [diningSubmitError, setDiningSubmitError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmedToken, setConfirmedToken] = useState("");
  const [venueEvents, setVenueEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        if (data.events && Array.isArray(data.events)) {
          const matching = data.events.filter((e: any) => {
            const brandNorm = (e.brand || '').toLowerCase().replace(/_/g, '-');
            const diningIdNorm = dining.id.toLowerCase().replace(/_/g, '-');
            return (
              brandNorm === diningIdNorm ||
              (dining.id === 'tamarind-restaurant' && (brandNorm.includes('restaurant') || e.venue?.toLowerCase().includes('restaurant'))) ||
              (dining.id === 'tamarind-dhow' && (brandNorm.includes('dhow') || e.venue?.toLowerCase().includes('dhow'))) ||
              (dining.id === 'dawa-terrace' && (brandNorm.includes('dawa') || e.venue?.toLowerCase().includes('dawa')))
            );
          });
          setVenueEvents(matching);
        }
      })
      .catch(() => {});
  }, [dining.id]);

  // Additional data based on dining ID
  const getDiningSpecials = (id: string) => {
    switch (id) {
      case "tamarind-restaurant":
        return {
          tagline: "East Africa's Seafood Pinnacle",
          seatingOptions: [
            { id: "creekside", name: "Creekside Cliffside Deck (Highly Recommended)" },
            { id: "indoor-dome", name: "Moorish Domed Main Hall" },
            { id: "bar-lounge", name: "Copper Dome Bar Counter" }
          ],
          extraDetail: "Our seafood is sourced exclusively from registered artisanal fishermen in Shimoni and Kilifi, delivering 'hook-to-plate' freshness within 6 hours of catch."
        };
      case "dawa-terrace":
        return {
          tagline: "Sunset Lounge & Overwater Deck",
          seatingOptions: [
            { id: "creekside", name: "Floating Overwater Sofa" },
            { id: "sunset-counter", name: "High-top Sunset Ridge Bar" },
            { id: "garden-alcove", name: "Palm Tree Garden Lounge" }
          ],
          extraDetail: "Enjoy deep tropical house sets and authentic acoustic live performances every Friday and Saturday evening from 6:30 PM."
        };
      case "tamarind-dhow":
        return {
          tagline: "Floating Historical Romance",
          seatingOptions: [
            { id: "main-deck", name: "Main Dining Deck (Open Sky Under Sail)" },
            { id: "stern-lounge", name: "Stern Captain's Lounge" },
            { id: "bow-viewpoint", name: "Bow Viewpoint Cushion Deck" }
          ],
          extraDetail: "Built in 1977 and 1983 respectively, the Nawalikoni and Babulkher are hand-crafted from indigenous mvule wood, maintaining the pure structural spirit of traditional maritime trade."
        };
      default:
        return {
          tagline: "Fine Dining Mombasa",
          seatingOptions: [{ id: "creekside", name: "Creekside Deck" }],
          extraDetail: "Tamarind hospitality offers unforgettable service and cuisine."
        };
    }
  };

  const specials = getDiningSpecials(dining.id);

  // Budget calculations
  const calculateEstimate = () => {
    let perPerson = 0;
    let baseTotal = 0;
    let extraChargeName = "";
    let extraChargeVal = 0;

    if (dining.id === "tamarind-restaurant") {
      perPerson = 45;
    } else if (dining.id === "dawa-terrace") {
      perPerson = 25;
    } else if (dining.id === "tamarind-dhow") {
      perPerson = cruiseType === "dinner" ? 85 : 60;
      if (charterType === "private") {
        baseTotal = 850; // base charter fee
        extraChargeName = "Private Charter Crew & Fuel Service";
        extraChargeVal = 150;
      }
    }

    const foodCost = perPerson * reserveGuests;
    const finalFood = baseTotal > 0 ? baseTotal : foodCost;
    const taxes = Math.round(finalFood * 0.16); // 16% VAT and Service
    const grandTotal = finalFood + taxes + extraChargeVal;

    return {
      perPerson,
      foodCost: finalFood,
      taxes,
      extraName: extraChargeName,
      extraVal: extraChargeVal,
      total: grandTotal
    };
  };

  const estimate = calculateEstimate();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestEmail || !guestPhone || !reserveDate || !reserveTime) {
      toast.error("Please fill out all mandatory guest contact and booking details.");
      return;
    }

    setIsDiningSubmitting(true);
    setDiningSubmitError("");

    try {
      const extraDetails = [
        `Seating preference: ${seatingPreference}`,
        dietary ? `Dietary constraints: ${dietary}` : "",
        specialRequests ? `Special notes: ${specialRequests}` : "",
        dining.id === "tamarind-dhow" ? `Cruise selection: ${cruiseType} cruise, ${charterType} charter` : "",
      ].filter(Boolean).join("\n");

      const response = await fetch("/api/inquire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "restaurant",
          venue: dining.id === "dawa-terrace" ? "dawa_terrace" : dining.id === "tamarind-dhow" ? "dhow" : (dining.id === "golden-key" || dining.id === "golden-key-casino") ? "golden_key" : "restaurant",
          payload: {
            name: guestName,
            email: guestEmail,
            phone: guestPhone,
            diningName: dining.name,
            date: reserveDate,
            time: reserveTime,
            guests: reserveGuests,
            details: extraDetails,
            totalCost: estimate.total,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit dining reservation inquiry.");
      }

      setIsSubmitted(true);
      toast.success("Dining reservation inquiry submitted successfully!");
    } catch (err: any) {
      console.error("Error submitting dining inquiry:", err);
      toast.error(err.message || "An error occurred while sending your request. Please try again.");
      setDiningSubmitError(err.message || "An error occurred while sending your request. Please try again.");
    } finally {
      setIsDiningSubmitting(false);
    }
  };

  const otherDinings = allDinings.filter(d => d.id !== dining.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id={`dining-detail-${dining.id}`}>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="group flex items-center gap-2 text-stone-600 hover:text-brand-teal font-medium mb-8 transition-colors duration-200 cursor-pointer"
        id="btn-back-to-home"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
        <span className="text-xs uppercase tracking-widest font-bold">Back to Main Resort</span>
      </button>

      {/* Main Dining Title */}
      <div className="mb-10 text-left">
        <div className="flex items-center gap-2 mb-2 text-brand-teal text-xs font-bold tracking-widest uppercase">
          <Utensils className="w-4 h-4" />
          <span>{specials.tagline}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif text-brand-dark tracking-tight" id="dining-title">
          {dining.name}
        </h1>
        <p className="text-stone-500 mt-2 text-base sm:text-lg font-light leading-relaxed max-w-4xl">
          Savor world-famous coastal flavors right next to your Tamarind Village serviced apartment.
        </p>
      </div>

      {/* Gallery & Quick specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">

        {/* Left: Gallery & Description (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Image */}
          <div className="relative aspect-[16/10] bg-stone-100 rounded-none overflow-hidden shadow-md">
            <OptimizedImage
              src={activeImage}
              preset="gallery"
              alt={dining.name}
              className="w-full h-full object-cover"
              id="dining-main-image"
              loading="eager"
            />
            <div className="absolute top-4 left-4 bg-brand-dark/95 border border-stone-800 px-3 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-widest text-brand-gold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{dining.hours}</span>
            </div>
          </div>

          {/* Gallery Thumbnails */}
          <div className="grid grid-cols-3 gap-3">
            {gallery.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`relative aspect-[4/3] rounded-none overflow-hidden cursor-pointer transition-all duration-200 ${activeImage === img
                  ? "ring-2 ring-brand-teal ring-offset-2 scale-98 shadow-sm"
                  : "opacity-75 hover:opacity-100 hover:scale-102"
                  }`}
                id={`dining-thumb-${idx}`}
              >
                <OptimizedImage
                  src={img}
                  preset="thumb"
                  alt={`${dining.name} detail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Description */}
          <div className="pt-6 border-t border-stone-200">
            <h3 className="text-xl font-serif text-brand-dark mb-3">The Gastronomy Experience</h3>
            <p className="text-stone-600 leading-relaxed font-light mb-6 text-xs sm:text-sm">
              {dining.description}
            </p>

            <p className="p-4 bg-brand-teal/5 border-l-2 border-brand-teal text-stone-700 text-xs sm:text-sm font-light leading-relaxed italic mb-8">
              "{specials.extraDetail}"
            </p>

            {/* Experience Highlights */}
            {dining.highlights && dining.highlights.length > 0 && (
              <div>
                <h4 className="text-lg font-serif text-brand-dark mb-4 pb-2 border-b border-stone-200">
                  Experience Highlights
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dining.highlights.map((highlight, idx) => (
                    <div key={idx} className="bg-brand-sand/50 p-3.5 border border-stone-200 rounded-none flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                      <span className="text-stone-700 text-xs font-light leading-relaxed">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Stay Specs & Inquiry Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Quick specs card */}
          <div className="bg-brand-sand/40 border border-stone-200 rounded-none p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-serif text-brand-dark pb-2 border-b border-stone-200">Table & Venue Guidelines</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-200/60 text-stone-700">
                  <Star className="w-4 h-4 text-brand-teal" />
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Standard</p>
                  <p className="text-xs font-semibold text-stone-800">5-Star Coastal</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-200/60 text-stone-700">
                  <GlassWater className="w-4 h-4 text-brand-teal" />
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Dress Code</p>
                  <p className="text-xs font-semibold text-stone-800">Smart Casual</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-200/60 text-stone-700">
                  <ChefHat className="w-4 h-4 text-brand-teal" />
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">In-Room Dining</p>
                  <p className="text-xs font-semibold text-stone-800">Veranda Delivery</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-200/60 text-stone-700">
                  <Wine className="w-4 h-4 text-brand-teal" />
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Corkage</p>
                  <p className="text-xs font-semibold text-stone-800">Allowed ($15 fee)</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-brand-teal/5 border border-brand-teal/15 text-xs text-stone-600 leading-relaxed font-light">
              <p className="font-semibold text-brand-dark mb-0.5">Resident Privilege Note:</p>
              Tamarind Village guests bypass external reservation lists. Present your room card / credentials upon arrival at the desk for expedited seating.
            </div>
          </div>

          {/* Interactive Reservation Form */}
          <div className="bg-white border border-stone-200 rounded-none shadow-sm overflow-hidden relative" id="dining-reservation-widget">
            <div className="bg-brand-dark text-white px-6 py-4">
              <h3 className="font-serif text-lg text-brand-gold font-bold uppercase tracking-wider">Direct Dining Inquiry</h3>
              <p className="text-xs text-stone-400 font-light mt-0.5">Secure creekside seating or cruise reservations instantly</p>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-left">

                {/* Specific options for Dhow Cruise */}
                {dining.id === "tamarind-dhow" && (
                  <div className="space-y-3 p-3.5 bg-brand-teal/5 border border-brand-teal/10 mb-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">Cruise Journey Type</label>
                      <select
                        value={cruiseType}
                        onChange={(e) => setCruiseType(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 bg-white focus:outline-none focus:border-brand-teal"
                      >
                        <option value="lunch">Tamarind Lunch Cruise ($60/person)</option>
                        <option value="dinner">Tamarind Candlelit Sunset Dinner Cruise ($85/person)</option>
                        <option value="sundowner">Sunset Cocktail Cruise ($45/person)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">Booking Format</label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setCharterType("shared")}
                          className={`py-2 text-center border font-bold ${charterType === "shared" ? "bg-brand-dark text-white border-brand-dark" : "bg-white text-stone-700 border-stone-300"}`}
                        >
                          Shared Voyage
                        </button>
                        <button
                          type="button"
                          onClick={() => setCharterType("private")}
                          className={`py-2 text-center border font-bold ${charterType === "private" ? "bg-brand-dark text-white border-brand-dark" : "bg-white text-stone-700 border-stone-300"}`}
                        >
                          Private Charter
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grid: Date and Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">Preferred Date</label>
                    <input
                      type="date"
                      required
                      min="2026-06-29"
                      value={reserveDate}
                      onChange={(e) => setReserveDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 bg-stone-50/50 focus:outline-none focus:border-brand-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">Preferred Time</label>
                    <input
                      type="time"
                      required
                      value={reserveTime}
                      onChange={(e) => setReserveTime(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 bg-stone-50/50 focus:outline-none focus:border-brand-teal"
                    />
                  </div>
                </div>

                {/* Grid: Seating & Guests */}
                <div className="grid grid-cols-2 gap-3 items-end">
                  {dining.id !== "tamarind-dhow" ? (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">Seating Zone</label>
                      <select
                        value={seatingPreference}
                        onChange={(e) => setSeatingPreference(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 bg-stone-50/50 focus:outline-none focus:border-brand-teal"
                      >
                        {specials.seatingOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">Onboard Zone</label>
                      <select
                        value={seatingPreference}
                        onChange={(e) => setSeatingPreference(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 bg-stone-50/50 focus:outline-none focus:border-brand-teal"
                      >
                        {specials.seatingOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">Cover Guests</label>
                    <div className="flex items-center border border-stone-300 rounded-none overflow-hidden bg-stone-50/50 h-[34px]">
                      <button
                        type="button"
                        onClick={() => setReserveGuests(prev => Math.max(1, prev - 1))}
                        className="px-3 py-1 hover:bg-stone-200 text-stone-600 font-bold h-full cursor-pointer"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center font-mono text-xs text-stone-800 font-bold">{reserveGuests}</span>
                      <button
                        type="button"
                        onClick={() => setReserveGuests(prev => Math.min(25, prev + 1))}
                        className="px-3 py-1 hover:bg-stone-200 text-stone-600 font-bold h-full cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dynamic Price Estimator Panel */}
                {reserveDate ? (
                  <div className="p-4 bg-brand-sand border border-stone-200 rounded-none space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span>Cover Food & Drinks Estimation ({reserveGuests} guests)</span>
                      <span className="font-semibold text-stone-800">${estimate.foodCost}</span>
                    </div>
                    {estimate.extraName && (
                      <div className="flex justify-between text-stone-600">
                        <span>{estimate.extraName}</span>
                        <span className="font-semibold text-stone-800">${estimate.extraVal}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-600">
                      <span>Government Tourism VAT & Catering Levy (16%)</span>
                      <span className="font-semibold text-stone-800">${estimate.taxes}</span>
                    </div>
                    <div className="border-t border-stone-300 pt-2 flex justify-between text-xs font-serif font-bold text-brand-dark">
                      <span>Estimated Dining Balance</span>
                      <span className="text-brand-teal font-sans">${estimate.total} USD</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-brand-teal/5 border border-brand-teal/15 text-brand-dark rounded-none text-xs text-center font-light">
                    Select a preferred date to generate custom menu cost projections.
                  </div>
                )}

                {/* Guest Contacts */}
                <div className="pt-2 border-t border-stone-100 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-800 block pb-1 border-b border-stone-100">Guest Contact Information</h4>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Phone (e.g. +254...)"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Dietary requirements (e.g., Shellfish Allergy, Vegetarian)"
                      value={dietary}
                      onChange={(e) => setDietary(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal"
                    />
                  </div>

                  <div>
                    <textarea
                      placeholder="Special requests, celebration milestones, or specific table desires..."
                      rows={2}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal resize-none"
                    />
                  </div>
                </div>

                {/* Submit */}
                {diningSubmitError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs font-medium border-l-2 border-red-600 mb-3">
                    {diningSubmitError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isDiningSubmitting}
                  className="w-full py-3 bg-brand-dark hover:bg-brand-teal text-white font-bold rounded-none text-xs transition-colors duration-200 uppercase tracking-widest shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  id="btn-submit-dining-inquiry"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{isDiningSubmitting ? "Submitting Reservation..." : "Submit Dining Reservation"}</span>
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center space-y-4"
                id="dining-success-screen"
              >
                <div className="w-12 h-12 bg-brand-teal/10 text-brand-teal rounded-none flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-xl text-brand-dark font-bold">Reservation Logged!</h4>
                <div className="p-4 bg-brand-sand border border-stone-200 rounded-none text-xs text-left space-y-2 text-stone-600 font-light">
                  <p><strong>Venue:</strong> {dining.name}</p>
                  <p><strong>Date & Time:</strong> {reserveDate} at {reserveTime}</p>
                  <p><strong>Inquirer:</strong> {guestName}</p>
                  <p><strong>Cover Guests:</strong> {reserveGuests} Adults</p>
                  {dining.id === "tamarind-dhow" && (
                    <p><strong>Voyage Type:</strong> {cruiseType === "dinner" ? "Dinner Cruise" : cruiseType === "lunch" ? "Lunch Cruise" : "Sunset Cocktail"}</p>
                  )}
                  <p className="text-brand-teal font-medium"><strong>Projected Menu Total:</strong> ${estimate.total} USD</p>
                </div>
                <p className="text-stone-500 text-xs font-light leading-relaxed">
                  The dining reservation desk has prioritized your Swahili coastal booking. A formal SMS and email verification with dining credentials has been dispatched to <span className="font-semibold">{guestEmail}</span>.
                </p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setGuestName("");
                    setGuestEmail("");
                    setGuestPhone("");
                    setDietary("");
                    setSpecialRequests("");
                  }}
                  className="px-6 py-2 border border-brand-dark text-brand-dark font-bold rounded-none text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors cursor-pointer"
                  id="btn-new-dining-inquiry"
                >
                  Request Another Table
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Venue Events & Experiences */}
      {venueEvents.length > 0 && (
        <div className="pt-10 pb-4 border-t border-stone-200" id="venue-events-section">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-gold/15 text-brand-dark text-[10px] font-bold tracking-widest uppercase mb-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                <span>Special Happenings &amp; Curated Sessions</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif text-brand-dark">
                Upcoming Experiences at {dining.name}
              </h3>
            </div>
            <Link
              href="/events"
              className="text-xs uppercase tracking-widest font-bold text-brand-teal hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>View All Group Events</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venueEvents.map((evt) => {
              const poster = evt.image || evt.posterUrl || gallery[0];
              const dateStr = evt.startDate || evt.eventDate || 'Upcoming Date';
              const timeStr = evt.timeText || evt.eventTime || 'Evening Session';
              const priceKes = evt.priceKes || evt.ticketPriceKes || 0;
              const priceUsd = evt.priceUsd || 0;

              return (
                <div
                  key={evt.id}
                  className="bg-white border border-stone-200 rounded-none overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                      <OptimizedImage
                        src={poster}
                        alt={evt.title}
                        preset="card"
                        className="w-full h-full object-cover transform duration-500 group-hover:scale-103"
                      />
                      {priceKes > 0 && (
                        <div className="absolute bottom-3 right-3 bg-brand-dark/90 backdrop-blur-xs text-brand-gold px-2.5 py-1 text-[11px] font-bold font-mono shadow">
                          KES {priceKes.toLocaleString()}
                          {priceUsd > 0 && <span className="text-stone-300 ml-1">(${priceUsd})</span>}
                        </div>
                      )}
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-3 text-[11px] text-stone-500 font-medium">
                        <span className="flex items-center gap-1 text-brand-teal font-semibold">
                          <Calendar className="w-3.5 h-3.5" /> {dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {timeStr}
                        </span>
                      </div>
                      <h4 className="font-serif text-base font-bold text-brand-dark group-hover:text-brand-teal transition-colors">
                        {evt.title}
                      </h4>
                      <p className="text-stone-600 text-xs font-light line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                      {evt.venue}
                    </span>
                    <Link
                      href="/events"
                      className="px-3.5 py-1.5 bg-brand-teal text-white text-[11px] font-bold uppercase tracking-wider hover:bg-brand-dark transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Reserve</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alternative dining choices cross-linking */}
      <div className="pt-10 border-t border-stone-200">
        <h3 className="text-2xl font-serif text-brand-dark mb-8 text-center">Alternative Dining Experiences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {otherDinings.map((apt) => (
            <div
              key={apt.id}
              onClick={() => {
                onSelectDining(apt.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="bg-white border border-stone-200 rounded-none overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row cursor-pointer group"
              id={`recommend-dining-${apt.id}`}
            >
              <div className="sm:w-2/5 aspect-[16/10] sm:aspect-auto relative overflow-hidden bg-stone-100">
                <OptimizedImage
                  src={apt.image}
                  preset="card"
                  alt={apt.name}
                  className="w-full h-full object-cover transform duration-500 group-hover:scale-103"
                />
              </div>
              <div className="p-6 sm:w-3/5 flex flex-col justify-between">
                <div>
                  <h4 className="font-serif text-lg text-brand-dark group-hover:text-brand-teal transition-colors">
                    {apt.name}
                  </h4>
                  <p className="text-stone-500 text-xs font-light line-clamp-2 mt-2 leading-relaxed">
                    {apt.description}
                  </p>
                  <p className="text-[10px] font-mono text-stone-400 mt-3 font-semibold uppercase tracking-wider">
                    Hours: {apt.hours.split(" | ")[0]}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-stone-100/80 flex items-center justify-between">
                  <span className="text-xs text-brand-teal font-bold flex items-center gap-1 group-hover:underline uppercase tracking-wider">
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
