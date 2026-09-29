'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, CheckCircle2, Clock, XCircle, ArrowRight, ShieldCheck, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingsLedgerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const filtered = bookings.filter((b) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (b.guestName || '').toLowerCase().includes(term) ||
      (b.bookingReference || b.id || '').toLowerCase().includes(term) ||
      (b.guestEmail || '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || b.bookingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" /> Master Ledger • Live Database
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Reservations Ledger
          </h1>
          <p className="text-xs text-white/60">
            Real-time PostgreSQL records for all guest bookings, deposits, and status.
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
              placeholder="Search by name, ref, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#1F1615] border border-[#C59B27]/25 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27] w-64"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1F1615] rounded-2xl border border-[#C59B27]/25 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="py-20 text-center text-white/50 space-y-3">
            <RotateCw className="w-8 h-8 animate-spin mx-auto text-[#C59B27]" />
            <p className="text-sm">Loading reservations from PostgreSQL...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-white/40 tracking-wider">
                  <th className="p-4">Reference</th>
                  <th className="p-4">Guest</th>
                  <th className="p-4">Residence</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-white/80">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-mono font-bold text-[#C59B27]">
                      {b.bookingReference || b.id}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{b.guestName}</div>
                      <div className="text-[11px] text-white/50">{b.guestPhone || b.guestEmail}</div>
                    </td>
                    <td className="p-4">{b.apartmentName || b.apartmentId}</td>
                    <td className="p-4">
                      {b.checkIn} → {b.checkOut}
                    </td>
                    <td className="p-4 font-mono font-bold">
                      ${b.totalAmount || 0}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        b.paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                      }`}>
                        {b.paymentStatus || 'unpaid'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        b.bookingStatus === 'in_house' ? 'bg-blue-950 text-blue-400 border border-blue-500/30' :
                        b.bookingStatus === 'arriving_today' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                        b.bookingStatus === 'departing_today' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                        'bg-stone-800 text-stone-300'
                      }`}>
                        {(b.bookingStatus || 'confirmed').replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
