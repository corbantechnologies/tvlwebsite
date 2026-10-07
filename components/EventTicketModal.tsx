'use client';

import React, { useState } from 'react';
import {
  X,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CreditCard,
  Tag,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface EventTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    venue: string;
    brand?: string;
    startDate?: string;
    eventDate?: string;
    timeText?: string;
    eventTime?: string;
    priceKes?: number;
    ticketPriceKes?: number;
    priceUsd?: number;
    image?: string;
    posterUrl?: string;
    subaccountCode?: string | null;
  } | null;
}

export default function EventTicketModal({ isOpen, onClose, event }: EventTicketModalProps) {
  const [ticketCount, setTicketCount] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [dietaryRequirements, setDietaryRequirements] = useState('');

  // Voucher / Promo code
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discountAmountKes: number;
    discountType: string;
    discountValue: number;
  } | null>(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  if (!isOpen || !event) return null;

  const unitPriceKes = event.priceKes || event.ticketPriceKes || 0;
  const unitPriceUsd = event.priceUsd || Math.round(unitPriceKes / 130);
  const subtotalKes = unitPriceKes * ticketCount;
  const discountKes = appliedVoucher ? appliedVoucher.discountAmountKes : 0;
  const totalAmountKes = Math.max(0, subtotalKes - discountKes);

  // Validate Promo Code
  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) return;
    setValidatingVoucher(true);
    setVoucherError(null);

    try {
      const res = await fetch(
        `/api/vouchers?code=${encodeURIComponent(voucherCodeInput.trim().toUpperCase())}&scope=event&eventId=${encodeURIComponent(event.id)}&amountKes=${subtotalKes}`
      );
      const data = await res.json();

      if (data.valid && data.voucher) {
        setAppliedVoucher(data.voucher);
        toast.success(`Promo code applied: KES ${Number(data.voucher.discountAmountKes).toLocaleString()} discount!`);
      } else {
        setVoucherError(data.error || 'Invalid voucher code for this event.');
        setAppliedVoucher(null);
      }
    } catch {
      setVoucherError('Unable to validate voucher.');
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput('');
    setVoucherError(null);
  };

  // Submit and redirect to Paystack
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      toast.error('Please fill in your name, email, and phone number.');
      return;
    }

    setLoading(true);

    try {
      const reference = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: guestEmail.trim(),
          amount: totalAmountKes,
          currency: 'KES',
          reference,
          subaccount: event.subaccountCode || undefined,
          metadata: {
            type: 'event_ticket',
            eventId: event.id,
            eventTitle: event.title,
            brand: event.brand || 'tamarind_village',
            venue: event.venue,
            eventDate: event.startDate || event.eventDate || '',
            guestName: guestName.trim(),
            guestEmail: guestEmail.trim(),
            guestPhone: guestPhone.trim(),
            ticketCount,
            unitPriceKes,
            unitPriceUsd,
            totalAmountKes,
            discountAmountKes: discountKes,
            voucherCode: appliedVoucher?.code || null,
            dietaryRequirements: dietaryRequirements.trim() || null,
            subaccountCode: event.subaccountCode || null,
          },
        }),
      });

      const data = await res.json();

      if (res.ok && data.authorizationUrl) {
        toast.loading('Redirecting to Paystack Secure Checkout...');
        window.location.href = data.authorizationUrl;
      } else {
        toast.error(data.error || 'Failed to initialize ticket payment. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      toast.error('Network error during checkout initialization.');
      setLoading(false);
    }
  };

  const poster = event.image || event.posterUrl || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl relative overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Header */}
        <div className="relative h-44 sm:h-48 w-full bg-slate-900 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster} alt={event.title} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          <div className="absolute bottom-4 left-5 right-5 text-white space-y-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#821124] text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Official Event Pass</span>
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold leading-tight">
              {event.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                {event.startDate || event.eventDate || 'Date TBA'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                {event.venue}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Quantity Stepper & Price Calculation */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Number of Passes
              </span>
              <span className="text-xs text-slate-600">
                KES {unitPriceKes.toLocaleString()} per attendee
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTicketCount((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <span className="font-mono text-base font-bold text-slate-900 w-6 text-center">
                {ticketCount}
              </span>
              <button
                type="button"
                onClick={() => setTicketCount((prev) => Math.min(10, prev + 1))}
                className="w-8 h-8 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Guest Contact Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#821124]" />
              <span>Attendee Information</span>
            </h3>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Primary Attendee Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cynthia Mwangi"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Address * (For E-Ticket delivery)
                </label>
                <input
                  type="email"
                  required
                  placeholder="cynthia@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  M-Pesa / Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0712 345 678"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Dietary Requirements or Special Requests (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Vegetarian, Shellfish allergy, Window table"
                value={dietaryRequirements}
                onChange={(e) => setDietaryRequirements(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
              />
            </div>
          </div>

          {/* Event Promo Code / Voucher */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#821124]" />
              <span>Event Promo Code / Voucher</span>
            </span>

            {appliedVoucher ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{appliedVoucher.code}</span>
                  <span className="font-normal text-emerald-700">(-KES {discountKes.toLocaleString()})</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveVoucher}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter event promo code"
                  value={voucherCodeInput}
                  onChange={(e) => setVoucherCodeInput(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 uppercase font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyVoucher}
                  disabled={validatingVoucher || !voucherCodeInput.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {validatingVoucher ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
                </button>
              </div>
            )}

            {voucherError && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{voucherError}</span>
              </p>
            )}
          </div>

          {/* Total Breakdown & Checkout Button */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Passes Subtotal ({ticketCount} pax):</span>
              <span className="font-mono">KES {subtotalKes.toLocaleString()}</span>
            </div>

            {discountKes > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
                <span>Voucher Discount:</span>
                <span className="font-mono">-KES {discountKes.toLocaleString()}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200/80">
              <span>Total Payable:</span>
              <span className="font-serif text-xl text-[#821124]">
                KES {totalAmountKes.toLocaleString()}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to Paystack...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay KES {totalAmountKes.toLocaleString()} (M-Pesa / Card)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-slate-400">
              Encrypted 256-bit payment via Paystack. Instant E-Ticket delivery to your email upon confirmation.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
