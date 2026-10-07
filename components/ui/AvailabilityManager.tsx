'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon, Clock, Plus, Trash2, Edit3, Save, X,
  ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, ShieldAlert,
  Layers, BedDouble, DollarSign, Filter, RefreshCw, Info, Lock, Loader2, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Apartment {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  totalUnits: number;
  notes?: string;
  updatedAt?: string;
}

interface AvailabilityBlock {
  id: string;
  apartmentId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  blockType?: 'hard_block' | 'rate_hold' | string;
  source?: string;
  blockedBy?: string;
  createdAt?: string;
}

interface RateOverride {
  id: string;
  apartmentId: string;
  startDate: string;
  endDate: string;
  rateUsd?: number | null;
  rateKes?: number | null;
  minNights?: number;
  label?: string | null;
  createdBy?: string;
  createdAt?: string;
}

interface BookingRecord {
  id: string;
  bookingReference: string;
  apartmentId: string;
  apartmentName: string;
  allocatedUnit?: string | null;
  guestName: string;
  checkIn: string;
  checkOut: string;
  bookingStatus: string;
}

interface Props {
  apartments: Apartment[];
  currentUserName: string;
}

const DEFAULT_APARTMENTS: Apartment[] = [
  { id: '1-bedroom', name: '1-Bedroom Luxury Suite' },
  { id: '2-bedroom', name: '2-Bedroom Family Suite' },
  { id: '3-bedroom', name: '3-Bedroom Penthouse Suite' },
];

const BLOCK_REASONS = [
  'Maintenance / Refurbishment',
  'Opera PMS Direct Hold',
  'OTA / UpperBooking Allocation',
  'Private Property Buyout',
  'VIP / Owner Hold',
  'Custom Reason',
];

