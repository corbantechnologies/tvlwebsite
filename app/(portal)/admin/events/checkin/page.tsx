'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Lock,
  Unlock,
  RotateCw,
  ArrowLeft,
  Users,
  Clock,
  Sparkles,
  Camera,
  Loader2,
  Check,
  ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';
import { EventTicketType, ResortEvent } from '@/types';

function GateCheckInContent() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get('eventId') || '';

  const [events, setEvents] = useState<ResortEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
  const [loading, setLoading] = useState(true);

  // Gate PIN protection
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [staffName, setStaffName] = useState('Gate Steward');

  // Input scanner state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'already_checked_in' | 'error' | null;
    message: string;
    ticket?: EventTicketType;
  }>({ status: null, message: '' });

  // Recent scans feed
  const [recentScans, setRecentScans] = useState<EventTicketType[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load events
  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
          if (!selectedEventId) {
            setSelectedEventId(data.events[0].id);
          }
        }
      })
      .catch(() => toast.error('Failed to load events'))
      .finally(() => setLoading(false));
  }, []);

  // Auto focus input when unlocked
  useEffect(() => {
    if (isUnlocked && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isUnlocked]);

  // Selected event
  const currentEvent = events.find((e) => e.id === selectedEventId) || null;

  // Unlock check
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPin = currentEvent?.gatePin || '2026';

    if (enteredPin.trim() === targetPin.trim() || enteredPin.trim() === '2026') {
      setIsUnlocked(true);
      toast.success('Gate entrance terminal unlocked!');
    } else {
      toast.error('Invalid Gate PIN. Contact Event Host or Reception.');
    }
  };

  // Perform ticket check-in
  const processCheckIn = async (identifier: string) => {
    if (!identifier.trim()) return;

    setIsProcessing(true);
    setScanResult({ status: null, message: '' });

    try {
      const res = await fetch('/api/events/tickets/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          eventId: selectedEventId || undefined,
          scannedBy: staffName.trim() || 'Gate Steward',
          gatePin: enteredPin || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setScanResult({
          status: 'success',
          message: data.message || 'Check-in successful! Karibu!',
          ticket: data.ticket,
        });
        setRecentScans((prev) => [data.ticket, ...prev.slice(0, 9)]);
        setBarcodeInput('');
      } else if (res.status === 409) {
        // ALREADY CHECKED IN
        setScanResult({
          status: 'already_checked_in',
          message: data.error || 'Ticket has already been used.',
          ticket: data.ticket,
        });
        setBarcodeInput('');
      } else {
        setScanResult({
          status: 'error',
          message: data.error || 'Invalid ticket code or unrecognized token.',
          ticket: data.ticket,
        });
      }
    } catch {
      setScanResult({
        status: 'error',
        message: 'Network error communicating with check-in server.',
      });
    } finally {
      setIsProcessing(false);
      // Re-focus input for next scan
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCheckIn(barcodeInput);
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 px-2 sm:px-4 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/events"
              className="text-xs text-slate-500 hover:text-[#821124] flex items-center gap-1 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Events Hub
            </Link>
            <span className="text-slate-300">/</span>
            <Link
              href={selectedEventId ? `/admin/events/ledger?eventId=${selectedEventId}` : '/admin/events/ledger'}
              className="text-xs text-slate-500 hover:text-[#821124] flex items-center gap-1 font-semibold transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5" /> Hosting Ledger
            </Link>
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <QrCode className="w-6 h-6 text-amber-600" />
            <span>Day-of-Event Gate Check-In Terminal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rapid entrance scanner for door stewards. Prevents duplicate admissions with anti-fraud verification.
          </p>
        </div>

        {isUnlocked && (
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Terminal Armed</span>
            </div>
            <button
              onClick={() => setIsUnlocked(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Lock Terminal
            </button>
          </div>
        )}
      </div>

      {/* Terminal Locked Screen */}
      {!isUnlocked ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md mx-auto text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="font-serif text-xl font-bold text-slate-900">
              Entrance Gate Lock
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your active event and enter the 4-digit Event Gate PIN to unlock this scanning device.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Active Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title} ({evt.startDate})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Steward / Gate Staff Name
              </label>
              <input
                type="text"
                placeholder="e.g. John K. (Gate 1)"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4-Digit Gate Entrance PIN
              </label>
              <input
                type="password"
                maxLength={6}
                required
                placeholder="••••"
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-center text-lg tracking-widest font-mono font-bold text-slate-900 focus:outline-none focus:border-[#821124]"
              />
              <p className="text-[10px] text-slate-400 mt-1 text-center">
                Default PIN is 2026 or configured in event settings.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Gate Scanner</span>
            </button>
          </form>
        </div>
      ) : (
        /* Terminal Unlocked & Active */
        <div className="space-y-6">
          {/* Active Event Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-md">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                Active Gate Lane · {staffName}
              </span>
              <h2 className="font-serif text-lg font-bold">
                {currentEvent?.title || 'Resort Special Event'}
              </h2>
              <p className="text-xs text-slate-400">
                {currentEvent?.venue} · {currentEvent?.startDate} ({currentEvent?.timeText})
              </p>
            </div>

            <div className="flex items-center gap-3 text-right">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">
                  Capacity Count
                </span>
                <span className="font-mono text-base font-bold text-amber-300">
                  {currentEvent?.bookedCount || 0} / {currentEvent?.maxCapacity || 80}
                </span>
              </div>
            </div>
          </div>

          {/* Scanner Input Card */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-amber-300 p-6 sm:p-8 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold text-slate-900">
                Ready to Scan QR Code or Ticket Reference
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Point handheld scanner at guest's phone, or type in Ticket Code (e.g. <strong>TKT-10294</strong>) / Security Token and press Enter.
              </p>
            </div>

            <form onSubmit={handleScanSubmit} className="max-w-md mx-auto flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={inputRef}
                  type="text"
                  required
                  placeholder="Scan QR token or type Ref..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 font-mono font-bold uppercase focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Admit'}
              </button>
            </form>
          </div>

          {/* Real-time Scan Result Banner */}
          {scanResult.status === 'success' && scanResult.ticket && (
            <div className="bg-emerald-500 text-white rounded-2xl p-6 sm:p-8 shadow-lg space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-100 block">
                    Access Granted · Valid E-Ticket
                  </span>
                  <h3 className="font-serif text-2xl font-bold">
                    Karibu, {scanResult.ticket.guestName}!
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 rounded-xl p-4 text-xs">
                <div>
                  <span className="text-[10px] text-emerald-100 uppercase font-bold block">Admitted Pax</span>
                  <span className="font-mono text-base font-bold">{scanResult.ticket.ticketCount} Attendees</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-100 uppercase font-bold block">Ticket Reference</span>
                  <span className="font-mono text-base font-bold">{scanResult.ticket.ticketReference}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-100 uppercase font-bold block">Payment Status</span>
                  <span className="font-bold uppercase">{scanResult.ticket.paymentStatus}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-100 uppercase font-bold block">Admitted At</span>
                  <span className="font-bold">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>

              {scanResult.ticket.dietaryRequirements && (
                <div className="p-3 bg-white/20 rounded-xl text-xs font-medium">
                  Dietary Note: <strong>{scanResult.ticket.dietaryRequirements}</strong>
                </div>
              )}
            </div>
          )}

          {scanResult.status === 'already_checked_in' && scanResult.ticket && (
            <div className="bg-rose-600 text-white rounded-2xl p-6 sm:p-8 shadow-lg space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-rose-200 block">
                    Duplicate Admission Alert · Deny Entry
                  </span>
                  <h3 className="font-serif text-2xl font-bold">
                    Ticket Already Scanned!
                  </h3>
                </div>
              </div>

              <p className="text-xs text-rose-100 leading-relaxed">
                This pass has already been used to enter the event venue. Do not permit duplicate entry without Host Manager clearance.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/10 rounded-xl p-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-rose-200 uppercase font-sans font-bold block">Guest Name</span>
                  <span className="font-bold">{scanResult.ticket.guestName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-200 uppercase font-sans font-bold block">Initial Scan Time</span>
                  <span className="font-bold">{new Date(scanResult.ticket.checkedInAt || '').toLocaleTimeString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-200 uppercase font-sans font-bold block">Scanned By</span>
                  <span className="font-bold">{scanResult.ticket.checkedInBy || 'Gate Staff'}</span>
                </div>
              </div>
            </div>
          )}

          {scanResult.status === 'error' && (
            <div className="bg-amber-500 text-white rounded-2xl p-6 shadow-md space-y-2 animate-in fade-in">
              <div className="flex items-center gap-3">
                <XCircle className="w-6 h-6 text-white" />
                <h3 className="font-serif text-lg font-bold">Invalid Ticket</h3>
              </div>
              <p className="text-xs text-amber-100">{scanResult.message}</p>
            </div>
          )}

          {/* Recent Scans Log */}
          {recentScans.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h3 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Recent Gate Admissions (This Lane)</span>
              </h3>

              <div className="divide-y divide-slate-100 text-xs">
                {recentScans.map((t, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{t.guestName}</span>
                      <span className="text-slate-500 text-[11px] ml-2 font-mono">({t.ticketReference})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-600">{t.ticketCount} pax</span>
                      <span className="text-[11px] text-emerald-600 font-bold">Admitted</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GateCheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-600" />
          <p className="mt-2">Loading Gate Terminal...</p>
        </div>
      }
    >
      <GateCheckInContent />
    </Suspense>
  );
}
