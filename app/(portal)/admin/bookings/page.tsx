'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Filter, CheckCircle2, Clock, XCircle, 
  ArrowRight, ShieldCheck, RotateCw, BedDouble, Key, Plus, X, Tag 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingsLedgerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Unit allocation modal state
  const [allocatingBooking, setAllocatingBooking] = useState<any | null>(null);
  const [allocatedUnit, setAllocatedUnit] = useState('');
  const [allocationNote, setAllocationNote] = useState('');
  const [isSubmittingAlloc, setIsSubmittingAlloc] = useState(false);

  const loadLiveBookings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.bookings) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error('Failed to load ledger:', err);
      toast.error('Failed to load live bookings ledger.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLiveBookings();
  }, []);

  const openAllocateModal = (booking: any) => {
    setAllocatingBooking(booking);
    setAllocatedUnit(booking.allocatedUnit || '');
    setAllocationNote('');
  };

  const handleSaveAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingBooking) return;
    if (!allocatedUnit.trim()) {
      toast.error('Please specify a unit number / identifier');
      return;
    }

    setIsSubmittingAlloc(true);
    try {
      const res = await fetch(`/api/bookings/${allocatingBooking.id}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocatedUnit: allocatedUnit.trim(),
          note: allocationNote.trim() || undefined,
          actor: 'Reservations Desk',
          actorRole: 'reservations',
        }),
      });

      if (res.ok) {
        toast.success(`Unit "${allocatedUnit.trim()}" allocated to ${allocatingBooking.guestName}!`);
        setAllocatingBooking(null);
        loadLiveBookings();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to allocate unit');
      }
    } catch {
      toast.error('Network error allocating unit');
    } finally {
      setIsSubmittingAlloc(false);
    }
  };

  const filtered = bookings.filter((b) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (b.guestName || '').toLowerCase().includes(term) ||
      (b.bookingReference || b.id || '').toLowerCase().includes(term) ||
      (b.guestEmail || '').toLowerCase().includes(term) ||
      (b.apartmentName || '').toLowerCase().includes(term) ||
      (b.allocatedUnit || '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || b.bookingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" /> Master Ledger
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Reservations Ledger &amp; Room Allocations
          </h1>
          <p className="text-xs text-white/60">
            Confirmed reservations, guest portal tokens, meal plans, and physical apartment allocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadLiveBookings}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-[#1F1615] border border-[#C59B27]/25 text-[#C59B27] hover:bg-[#821124] hover:text-white transition-all cursor-pointer"
            title="Refresh Ledger"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ref, unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#1F1615] border border-[#C59B27]/25 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C59B27] w-64"
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-[#1F1615] rounded-2xl border border-[#C59B27]/25 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 text-center text-white/50 space-y-3">
            <RotateCw className="w-8 h-8 animate-spin mx-auto text-[#C59B27]" />
            <p className="text-sm">Loading reservations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-white/40 space-y-2">
            <Calendar className="w-10 h-10 mx-auto opacity-30 text-[#C59B27]" />
            <p className="text-sm font-semibold text-white">No confirmed reservations found</p>
            <p className="text-xs text-white/40 max-w-md mx-auto">
              When guest inquiries or Paystack checkouts are confirmed, they will appear here with full stay details and room allocation actions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-white/40 tracking-wider bg-black/20">
                  <th className="p-4">Reference &amp; Token</th>
                  <th className="p-4">Guest</th>
                  <th className="p-4">Residence &amp; Allocated Unit</th>
                  <th className="p-4">Meal Plan &amp; Extras</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Unit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-white/80">
                {filtered.map((b) => {
                  return (
                    <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="font-mono font-bold text-[#C59B27]">
                          {b.bookingReference || b.id}
                        </div>
                        {b.guestToken && (
                          <div className="text-[10px] text-white/40 font-mono mt-0.5">
                            Token: {b.guestToken}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white">{b.guestName}</div>
                        <div className="text-[11px] text-white/50">{b.guestPhone || b.guestEmail}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-white">{b.apartmentName || b.apartmentId}</div>
                        {b.allocatedUnit ? (
                          <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                            <Key className="w-2.5 h-2.5" />
                            <span>{b.allocatedUnit}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-[10px] text-amber-400/80 font-mono mt-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                            <span>Unallocated</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {b.mealPlanName ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-[#C59B27] border border-white/5">
                            {b.mealPlanName}
                          </span>
                        ) : (
                          <span className="text-white/40 text-[11px]">Room Only</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-[11px]">
                        <div>{b.checkIn} → {b.checkOut}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">
                          {b.adults} adult{b.adults !== 1 ? 's' : ''}{b.children > 0 ? `, ${b.children} child` : ''}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-white">
                        {b.currency === 'KES' ? 'KES ' : '$'}{Number(b.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          b.paymentStatus === 'fully_paid' || b.paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 
                          b.paymentStatus === 'deposit_paid' ? 'bg-blue-950 text-blue-400 border border-blue-500/30' :
                          'bg-amber-950 text-amber-400 border border-amber-500/30'
                        }`}>
                          {(b.paymentStatus || 'unpaid').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                          b.bookingStatus === 'in_house' ? 'bg-blue-950 text-blue-400 border border-blue-500/30' :
                          b.bookingStatus === 'confirmed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                          'bg-stone-800 text-stone-300'
                        }`}>
                          {(b.bookingStatus || 'confirmed').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openAllocateModal(b)}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#821124] text-white text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Key className="w-3 h-3 text-[#C59B27]" />
                          <span>{b.allocatedUnit ? 'Change Unit' : 'Allocate Unit'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Allocate Unit Modal */}
      {allocatingBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1F1615] border border-[#C59B27]/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono text-[#C59B27] uppercase tracking-wider">
                  Booking Ref: {allocatingBooking.bookingReference}
                </span>
                <h3 className="font-serif text-lg font-bold text-white">
                  Allocate Physical Unit
                </h3>
              </div>
              <button
                onClick={() => setAllocatingBooking(null)}
                className="p-1 rounded-lg text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-1 text-xs">
              <div className="text-white/50">Guest: <strong className="text-white">{allocatingBooking.guestName}</strong></div>
              <div className="text-white/50">Suite Type: <strong className="text-[#C59B27]">{allocatingBooking.apartmentName}</strong></div>
              <div className="text-white/50">Dates: <span className="font-mono text-white/80">{allocatingBooking.checkIn} → {allocatingBooking.checkOut}</span></div>
            </div>

            <form onSubmit={handleSaveAllocation} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                  Physical Apartment Unit
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 4B, 2nd Floor Oceanfront"
                  value={allocatedUnit}
                  onChange={(e) => setAllocatedUnit(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  autoFocus
                />
                <p className="text-[10px] text-white/40 mt-1">
                  This unit will be recorded on the reservation and visible across Front Desk and guest records.
                </p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-[#C59B27] mb-1">
                  Allocation Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quiet creek-view block requested by guest"
                  value={allocationNote}
                  onChange={(e) => setAllocationNote(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAllocatingBooking(null)}
                  className="px-4 py-2 rounded-xl border border-white/20 text-white text-xs font-bold hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAlloc}
                  className="px-5 py-2 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {isSubmittingAlloc ? 'Assigning...' : 'Assign Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
