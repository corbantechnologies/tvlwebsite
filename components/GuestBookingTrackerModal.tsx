'use client';

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Calendar, Users, MapPin, Phone, Mail, ShieldCheck, CheckCircle2,
  Clock, AlertCircle, ArrowRight, Copy, Check, MessageSquare, CreditCard,
  RefreshCw, X, ChevronRight, Download, DollarSign, Utensils, Sparkles,
  Maximize2, Minimize2, Trash2, Key, AlertTriangle, Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GuestBookingTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialToken?: string;
  onOpenBookingModal?: () => void;
}

export default function GuestBookingTrackerModal({
  isOpen,
  onClose,
  initialToken,
  onOpenBookingModal
}: GuestBookingTrackerModalProps) {
  const [tokenInput, setTokenInput] = useState(initialToken || "");
  const [activeToken, setActiveToken] = useState(initialToken || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<any | null>(null);
  const [recordType, setRecordType] = useState<"inquiry" | "booking" | null>(null);

  // Special requests edit form
  const [showRequestsForm, setShowRequestsForm] = useState(false);
  const [specialRequests, setSpecialRequests] = useState("");
  const [dietaryNeeds, setDietaryNeeds] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [guestNotes, setGuestNotes] = useState("");
  const [savingRequests, setSavingRequests] = useState(false);

  // Cancellation state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Paystack online payment
  const [initiatingPay, setInitiatingPay] = useState(false);

  // Copy feedback
  const [copiedLink, setCopiedLink] = useState(false);

  // Load record whenever initialToken changes or is set
  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
      setActiveToken(initialToken);
      fetchBookingDetails(initialToken);
    }
  }, [initialToken]);

  const fetchBookingDetails = async (tokenToFetch: string) => {
    if (!tokenToFetch.trim()) return;
    setLoading(true);
    setError(null);

    const cleanToken = tokenToFetch.trim().toUpperCase();

    try {
      const res = await fetch(`/api/guest/inquiry/${encodeURIComponent(cleanToken)}`);
      const data = await res.json();

      if (res.ok && (data.inquiry || data.booking)) {
        if (data.inquiry) {
          setRecord(data.inquiry);
          setRecordType("inquiry");
          const p = data.inquiry.payload || {};
          setSpecialRequests(p.specialRequests || "");
          setDietaryNeeds(p.dietaryNeeds || "");
          setArrivalTime(p.arrivalTime || "");
          setGuestNotes(p.guestNotes || "");
        } else {
          setRecord(data.booking);
          setRecordType("booking");
          setSpecialRequests(data.booking.specialRequests || "");
        }
      } else {
        // Fallback: try /api/track
        const trackRes = await fetch(`/api/track?token=${encodeURIComponent(cleanToken)}`);
        const trackData = await trackRes.json();
        if (trackRes.ok && (trackData.inquiry || trackData.booking)) {
          const rec = trackData.inquiry || trackData.booking;
          setRecord(rec);
          setRecordType(trackData.type || "inquiry");
          const p = rec.payload || {};
          setSpecialRequests(p.specialRequests || rec.specialRequests || "");
        } else {
          setError(data.error || trackData.error || "No reservation found for this reference code.");
          setRecord(null);
        }
      }
    } catch {
      setError("Unable to connect to Tamarind reservations server.");
      setRecord(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setActiveToken(tokenInput.trim());
    fetchBookingDetails(tokenInput.trim());
  };

  // Submit special requests update via PATCH
  const handleSaveSpecialRequests = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeToken) return;
    setSavingRequests(true);
    try {
      const res = await fetch(`/api/guest/inquiry/${encodeURIComponent(activeToken)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialRequests,
          dietaryNeeds,
          arrivalTime,
          notes: guestNotes,
        }),
      });

      if (res.ok) {
        toast.success("Special requests saved! Our team has been notified.");
        setShowRequestsForm(false);
        fetchBookingDetails(activeToken);
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to save requests");
      }
    } catch {
      toast.error("Network error saving requests");
    } finally {
      setSavingRequests(false);
    }
  };

  // Cancel reservation / inquiry via DELETE
  const handleCancelBooking = async () => {
    if (!activeToken) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/guest/inquiry/${encodeURIComponent(activeToken)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Reservation cancelled. A confirmation has been sent to your email.");
        setShowCancelConfirm(false);
        fetchBookingDetails(activeToken);
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to cancel reservation");
      }
    } catch {
      toast.error("Network error cancelling reservation");
    } finally {
      setCancelling(false);
    }
  };

  // Pay online with Paystack
  const handlePayNow = async () => {
    if (!record) return;
    setInitiatingPay(true);
    const p = record.payload || {};
    const amount = record.totalAmount || p.totalCostUsd || p.totalCost || 160;
    const email = record.guestEmail || p.email;

    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount,
          currency: record.currency || "USD",
          reference: `TVL-${Date.now()}`,
          metadata: {
            inquiryId: record.id,
            guestToken: activeToken,
            apartmentName: record.apartmentName || p.apartmentName,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        toast.error(data.error || "Failed to initialize payment");
      }
    } catch {
      toast.error("Network error connecting to payment gateway");
    } finally {
      setInitiatingPay(false);
    }
  };

  const copyMagicLink = () => {
    const url = `${window.location.origin}/track?token=${activeToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success("Guest link copied to clipboard!");
  };

  if (!isOpen) return null;

  // Normalise record data
  const p = record?.payload || {};
  const guestName = record?.guestName || p.name || "Guest";
  const guestEmail = record?.guestEmail || p.email || "";
  const guestPhone = record?.guestPhone || p.phone || "";
  const suiteName = record?.apartmentName || p.apartmentName || p.apartmentType || "Tamarind Village Suite";
  const checkIn = record?.checkIn || p.checkIn || "—";
  const checkOut = record?.checkOut || p.checkOut || "—";
  const totalAmount = record?.totalAmount || p.totalCostUsd || p.totalCost || 0;
  const currency = record?.currency || p.currency || "USD";
  const status = record?.bookingStatus || record?.status || "Pending";
  const paymentStatus = record?.paymentStatus || p.paymentStatus || "unpaid";
  const allocatedUnit = record?.allocatedUnit || null;
  const mealPlanName = record?.mealPlanName || p.mealPlanName || (p.packageId ? `Package: ${p.packageId}` : null);
  const isCancelled = status.toLowerCase().includes("cancel");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#1F1615] border border-[#C59B27]/40 shadow-2xl rounded-2xl overflow-hidden max-h-[92vh] flex flex-col text-xs text-white">
        {/* Header */}
        <div className="bg-[#16100F] border-b border-[#C59B27]/25 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-mono text-[#C59B27] uppercase tracking-widest block">
              Guest Self-Service Portal
            </span>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-white">
              Tamarind Village Stay Manager
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
          {/* Reference Search Input */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter your reference code (e.g. TVL-XXXXXX)"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1 bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-[#C59B27]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Track"}
            </button>
          </form>

          {error && (
            <div className="p-4 bg-red-950/60 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {record && (
            <div className="space-y-5">
              {/* Reference & Status Bar */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider block">
                    Your Booking Reference
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-base font-bold text-[#C59B27]">
                      {record.guestToken || record.bookingReference || activeToken}
                    </span>
                    <button
                      onClick={copyMagicLink}
                      className="p-1 rounded text-white/50 hover:text-white"
                      title="Copy guest portal link"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    isCancelled
                      ? 'bg-red-950/80 text-red-400 border border-red-500/40'
                      : status.toLowerCase().includes('confirm') || status.toLowerCase().includes('book')
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                  }`}>
                    {status}
                  </span>
                </div>
              </div>

              {/* Suite & Stay Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-2">
                  <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider block">
                    Suite &amp; Room Assignment
                  </span>
                  <div className="text-sm font-serif font-bold text-white">
                    {suiteName}
                  </div>
                  {allocatedUnit ? (
                    <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/30">
                      <Key className="w-3.5 h-3.5" />
                      <span>Allocated: {allocatedUnit}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-white/50 italic block">
                      Physical unit will be assigned by front desk prior to arrival.
                    </span>
                  )}
                  {mealPlanName && (
                    <div className="text-xs text-[#C59B27] font-semibold pt-1">
                      Meal Plan: {mealPlanName}
                    </div>
                  )}
                </div>

                <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-2">
                  <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider block">
                    Dates &amp; Lead Guest
                  </span>
                  <div className="font-mono text-xs text-white">
                    {checkIn} → {checkOut}
                  </div>
                  <div className="text-xs text-white/80">
                    Lead Guest: <strong className="text-white">{guestName}</strong>
                  </div>
                  <div className="text-[11px] text-white/50">
                    {guestEmail} {guestPhone ? `· ${guestPhone}` : ''}
                  </div>
                </div>
              </div>

              {/* Payment Status Bar */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-[10px] text-white/50 uppercase font-bold block">Billing Status</span>
                  <div className="text-sm font-mono font-bold text-white">
                    {currency} {Number(totalAmount).toLocaleString()}
                    <span className={`ml-2 text-xs uppercase px-2 py-0.5 rounded font-sans font-bold ${
                      paymentStatus === 'paid' || paymentStatus === 'fully_paid'
                        ? 'text-emerald-400 bg-emerald-950/60'
                        : 'text-amber-400 bg-amber-950/60'
                    }`}>
                      {paymentStatus}
                    </span>
                  </div>
                </div>

                {paymentStatus !== 'paid' && !isCancelled && (
                  <button
                    onClick={handlePayNow}
                    disabled={initiatingPay}
                    className="px-4 py-2 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{initiatingPay ? 'Connecting...' : 'Pay Online with Card / M-Pesa'}</span>
                  </button>
                )}
              </div>

              {/* Special Requests Section */}
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C59B27]" />
                    <span className="font-bold text-white text-xs">Special Requests &amp; Notes</span>
                  </div>
                  {!isCancelled && (
                    <button
                      onClick={() => setShowRequestsForm(!showRequestsForm)}
                      className="text-xs text-[#C59B27] hover:underline"
                    >
                      {showRequestsForm ? "Hide Form" : "Update Requests"}
                    </button>
                  )}
                </div>

                {!showRequestsForm ? (
                  <div className="text-xs text-white/70 space-y-1">
                    <p>{specialRequests || "No special requests currently recorded."}</p>
                    {dietaryNeeds && <p><strong className="text-white">Dietary:</strong> {dietaryNeeds}</p>}
                    {arrivalTime && <p><strong className="text-white">Arrival Time:</strong> {arrivalTime}</p>}
                  </div>
                ) : (
                  <form onSubmit={handleSaveSpecialRequests} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#C59B27] mb-1">
                        Special Requests (Honeymoon Setup, Crib, Extra Pillows)
                      </label>
                      <textarea
                        rows={2}
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        className="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#C59B27] mb-1">
                          Dietary Needs
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Vegetarian, Halal, Seafood allergy"
                          value={dietaryNeeds}
                          onChange={(e) => setDietaryNeeds(e.target.value)}
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#C59B27] mb-1">
                          Estimated Arrival Time
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 15:30 afternoon"
                          value={arrivalTime}
                          onChange={(e) => setArrivalTime(e.target.value)}
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowRequestsForm(false)}
                        className="px-3 py-1.5 rounded-lg border border-white/20 text-white text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingRequests}
                        className="px-4 py-1.5 rounded-lg bg-[#821124] text-white text-xs font-bold uppercase tracking-wider"
                      >
                        {savingRequests ? "Saving..." : "Save Requests"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Cancellation Option */}
              {!isCancelled && (
                <div className="pt-2 border-t border-white/10">
                  {!showCancelConfirm ? (
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-[11px]">
                        Need to change plans or cancel your reservation?
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(true)}
                        className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer"
                      >
                        Cancel Reservation
                      </button>
                    </div>
                  ) : (
                    <div className="bg-red-950/40 border border-red-500/30 p-4 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-red-300 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span>Are you sure you want to cancel this reservation?</span>
                      </div>
                      <p className="text-[11px] text-white/70 leading-relaxed">
                        Direct website reservations may be cancelled without penalty up to 48 hours prior to scheduled check-in. Upon cancellation, your reserved apartment will be released and a cancellation receipt will be emailed to <strong className="text-white">{guestEmail}</strong>.
                      </p>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(false)}
                          className="px-3.5 py-1.5 rounded-lg border border-white/20 text-white text-xs"
                        >
                          Keep My Reservation
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelBooking}
                          disabled={cancelling}
                          className="px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
