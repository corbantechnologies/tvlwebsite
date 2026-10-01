'use client';

import React, { useState, useEffect } from 'react';
import { 
  Car, Plane, Train, CheckCircle2, Clock, Calendar, 
  RotateCw, User, Phone, Mail, MapPin, ExternalLink, 
  AlertCircle, Plus, X, Loader2, ShieldCheck, Info, Check, Trash2, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TransferItem {
  id: string;
  bookingId?: string | null;
  bookingReference?: string | null;
  guestName: string;
  guestPhone?: string | null;
  guestEmail?: string | null;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  flightOrTrainNumber?: string | null;
  vehicleType: string;
  passengers?: number;
  driverName?: string | null;
  driverPhone?: string | null;
  status: string; // 'scheduled' | 'dispatched' | 'in_transit' | 'completed' | 'cancelled'
  costKes?: number;
  costUsd?: number;
  notes?: string | null;
  createdAt?: string;
  isFromBooking?: boolean;
}

export default function AdminTransfersPage() {
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showBookModal, setShowBookModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [pickupLoc, setPickupLoc] = useState('Moi International Airport (MBA)');
  const [dropoffLoc, setDropoffLoc] = useState('Tamarind Village Mombasa');
  const [pickupDateTime, setPickupDateTime] = useState('');
  const [flightOrTrain, setFlightOrTrain] = useState('');
  const [vehicleType, setVehicleType] = useState('Luxury Alphard VIP');
  const [passengers, setPassengers] = useState<number | ''>(2);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [notes, setNotes] = useState('');

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transfers');
      const data = await res.json();
      if (data.transfers) {
        setTransfers(data.transfers);
      }
    } catch {
      toast.error('Failed to load transfers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !pickupLoc.trim() || !pickupDateTime) {
      toast.error('Guest name, pickup location, and date/time are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          guestEmail: guestEmail.trim(),
          bookingReference: bookingRef.trim() || undefined,
          pickupLocation: pickupLoc.trim(),
          dropoffLocation: dropoffLoc.trim(),
          pickupDateTime: pickupDateTime.trim(),
          flightOrTrainNumber: flightOrTrain.trim() || undefined,
          vehicleType,
          passengers: Number(passengers) || 1,
          driverName: driverName.trim() || undefined,
          driverPhone: driverPhone.trim() || undefined,
          notes: notes.trim() || undefined,
          costKes: vehicleType.includes('Alphard') ? 7000 : vehicleType.includes('Van') ? 9500 : 3500,
          costUsd: vehicleType.includes('Alphard') ? 55 : vehicleType.includes('Van') ? 75 : 30,
        }),
      });

      if (res.ok) {
        toast.success(`VIP Transfer scheduled for ${guestName}!`);
        setShowBookModal(false);
        // Reset form
        setGuestName('');
        setGuestPhone('');
        setGuestEmail('');
        setBookingRef('');
        setFlightOrTrain('');
        setDriverName('');
        setDriverPhone('');
        setNotes('');
        loadTransfers();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to schedule transfer');
      }
    } catch {
      toast.error('Network error booking transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/transfers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Transfer marked as ${newStatus}`);
        setTransfers((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
        );
      } else {
        toast.error('Failed to update transfer status');
      }
    } catch {
      toast.error('Network error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string, guest: string) => {
    if (!confirm(`Are you sure you want to cancel the transfer for ${guest}?`)) return;
    try {
      const res = await fetch(`/api/transfers?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Transfer deleted');
        setTransfers((prev) => prev.filter((t) => t.id !== id));
      } else {
        toast.error('Failed to delete transfer');
      }
    } catch {
      toast.error('Network error deleting transfer');
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#821124] font-semibold uppercase tracking-wider mb-1">
            <Car className="w-3.5 h-3.5" /> Chauffeur Fleet &amp; Airport Dispatch
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            VIP Transfers &amp; Chauffeur Dispatch
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage airport and SGR train pickups booked by guests online or manually scheduled by concierge.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadTransfers}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            title="Refresh Fleet"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowBookModal(true)}
            className="px-3.5 py-2 rounded-lg bg-[#821124] hover:bg-[#6b0d1d] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book VIP Transfer</span>
          </button>
        </div>
      </div>

      {/* Architecture Explainer Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-slate-900">
          <Info className="w-4 h-4 text-[#821124]" />
          <h3 className="font-serif text-sm font-bold">
            How Transfers Connect Across the Tamarind Platform
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-1">
            <strong className="text-slate-900 block font-semibold">1. Guest Online Booking Channel</strong>
            <p>
              When guests complete a reservation or inquiry on the public site, choosing an Airport/SGR add-on or entering flight details automatically logs the transfer into this ledger linked to their booking reference.
            </p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-1">
            <strong className="text-slate-900 block font-semibold">2. Concierge Direct Dispatch</strong>
            <p>
              Staff can click <strong>&quot;Book VIP Transfer&quot;</strong> above to manually dispatch our luxury Alphard or executive fleet for non-booking guests, VIP corporate arrivals, or dining guests boarding the Dhow.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['all', 'scheduled', 'dispatched', 'in_transit', 'completed', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer capitalize ${
              statusFilter === st
                ? 'bg-[#821124] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Transfers Table / Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#821124]" />
          <p>Loading fleet dispatch ledger...</p>
        </div>
      ) : filteredTransfers.length === 0 ? (
        <div className="p-16 text-center text-slate-500 space-y-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <Car className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-800">No Transfer Requests in Current View</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {statusFilter === 'all'
              ? 'No airport or SGR transfers currently scheduled. Click "+ Book VIP Transfer" to schedule one manually.'
              : `No transfers found under status "${statusFilter}".`}
          </p>
          <button
            onClick={() => setShowBookModal(true)}
            className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#6b0d1d] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Transfer</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Guest &amp; Reference</th>
                  <th className="py-3 px-4">Route &amp; Destination</th>
                  <th className="py-3 px-4">Pickup Date/Time</th>
                  <th className="py-3 px-4">Vehicle &amp; Pax</th>
                  <th className="py-3 px-4">Flight / Train Details</th>
                  <th className="py-3 px-4">Status &amp; Driver</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTransfers.map((t) => {
                  const isUpdating = updatingId === t.id;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{t.guestName}</span>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          {t.bookingReference && (
                            <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 text-[10px]">
                              {t.bookingReference}
                            </span>
                          )}
                          <span>{t.guestPhone || t.guestEmail || 'Direct Dispatch'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{t.pickupLocation}</div>
                        <div className="text-[11px] text-slate-400">→ {t.dropoffLocation}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-800">
                        <div className="font-medium">{t.pickupDateTime}</div>
                        {t.costKes ? (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            KES {t.costKes.toLocaleString()} (${t.costUsd || 30})
                          </div>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-900 block">{t.vehicleType}</span>
                        <span className="text-[10px] text-slate-500">{t.passengers || 1} passenger(s)</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                          {t.flightOrTrainNumber || 'Standard Arrival'}
                        </span>
                        {t.notes && (
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{t.notes}</p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : t.status === 'dispatched' || t.status === 'in_transit'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : t.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {t.status.replace('_', ' ')}
                        </span>
                        {t.driverName && (
                          <div className="text-[10px] text-slate-600 mt-0.5">
                            Driver: <strong>{t.driverName}</strong>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status !== 'completed' && t.status !== 'cancelled' && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(
                                  t.id,
                                  t.status === 'scheduled' ? 'dispatched' : 'completed'
                                )
                              }
                              disabled={isUpdating}
                              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1"
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3 h-3 animate-spin text-[#821124]" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              )}
                              <span>{t.status === 'scheduled' ? 'Dispatch' : 'Complete'}</span>
                            </button>
                          )}

                          {!t.isFromBooking && (
                            <button
                              onClick={() => handleDelete(t.id, t.guestName)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Transfer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BOOK VIP TRANSFER MODAL */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 border border-slate-200 shadow-xl relative text-slate-900 space-y-4 my-8">
            <button
              onClick={() => setShowBookModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">
                Book VIP Chauffeur Transfer
              </h2>
              <p className="text-xs text-slate-500">
                Schedule airport/SGR pickup with vehicle allocation, flight tracking, and driver assignment.
              </p>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Amina Hassan"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Booking Reference (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TVL-2026-8812"
                    value={bookingRef}
                    onChange={(e) => setBookingRef(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Guest Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +254 712 345 678"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Guest Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. guest@domain.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Pickup Location *
                  </label>
                  <select
                    value={pickupLoc}
                    onChange={(e) => setPickupLoc(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  >
                    <option value="Moi International Airport (MBA)">Moi International Airport (MBA)</option>
                    <option value="Mombasa SGR Terminus (Miritini)">Mombasa SGR Terminus (Miritini)</option>
                    <option value="Vipingo Ridge Airstrip">Vipingo Ridge Airstrip</option>
                    <option value="Diani / Ukunda Airstrip">Diani / Ukunda Airstrip</option>
                    <option value="Mombasa CBD / Nyali">Mombasa CBD / Nyali</option>
                    <option value="Custom Location">Custom Location</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Destination Dropoff
                  </label>
                  <input
                    type="text"
                    value={dropoffLoc}
                    onChange={(e) => setDropoffLoc(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Pickup Date &amp; Time *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026-10-15 14:30"
                    value={pickupDateTime}
                    onChange={(e) => setPickupDateTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Passengers
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={passengers ?? ''}
                    onChange={(e) => setPassengers(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Flight / SGR Train Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KQ 604 or Madaraka Express E1"
                    value={flightOrTrain}
                    onChange={(e) => setFlightOrTrain(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  >
                    <option value="Luxury Alphard VIP">Luxury Alphard VIP (KES 7,000 / $55)</option>
                    <option value="Executive Private Sedan">Executive Private Sedan (KES 3,500 / $30)</option>
                    <option value="Executive Chauffeur Van">Executive Chauffeur Van (KES 9,500 / $75)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Assigned Driver (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Mwangi"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Driver Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +254 722 000 111"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Special Notes / Luggage Requests
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 4 large suitcases, child car seat requested..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-[#821124] hover:bg-[#6b0d1d] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Dispatch</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
