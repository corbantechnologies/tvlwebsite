'use client';

import React, { useState, useEffect } from 'react';
import { 
  Car, Plane, Train, CheckCircle2, Clock, Calendar, 
  RotateCw, User, Phone, Mail, MapPin, ExternalLink, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TransferBooking {
  id: string;
  bookingReference: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  route: string;
  flightNotes?: string;
  vehicle: string;
  status: string;
  specialRequests?: string;
}

export default function AdminTransfersPage() {
  const [transfers, setTransfers] = useState<TransferBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      // Query bookings to find any bookings with transfer extras or notes
      const res = await fetch('/api/bookings');
      const data = await res.json();
      
      const realBookings = Array.isArray(data.bookings) ? data.bookings : [];
      
      // Filter bookings where guest requested transfer
      const transferList: TransferBooking[] = [];

      realBookings.forEach((b: any) => {
        const reqLower = (b.specialRequests || '').toLowerCase();
        const hasTransfer = reqLower.includes('transfer') || reqLower.includes('airport') || reqLower.includes('sgr') || reqLower.includes('pickup') || reqLower.includes('alphard');

        if (hasTransfer) {
          transferList.push({
            id: b.id,
            bookingReference: b.bookingReference,
            guestName: b.guestName,
            guestEmail: b.guestEmail,
            guestPhone: b.guestPhone,
            checkIn: b.checkIn,
            checkOut: b.checkOut,
            route: reqLower.includes('sgr') ? 'Mombasa SGR Terminus → Tamarind Village' : 'Moi Int\'l Airport (MBA) → Tamarind Village',
            flightNotes: b.specialRequests || 'Standard scheduled check-in',
            vehicle: reqLower.includes('alphard') ? 'Executive VIP Alphard' : 'Executive Private Sedan',
            status: b.bookingStatus || 'Confirmed',
            specialRequests: b.specialRequests,
          });
        }
      });

      setTransfers(transferList);
    } catch (err) {
      console.error('Failed to load transfers:', err);
      toast.error('Unable to fetch transfer requests');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C59B27]/20">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Car className="w-3.5 h-3.5" /> Chauffeur &amp; Airport Dispatch
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
            VIP Transfers &amp; Chauffeur Fleet
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Real-time tracking of airport and SGR guest transfers booked by guests in the reservation flow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadTransfers}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Content: Live or Clean Empty State */}
      {loading ? (
        <div className="p-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
          <RotateCw className="w-4 h-4 animate-spin text-[#C59B27]" />
          <span>Scanning bookings for transfer requests...</span>
        </div>
      ) : transfers.length === 0 ? (
        <div className="p-12 text-center bg-[#1F1615] rounded-xl border border-dashed border-[#C59B27]/30 max-w-xl mx-auto space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#821124]/20 text-[#821124] flex items-center justify-center mx-auto">
            <Car className="w-5 h-5 text-[#C59B27]" />
          </div>
          <h3 className="font-serif text-lg font-bold text-white">No Transfer Requests Pending</h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            There are currently no airport or SGR transfer bookings in the system. When guests select transfer add-ons or input flight details during online booking, they will automatically appear here for driver assignment.
          </p>
          <div className="p-3 bg-black/40 rounded-lg border border-white/10 text-[11px] text-stone-400 text-left space-y-1">
            <span className="text-[#C59B27] font-semibold block">Configured Fleet Routes:</span>
            <p>• Moi International Airport (MBA) ↔ Tamarind Village Clifftop</p>
            <p>• Mombasa SGR Terminus (Miritini) ↔ Tamarind Village Clifftop</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transfers.map((tr) => (
            <div key={tr.id} className="bg-[#1F1615] rounded-xl p-5 border border-[#C59B27]/25 shadow-md space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-[#C59B27] block">
                    Ref: {tr.bookingReference}
                  </span>
                  <h3 className="font-serif text-base font-bold text-white">{tr.guestName}</h3>
                  <span className="text-xs text-stone-300 block mt-0.5">{tr.route}</span>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  {tr.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-y border-white/10 text-stone-300">
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-semibold">Service Date:</span>
                  <span className="font-semibold">{tr.checkIn}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-semibold">Vehicle:</span>
                  <span className="font-semibold text-[#C59B27]">{tr.vehicle}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-semibold">Guest Phone:</span>
                  <span>{tr.guestPhone || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-semibold">Guest Email:</span>
                  <span className="truncate block">{tr.guestEmail}</span>
                </div>
              </div>

              {tr.specialRequests && (
                <div className="p-2 bg-black/40 rounded border border-white/10 text-[11px] text-stone-400">
                  <span className="text-stone-500 font-semibold block mb-0.5 text-[10px] uppercase">Flight / Special Details:</span>
                  <p className="line-clamp-2">{tr.specialRequests}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <a
                  href={`tel:${tr.guestPhone}`}
                  className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-semibold"
                >
                  Call Guest
                </a>
                <button
                  onClick={() => toast.success('Transfer details logged for chauffeur!')}
                  className="px-3 py-1 rounded bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold cursor-pointer"
                >
                  Assign Chauffeur
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
