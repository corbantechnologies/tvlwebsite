'use client';

import React, { useState, useEffect } from 'react';
import { 
  Hotel, Users, Calendar, Clock, CheckCircle2, 
  ArrowRight, ShieldCheck, Key, AlertCircle, Phone, Mail, RotateCw, Plus, Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FrontDeskPage() {
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures' | 'inhouse' | 'all'>('arrivals');
  const [guests, setGuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Fetch live bookings
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
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#821124] font-bold uppercase tracking-wider mb-1">
            <Hotel className="w-3.5 h-3.5" /> Front Desk Operations • Live Database
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Daily Guest Movement Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time PostgreSQL-synced guest arrivals, departures, room keys, and in-house VIP concierge.
          </p>
        </div>

        {/* Tab Switcher & Refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadLiveBookings}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh Live Data"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('arrivals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'arrivals' ? 'bg-[#821124] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Arrivals ({arrivalsCount})
            </button>
            <button
              onClick={() => setActiveTab('departures')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'departures' ? 'bg-[#821124] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Departures ({departuresCount})
            </button>
            <button
              onClick={() => setActiveTab('inhouse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'inhouse' ? 'bg-[#821124] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In-House ({inHouseCount})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all' ? 'bg-[#821124] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({guests.length})
            </button>
          </div>
        </div>
      </div>

      {/* Guest Cards */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500 space-y-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <RotateCw className="w-8 h-8 animate-spin mx-auto text-[#821124]" />
          <p className="text-sm">Connecting to live front desk guest records...</p>
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3 shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-slate-900">No Guests in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md space-y-4 transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#821124] block">
                      {g.bookingReference || g.id}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-slate-900">
                      {g.guestName}
                    </h3>
                    <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                      {g.apartmentName}
                    </span>
                  </div>

                  <span className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full ${
                    g.bookingStatus === 'arriving_today' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    g.bookingStatus === 'departing_today' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    g.bookingStatus === 'in_house' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {(g.bookingStatus || 'confirmed').replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-slate-100 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Stay Dates:</span>
                    <span className="font-semibold">{g.checkIn} → {g.checkOut}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Party:</span>
                    <span className="font-semibold">{g.adults} Adults {g.children ? `, ${g.children} Kids` : ''}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contact:</span>
                    <span className="font-semibold truncate block">{g.guestPhone || g.guestEmail || 'Direct'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Key Status:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Key className="w-3 h-3 text-[#821124]" /> Keycard Programmed
                    </span>
                  </div>
                </div>

                {g.specialRequests && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <span className="text-slate-900 font-bold block mb-1">VIP &amp; Operational Requests:</span>
                    {g.specialRequests}
                  </div>
                )}

                {notes.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Staff Activity Logs:</span>
                    {notes.slice(-2).map((n: any, idx: number) => (
                      <div key={idx} className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-700">
                        <span className="text-[#821124] font-semibold">{n.author || 'Staff'}:</span> {n.text}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  {g.bookingStatus === 'arriving_today' && (
                    <button
                      onClick={() => handleAction(g.id, 'check-in')}
                      disabled={isBusy}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Confirm Check-In</span>
                    </button>
                  )}
                  {(g.bookingStatus === 'in_house' || g.bookingStatus === 'departing_today') && (
                    <button
                      onClick={() => handleAction(g.id, 'check-out')}
                      disabled={isBusy}
                      className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Finalize Check-Out</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(g.id, 'log-note')}
                    disabled={isBusy}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
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
