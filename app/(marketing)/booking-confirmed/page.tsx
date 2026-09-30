'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Calendar, 
  Users, 
  Hotel, 
  CreditCard, 
  Utensils, 
  Printer, 
  ArrowRight, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Loader2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface ConfirmedBooking {
  id: string;
  bookingReference: string;
  apartmentName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  mealPlanName?: string | null;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  paymentMethod: string;
  guestToken?: string;
  createdAt: string;
}

function BookingConfirmedContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<ConfirmedBooking | null>(null);
  const [guestToken, setGuestToken] = useState<string>('');

  const verifyPayment = async () => {
    if (!reference) {
      setError('No payment reference found. If you completed a payment, please check your confirmation email or contact our front desk.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/paystack/verify/${encodeURIComponent(reference)}`);
      const data = await res.json();

      if (data.success && data.booking) {
        setBooking(data.booking);
        setGuestToken(data.guestToken || data.booking.guestToken || '');
      } else {
        setError(data.error || 'Payment verification failed. Please contact reception with your transaction reference.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError('Unable to reach the verification server. Please reload or contact our reservations desk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyPayment();
  }, [reference]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-20">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 sticky top-0 z-20 shadow-xs print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#821124]/10 p-1.5 border border-[#821124]/30 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.png" alt="Tamarind Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-serif font-bold text-sm tracking-wider text-slate-900 block">
                TAMARIND VILLAGE
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#821124] font-semibold block">
                Mombasa Clifftop Luxury
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 hover:text-[#821124] transition-colors"
          >
            ← Return to Website
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#821124]">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              Verifying Your Payment
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Please wait while we confirm your Paystack transaction and generate your official Tamarind Village reservation voucher...
            </p>
            {reference && (
              <p className="text-[11px] font-mono text-slate-400">
                Reference: {reference}
              </p>
            )}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-red-200 shadow-sm space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-bold text-slate-900">
                  Payment Verification Notice
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>

            {reference && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Payment Reference
                </span>
                <span className="font-mono font-bold text-slate-800 break-all">
                  {reference}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={verifyPayment}
                className="px-5 py-2.5 rounded-xl bg-[#821124] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#680e1c] transition-all cursor-pointer"
              >
                Retry Verification
              </button>

              <Link
                href="/track"
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all"
              >
                Search by Guest Token
              </Link>
            </div>

            <div className="border-t border-slate-200 pt-5 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Need Immediate Front Desk Assistance?</p>
              <p>Call Reservations at <strong>+254 711 082 000</strong> or email <strong>reservations.village@tamarind.co.ke</strong>.</p>
            </div>
          </div>
        )}

        {/* Success Voucher State */}
        {!loading && !error && booking && (
          <div className="space-y-6">
            {/* Celebration & Status Banner */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-bl-full -z-0 opacity-70"></div>

              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Reservation Confirmed &amp; Paid</span>
                </div>

                <div>
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
                    Karibu, {booking.guestName}!
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    Your stay at Tamarind Village Mombasa is officially locked in. We have sent a detailed confirmation email and receipt to <strong>{booking.guestEmail}</strong>.
                  </p>
                </div>

                {/* Booking Reference Pill */}
                <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Booking Reference Number
                    </span>
                    <span className="font-mono text-base font-bold text-[#821124]">
                      {booking.bookingReference}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Amount Paid (Paystack)
                    </span>
                    <span className="font-serif text-lg font-bold text-slate-900">
                      {booking.currency} {booking.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reservation Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 relative z-10 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <Hotel className="w-3.5 h-3.5 text-[#821124]" />
                    <span>Apartment Suite</span>
                  </div>
                  <p className="font-serif font-bold text-sm text-slate-900">
                    {booking.apartmentName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {booking.adults} Adults {booking.children > 0 ? `· ${booking.children} Children` : ''}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5 text-[#821124]" />
                    <span>Stay Dates</span>
                  </div>
                  <p className="font-bold text-slate-900">
                    {booking.checkIn} → {booking.checkOut}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Check-in: 3:00 PM · Check-out: 11:00 AM
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <Utensils className="w-3.5 h-3.5 text-[#821124]" />
                    <span>Boarding &amp; Dining Plan</span>
                  </div>
                  <p className="font-bold text-slate-900">
                    {booking.mealPlanName || 'Flexible Rate — Room Only'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Tamarind Restaurant &amp; Harbour poolside dining
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Payment Verification</span>
                  </div>
                  <p className="font-bold text-emerald-700">
                    Verified via Paystack
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Method: {booking.paymentMethod.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* No-Login Guest Hub Card */}
              {guestToken && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#821124]/10 via-[#FAF6F0] to-[#C59B27]/15 border border-[#C59B27]/40 space-y-4 relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#821124]">
                        <ShieldCheck className="w-4 h-4 text-[#821124]" />
                        <span>No-Login Guest Management Link</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-lg">
                        You can manage your reservation, submit special requests (honeymoon setups, late check-in), or request changes anytime without a password using your personal guest link:
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/track?token=${encodeURIComponent(guestToken)}`}
                      className="px-6 py-3 rounded-xl bg-[#821124] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#680e1c] transition-all shadow-md flex items-center gap-2"
                      id="btn-guest-hub-access"
                    >
                      <span>Open Guest Management Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-800">
                      Token: {guestToken}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer"
                  id="btn-print-voucher"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>

                <Link
                  href="/"
                  className="text-xs font-bold text-[#821124] hover:underline flex items-center gap-1"
                >
                  <span>Return to Tamarind Village Home</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Resort Information Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4 text-xs text-slate-600">
              <h3 className="font-serif text-base font-bold text-slate-900">
                Resort Information &amp; Directions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-[#821124]" />
                    <span>Location</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Cement Silo Road, Nyali, Mombasa overlooking Tudor Creek.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Phone className="w-3.5 h-3.5 text-[#821124]" />
                    <span>Front Desk</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    +254 711 082 000<br />Available 24/7 for guest assistance.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Mail className="w-3.5 h-3.5 text-[#821124]" />
                    <span>Concierge Email</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    reservations.village@tamarind.co.ke
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function BookingConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
          <div className="flex items-center gap-3 text-slate-600 text-sm font-semibold">
            <Loader2 className="w-5 h-5 animate-spin text-[#821124]" />
            <span>Loading confirmation voucher...</span>
          </div>
        </div>
      }
    >
      <BookingConfirmedContent />
    </Suspense>
  );
}
