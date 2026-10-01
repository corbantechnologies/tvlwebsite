'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, Calendar, DollarSign, 
  CheckCircle2, Bell, Hotel, Clock, ArrowUpRight, RotateCw, Filter, Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsAnalyticsPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inqRes, bkgRes] = await Promise.all([
        fetch('/api/inquiries'),
        fetch('/api/bookings')
      ]);
      const inqData = await inqRes.json();
      const bkgData = await bkgRes.json();

      setInquiries(inqData.inquiries || []);
      setBookings(bkgData.bookings || []);
    } catch {
      toast.error('Failed to load reporting data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute key analytics
  const totalInquiries = inquiries.length;
  const bookedInquiries = inquiries.filter(i => i.status === 'Booked' || i.status === 'confirmed').length;
  const pendingInquiries = inquiries.filter(i => i.status === 'Pending').length;
  const offerSentInquiries = inquiries.filter(i => i.status === 'Offer Sent').length;
  const contactedInquiries = inquiries.filter(i => i.status === 'Contacted').length;
  const declinedInquiries = inquiries.filter(i => i.status === 'Declined').length;

  const conversionRate = totalInquiries > 0 
    ? ((bookedInquiries / totalInquiries) * 100).toFixed(1) 
    : '0.0';

  const totalRevenueKES = bookings.reduce((sum, b) => {
    const amt = Number(b.totalAmount || 0);
    return sum + (b.currency === 'KES' ? amt : amt * 128.5);
  }, 0);

  const totalRevenueUSD = bookings.reduce((sum, b) => {
    const amt = Number(b.totalAmount || 0);
    return sum + (b.currency === 'USD' ? amt : amt / 128.5);
  }, 0);

  // Group inquiries by type
  const typeCounts: Record<string, number> = {};
  inquiries.forEach(i => {
    const t = i.type || i.payload?.type || 'Suite Reservation';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#821124] font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-3.5 h-3.5" /> Performance &amp; Conversion Analytics
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Website Inquiries &amp; Direct Revenue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of direct guest inquiries, staff quote conversion rates, and captured booking volume.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Operational Scope Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
            <Hotel className="w-5 h-5 text-[#821124]" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Direct Website Inquiries vs. Opera PMS
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              This analytics engine tracks direct leads generated via tamarindvillage.co.ke. Once inquiries are confirmed and rooms are allocated, reservations staff transfer the confirmed details into Opera PMS.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Web Inquiries</span>
            <Bell className="w-4 h-4 text-[#821124]" />
          </div>
          <div className="text-3xl font-serif font-bold text-slate-900">
            {totalInquiries}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Direct guest requests received</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Confirmed Bookings</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-serif font-bold text-emerald-700">
            {bookedInquiries}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium block mt-1">Converted into confirmed stays</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Lead Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-[#821124]" />
          </div>
          <div className="text-3xl font-serif font-bold text-slate-900">
            {conversionRate}%
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Inquiry to confirmed booking</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Captured Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-slate-900 font-mono">
            KES {Math.round(totalRevenueKES).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">~ ${Math.round(totalRevenueUSD).toLocaleString()} USD total</span>
        </div>
      </div>

      {/* Two Column Layout: Pipeline Breakdown + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Status Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>Inquiry Pipeline Stages</span>
            <span className="text-xs font-mono text-slate-400">{totalInquiries} total</span>
          </h3>

          <div className="space-y-3 pt-2">
            {[
              { label: 'Pending (Awaiting Initial Review)', count: pendingInquiries, color: 'bg-amber-500' },
              { label: 'Contacted (Staff in Communication)', count: contactedInquiries, color: 'bg-sky-500' },
              { label: 'Offer Sent (Quoted & Link Shared)', count: offerSentInquiries, color: 'bg-blue-500' },
              { label: 'Booked / Confirmed', count: bookedInquiries, color: 'bg-emerald-500' },
              { label: 'Declined / Unavailable', count: declinedInquiries, color: 'bg-slate-400' },
            ].map(stage => {
              const pct = totalInquiries > 0 ? (stage.count / totalInquiries) * 100 : 0;
              return (
                <div key={stage.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-medium">{stage.label}</span>
                    <span className="font-mono text-slate-900 font-bold">{stage.count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Category Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Inquiries by Experience Category
          </h3>

          <div className="space-y-3 pt-2">
            {Object.keys(typeCounts).length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No inquiry categories recorded yet.</p>
            ) : (
              Object.entries(typeCounts).map(([type, count]) => {
                const pct = totalInquiries > 0 ? (count / totalInquiries) * 100 : 0;
                return (
                  <div key={type} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-[#821124]" />
                      <span className="font-medium text-slate-900 capitalize">{type}</span>
                    </div>
                    <span className="font-mono text-[#821124] font-bold">
                      {count} inquiries ({pct.toFixed(0)}%)
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
