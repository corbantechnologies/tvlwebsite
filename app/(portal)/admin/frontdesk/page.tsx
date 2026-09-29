'use client';

import React, { useState, useEffect } from 'react';
import { 
  Hotel, Users, Calendar, Clock, CheckCircle2, 
  ArrowRight, ShieldCheck, Key, AlertCircle, Phone, Mail 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FrontDeskPage() {
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures' | 'inhouse'>('arrivals');

  // Realistic Front Desk active guests dataset
  const [guests, setGuests] = useState([
    {
      id: 'res_001',
      guestName: 'Ambassador David K. Mutua',
      suite: 'Villa 104 - 3 Bedroom Harbour Villa',
      checkIn: '2026-09-29',
      checkOut: '2026-10-04',
      status: 'arriving_today',
      pax: '4 Adults',
      notes: 'VIP Guest. Chilled champagne on arrival. Dhow sunset cruise reserved for tomorrow.',
      phone: '+254 722 100 200'
    },
    {
      id: 'res_002',
      guestName: 'Claire & Marcus Sterling',
      suite: 'Suite 201 - 1 Bedroom Ocean Penthouse',
      checkIn: '2026-09-29',
      checkOut: '2026-10-02',
      status: 'arriving_today',
      pax: '2 Adults (Honeymoon)',
      notes: 'Honeymoon couple. Flower petals and ocean-facing balcony breakfast.',
      phone: '+44 7911 123456'
    },
    {
      id: 'res_003',
      guestName: 'Eng. Farooq Al-Mansoor',
      suite: 'Suite 102 - 2 Bedroom Garden Suite',
      checkIn: '2026-09-25',
      checkOut: '2026-09-29',
      status: 'departing_today',
      pax: '2 Adults, 2 Kids',
      notes: 'Late checkout granted until 14:00. Airport Alphard transfer arranged for 14:30.',
      phone: '+971 50 123 4567'
    },
    {
      id: 'res_004',
      guestName: 'Dr. Sarah Wanjiku',
      suite: 'Suite 305 - 1 Bedroom Clifftop Suite',
      checkIn: '2026-09-27',
      checkOut: '2026-10-01',
      status: 'in_house',
      pax: '1 Adult',
      notes: 'Dietary: Gluten-free. Tamarind Restaurant table requested for tonight 20:00.',
      phone: '+254 733 456 789'
    }
  ]);

  const handleAction = (guestId: string, action: string) => {
    toast.success(`Guest record ${guestId}: ${action} processed successfully.`);
  };

  const filteredGuests = guests.filter(g => {
    if (activeTab === 'arrivals') return g.status === 'arriving_today';
    if (activeTab === 'departures') return g.status === 'departing_today';
    return g.status === 'in_house';
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Hotel className="w-3.5 h-3.5" /> Front Desk Operations
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Daily Guest Movement Hub
          </h1>
          <p className="text-xs text-white/60">
            Monitor today’s guest arrivals, departures, room keys, and in-house VIP services.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#1F1615] p-1.5 rounded-xl border border-[#C59B27]/25">
          <button
            onClick={() => setActiveTab('arrivals')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'arrivals' ? 'bg-[#821124] text-white shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            Arrivals (2)
          </button>
          <button
            onClick={() => setActiveTab('departures')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'departures' ? 'bg-[#821124] text-white shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            Departures (1)
          </button>
          <button
            onClick={() => setActiveTab('inhouse')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'inhouse' ? 'bg-[#821124] text-white shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            In-House (1)
          </button>
        </div>
      </div>

      {/* Guest Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGuests.map((g) => (
          <div
            key={g.id}
            className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 shadow-lg space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#C59B27] block">
                  {g.id}
                </span>
                <h3 className="font-serif text-lg font-bold text-white">
                  {g.guestName}
                </h3>
                <span className="text-xs text-white/70 block mt-0.5 font-medium">
                  {g.suite}
                </span>
              </div>

              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                g.status === 'arriving_today' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                g.status === 'departing_today' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                'bg-blue-950 text-blue-400 border border-blue-500/30'
              }`}>
                {g.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-white/10 text-white/80">
              <div>
                <span className="text-white/40 block text-[10px] uppercase">Stay Dates:</span>
                <span className="font-semibold">{g.checkIn} → {g.checkOut}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] uppercase">Party:</span>
                <span className="font-semibold">{g.pax}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] uppercase">Contact:</span>
                <span className="font-semibold">{g.phone}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] uppercase">Key Status:</span>
                <span className="text-[#C59B27] font-semibold flex items-center gap-1">
                  <Key className="w-3 h-3" /> Keycard Programmed
                </span>
              </div>
            </div>

            {g.notes && (
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-white/70">
                <span className="text-[#C59B27] font-bold block mb-1">VIP &amp; Operational Notes:</span>
                {g.notes}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              {g.status === 'arriving_today' && (
                <button
                  onClick={() => handleAction(g.id, 'Check-In')}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Confirm Check-In
                </button>
              )}
              {g.status === 'departing_today' && (
                <button
                  onClick={() => handleAction(g.id, 'Check-Out')}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Finalize Check-Out
                </button>
              )}
              <button
                onClick={() => handleAction(g.id, 'VIP Service Note Updated')}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Log Service
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