export default function AvailabilityManager({ apartments: propApartments, currentUserName }: Props) {
  const apartments = propApartments.length > 0 ? propApartments : DEFAULT_APARTMENTS;

  const [activeTab, setActiveTab] = useState<'calendar' | 'rates' | 'blocks' | 'inventory'>('calendar');
  const [loading, setLoading] = useState(false);

  // Month navigation
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Data
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [rateOverridesList, setRateOverridesList] = useState<RateOverride[]>([]);
  const [bookingsList, setBookingsList] = useState<BookingRecord[]>([]);

  // Inventory inline edit
  const [editingInv, setEditingInv] = useState<Record<string, number | ''>>({});

  // Modals
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [cellPopover, setCellPopover] = useState<{
    apartment: Apartment;
    dateStr: string;
    availableUnits: number;
    totalUnits: number;
    rateOverride: RateOverride | null;
    activeBlocks: AvailabilityBlock[];
    activeBookings: BookingRecord[];
    x: number;
    y: number;
  } | null>(null);

  const handleCellClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    apt: Apartment,
    dateStr: string,
    status: ReturnType<typeof getDayStatus>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const popoverWidth = 320;
    const popoverHeight = 330;

    let x = rect.left + rect.width / 2 - popoverWidth / 2;
    if (x < 16) x = 16;
    if (typeof window !== 'undefined' && x + popoverWidth > window.innerWidth - 16) {
      x = window.innerWidth - popoverWidth - 16;
    }

    let y = rect.bottom + 8;
    if (typeof window !== 'undefined' && y + popoverHeight > window.innerHeight - 16) {
      y = Math.max(16, rect.top - popoverHeight - 8);
    }

    setCellPopover({
      apartment: apt,
      dateStr,
      availableUnits: status.availableUnits,
      totalUnits: status.totalUnits,
      rateOverride: status.activeOverride,
      activeBlocks: status.matchingBlocks,
      activeBookings: status.activeBookings,
      x,
      y,
    });
  };

  // Form states for Block
  const [blockAptId, setBlockAptId] = useState<string>('all');
  const [blockStart, setBlockStart] = useState<string>('');
  const [blockEnd, setBlockEnd] = useState<string>('');
  const [blockReason, setBlockReason] = useState<string>(BLOCK_REASONS[0]);
  const [blockCustomReason, setBlockCustomReason] = useState<string>('');
  const [blockType, setBlockType] = useState<'hard_block' | 'rate_hold'>('hard_block');
  const [blockSource, setBlockSource] = useState<string>('direct');
  const [submittingBlock, setSubmittingBlock] = useState(false);

  // Form states for Rate Override
  const [rateAptId, setRateAptId] = useState<string>('all');
  const [rateStart, setRateStart] = useState<string>('');
  const [rateEnd, setRateEnd] = useState<string>('');
  const [rateUsd, setRateUsd] = useState<number | ''>(320);
  const [rateKes, setRateKes] = useState<number | ''>(42000);
  const [rateMinNights, setRateMinNights] = useState<number | ''>(1);
  const [rateLabel, setRateLabel] = useState<string>('Peak Season Special');
  const [submittingRate, setSubmittingRate] = useState(false);

  // Fetch all availability data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, blkRes, ratRes, bkgRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/availability/blocks'),
        fetch('/api/availability/rates'),
        fetch('/api/bookings'),
      ]);

      const invData = await invRes.json();
      const blkData = await blkRes.json();
      const ratData = await ratRes.json();
      const bkgData = await bkgRes.json();

      if (invData.inventory) {
        setInventory(invData.inventory);
        const map: Record<string, number> = {};
        invData.inventory.forEach((i: InventoryItem) => {
          map[i.id] = i.totalUnits;
        });
        setEditingInv(map);
      }
      if (blkData.blocks) setBlocks(blkData.blocks);
      if (ratData.rates) setRateOverridesList(ratData.rates);
      if (bkgData.bookings) setBookingsList(bkgData.bookings);
    } catch {
      toast.error('Failed to load live availability data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute month layout
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthName = currentDate.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });

  // Number of days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Array of date strings for current month: YYYY-MM-DD
  const monthDates = useMemo(() => {
    const dates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const padM = String(month + 1).padStart(2, '0');
      const padD = String(day).padStart(2, '0');
      dates.push(`${year}-${padM}-${padD}`);
    }
    return dates;
  }, [year, month, daysInMonth]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSaveInventory = async (aptId: string) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartmentId: aptId,
          totalUnits: editingInv[aptId] ?? 5,
        }),
      });
      if (res.ok) {
        toast.success('Inventory capacity updated!');
        fetchData();
      } else {
        toast.error('Failed to update inventory');
      }
    } catch {
      toast.error('Network error saving inventory');
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockStart || !blockEnd) {
      toast.error('Please specify start and end dates');
      return;
    }
    if (blockStart >= blockEnd) {
      toast.error('Start date must precede end date');
      return;
    }

    setSubmittingBlock(true);
    const finalReason = blockReason === 'Custom Reason' ? blockCustomReason : blockReason;

    try {
      const res = await fetch('/api/availability/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartmentId: blockAptId,
          startDate: blockStart,
          endDate: blockEnd,
          reason: finalReason || 'Manual staff block',
          blockType,
          source: blockSource,
          blockedBy: currentUserName || 'Reservations Staff',
        }),
      });

      if (res.ok) {
        toast.success('Availability block placed!');
        setShowBlockModal(false);
        fetchData();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to place block');
      }
    } catch {
      toast.error('Network error creating block');
    } finally {
      setSubmittingBlock(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm('Remove this availability block?')) return;
    try {
      const res = await fetch(`/api/availability/blocks?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Block removed');
        fetchData();
      } else {
        toast.error('Failed to remove block');
      }
    } catch {
      toast.error('Network error removing block');
    }
  };

  const handleCreateRateOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateStart || !rateEnd) {
      toast.error('Please specify start and end dates');
      return;
    }
    if (rateStart >= rateEnd) {
      toast.error('Start date must precede end date');
      return;
    }

    setSubmittingRate(true);
    try {
      const res = await fetch('/api/availability/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartmentId: rateAptId,
          startDate: rateStart,
          endDate: rateEnd,
          rateUsd: rateUsd === '' ? null : Number(rateUsd),
          rateKes: rateKes === '' ? null : Number(rateKes),
          minNights: Number(rateMinNights || 1),
          label: rateLabel || 'Seasonal Rate',
          createdBy: currentUserName || 'Reservations Staff',
        }),
      });

      if (res.ok) {
        toast.success('Seasonal rate override saved!');
        setShowRateModal(false);
        fetchData();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to save rate override');
      }
    } catch {
      toast.error('Network error saving rate override');
    } finally {
      setSubmittingRate(false);
    }
  };

  const handleDeleteRateOverride = async (id: string) => {
    if (!confirm('Remove this seasonal rate override?')) return;
    try {
      const res = await fetch(`/api/availability/rates?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Rate override removed');
        fetchData();
      } else {
        toast.error('Failed to remove rate override');
      }
    } catch {
      toast.error('Network error removing rate override');
    }
  };

  // Helper to get status for an apartment on a specific date
  const getDayStatus = (aptId: string, dateStr: string) => {
    const inv = inventory.find((i) => i.id === aptId);
    const totalUnits = inv?.totalUnits ?? 5;

    // Hard blocks (apt-specific or all)
    const matchingBlocks = blocks.filter(
      (b) =>
        (b.apartmentId === aptId || b.apartmentId === 'all') &&
        dateStr >= b.startDate &&
        dateStr < b.endDate
    );
    const hasHardBlock = matchingBlocks.some((b) => b.blockType === 'hard_block' || !b.blockType);

    // Overlapping confirmed bookings
    const activeBookings = bookingsList.filter(
      (b) =>
        b.apartmentId === aptId &&
        !['cancelled', 'checked_out', 'no_show'].includes(b.bookingStatus) &&
        dateStr >= b.checkIn &&
        dateStr < b.checkOut
    );

    const bookedCount = activeBookings.length;
    const availableUnits = hasHardBlock ? 0 : Math.max(0, totalUnits - bookedCount);

    // Rate override
    const activeOverride = rateOverridesList.find(
      (ro) =>
        (ro.apartmentId === aptId || ro.apartmentId === 'all') &&
        dateStr >= ro.startDate &&
        dateStr < ro.endDate
    ) || null;

    let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (hasHardBlock) {
      badgeColor = 'bg-slate-100 text-slate-500 border-slate-300';
    } else if (availableUnits === 0) {
      badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
    } else if (availableUnits < totalUnits) {
      badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
    }

    return {
      totalUnits,
      bookedCount,
      availableUnits,
      hasHardBlock,
      matchingBlocks,
      activeBookings,
      activeOverride,
      badgeColor,
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Tabs and Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'calendar'
                ? 'bg-[#821124] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Monthly Grid</span>
          </button>

          <button
            onClick={() => setActiveTab('rates')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'rates'
                ? 'bg-[#821124] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Period Pricing ({rateOverridesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('blocks')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'blocks'
                ? 'bg-[#821124] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Date Blocks ({blocks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'bg-[#821124] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BedDouble className="w-3.5 h-3.5" />
            <span>Unit Capacity</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh availability"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setBlockStart(monthDates[0]);
              setBlockEnd(monthDates[Math.min(3, monthDates.length - 1)]);
              setShowBlockModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Lock className="w-3.5 h-3.5 text-[#821124]" />
            <span>Add Block</span>
          </button>

          <button
            onClick={() => {
              setRateStart(monthDates[0]);
              setRateEnd(monthDates[monthDates.length - 1]);
              setShowRateModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white font-semibold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Set Override Rate</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CALENDAR SWIMLANES */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-6">
          {/* Month Navigator Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="font-serif text-xl font-bold text-slate-900 tracking-tight">
                {monthName}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Legend */}
            <div className="hidden lg:flex items-center gap-4 text-[11px] font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Partially Booked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Fully Booked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span>Blocked / Hold</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#821124]" />
                <span className="text-[#821124] font-semibold">Rate Override</span>
              </div>
            </div>
          </div>

          {/* Swimlane Calendar Table */}
          <div className="overflow-x-auto scrollbar-thin border border-slate-200 rounded-2xl bg-white shadow-2xs">
            <div
              className="divide-y divide-slate-100"
              style={{ minWidth: `${200 + monthDates.length * 38}px` }}
            >
              {/* Date Header Row */}
              <div
                className="grid items-center bg-slate-50/90 py-2 text-[10px] uppercase font-bold text-slate-400 select-none"
                style={{
                  gridTemplateColumns: `200px repeat(${monthDates.length}, minmax(36px, 1fr))`,
                }}
              >
                <div className="sticky left-0 z-20 bg-slate-50/95 backdrop-blur-xs pl-4 pr-2 font-bold tracking-wider text-slate-600 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                  Apartment Tier
                </div>
                {monthDates.map((dateStr) => {
                  const d = new Date(dateStr);
                  const dayNum = d.getDate();
                  const dayLetter = d.toLocaleDateString('en-KE', { weekday: 'narrow' });
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                  return (
                    <div
                      key={dateStr}
                      className={`text-center py-0.5 border-r border-slate-100 last:border-r-0 ${
                        isWeekend ? 'text-[#821124] font-bold' : 'text-slate-600'
                      }`}
                    >
                      <div className="font-mono font-bold text-xs">{dayNum}</div>
                      <div className="text-[9px] opacity-70">{dayLetter}</div>
                    </div>
                  );
                })}
              </div>

              {/* Apartment Rows */}
              {apartments.map((apt) => {
                return (
                  <div
                    key={apt.id}
                    className="grid items-center hover:bg-slate-50/50 transition-colors"
                    style={{
                      gridTemplateColumns: `200px repeat(${monthDates.length}, minmax(36px, 1fr))`,
                    }}
                  >
                    {/* Apartment Name Column (Sticky left) */}
                    <div className="sticky left-0 z-10 bg-white hover:bg-slate-50/90 pl-4 pr-3 py-3 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.02)] truncate">
                      <span className="text-xs font-serif font-bold text-slate-900 block truncate" title={apt.name}>
                        {apt.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {editingInv[apt.id] ?? 5} units total
                      </span>
                    </div>

                    {/* Day Cells */}
                    {monthDates.map((dateStr) => {
                      const status = getDayStatus(apt.id, dateStr);
                      const isSelected =
                        cellPopover?.apartment.id === apt.id && cellPopover?.dateStr === dateStr;

                      return (
                        <div
                          key={dateStr}
                          className="p-1 border-r border-slate-100 last:border-r-0 flex items-center justify-center"
                        >
                          <button
                            type="button"
                            onClick={(e) => handleCellClick(e, apt, dateStr, status)}
                            className={`w-full h-9 rounded-lg border text-center flex flex-col justify-center items-center cursor-pointer transition-all hover:scale-105 hover:shadow-xs relative ${
                              status.badgeColor
                            } ${
                              isSelected
                                ? 'ring-2 ring-[#821124] shadow-xs'
                                : status.activeOverride
                                ? 'ring-1 ring-[#821124]'
                                : ''
                            }`}
                            title={`${apt.name} on ${dateStr}: ${status.availableUnits} free / ${status.totalUnits} total`}
                          >
                            {status.hasHardBlock ? (
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <>
                                <span className="font-mono text-xs font-bold leading-none">
                                  {status.availableUnits}
                                </span>
                                {status.activeOverride?.rateUsd && (
                                  <span className="text-[7.5px] font-mono text-[#821124] mt-0.5 leading-none font-bold">
                                    ${status.activeOverride.rateUsd}
                                  </span>
                                )}
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RATE OVERRIDES MANAGER */}
      {activeTab === 'rates' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-slate-900">
                Period Pricing &amp; Minimum Stays
              </h2>
              <p className="text-xs text-slate-500">
                Override apartment standard rates for peak holidays, events, or low-season specials.
              </p>
            </div>
            <button
              onClick={() => setShowRateModal(true)}
              className="px-4 py-2 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Rate Override</span>
            </button>
          </div>

          {rateOverridesList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <DollarSign className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
              <p className="text-sm font-semibold text-slate-900">No active rate overrides</p>
              <p className="text-xs text-slate-500">
                All dates currently use base apartment pricing. Add seasonal periods to adjust rates for peak periods.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider bg-slate-50">
                    <th className="p-3">Period Label</th>
                    <th className="p-3">Apartment</th>
                    <th className="p-3">Date Range</th>
                    <th className="p-3">Override Rate</th>
                    <th className="p-3">Min Stay</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {rateOverridesList.map((ro) => (
                    <tr key={ro.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">
                        {ro.label || 'Custom Override'}
                      </td>
                      <td className="p-3 capitalize">
                        {ro.apartmentId === 'all'
                          ? 'Property-Wide (All Suites)'
                          : apartments.find((a) => a.id === ro.apartmentId)?.name || ro.apartmentId}
                      </td>
                      <td className="p-3 font-mono text-[#821124] font-semibold">
                        {ro.startDate} → {ro.endDate}
                      </td>
                      <td className="p-3 font-mono">
                        {ro.rateUsd ? (
                          <span className="text-emerald-700 font-bold">
                            ${ro.rateUsd} USD{' '}
                            <span className="text-slate-500 text-[11px]">
                              ({ro.rateKes ? `KES ${ro.rateKes.toLocaleString()}` : ''})
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Base Rate Unchanged</span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold">
                        {ro.minNights || 1} night{ro.minNights !== 1 ? 's' : ''}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteRateOverride(ro.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete override"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DATE BLOCKS MANAGER */}
      {activeTab === 'blocks' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-slate-900">
                Date Closures &amp; Inventory Blocks
              </h2>
              <p className="text-xs text-slate-500">
                Manual reservation holds for maintenance, private charters, or external Opera reservations.
              </p>
            </div>
            <button
              onClick={() => setShowBlockModal(true)}
              className="px-4 py-2 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Block</span>
            </button>
          </div>

          {blocks.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Lock className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
              <p className="text-sm font-semibold text-slate-900">No active inventory blocks</p>
              <p className="text-xs text-slate-500">
                All physical units are open for direct booking.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider bg-slate-50">
                    <th className="p-3">Apartment</th>
                    <th className="p-3">Block Dates</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Staff / Source</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {blocks.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">
                        {b.apartmentId === 'all'
                          ? 'Property-Wide'
                          : apartments.find((a) => a.id === b.apartmentId)?.name || b.apartmentId}
                      </td>
                      <td className="p-3 font-mono text-[#821124] font-semibold">
                        {b.startDate} → {b.endDate}
                      </td>
                      <td className="p-3">{b.reason || 'Manual block'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-700">
                          {b.blockType || 'hard_block'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {b.blockedBy || b.source || 'Staff'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteBlock(b.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove block"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: UNIT CAPACITY (INVENTORY) */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-serif text-lg font-bold text-slate-900">
              Physical Unit Inventory Settings
            </h2>
            <p className="text-xs text-slate-500">
              Set the total physical rentable unit count for each apartment tier.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {apartments.map((apt) => (
              <div
                key={apt.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs"
              >
                <div>
                  <h3 className="font-serif text-base font-bold text-slate-900">{apt.name}</h3>
                  <span className="text-[10px] font-mono text-[#821124] font-semibold">ID: {apt.id}</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-600">
                    Total Rentable Units
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={editingInv[apt.id] ?? ''}
                    onChange={(e) =>
                      setEditingInv({
                        ...editingInv,
                        [apt.id]: e.target.value === '' ? '' : Math.max(1, Number(e.target.value)),
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                  <p className="text-[10px] text-slate-400">
                    The booking engine checks this capacity against confirmed reservations.
                  </p>
                </div>

                <button
                  onClick={() => handleSaveInventory(apt.id)}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Save className="w-3.5 h-3.5 text-[#821124]" />
                  <span>Save Capacity</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANCHORED CELL POPOVER */}
      {cellPopover && (
        <>
          {/* Transparent dismiss backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
            onClick={() => setCellPopover(null)}
          />

          {/* Floating In-Context Popover */}
          <div
            style={{
              top: `${cellPopover.y}px`,
              left: `${cellPopover.x}px`,
              width: '320px',
            }}
            className="fixed z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 space-y-3.5 text-slate-900 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Popover Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-[10px] font-mono text-[#821124] uppercase tracking-wider font-semibold block">
                  {new Date(cellPopover.dateStr).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <h4 className="font-serif text-sm font-bold text-slate-900 truncate max-w-[240px]">
                  {cellPopover.apartment.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setCellPopover(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Stats: Free Units & Rate */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Units Free</span>
                <span className="text-base font-mono font-bold text-emerald-700 block">
                  {cellPopover.availableUnits} / {cellPopover.totalUnits}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Rate</span>
                <span className="text-xs font-mono font-bold text-[#821124] block truncate">
                  {cellPopover.rateOverride?.rateUsd
                    ? `$${cellPopover.rateOverride.rateUsd} USD`
                    : 'Standard Rate'}
                </span>
              </div>
            </div>

            {/* Active Bookings on this date */}
            {cellPopover.activeBookings.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  Bookings ({cellPopover.activeBookings.length}):
                </span>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {cellPopover.activeBookings.map((b) => (
                    <div
                      key={b.id}
                      className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-900 truncate max-w-[170px]">{b.guestName}</span>
                      <span className="font-mono text-[9px] text-[#821124] font-bold">
                        {b.allocatedUnit || b.bookingReference}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Block if any */}
            {cellPopover.activeBlocks.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 p-2 rounded-lg text-xs space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-rose-700 block">Closure Block Active</span>
                <span className="text-rose-900 block truncate font-medium">
                  {cellPopover.activeBlocks[0].reason || 'Manual staff closure'}
                </span>
              </div>
            )}

            {/* In-Popover Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setRateAptId(cellPopover.apartment.id);
                  setRateStart(cellPopover.dateStr);
                  setRateEnd(cellPopover.dateStr);
                  setCellPopover(null);
                  setShowRateModal(true);
                }}
                className="py-1.5 px-2.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <DollarSign className="w-3 h-3" />
                <span>Override Rate</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBlockAptId(cellPopover.apartment.id);
                  setBlockStart(cellPopover.dateStr);
                  setBlockEnd(cellPopover.dateStr);
                  setCellPopover(null);
                  setShowBlockModal(true);
                }}
                className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors border border-slate-200"
              >
                <Lock className="w-3 h-3 text-[#821124]" />
                <span>Add Block</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* CREATE BLOCK MODAL */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Place Date Closure / Block
              </h3>
              <button
                onClick={() => setShowBlockModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apartment Tier
                </label>
                <select
                  value={blockAptId}
                  onChange={(e) => setBlockAptId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                >
                  <option value="all">Property-Wide (All Apartments)</option>
                  {apartments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date (Check-In)
                  </label>
                  <input
                    type="date"
                    required
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date (Check-Out)
                  </label>
                  <input
                    type="date"
                    required
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Block Reason
                </label>
                <select
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                >
                  {BLOCK_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {blockReason === 'Custom Reason' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custom Reason Details
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Specify reason..."
                    value={blockCustomReason}
                    onChange={(e) => setBlockCustomReason(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Block Type
                  </label>
                  <select
                    value={blockType}
                    onChange={(e) => setBlockType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  >
                    <option value="hard_block">Hard Block (Close Sales)</option>
                    <option value="rate_hold">Rate Hold (Waitlist / Special)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Booking Source
                  </label>
                  <select
                    value={blockSource}
                    onChange={(e) => setBlockSource(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  >
                    <option value="direct">Direct Property Block</option>
                    <option value="opera">Opera PMS Hold</option>
                    <option value="upperbooking">UpperBooking / OTA Channel</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBlock}
                  className="px-5 py-2 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingBlock ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirm Block</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE RATE OVERRIDE MODAL */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Set Seasonal Rate Override
              </h3>
              <button
                onClick={() => setShowRateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRateOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apartment Tier
                </label>
                <select
                  value={rateAptId}
                  onChange={(e) => setRateAptId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                >
                  <option value="all">Property-Wide (All Apartments)</option>
                  {apartments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Period / Season Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Christmas 2026 Peak, Easter Weekend"
                  value={rateLabel}
                  onChange={(e) => setRateLabel(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={rateStart}
                    onChange={(e) => setRateStart(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={rateEnd}
                    onChange={(e) => setRateEnd(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Rate (USD)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={rateUsd}
                    onChange={(e) => setRateUsd(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Rate (KES)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={rateKes}
                    onChange={(e) => setRateKes(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Min Nights
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={rateMinNights ?? ''}
                    onChange={(e) => setRateMinNights(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                When a guest selects dates overlapping this period, the booking engine will quote this override rate and enforce the minimum stay requirement.
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRate}
                  className="px-5 py-2 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingRate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Set Override</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
