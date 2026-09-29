'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, Users, Calendar, Sparkles, Tag, DollarSign, 
  ArrowRight, ShieldCheck, CheckCircle2, Clock, Bell, Hotel 
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [stats, setStats] = useState({
    occupancyRate: 84,
    todayArrivals: 6,
    activeStays: 24,
    pendingInquiries: 0,
    activeEvents: 0,
    activePackages: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/inquiries').then(r => r.json()).catch(() => ({})),
      fetch('/api/events').then(r => r.json()).catch(() => ({})),
      fetch('/api/packages').then(r => r.json()).catch(() => ({})),
    ]).then(([inqData, evtData, pkgData]) => {
      const inqs = inqData.inquiries || [];
      const evts = evtData.events || [];
      const pkgs = pkgData.packages || [];
      
      setInquiries(inqs);
      setEvents(evts);
      setPackages(pkgs);

      setStats(prev => ({
        ...prev,
        pendingInquiries: inqs.filter((i: any) => i.status === 'new' || i.status === 'inquiry').length,
        activeEvents: evts.length,
        activePackages: pkgs.length,
      }));
    });
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Operations &amp; Lifestyle Dashboard
          </h1>
          <p className="text-xs text-white/60 mt-1">
            Real-time management for Tamarind Village accommodations, dining, dhow cruises, and lifestyle packages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/events"
            className="px-4 py-2 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Add Event</span>
          </Link>
          <Link
            href="/admin/packages"
            className="px-4 py-2 rounded-xl bg-[#C59B27] hover:bg-[#a5811e] text-[#1F1615] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>New Package</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1F1615] p-5 rounded-2xl border border-[#C59B27]/25 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">Occupancy</span>
            <Hotel className="w-4 h-4 text-[#C59B27]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-white">
            {stats.occupancyRate}%
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">Harbour Suites High Demand</span>
        </div>

        <div className="bg-[#1F1615] p-5 rounded-2xl border border-[#C59B27]/25 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">Pending Inquiries</span>
            <Bell className="w-4 h-4 text-[#821124]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-white">
            {stats.pendingInquiries}
          </div>
          <Link href="/admin/inquiries" className="text-[10px] text-[#C59B27] hover:underline">
            Requires Quotes / Review →
          </Link>
        </div>

        <div className="bg-[#1F1615] p-5 rounded-2xl border border-[#C59B27]/25 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">Active Events</span>
            <Sparkles className="w-4 h-4 text-[#C59B27]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-white">
            {stats.activeEvents}
          </div>
          <Link href="/admin/events" className="text-[10px] text-[#C59B27] hover:underline">
            Village &amp; Dhow Happenings →
          </Link>
        </div>

        <div className="bg-[#1F1615] p-5 rounded-2xl border border-[#C59B27]/25 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">Curated Packages</span>
            <Tag className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-white">
            {stats.activePackages}
          </div>
          <Link href="/admin/packages" className="text-[10px] text-[#C59B27] hover:underline">
            Honeymoon, Dhow, &amp; Retreats →
          </Link>
        </div>
      </div>

      {/* Two Column Grid: Recent Inquiries + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Inquiries List */}
        <div className="lg:col-span-2 bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="font-serif text-lg font-bold text-white">
              Recent Guest Inquiries &amp; Bookings
            </h3>
            <Link href="/admin/inquiries" className="text-xs text-[#C59B27] hover:underline font-medium">
              View All ({inquiries.length})
            </Link>
          </div>

          <div className="divide-y divide-white/5 space-y-2">
            {inquiries.slice(0, 5).map((inq) => (
              <div key={inq.id} className="pt-2 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">{inq.guest_name}</span>
                  <span className="text-white/50 text-[11px]">
                    {inq.check_in} → {inq.check_out} • {inq.apartment_id}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    inq.status === 'confirmed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                    inq.status === 'quote_sent' ? 'bg-blue-950 text-blue-400 border border-blue-500/30' :
                    'bg-amber-950 text-amber-400 border border-amber-500/30'
                  }`}>
                    {inq.status}
                  </span>
                </div>
              </div>
            ))}

            {inquiries.length === 0 && (
              <p className="text-xs text-white/50 py-4 text-center">
                No inquiries lodged yet. Direct web bookings will stream here automatically.
              </p>
            )}
          </div>
        </div>

        {/* Quick Launchpad */}
        <div className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 shadow-lg space-y-4">
          <h3 className="font-serif text-lg font-bold text-white border-b border-white/10 pb-4">
            Operational Shortcuts
          </h3>

          <div className="space-y-2.5">
            <Link
              href="/admin/frontdesk"
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Hotel className="w-4 h-4 text-[#C59B27]" />
                <span className="font-medium text-white">Front Desk Daily Ledger</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-white/40" />
            </Link>

            <Link
              href="/admin/apartments"
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-[#C59B27]" />
                <span className="font-medium text-white">Manage Suites &amp; Rates</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-white/40" />
            </Link>

            <Link
              href="/admin/dining"
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#C59B27]" />
                <span className="font-medium text-white">Tamarind Dhow &amp; Menus</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-white/40" />
            </Link>

            <Link
              href="/admin/pricing"
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="font-medium text-white">Dynamic Pricing Multiplier</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-white/40" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
