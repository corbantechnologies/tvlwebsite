'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, CheckCircle2, Clock, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingsLedgerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [bookings, setBookings] = useState([
    {
      id: 'BK-2026-091',
      guestName: 'Hon. Justice Evans Ochieng',
      email: 'evans.o@judiciary.go.ke',
      phone: '+254 722 334 455',
      apartmentId: '3-bedroom',
      apartmentTitle: '3-Bedroom Grand Harbour Villa',
      checkIn: '2026-10-05',
      checkOut: '2026-10-10',
      totalKes: 250000,
      status: 'confirmed',
      paid: true,
      source: 'Direct Web'
    },
    {
      id: 'BK-2026-092',
      guestName: 'Amina & Tariq Said',
      email: 'amina.t@domain.com',
      phone: '+254 711 223 344',
      apartmentId: '1-bedroom',
      apartmentTitle: '1-Bedroom Clifftop Sea View Suite',
      checkIn: '2026-10-02',
      checkOut: '2026-10-05',
      totalKes: 75000,
      status: 'confirmed',
      paid: true,
      source: 'Profitroom PMS'
    },
    {
      id: 'BK-2026-093',
      guestName: 'Dr. Michael van der Merwe',
      email: 'michael.vdm@health.za',
      phone: '+27 82 123 4567',
      apartmentId: '2-bedroom',
      apartmentTitle: '2-Bedroom Ocean & Garden Suite',
      checkIn: '2026-10-12',
      checkOut: '2026-10-18',
      totalKes: 228000,
      status: 'pending_deposit',
      paid: false,
      source: 'Direct Web'
    },
  ]);

  const filtered = bookings.filter((b) => {
    const matchesSearch = b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" /> Master Ledger
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Confirmed Bookings &amp; Reservations
          </h1>
          <p className="text-xs text-white/60">
            Real-time synchronization with Tamarind Village front desk and Profitroom channel manager.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#1F1615] p-4 rounded-2xl border border-[#C59B27]/25 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by guest name, reservation code, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C59B27]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
        >
          <option value="all">All Reservation Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending_deposit">Pending Deposit</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-[#1F1615] rounded-2xl border border-[#C59B27]/25 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/40 border-b border-white/10 text-[#C59B27] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Ref Code</th>
                <th className="py-3.5 px-4">Guest Information</th>
                <th className="py-3.5 px-4">Apartment &amp; Dates</th>
                <th className="py-3.5 px-4">Rate (KES)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-white">
                    {b.id}
                    <span className="block text-[10px] text-white/40 font-sans font-normal">{b.source}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-bold text-white block">{b.guestName}</span>
                    <span className="text-white/50 block text-[11px]">{b.email}</span>
                    <span className="text-white/50 block text-[11px]">{b.phone}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-white block">{b.apartmentTitle}</span>
                    <span className="text-[#C59B27] text-[11px]">{b.checkIn} → {b.checkOut}</span>
                  </td>
                  <td className="py-4 px-4 font-bold text-[#FAF6F0]">
                    KES {b.totalKes.toLocaleString()}
                    <span className={`block text-[10px] uppercase font-bold ${b.paid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {b.paid ? 'Paid in Full' : 'Awaiting Payment'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      b.status === 'confirmed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                      'bg-amber-950 text-amber-400 border border-amber-500/30'
                    }`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => toast.success(`Reservation ${b.id} voucher dispatched to ${b.email}`)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold uppercase transition-colors cursor-pointer"
                    >
                      Resend Voucher
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
