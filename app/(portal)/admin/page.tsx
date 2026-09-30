'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, Users, Calendar, Sparkles, Tag, DollarSign, 
  ArrowRight, ShieldCheck, CheckCircle2, Clock, Bell, Hotel, Car, Layers 
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pendingInquiries: 0,
    bookedInquiries: 0,
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

      setStats({
        pendingInquiries: inqs.filter((i: any) => i.status === 'Pending' || i.status === 'new' || i.status === 'inquiry').length,
        bookedInquiries: inqs.filter((i: any) => i.status === 'Booked' || i.status === 'confirmed').length,
        activeEvents: evts.length,
        activePackages: pkgs.length,
      });
    });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Website Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct guest inquiry tracking, live site content management, and lifestyle experiences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/events"
            className="px-3.5 py-2 rounded-lg bg-[#821124] hover:bg-[#6b0d1d] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </Link>
          <Link
            href="/admin/packages"
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Tag className="w-3.5 h-3.5 text-[#821124]" />
            <span>Meal Plans</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Confirmed Direct</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
            {stats.bookedInquiries}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold">Converted to Booking</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Inquiries</span>
            <Bell className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
            {stats.pendingInquiries}
          </div>
          <Link href="/admin/inquiries" className="text-[10px] text-[#821124] hover:underline font-medium">
            Requires Follow-up →
          </Link>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Events</span>
            <Sparkles className="w-4 h-4 text-[#821124]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
            {stats.activeEvents}
          </div>
          <Link href="/admin/events" className="text-[10px] text-[#821124] hover:underline font-medium">
            Village &amp; Dhow Happenings →
          </Link>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Curated Meal Plans</span>
            <Tag className="w-4 h-4 text-[#821124]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
            {stats.activePackages}
          </div>
          <Link href="/admin/packages" className="text-[10px] text-[#821124] hover:underline font-medium">
            Tiers &amp; Pricing →
          </Link>
        </div>
      </div>

      {/* Two Column Grid: Recent Inquiries + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Inquiries List */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-serif text-base font-bold text-slate-900">
              Recent Website Inquiries
            </h3>
            <Link href="/admin/inquiries" className="text-xs text-[#821124] hover:underline font-medium">
              View All ({inquiries.length})
            </Link>
          </div>

          <div className="divide-y divide-slate-100 space-y-2">
            {inquiries.slice(0, 5).map((inq) => {
              const name = inq.payload?.name || inq.guest_name || 'Website Guest';
              const checkIn = inq.payload?.checkIn || inq.check_in || 'Flexible';
              const checkOut = inq.payload?.checkOut || inq.check_out || 'Flexible';
              const suite = inq.payload?.apartmentName || inq.apartment_id || 'Suite Inquiry';
              const status = inq.status || 'Pending';
              
              return (
                <div key={inq.id} className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block">{name}</span>
                    <span className="text-slate-500 text-[11px]">
                      {checkIn} → {checkOut} • {suite}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      status === 'Booked' || status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      status === 'Offer Sent' || status === 'quote_sent' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {status}
                    </span>
                  </div>
                </div>
              );
            })}

            {inquiries.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">
                No inquiries lodged yet. Direct web inquiries will appear here automatically.
              </p>
            )}
          </div>
        </div>

        {/* Quick Launchpad */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-serif text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Operational Shortcuts
          </h3>

          <div className="space-y-2">
            <Link
              href="/admin/inquiries"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-[#821124]" />
                <span className="font-medium text-slate-800">Inquiry &amp; Quote Pipeline</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              href="/admin/apartments"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-[#821124]" />
                <span className="font-medium text-slate-800">Manage Suites &amp; Rates</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              href="/admin/dining"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#821124]" />
                <span className="font-medium text-slate-800">Tamarind Dhow &amp; Menus</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              href="/admin/transfers"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Car className="w-4 h-4 text-[#821124]" />
                <span className="font-medium text-slate-800">VIP Transfers &amp; Chauffeurs</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              href="/admin/hero"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#821124]" />
                <span className="font-medium text-slate-800">Hero &amp; Seasonal Campaigns</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
