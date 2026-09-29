'use client';

import React from 'react';
import { Compass, CheckCircle2 } from 'lucide-react';
import { FACILITIES } from '@/lib/data';

export default function AdminFacilitiesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
          <Compass className="w-3.5 h-3.5" /> Resort Amenities
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
          Facilities &amp; Recreation Management
        </h1>
        <p className="text-xs text-white/60">
          Control operational status and guest availability for pools, fitness facilities, and squash courts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FACILITIES.map((f) => (
          <div key={f.id} className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-white">{f.title}</h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                Operational
              </span>
            </div>
            <p className="text-xs text-white/70">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
