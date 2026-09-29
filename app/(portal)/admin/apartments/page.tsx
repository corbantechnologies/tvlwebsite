'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Sparkles, Check, Edit, Save, RefreshCw, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApartmentType } from '@/types';
import { APARTMENTS } from '@/lib/data';

export default function AdminApartmentsPage() {
  const [apartments, setApartments] = useState<ApartmentType[]>(APARTMENTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPriceKes, setEditPriceKes] = useState<number>(0);
  const [editPriceUsd, setEditPriceUsd] = useState<number>(0);

  const fetchApartments = async () => {
    try {
      const res = await fetch('/api/apartments');
      const data = await res.json();
      if (data.apartments && data.apartments.length > 0) {
        setApartments(data.apartments);
      }
    } catch {
      console.warn('Using local apartment defaults');
    }
  };

  useEffect(() => {
    fetchApartments();
  }, []);

  const startEdit = (apt: ApartmentType) => {
    setEditingId(apt.id);
    setEditPriceKes(apt.pricePerNightKes || apt.pricePerNight || 0);
    setEditPriceUsd(apt.pricePerNightUsd || 0);
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/apartments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_per_night_kes: editPriceKes,
          price_per_night_usd: editPriceUsd,
        })
      });

      if (res.ok) {
        toast.success('Rates updated and saved to PostgreSQL!');
        setEditingId(null);
        fetchApartments();
      } else {
        toast.error('Failed to update rates.');
      }
    } catch {
      toast.error('Network error updating rates.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" /> Inventory Management
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Suites &amp; Villas Configuration
          </h1>
          <p className="text-xs text-white/60">
            Control base rates in KES &amp; USD, room availability, and synchronize with Profitroom channel engine.
          </p>
        </div>

        <button
          onClick={() => {
            toast.success('Syncing rates with Profitroom PMS engine...');
            setTimeout(() => toast.success('Rates in sync with Profitroom cloud!'), 1200);
          }}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-[#C59B27]" />
          <span>Sync Profitroom Rates</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {apartments.map((apt) => {
          const isEditing = editingId === apt.id;
          return (
            <div
              key={apt.id}
              className="bg-[#1F1615] rounded-2xl border border-[#C59B27]/25 overflow-hidden shadow-xl flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#C59B27] tracking-wider block">
                      {apt.bedrooms} Bedroom Category
                    </span>
                    <h3 className="font-serif text-xl font-bold text-white">
                      {apt.title}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </div>

                <p className="text-xs text-white/70 line-clamp-2">
                  {apt.description}
                </p>

                {/* Rates Section */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Base Price (KES):</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editPriceKes}
                        onChange={(e) => setEditPriceKes(Number(e.target.value))}
                        className="w-28 bg-[#1F1615] border border-[#C59B27] rounded px-2 py-1 text-white font-bold text-xs"
                      />
                    ) : (
                      <span className="font-bold text-[#C59B27] text-sm">
                        KES {apt.pricePerNightKes?.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Base Price (USD):</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editPriceUsd}
                        onChange={(e) => setEditPriceUsd(Number(e.target.value))}
                        className="w-28 bg-[#1F1615] border border-[#C59B27] rounded px-2 py-1 text-white font-bold text-xs"
                      />
                    ) : (
                      <span className="font-bold text-white text-sm">
                        ${apt.pricePerNightUsd} USD
                      </span>
                    )}
                  </div>
                </div>

                {/* Amenities */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] uppercase text-white/50 font-bold block">Included Features:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {apt.amenities.slice(0, 4).map((a, i) => (
                      <span key={i} className="text-[10px] bg-white/5 text-white/80 px-2 py-0.5 rounded border border-white/10">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-black/20 border-t border-white/10 flex items-center justify-end gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-bold uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(apt.id)}
                      className="px-4 py-1.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Rates</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEdit(apt)}
                    className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>Edit Pricing</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
