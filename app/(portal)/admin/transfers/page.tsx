'use client';

import React from 'react';
import { Car, Plane, Train, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminTransfersPage() {
  const requests = [
    {
      id: 'TR-101',
      guestName: 'Ambassador David K. Mutua',
      route: 'Moi Airport (MBA) → Tamarind Village',
      date: '2026-09-29',
      flight: 'KQ 604 (ETA 14:15)',
      vehicle: 'Executive Alphard (KDF 234P)',
      status: 'assigned',
      chauffeur: 'Juma Mwambire'
    },
    {
      id: 'TR-102',
      guestName: 'Claire & Marcus Sterling',
      route: 'Mombasa SGR Terminus → Tamarind Village',
      date: '2026-09-29',
      flight: 'SGR Express Train E1',
      vehicle: 'Mercedes E-Class (KCJ 889M)',
      status: 'assigned',
      chauffeur: 'Ali Hassan'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
          <Car className="w-3.5 h-3.5" /> Chauffeur Logistics
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
          VIP Transfers &amp; Chauffeur Fleet
        </h1>
        <p className="text-xs text-white/60">
          Track airport and SGR guest transfers, vehicle assignments, and real-time flight schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requests.map((tr) => (
          <div key={tr.id} className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C59B27] block">{tr.id}</span>
                <h3 className="font-serif text-lg font-bold text-white">{tr.guestName}</h3>
                <span className="text-xs text-white/70 block mt-0.5">{tr.route}</span>
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                {tr.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-white/10 text-white/80">
              <div>
                <span className="text-white/40 block text-[10px] uppercase">Service Date:</span>
                <span className="font-semibold">{tr.date}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] uppercase">Flight / Train:</span>
                <span className="font-semibold">{tr.flight}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] uppercase">Assigned Chauffeur:</span>
                <span className="font-semibold text-[#C59B27]">{tr.chauffeur}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] uppercase">Vehicle:</span>
                <span className="font-semibold">{tr.vehicle}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => toast.success('Dispatch notification sent to chauffeur WhatsApp!')}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase cursor-pointer"
              >
                Notify Chauffeur
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
