'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, Hotel, Calendar, Bell, Building2, UtensilsCrossed, 
  Sparkles, Tag, Car, DollarSign, Users, Activity, Layers, 
  ArrowRight, CheckCircle2, ShieldCheck, Key, Compass, Search,
  ExternalLink, HelpCircle, ChevronRight, Info
} from 'lucide-react';

export default function AdminGuidePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'operations' | 'lifestyle' | 'pricing' | 'roles'>('overview');

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1F1615] via-[#2A181A] to-[#1F1615] p-6 sm:p-8 rounded-3xl border border-[#C59B27]/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#821124]/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C59B27]/20 border border-[#C59B27]/30 text-[#C59B27] text-xs font-semibold tracking-wider uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tamarind Portal Operational Manual</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Admin Guide &amp; Platform Navigation
          </h1>

          <p className="text-sm text-white/80 max-w-3xl leading-relaxed font-light">
            Welcome to the centralized management system for Tamarind Village Mombasa. This guide explains how to manage front desk operations, convert guest inquiries into confirmed stays, publish village &amp; dhow events, curate multi-tier packages, and configure dynamic revenue multipliers.
          </p>

          {/* Quick tab switcher */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#821124] text-white shadow-md'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              System Overview
            </button>
            <button
              onClick={() => setActiveTab('operations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'operations'
                  ? 'bg-[#821124] text-white shadow-md'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              Desk &amp; Inquiries
            </button>
            <button
              onClick={() => setActiveTab('lifestyle')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'lifestyle'
                  ? 'bg-[#821124] text-white shadow-md'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              Events &amp; Packages
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'pricing'
                  ? 'bg-[#821124] text-white shadow-md'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              Suites &amp; Pricing
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-[#821124] text-white shadow-md'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              Staff Roles &amp; Security
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: System Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#821124]/20 text-[#821124] flex items-center justify-center">
                <Hotel className="w-5 h-5 text-[#C59B27]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white">Next.js 16 App Router</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Modern high-performance web architecture combining server-rendered marketing pages with an edge-guarded staff portal.
              </p>
            </div>

            <div className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white">Drizzle + PostgreSQL</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Self-healing database layer. Tables and starter records automatically initialize upon first connection without manual scripts.
              </p>
            </div>

            <div className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white">proxy.ts Edge Guard</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Next.js 16 Edge proxy intercepts all <code className="text-[#C59B27]">/admin/*</code> routes, verifying cryptographically signed JWT cookies.
              </p>
            </div>
          </div>

          {/* Quick Shortcuts Map */}
          <div className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 space-y-4">
            <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#C59B27]" /> Platform Architecture &amp; Map
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                <span className="font-bold text-[#C59B27] block">Public Marketing Suite</span>
                <span className="text-white/60">Homepage, Accommodations, Dining &amp; Dhow, Events, Packages, Transfers, and Live Guest Tracker.</span>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                <span className="font-bold text-[#C59B27] block">Operations Hub</span>
                <span className="text-white/60">Daily Front Desk arrivals &amp; departures, Master Bookings ledger, and Guest Inquiries inbox.</span>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                <span className="font-bold text-[#C59B27] block">Lifestyle Engine</span>
                <span className="text-white/60">Incoming Village, Restaurant, and Dhow events publisher, plus multi-tier packages creator.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Desk & Inquiries */}
      {activeTab === 'operations' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Front Desk Flow */}
          <div className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-white">Front Desk Daily Ledger</h3>
                <span className="text-xs text-[#C59B27]">Managing Arrivals, Departures, and In-House VIPs</span>
              </div>
              <Link
                href="/admin/frontdesk"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
              >
                <span>Open Front Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <ol className="space-y-3 text-xs text-white/80 list-decimal list-inside leading-relaxed">
              <li>
                <strong className="text-white">Reviewing Today's Arrivals:</strong> Switch between the <em>Arrivals</em>, <em>Departures</em>, and <em>In-House</em> tabs to see guest arrivals, flight tracking, and assigned suites.
              </li>
              <li>
                <strong className="text-white">Confirming Check-In:</strong> Click <code className="bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded">Confirm Check-In</code> to update the room status and assign active keycards.
              </li>
              <li>
                <strong className="text-white">VIP Guest Notes:</strong> Review dietary notes, special anniversary requests, and scheduled Dhow cruises linked to the reservation.
              </li>
            </ol>
          </div>

          {/* Inquiries & Quoting Flow */}
          <div className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-white">Guest Inquiries &amp; Quotation Engine</h3>
                <span className="text-xs text-[#C59B27]">Converting Web Inquiries to Locked-In Stays</span>
              </div>
              <Link
                href="/admin/inquiries"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
              >
                <span>Open Inquiries</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-white/80">
              <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2">
                <span className="font-bold text-white block text-sm">Step 1: Inbound Web Request</span>
                <p>
                  When a guest submits a reservation request on the website, an inquiry record is created with a unique token (e.g. <code className="text-[#C59B27]">tv_guest_9b2d...</code>).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2">
                <span className="font-bold text-white block text-sm">Step 2: Issuing a Quote</span>
                <p>
                  Select the inquiry from the list, input the total calculated quote in KES, add any notes, and click <code className="bg-[#821124] text-white px-1 py-0.5 rounded">Update &amp; Lock-In Quote</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2">
                <span className="font-bold text-white block text-sm">Step 3: Sharing Tracking Link</span>
                <p>
                  Click <em>Copy Guest Tracking Link</em> to send the direct link to the guest via WhatsApp or Email. When opened, the guest sees their live status, dates, and quoted rate.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2">
                <span className="font-bold text-white block text-sm">Step 4: Confirmation</span>
                <p>
                  Once payment is received, mark status as <strong className="text-emerald-400">Confirmed</strong> to automatically provision a reservation code in the Bookings Ledger.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Lifestyle (Events & Packages) */}
      {activeTab === 'lifestyle' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Events Manager */}
          <div className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-white">Village &amp; Dhow Events Platform</h3>
                <span className="text-xs text-[#C59B27]">Publishing Theme Nights, Dhow Cruises &amp; Feasts</span>
              </div>
              <Link
                href="/admin/events"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
              >
                <span>Manage Events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Tamarind Village is an all-round lifestyle resort. You can publish happenings across three primary venues:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                <span className="font-bold text-[#821124] block">Tamarind Dhow</span>
                <span className="text-white/60">Sunset live jazz cruises, full-moon dinner charters, romantic Tudor Creek sailing.</span>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                <span className="font-bold text-[#821124] block">Tamarind Restaurant</span>
                <span className="text-white/60">Clifftop wine pairings, Mangrove crab tastings, guest chef collaborations.</span>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                <span className="font-bold text-[#821124] block">Village Clifftop &amp; Pool</span>
                <span className="text-white/60">Poolside sunset cocktails, Swahili barbecue nights, cultural evenings.</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#821124]/10 border border-[#821124]/30 text-xs text-white/80 space-y-1">
              <span className="font-bold text-[#C59B27] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Publishing Pro-Tip:
              </span>
              <p>
                When you create an event in <Link href="/admin/events" className="underline font-semibold">/admin/events</Link>, it immediately updates the dynamic homepage showcase, the dedicated public <Link href="/events" className="underline font-semibold">/events</Link> calendar, and the dining experience cards without needing any server restart.
              </p>
            </div>
          </div>

          {/* Packages Manager */}
          <div className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-white">Robust Multi-Tier Packages Engine</h3>
                <span className="text-xs text-[#C59B27]">Creating Bundled Stays, Honeymoons &amp; Retreats</span>
              </div>
              <Link
                href="/admin/packages"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
              >
                <span>Manage Packages</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <ol className="space-y-3 text-xs text-white/80 list-decimal list-inside leading-relaxed">
              <li>
                <strong className="text-white">Tier Selection:</strong> Categorize packages under <em>Signature</em>, <em>Luxury</em>, <em>Executive</em>, or <em>Seasonal</em>.
              </li>
              <li>
                <strong className="text-white">Dynamic Inclusions:</strong> Add or remove individual inclusions (e.g. <em>Chilled Moët Champagne</em>, <em>Private Sunset Dhow Cruise</em>, <em>Executive Airport Chauffeur</em>). Guests see these formatted with luxury checkmarks on the site.
              </li>
              <li>
                <strong className="text-white">Featured Badge:</strong> Toggle <em>Featured</em> to display the package with the distinctive gold ring and top highlight badge on the marketing landing page.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* TAB 4: Suites & Pricing */}
      {activeTab === 'pricing' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-white">Dynamic Pricing &amp; Revenue Multiplier</h3>
                <span className="text-xs text-[#C59B27]">Configuring Seasonal Factors &amp; Pegged Exchange Rates</span>
              </div>
              <Link
                href="/admin/pricing"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
              >
                <span>Open Pricing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-white/80">
              <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                <span className="font-bold text-white block">Markup Multiplier</span>
                <p>
                  Acts as a global yield factor across all suites. Setting this to <code className="text-[#C59B27]">1.10</code> automatically increases all starting rates by 10% during high-demand periods without altering individual base suite rates.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                <span className="font-bold text-white block">Seasonal Factors</span>
                <p>
                  Switch between <em>Low Season</em>, <em>Regular</em>, and <em>Peak Season</em> (December/Easter). The platform adjusts promotional badges and package availability accordingly.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                <span className="font-bold text-white block">Tax &amp; Tourism Levy</span>
                <p>
                  Specifies the applicable Catering Levy and VAT percentage added to final booking quotes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                <span className="font-bold text-white block">USD/KES Currency Peg</span>
                <p>
                  Calculates real-time USD equivalent prices for international travelers viewing the booking engine.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Staff Roles & Security */}
      {activeTab === 'roles' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-white">Staff Roles &amp; Permissions Matrix</h3>
                <span className="text-xs text-[#C59B27]">Role-Based Access Control via Edge Proxy</span>
              </div>
              <Link
                href="/admin/team"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
              >
                <span>Manage Staff</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/40 text-[#C59B27] uppercase text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Role Clearance</th>
                    <th className="py-3 px-4">Default Profile</th>
                    <th className="py-3 px-4">Operational Capabilities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#821124]">admin</td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">admin@tamarind.co.ke</td>
                    <td className="py-3.5 px-4">Full unrestricted access: Pricing, Team provision, Database logs, Settings.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-purple-400">gm</td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">gm@tamarind.co.ke</td>
                    <td className="py-3.5 px-4">Executive overview, Revenue pricing, Event authoring, Master Bookings ledger.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-blue-400">reservations</td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">reservations@tamarind.co.ke</td>
                    <td className="py-3.5 px-4">Inquiry quotation engine, Package bookings, Voucher generation, Guest tracking links.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">frontdesk</td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">frontdesk@tamarind.co.ke</td>
                    <td className="py-3.5 px-4">Daily arrivals/departures, Room readiness check, In-house guest services, VIP keycards.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
