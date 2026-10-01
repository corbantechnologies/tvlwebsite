'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Filter, CheckCircle2, Clock, XCircle, 
  ArrowRight, ShieldCheck, RotateCw, BedDouble, Key, Plus, X, Tag, Loader2, Check 
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#821124] font-bold uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" /> Master Ledger
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Reservations Ledger &amp; Room Allocations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirmed reservations, guest portal tokens, meal plans, and physical apartment allocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadLiveBookings}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh Ledger"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ref, unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124] w-64 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 space-y-3">
            <RotateCw className="w-8 h-8 animate-spin mx-auto text-[#821124]" />
            <p className="text-sm">Loading reservations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <Calendar className="w-10 h-10 mx-auto opacity-30 text-[#821124]" />
            <p className="text-sm font-semibold text-slate-900">No confirmed reservations found</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When guest inquiries or Paystack checkouts are confirmed, they will appear here with full stay details and room allocation actions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider bg-slate-50">
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
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filtered.map((b) => {
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-mono font-bold text-[#821124]">
                          {b.bookingReference || b.id}
                        </div>
                        {b.guestToken && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Token: {b.guestToken}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{b.guestName}</div>
                        <div className="text-[11px] text-slate-500">{b.guestPhone || b.guestEmail}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{b.apartmentName || b.apartmentId}</div>
                        {b.allocatedUnit ? (
                          <div className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-mono mt-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Key className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{b.allocatedUnit}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-[10px] text-amber-800 font-mono mt-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <span>Unallocated</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {b.mealPlanName ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-[#821124] border border-slate-200">
                            {b.mealPlanName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Room Only</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-[11px]">
                        <div>{b.checkIn} → {b.checkOut}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {b.adults} adult{b.adults !== 1 ? 's' : ''}{b.children > 0 ? `, ${b.children} child` : ''}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {b.currency === 'KES' ? 'KES ' : '$'}{Number(b.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          b.paymentStatus === 'fully_paid' || b.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                          b.paymentStatus === 'deposit_paid' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {(b.paymentStatus || 'unpaid').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full ${
                          b.bookingStatus === 'in_house' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          b.bookingStatus === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {(b.bookingStatus || 'confirmed').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openAllocateModal(b)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#821124] hover:text-white text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                        >
                          <Key className="w-3 h-3 text-slate-400 group-hover:text-white" />
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative text-slate-900 space-y-4">
            <button
              onClick={() => setAllocatingBooking(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="text-[10px] font-bold uppercase text-[#821124] tracking-wider mb-0.5">
                Front Desk Key Allocation
              </div>
              <h2 className="font-serif text-xl font-bold text-slate-900">
                Allocate Apartment Unit
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Guest: <strong className="text-slate-900">{allocatingBooking.guestName}</strong> ({allocatingBooking.apartmentName || allocatingBooking.apartmentId})
              </p>
            </div>

            <form onSubmit={handleSaveAllocation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apartment Unit / Room Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Villa 12, Penthouse 3B, Suite 104"
                  value={allocatedUnit}
                  onChange={(e) => setAllocatedUnit(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Concierge / Internal Key Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. VIP fruit platter arranged, keycard handed to guest upon arrival."
                  value={allocationNote}
                  onChange={(e) => setAllocationNote(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAllocatingBooking(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAlloc}
                  className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAlloc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Allocation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
