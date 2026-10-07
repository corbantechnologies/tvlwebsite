'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Calendar,
  Ticket,
  Clock,
  Printer,
  Download,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Loader2,
  AlertCircle,
  Sparkles,
  QrCode
} from 'lucide-react';
import { EventTicketType } from '@/types';

function TicketConfirmedContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<EventTicketType | null>(null);

  const verifyTicketPayment = async () => {
    if (!reference) {
      setError('No transaction reference found. Please check your confirmation email.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/paystack/verify/${encodeURIComponent(reference)}`);
      const data = await res.json();

      if (data.success && data.ticket) {
        setTicket(data.ticket);
      } else {
        setError(data.error || 'Ticket verification failed. Please contact our reception.');
      }
    } catch {
      setError('Unable to reach the verification server. Please reload or contact our team.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyTicketPayment();
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
                TAMARIND MOMBASA
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#821124] font-semibold block">
                Official E-Ticket Pass
              </span>
            </div>
          </Link>

          <Link
            href="/events"
            className="text-xs font-semibold text-slate-600 hover:text-[#821124] transition-colors"
          >
            ← View Events Calendar
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-10">
        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#821124]">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              Verifying Your Ticket Payment
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Confirming your Paystack payment and issuing your security entrance QR pass...
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
                  Ticket Verification Notice
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={verifyTicketPayment}
                className="px-5 py-2.5 rounded-xl bg-[#821124] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#680e1c] transition-all cursor-pointer"
              >
                Retry Verification
              </button>
            </div>
          </div>
        )}

        {/* Success Pass State */}
        {!loading && !error && ticket && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-bl-full -z-0 opacity-70" />

              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>E-Ticket Confirmed &amp; Active</span>
                </div>

                <div>
                  <h1 className="font-serif text-3xl font-bold text-slate-900">
                    Karibu, {ticket.guestName}!
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    Your passes for <strong>{ticket.eventTitle}</strong> are locked in. A copy of this E-Ticket and QR token has been sent to <strong>{ticket.guestEmail}</strong>.
                  </p>
                </div>

                {/* Ticket Pass Box */}
                <div className="p-6 bg-[#FAF6F0] rounded-2xl border-2 border-dashed border-[#C59B27]/40 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Ticket Reference
                      </span>
                      <span className="font-mono text-xl font-bold text-[#821124]">
                        {ticket.ticketReference}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Total Amount Paid
                      </span>
                      <span className="font-serif text-lg font-bold text-slate-900">
                        {ticket.currency} {Number(ticket.totalAmountKes).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-[#C59B27]/20">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Venue</span>
                      <span className="font-semibold text-slate-900">{ticket.venue}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Event Date</span>
                      <span className="font-semibold text-slate-900">{ticket.eventDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Admitted Attendees</span>
                      <span className="font-mono font-bold text-slate-900">{ticket.ticketCount} Pax</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Payment Channel</span>
                      <span className="font-bold uppercase text-emerald-700">Verified via Paystack</span>
                    </div>
                  </div>

                  {ticket.dietaryRequirements && (
                    <div className="p-3 bg-white/80 rounded-xl text-xs text-slate-600 border border-slate-200">
                      Dietary Request: <strong>{ticket.dietaryRequirements}</strong>
                    </div>
                  )}

                  {/* Security QR Box */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block flex items-center justify-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-[#821124]" />
                      <span>Gate Entrance Security Token</span>
                    </span>
                    <div className="font-mono text-xs sm:text-sm font-bold bg-slate-900 text-white py-2 px-4 rounded-lg inline-block tracking-wider">
                      {ticket.ticketQrToken}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Show this screen or printout to the gate steward upon arrival for instant check-in.
                    </p>
                  </div>
                </div>

                {/* Print & Return Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 print:hidden">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-5 py-2.5 rounded-xl bg-[#821124] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#680e1c] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download / Print E-Ticket</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </div>

                  <Link
                    href="/events"
                    className="text-xs font-bold text-[#821124] hover:underline flex items-center gap-1"
                  >
                    <span>Back to Events Calendar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Venue & Directions */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-3 text-xs text-slate-600">
              <h3 className="font-serif text-base font-bold text-slate-900">
                Venue Information &amp; Entry Guidelines
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Entrance gates open 30 minutes before event start time. Please have your digital or printed pass ready at the security entrance.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 font-medium">
                  <Phone className="w-3.5 h-3.5 text-[#821124]" />
                  <span>Concierge: +254 725 959 552</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Mail className="w-3.5 h-3.5 text-[#821124]" />
                  <span>reservations.village@tamarind.co.ke</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function TicketConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
          <div className="flex items-center gap-3 text-slate-600 text-sm font-semibold">
            <Loader2 className="w-5 h-5 animate-spin text-[#821124]" />
            <span>Loading E-Ticket...</span>
          </div>
        </div>
      }
    >
      <TicketConfirmedContent />
    </Suspense>
  );
}
