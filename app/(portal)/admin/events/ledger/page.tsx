'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ClipboardList,
  Search,
  Filter,
  Download,
  Plus,
  QrCode,
  CheckCircle2,
  Clock,
  UserCheck,
  RotateCw,
  ArrowLeft,
  Calendar,
  Ticket,
  DollarSign,
  AlertCircle,
  X,
  Check,
  Loader2,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { EventTicketType, ResortEvent } from '@/types';

function EventsLedgerContent() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get('eventId') || 'all';

  const [events, setEvents] = useState<ResortEvent[]>([]);
  const [tickets, setTickets] = useState<EventTicketType[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'paid' | 'comp' | 'checked_in' | 'pending'>('all');

  // Modal for issuing VIP / Comp Pass
  const [showCompModal, setShowCompModal] = useState(false);
  const [compEventId, setCompEventId] = useState('');
  const [compGuestName, setCompGuestName] = useState('');
  const [compGuestEmail, setCompGuestEmail] = useState('');
  const [compGuestPhone, setCompGuestPhone] = useState('');
  const [compTicketCount, setCompTicketCount] = useState(1);
  const [compNotes, setCompNotes] = useState('');
  const [compSubmitting, setCompSubmitting] = useState(false);

  // Manual fast check-in action
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, ticketsRes] = await Promise.all([
        fetch('/api/events'),
        fetch(selectedEventId !== 'all' ? `/api/events/tickets?eventId=${selectedEventId}` : '/api/events/tickets'),
      ]);

      const eventsData = await eventsRes.json();
      const ticketsData = await ticketsRes.json();

      if (eventsData.events) {
        setEvents(eventsData.events);
        if (!compEventId && eventsData.events.length > 0) {
          setCompEventId(eventsData.events[0].id);
        }
      }

      if (ticketsData.tickets) {
        setTickets(ticketsData.tickets);
      }
    } catch (err: any) {
      toast.error('Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEventId]);

  // Selected event object
  const activeEvent = useMemo(() => {
    if (selectedEventId === 'all') return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Event filter (if not already handled by query)
      if (selectedEventId !== 'all' && t.eventId !== selectedEventId) {
        return false;
      }

      // Status tab filter
      if (statusTab === 'paid' && t.paymentStatus !== 'paid') return false;
      if (statusTab === 'comp' && t.paymentStatus !== 'comp') return false;
      if (statusTab === 'checked_in' && t.checkInStatus !== 'checked_in') return false;
      if (statusTab === 'pending' && t.checkInStatus !== 'pending') return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.guestName.toLowerCase().includes(q);
        const matchesEmail = t.guestEmail.toLowerCase().includes(q);
        const matchesPhone = t.guestPhone.toLowerCase().includes(q);
        const matchesRef = t.ticketReference.toLowerCase().includes(q);
        const matchesToken = t.ticketQrToken.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesPhone || matchesRef || matchesToken;
      }

      return true;
    });
  }, [tickets, selectedEventId, statusTab, searchQuery]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const list = selectedEventId === 'all' ? tickets : tickets.filter((t) => t.eventId === selectedEventId);
    const totalAttendees = list.reduce((sum, t) => sum + (t.ticketCount || 1), 0);
    const totalRevenueKes = list.reduce((sum, t) => sum + (Number(t.totalAmountKes) || 0), 0);
    const checkedInCount = list.filter((t) => t.checkInStatus === 'checked_in').reduce((sum, t) => sum + (t.ticketCount || 1), 0);
    const compCount = list.filter((t) => t.paymentStatus === 'comp').length;

    const capacity = activeEvent?.maxCapacity || (selectedEventId === 'all' ? 0 : 100);
    const capacityPercent = capacity > 0 ? Math.min(100, Math.round((totalAttendees / capacity) * 100)) : 0;

    return {
      totalAttendees,
      totalRevenueKes,
      checkedInCount,
      compCount,
      capacity,
      capacityPercent,
    };
  }, [tickets, selectedEventId, activeEvent]);

  // CSV Export
  const exportCsv = () => {
    if (filteredTickets.length === 0) {
      toast.error('No attendees to export');
      return;
    }

    const headers = [
      'Ticket Reference',
      'Event Title',
      'Event Date',
      'Guest Name',
      'Guest Email',
      'Guest Phone',
      'Pax Count',
      'Amount (KES)',
      'Payment Status',
      'Method',
      'Subaccount',
      'Check-in Status',
      'Checked-in At',
      'Checked-in By',
      'Dietary Notes',
      'QR Token',
    ];

    const rows = filteredTickets.map((t) => [
      `"${t.ticketReference}"`,
      `"${t.eventTitle.replace(/"/g, '""')}"`,
      `"${t.eventDate}"`,
      `"${t.guestName.replace(/"/g, '""')}"`,
      `"${t.guestEmail}"`,
      `"${t.guestPhone}"`,
      t.ticketCount,
      t.totalAmountKes,
      t.paymentStatus,
      t.paymentMethod || 'paystack',
      `"${t.subaccountCode || 'Main'}"`,
      t.checkInStatus,
      `"${t.checkedInAt || ''}"`,
      `"${t.checkedInBy || ''}"`,
      `"${(t.dietaryRequirements || '').replace(/"/g, '""')}"`,
      `"${t.ticketQrToken}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tamarind_attendees_${selectedEventId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendee list downloaded as CSV');
  };

  // Direct manual check-in from Ledger
  const handleDirectCheckin = async (ticket: EventTicketType) => {
    if (ticket.checkInStatus === 'checked_in') return;
    setCheckingInId(ticket.id);
    try {
      const res = await fetch('/api/events/tickets/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: ticket.ticketReference,
          scannedBy: 'Desk Staff (Ledger)',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Admitted ${ticket.guestName}!`);
        setTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? { ...t, checkInStatus: 'checked_in', checkedInAt: new Date().toISOString(), checkedInBy: 'Desk Staff (Ledger)' } : t))
        );
      } else {
        toast.error(data.error || 'Failed to check in guest');
      }
    } catch {
      toast.error('Network error during check-in');
    } finally {
      setCheckingInId(null);
    }
  };

  // Issue Comp Ticket
  const handleIssueComp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compGuestName.trim() || !compGuestEmail.trim() || !compEventId) {
      toast.error('Please complete all required fields.');
      return;
    }

    setCompSubmitting(true);
    try {
      const targetEvt = events.find((e) => e.id === compEventId);
      const res = await fetch('/api/events/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: compEventId,
          eventTitle: targetEvt?.title || 'Resort Event',
          brand: targetEvt?.brand || 'tamarind_village',
          venue: targetEvt?.venue || 'Tamarind Mombasa',
          eventDate: targetEvt?.startDate || new Date().toISOString().split('T')[0],
          guestName: compGuestName.trim(),
          guestEmail: compGuestEmail.trim(),
          guestPhone: compGuestPhone.trim(),
          ticketCount: Number(compTicketCount) || 1,
          notes: compNotes.trim(),
          issuedBy: 'Front Desk Admin',
        }),
      });

      const data = await res.json();
      if (res.ok && data.ticket) {
        toast.success(`VIP pass issued to ${compGuestName}!`);
        setShowCompModal(false);
        setCompGuestName('');
        setCompGuestEmail('');
        setCompGuestPhone('');
        setCompNotes('');
        setTickets((prev) => [data.ticket, ...prev]);
      } else {
        toast.error(data.error || 'Failed to issue ticket');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setCompSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/events"
              className="text-xs text-slate-500 hover:text-[#821124] flex items-center gap-1 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Events Hub
            </Link>
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#821124]" />
            <span>Event Hosting Desk Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time attendee admissions, Paystack ticket revenue, gate entrance status, and capacity thresholds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={selectedEventId !== 'all' ? `/admin/events/checkin?eventId=${selectedEventId}` : '/admin/events/checkin'}
            className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <QrCode className="w-4 h-4 text-amber-700" />
            <span>Open Gate Scanner</span>
          </Link>

          <button
            onClick={() => setShowCompModal(true)}
            className="px-3.5 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Issue VIP Pass</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-2xs disabled:opacity-50"
            title="Refresh Data"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Event Selector & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
            Active Event:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#821124] min-w-[220px]"
          >
            <option value="all">All Experiences &amp; Galas</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({evt.startDate || 'Upcoming'})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Attendees */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Total Passes Sold</span>
            <Ticket className="w-4 h-4 text-[#821124]" />
          </div>
          <div className="font-serif text-2xl font-bold text-slate-900">
            {stats.totalAttendees} <span className="text-xs font-sans text-slate-400 font-normal">pax</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {stats.compCount > 0 ? `${stats.compCount} Complimentary VIPs` : 'All Direct Paid'}
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Gross Revenue (Paystack)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-slate-900">
            KES {stats.totalRevenueKes.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            Deposited to designated subaccounts
          </div>
        </div>

        {/* Gate Admissions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Gate Checked In</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-slate-900">
            {stats.checkedInCount}{' '}
            <span className="text-xs font-sans text-slate-400 font-normal">
              / {stats.totalAttendees}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            {stats.totalAttendees - stats.checkedInCount} yet to arrive at door
          </div>
        </div>

        {/* Capacity Utilization */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Capacity Filled</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-2xl font-bold text-slate-900">
              {stats.capacityPercent}%
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {stats.totalAttendees} / {stats.capacity > 0 ? stats.capacity : '∞'} max
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.capacityPercent >= 90
                  ? 'bg-rose-500'
                  : stats.capacityPercent >= 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, stats.capacityPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Attendees Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Controls: Search & Status Tabs */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: `All (${tickets.length})` },
              { id: 'paid', label: 'Paid' },
              { id: 'comp', label: 'VIP / Comp' },
              { id: 'checked_in', label: 'Checked In' },
              { id: 'pending', label: 'Pending Gate' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusTab === tab.id
                    ? 'bg-[#821124] text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, ref, or QR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs space-y-2">
            <RotateCw className="w-6 h-6 animate-spin mx-auto text-[#821124]" />
            <p>Loading guestlist ledger from database...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No Tickets Found</p>
            <p className="text-xs text-slate-400">
              {searchQuery ? 'No attendees matched your search criteria.' : 'No ticket purchases or VIP passes registered for this view.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket Ref</th>
                  <th className="py-3 px-4">Guest Info</th>
                  <th className="py-3 px-4">Event &amp; Venue</th>
                  <th className="py-3 px-4 text-center">Attendees</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Gate Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((t) => {
                  const isCheckedIn = t.checkInStatus === 'checked_in';
                  const isCheckingIn = checkingInId === t.id;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Ticket Reference */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono font-bold text-slate-900">
                          {t.ticketReference}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Guest Info */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-900">{t.guestName}</div>
                        <div className="text-slate-500 text-[11px]">{t.guestEmail}</div>
                        {t.guestPhone && <div className="text-slate-400 text-[10px]">{t.guestPhone}</div>}
                        {t.dietaryRequirements && (
                          <div className="mt-1 text-[10px] text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 inline-block border border-amber-200">
                            Dietary: {t.dietaryRequirements}
                          </div>
                        )}
                      </td>

                      {/* Event */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-900 line-clamp-1">{t.eventTitle}</div>
                        <div className="text-slate-500 text-[11px]">{t.venue}</div>
                        <div className="text-slate-400 text-[10px]">{t.eventDate}</div>
                      </td>

                      {/* Attendees count */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-bold font-mono text-xs">
                          {t.ticketCount} pax
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-slate-900">
                          {t.currency} {Number(t.totalAmountKes).toLocaleString()}
                        </div>
                        <div className="text-[10px]">
                          {t.paymentStatus === 'comp' ? (
                            <span className="text-indigo-700 font-bold uppercase">VIP Comp</span>
                          ) : (
                            <span className="text-emerald-700 font-bold uppercase">Paid (Paystack)</span>
                          )}
                        </div>
                        {t.subaccountCode && (
                          <div className="text-[9px] text-slate-400 font-mono">
                            Sub: {t.subaccountCode}
                          </div>
                        )}
                      </td>

                      {/* Gate Status */}
                      <td className="py-3.5 px-4 align-top">
                        {isCheckedIn ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Admitted</span>
                            </span>
                            <div className="text-[10px] text-slate-400 leading-tight">
                              {new Date(t.checkedInAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-[9px] text-slate-400">
                              by {t.checkedInBy || 'Gate Staff'}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Gate</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        {!isCheckedIn ? (
                          <button
                            onClick={() => handleDirectCheckin(t)}
                            disabled={isCheckingIn}
                            className="px-2.5 py-1 rounded bg-[#821124] hover:bg-[#680e1c] text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                          >
                            {isCheckingIn ? (
                              <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                            ) : (
                              'Check In'
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold">Done</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Issue Complimentary / VIP Pass */}
      {showCompModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative text-slate-900 space-y-4 my-8">
            <button
              onClick={() => setShowCompModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">
                Issue VIP Complimentary Pass
              </h2>
              <p className="text-xs text-slate-500">
                Generates a secure QR entrance ticket with 100% discount for special guests or media.
              </p>
            </div>

            <form onSubmit={handleIssueComp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Event *
                </label>
                <select
                  required
                  value={compEventId}
                  onChange={(e) => setCompEventId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                >
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.startDate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  VIP Guest Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hon. James Ochieng"
                  value={compGuestName}
                  onChange={(e) => setCompGuestName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guest Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="guest@example.com"
                    value={compGuestEmail}
                    onChange={(e) => setCompGuestEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guest Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+254 7..."
                    value={compGuestPhone}
                    onChange={(e) => setCompGuestPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pass Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={compTicketCount}
                    onChange={(e) => setCompTicketCount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Inclusions
                  </label>
                  <input
                    type="text"
                    placeholder="VIP Table / Media Pass"
                    value={compNotes}
                    onChange={(e) => setCompNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-slate-600">
                An official Tamarind E-Ticket confirmation email with unique gate entrance QR code will be dispatched to <strong>{compGuestEmail || 'the guest email'}</strong> immediately upon issuance.
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCompModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={compSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {compSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Issue &amp; Send Pass</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventsLedgerPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#821124]" />
          <p className="mt-2">Loading Event Hosting Desk...</p>
        </div>
      }
    >
      <EventsLedgerContent />
    </Suspense>
  );
}
