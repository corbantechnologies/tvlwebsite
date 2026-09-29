'use client';

import React from 'react';
import { Utensils, Ship, Clock, Users, Sparkles, Check } from 'lucide-react';
import { DINING } from '@/lib/data';
import toast from 'react-hot-toast';

export default function AdminDiningPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
          <Utensils className="w-3.5 h-3.5" /> Gastronomy &amp; Charters
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
          Tamarind Restaurant &amp; Dhow Venues
        </h1>
        <p className="text-xs text-white/60">
          Manage operational hours, capacity limits, dhow cruise sailings, and clifftop signature menus.
        </p>
      </div>

      <div className="space-y-6">
        {DINING.map((venue) => (
          <div
            key={venue.id}
            className="bg-[#1F1615] rounded-2xl border border-[#C59B27]/25 p-6 shadow-xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#821124] tracking-wider block">
                  {venue.cuisine}
                </span>
                <h3 className="font-serif text-2xl font-bold text-white">
                  {venue.title}
                </h3>
              </div>

              <span className="text-xs px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold uppercase w-fit">
                Open Daily
              </span>
            </div>

            <p className="text-xs text-white/70 max-w-3xl">
              {venue.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-black/40 border border-white/10 text-xs">
              <div>
                <span className="text-white/40 block text-[10px] uppercase">Service Hours:</span>
                <span className="font-semibold text-white">{venue.hours}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] uppercase">Dress Code:</span>
                <span className="font-semibold text-white">{venue.dressCode}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] uppercase">Venue Type:</span>
                <span className="font-semibold text-[#C59B27]">Harbour Clifftop &amp; Sailing Dhow</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-[#C59B27] block">Signature Specialties:</span>
              <div className="flex flex-wrap gap-2">
                {(venue.signatureDishes || []).map((dish, i) => (
                  <span key={i} className="text-xs bg-white/5 text-white/90 px-3 py-1 rounded-full border border-white/10">
                    {dish}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
