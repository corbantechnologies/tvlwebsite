'use client';

import React, { useState, useEffect } from 'react';
import { 
  Hotel, Users, Calendar, Clock, CheckCircle2, 
  ArrowRight, ShieldCheck, Key, AlertCircle, Phone, Mail, RotateCw, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FrontDeskPage() {
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures' | 'inhouse' | 'all'>('arrivals');
  const [guests, setGuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Fetch live bookings from PostgreSQL database
  const loadLiveBookings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.bookings) {
        setGuests(data.bookings);
      }
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
      toast.error('Failed to load live guest ledger.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLiveBookings();
  }, []);

  const handleAction = async (guestId: string, actionType: 'check-in' | 'check-out' | 'log-note') => {
    setIsProcessing(guestId);
    try {
      let payload: Record<string, any> = { id: guestId, action: actionType };

      if (actionType === 'log-note') {
        const note = window.prompt('Enter VIP / Service Note for this guest:');
        if (!note) {
          setIsProcessing(null);
          return;
        }
        payload.note = note;
      }

      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success && result.booking) {
        setGuests((prev) =>
          prev.map((g) => (g.id === guestId ? result.booking : g))
        );
        toast.success(
          actionType === 'check-in'
            ? 'Guest successfully checked in!'
            : actionType === 'check-out'
            ? 'Guest successfully checked out.'
            : 'Service note logged to database.'
        );
      } else {
        toast.error(result.error || 'Failed to update guest status.');
      }
    } catch (err: any) {
      toast.error('Network error updating guest.');
    } finally {
      setIsProcessing(null);
    }
  };

  const arrivalsCount = guests.filter((g) => g.bookingStatus === 'arriving_today').length;
  const departuresCount = guests.filter((g) => g.bookingStatus === 'departing_today').length;
  const inHouseCount = guests.filter((g) => g.bookingStatus === 'in_house').length;

  const filteredGuests = guests.filter((g) => {
    if (activeTab === 'arrivals') return g.bookingStatus === 'arriving_today';
    if (activeTab === 'departures') return g.bookingStatus === 'departing_today';
    if (activeTab === 'inhouse') return g.bookingStatus === 'in_house';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Hotel className="w-3.5 h-3.5" /> Front Desk Operations • Live Database
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Daily Guest Movement Hub
          </h1>
          <p className="text-xs text-white/60">
            Real-time PostgreSQL-synced guest arrivals, departures, room keys, and in-house VIP services.
          </p>
        </div>

        {/* Tab Switcher & Refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadLiveBookings}
            disabled={isLoading}
            className="p-2 rounded-xl bg-[#1F1615] border border-[#C59B27]/25 text-[#C59B27] hover:bg-[#821124] hover:text-white transition-all cursor-pointer"
            title="Refresh Live Data"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center bg-[#1F1615] p-1.5 rounded-xl border border-[#C59B27]/25 overflow-x-auto">
            <button
              onClick={() => setActiveTab('arrivals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'arrivals' ? 'bg-[#821124] text-white shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              Arrivals ({arrivalsCount})
            </button>
            <button
              onClick={() => setActiveTab('departures')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'departures' ? 'bg-[#821124] text-white shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              Departures ({departuresCount})
            </button>
            <button
              onClick={() => setActiveTab('inhouse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'inhouse' ? 'bg-[#821124] text-white shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              In-House ({inHouseCount})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all' ? 'bg-[#821124] text-white shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              All ({guests.length})
            </button>
          </div>
        </div>
      </div>

      {/* Guest Cards */}
      {isLoading ? (
        <div className="py-20 text-center text-white/50 space-y-3">
          <RotateCw className="w-8 h-8 animate-spin mx-auto text-[#C59B27]" />
          <p className="text-sm">Connecting to live front desk guest records...</p>
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="bg-[#1F1615] rounded-2xl p-12 border border-[#C59B27]/20 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-[#C59B27] mx-auto opacity-60" />
          <h3 className="font-serif text-lg font-bold text-white">No Guests in this category</h3>
          <p className="text-xs text-white/50 max-w-sm mx-auto">
            All guest movements for {activeTab} are clear or have been processed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGuests.map((g) => {
            const notes = Array.isArray(g.staffNotes) ? g.staffNotes : [];
            const isBusy = isProcessing === g.id;

            return (
              <div
                key={g.id}
                className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 shadow-lg space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#C59B27] block">
                      {g.bookingReference || g.id}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-white">
                      {g.guestName}
                    </h3>
                    <span className="text-xs text-white/70 block mt-0.5 font-medium">
                      {g.apartmentName}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    g.bookingStatus === 'arriving_today' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                    g.bookingStatus === 'departing_today' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                    g.bookingStatus === 'in_house' ? 'bg-blue-950 text-blue-400 border border-blue-500/30' :
                    'bg-stone-800 text-stone-300 border border-stone-600'
                  }`}>
                    {(g.bookingStatus || 'confirmed').replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-white/10 text-white/80">
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">Stay Dates:</span>
                    <span className="font-semibold">{g.checkIn} → {g.checkOut}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">Party:</span>
                    <span className="font-semibold">{g.adults} Adults {g.children ? `, ${g.children} Kids` : ''}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">Contact:</span>
                    <span className="font-semibold truncate block">{g.guestPhone || g.guestEmail || 'Direct'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">Key Status:</span>
                    <span className="text-[#C59B27] font-semibold flex items-center gap-1">
                      <Key className="w-3 h-3" /> Keycard Programmed
                    </span>
                  </div>
                </div>

                {g.specialRequests && (
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-white/70">
                    <span className="text-[#C59B27] font-bold block mb-1">VIP &amp; Operational Requests:</span>
                    {g.specialRequests}
                  </div>
                )}

                {notes.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider block">Staff Activity Logs:</span>
                    {notes.slice(-2).map((n: any, idx: number) => (
                      <div key={idx} className="text-[11px] bg-white/5 p-2 rounded border border-white/5 text-stone-300">
                        <span className="text-brand-gold font-semibold">{n.author || 'Staff'}:</span> {n.text}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  {g.bookingStatus === 'arriving_today' && (
                    <button
                      onClick={() => handleAction(g.id, 'check-in')}
                      disabled={isBusy}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isBusy ? 'Checking In...' : 'Confirm Check-In'}
                    </button>
                  )}
                  {g.bookingStatus === 'in_house' && (
                    <button
                      onClick={() => handleAction(g.id, 'check-out')}
                      disabled={isBusy}
                      className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isBusy ? 'Checking Out...' : 'Finalize Check-Out'}
                    </button>
                  )}
                  {g.bookingStatus === 'departing_today' && (
                    <button
                      onClick={() => handleAction(g.id, 'check-out')}
                      disabled={isBusy}
                      className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isBusy ? 'Checking Out...' : 'Finalize Check-Out'}
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(g.id, 'log-note')}
                    disabled={isBusy}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Log Service
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
