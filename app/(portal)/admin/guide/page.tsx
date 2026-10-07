'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, Hotel, Calendar, Bell, Building2, UtensilsCrossed, 
  Sparkles, Tag, Car, DollarSign, Users, Activity, Layers, 
  ArrowRight, CheckCircle2, ShieldCheck, Key, Compass, Search,
  ExternalLink, HelpCircle, ChevronRight, Info,
  QrCode, ClipboardList, Ticket, Lock, CreditCard
} from 'lucide-react';

export default function AdminGuidePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'operations' | 'lifestyle' | 'pricing' | 'roles'>('overview');

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[#821124] text-xs font-bold tracking-wider uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tamarind Portal Operational Manual</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Admin Guide &amp; Platform Navigation
          </h1>

          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed font-normal">
            Welcome to the centralized management system for Tamarind Village Mombasa. This guide explains how to manage front desk operations, convert guest inquiries into confirmed stays, publish village &amp; dhow events, curate multi-tier packages, and configure dynamic revenue multipliers.
          </p>

          {/* Quick tab switcher */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#821124] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              System Overview
            </button>
            <button
              onClick={() => setActiveTab('operations')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'operations'
                  ? 'bg-[#821124] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              Desk &amp; Inquiries
            </button>
            <button
              onClick={() => setActiveTab('lifestyle')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'lifestyle'
                  ? 'bg-[#821124] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              Events &amp; Packages
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'pricing'
                  ? 'bg-[#821124] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              Suites &amp; Pricing
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-[#821124] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
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
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#821124] flex items-center justify-center">
                <Hotel className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Next.js 16 App Router</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Modern high-performance web architecture combining server-rendered marketing pages with an edge-guarded staff portal.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Data &amp; Storage</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All guest inquiries, bookings, content, and settings are stored securely in a managed cloud database. Everything is backed up automatically.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Live Rate Feed</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Next.js 16 Edge proxy intercepts all <code className="text-[#821124] font-semibold">/admin/*</code> routes, verifying cryptographically signed JWT cookies.
              </p>
            </div>
          </div>

          {/* Quick Shortcuts Map */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#821124]" /> Platform Architecture &amp; Map
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-[#821124] block">Public Marketing Suite</span>
                <span className="text-slate-600">Homepage, Accommodations, Dining &amp; Dhow, Events, Packages, Transfers, and Live Guest Tracker.</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-[#821124] block">Operations Hub</span>
                <span className="text-slate-600">Daily Front Desk arrivals &amp; departures, Master Bookings ledger, and Guest Inquiries inbox.</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-[#821124] block">Lifestyle Engine</span>
                <span className="text-slate-600">Incoming Village, Restaurant, and Dhow events publisher, plus multi-tier packages creator.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Desk & Inquiries */}
      {activeTab === 'operations' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Front Desk Flow */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">Front Desk Daily Ledger</h3>
                <span className="text-xs text-[#821124] font-medium">Managing Arrivals, Departures, and In-House VIPs</span>
              </div>
              <Link
                href="/admin/frontdesk"
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold uppercase transition-colors flex items-center gap-1.5 border border-slate-200"
              >
                <span>Open Front Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <ol className="space-y-3 text-xs text-slate-700 list-decimal list-inside leading-relaxed">
              <li>
                <strong className="text-slate-900">Reviewing Today's Arrivals:</strong> Switch between the <em>Arrivals</em>, <em>Departures</em>, and <em>In-House</em> tabs to see guest arrivals, flight tracking, and assigned suites.
              </li>
              <li>
                <strong className="text-slate-900">Confirming Check-In:</strong> Click <code className="bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded border border-emerald-200">Confirm Check-In</code> to update the room status and assign active keycards.
              </li>
              <li>
                <strong className="text-slate-900">VIP Guest Notes:</strong> Review dietary notes, special anniversary requests, and scheduled Dhow cruises linked to the reservation.
              </li>
            </ol>
          </div>

          {/* Inquiries & Quoting Flow */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">Guest Inquiries &amp; Quotation Engine</h3>
                <span className="text-xs text-[#821124] font-medium">Converting Web Inquiries to Locked-In Stays</span>
              </div>
              <Link
                href="/admin/inquiries"
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold uppercase transition-colors flex items-center gap-1.5 border border-slate-200"
              >
                <span>Open Inquiries</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-sm">Step 1: Inbound Web Request</span>
                <p className="text-slate-600">
                  When a guest submits a reservation request on the website, an inquiry record is created with a unique token (e.g. <code className="text-[#821124]">tv_guest_9b2d...</code>).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-sm">Step 2: Issuing a Quote</span>
                <p className="text-slate-600">
                  Select the inquiry from the list, input the total calculated quote in KES, add any notes, and click <code className="bg-[#821124] text-white px-1 py-0.5 rounded">Save Quote &amp; Notes</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-sm">Step 3: Sharing Tracking Link</span>
                <p className="text-slate-600">
                  Click <em>Copy Guest Tracking Link</em> to send the direct link to the guest via WhatsApp or Email. When opened, the guest sees their live status, dates, and quoted rate.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-sm">Step 4: Confirmation</span>
                <p className="text-slate-600">
                  Once payment is received, convert inquiry to <strong className="text-emerald-700">Confirmed Booking</strong> to automatically provision a reservation code in the Bookings Ledger.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Lifestyle (Events & Packages) */}
      {activeTab === 'lifestyle' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Events Manager & Lifecycle */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">Village &amp; Dhow Events Platform</h3>
                <span className="text-xs text-[#821124] font-medium">Publishing Theme Nights, Dhow Cruises, Galas &amp; Feasts</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/events"
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold uppercase transition-colors flex items-center gap-1.5 border border-slate-200"
                >
                  <span>Events Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/admin/events/ledger"
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#821124] text-xs font-semibold uppercase transition-colors flex items-center gap-1.5 border border-rose-200"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Hosting Ledger</span>
                </Link>
                <Link
                  href="/admin/events/checkin"
                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold uppercase transition-colors flex items-center gap-1.5 border border-amber-200"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-700" />
                  <span>Gate Scanner</span>
                </Link>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tamarind Village is an all-round lifestyle resort. You can publish happenings across multiple venues with automated online ticketing, gate validation, and direct bank settlement:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-[#821124] block">Tamarind Dhow</span>
                <span className="text-slate-600">Sunset live jazz cruises, full-moon dinner charters, romantic Tudor Creek sailing.</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-[#821124] block">Tamarind Restaurant</span>
                <span className="text-slate-600">Clifftop wine pairings, Mangrove crab tastings, guest chef collaborations.</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-[#821124] block">Village Clifftop &amp; Pool</span>
                <span className="text-slate-600">Poolside sunset cocktails, Swahili barbecue nights, cultural evenings.</span>
              </div>
            </div>

            {/* Event Status & Visibility Rules */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <Info className="w-4 h-4 text-[#821124]" />
                Event Lifecycle &amp; Status Controls
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-slate-600">
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active Status (<code className="text-slate-800 text-[11px]">isActive / is_active</code>)</span>
                  </span>
                  <p>
                    Determines whether the event is visible to guests on the public website and dynamic calendar. If toggled off, the event is immediately hidden from the public while remaining visible to staff in the admin hub.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5 text-[#821124]" />
                    <span>Direct Ticketing (<code className="text-slate-800 text-[11px]">paymentEnabled / payment_enabled</code>)</span>
                  </span>
                  <p>
                    Controls whether live online ticket purchases through Paystack are currently open. When enabled, guests can purchase tickets directly with credit card or M-Pesa. When disabled, the public button displays an RSVP / Contact concierge prompt.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Event Hosting Desk Ledger */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#821124]" />
                  <span>Event Hosting Desk Ledger</span>
                </h3>
                <span className="text-xs text-[#821124] font-medium">Real-Time Attendee Tracking, Revenue Metrics &amp; VIP Admissions</span>
              </div>
              <Link
                href="/admin/events/ledger"
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold uppercase transition-colors flex items-center gap-1.5 border border-slate-200"
              >
                <span>Open Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-sm">Active Event Dropdown &amp; &quot;All Experiences &amp; Galas&quot;</span>
                <p className="text-slate-600 leading-relaxed">
                  The <strong className="text-slate-900">&quot;Active Event&quot;</strong> selector at the top defaults to <code className="text-[#821124] bg-rose-50 px-1 py-0.5 rounded font-semibold">All Experiences &amp; Galas</code>. This aggregates statistics, ticket sales, and admissions across every event in the resort. Selecting a specific event filters the ledger, capacity gauges, and CSV export exclusively to that celebration.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-sm">Real-Time Capacity &amp; Revenue Gauges</span>
                <p className="text-slate-600 leading-relaxed">
                  Monitors total tickets sold against maximum venue capacity, real-time Paystack revenue collected, and live gate arrivals. Helps operations know exactly how many guests have entered and how many are still expected.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-sm">Issuing VIP &amp; Complimentary Passes</span>
                <p className="text-slate-600 leading-relaxed">
                  Staff can click <strong className="text-[#821124]">+ Issue VIP Pass</strong> to provision complimentary or press passes for special dignitaries or performers. VIP passes generate valid QR tokens and barcode references without requiring payment.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-sm">Instant CSV Export</span>
                <p className="text-slate-600 leading-relaxed">
                  Click <strong className="text-slate-800">Export CSV</strong> to download a complete manifest containing attendee names, emails, phone numbers, ticket reference codes, amounts paid, and gate check-in status.
                </p>
              </div>
            </div>
          </div>

          {/* Gate Scanner Terminal & PIN Security */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-600" />
                  <span>Gate Entrance Terminal &amp; Scanner PINs</span>
                </h3>
                <span className="text-xs text-amber-700 font-medium">Entrance Stewards, QR Barcode Scanners &amp; Anti-Fraud Protection</span>
              </div>
              <Link
                href="/admin/events/checkin"
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold uppercase transition-colors flex items-center gap-1.5 border border-amber-200"
              >
                <span>Launch Scanner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 text-slate-700 space-y-2">
                <span className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                  <Lock className="w-4 h-4 text-amber-700" />
                  Who Creates Gate Lock PINs?
                </span>
                <p className="leading-relaxed">
                  Gate lock PINs are created and configured by <strong className="text-slate-900">Admins / Event Hosts</strong> in the <Link href="/admin/events" className="underline font-semibold text-[#821124]">Events Hub (/admin/events)</Link>. When creating or editing any event, you will find the <strong className="text-slate-900">&quot;Gate Check-in PIN&quot;</strong> field (defaults to <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold text-slate-900">2026</code>). Each event can have its own distinct 4-digit PIN for security.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block text-sm">Distributing Scanner Links to Stewards</span>
                  <p className="text-slate-600 leading-relaxed">
                    Gate stewards and security personnel do not need admin access. Simply share either of these URLs:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li><strong className="text-slate-800">General Scanner URL:</strong> <code className="bg-white border px-1.5 py-0.5 rounded font-mono text-[11px] text-[#821124]">/admin/events/checkin</code></li>
                    <li><strong className="text-slate-800">Event-Specific URL:</strong> <code className="bg-white border px-1.5 py-0.5 rounded font-mono text-[11px] text-[#821124]">/admin/events/checkin?eventId=YOUR_EVENT_ID</code> (or click &quot;Open Gate Scanner&quot; directly on the ledger)</li>
                  </ul>
                  <p className="text-slate-500 text-[11px]">
                    Upon opening the page, the steward enters their name and the 4-digit Gate PIN to arm the scanner.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block text-sm">Anti-Fraud &amp; Hardware Compatibility</span>
                  <p className="text-slate-600 leading-relaxed">
                    The terminal supports Bluetooth/USB handheld barcode guns, mobile camera scans, or manual ticket reference lookup.
                  </p>
                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valid ticket: Admits attendee and marks timestamp &amp; steward name.</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-700">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Duplicate attempt: Immediately alarms &quot;Already Checked In&quot; to prevent pass reuse.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Paystack Subaccounts Configuration */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>Paystack Subaccounts &amp; Automated Payouts</span>
                </h3>
                <span className="text-xs text-emerald-700 font-medium">Automatic Split Payouts by Business Unit &amp; Venue</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ticket revenues can be automatically routed to specific venue bank accounts (e.g. Tamarind Dhow vs Tamarind Restaurant vs Tamarind Village) using Paystack Subaccounts.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <span className="font-bold text-slate-900 block text-sm">Required Environment Variables (<code className="font-mono text-[11px] text-[#821124]">.env.local</code>)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <code className="text-[#821124] font-bold block">PAYSTACK_SECRET_KEY</code>
                  <span className="text-slate-500">Master Paystack secret key (<code className="text-[11px]">sk_live_...</code> or <code className="text-[11px]">sk_test_...</code>).</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <code className="text-[#821124] font-bold block">PAYSTACK_SUBACCOUNT_VILLAGE</code>
                  <span className="text-slate-500">Subaccount code for Tamarind Village accommodations &amp; stays.</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <code className="text-[#821124] font-bold block">PAYSTACK_SUBACCOUNT_RESTAURANT</code>
                  <span className="text-slate-500">Subaccount code for Clifftop Seafood Restaurant galas.</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <code className="text-[#821124] font-bold block">PAYSTACK_SUBACCOUNT_DHOW</code>
                  <span className="text-slate-500">Subaccount code for Tamarind Dhow cruises &amp; charters.</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <code className="text-[#821124] font-bold block">PAYSTACK_SUBACCOUNT_DAWA</code>
                  <span className="text-slate-500">Subaccount code for Dawa Lounge &amp; Terrace events.</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <code className="text-[#821124] font-bold block">PAYSTACK_SUBACCOUNT_CASINO</code>
                  <span className="text-slate-500">Subaccount code for Golden Key Casino happenings.</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                <strong>Per-Event Override:</strong> If an individual event needs to route payouts to a specific custom partner or promoter subaccount, simply input their <code className="font-mono text-slate-800">ACCT_xxxxxxx</code> code into the &quot;Paystack Subaccount Override&quot; field in the event editor.
              </p>
            </div>
          </div>

          {/* Packages Manager */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">Meal Plans &amp; Boarding Packages</h3>
                <span className="text-xs text-[#821124] font-medium">Configuring Room Only, Bed &amp; Breakfast, and Half Board</span>
              </div>
              <Link
                href="/admin/packages"
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold uppercase transition-colors flex items-center gap-1.5 border border-slate-200"
              >
                <span>Manage Meal Plans</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <ol className="space-y-3 text-xs text-slate-700 list-decimal list-inside leading-relaxed">
              <li>
                <strong className="text-slate-900">Per Person / Per Night Formula:</strong> Meal plans calculate dynamically as <code className="bg-slate-100 text-[#821124] px-1 py-0.5 rounded font-mono">Rate × Guests × Nights</code>.
              </li>
              <li>
                <strong className="text-slate-900">Dynamic Inclusions:</strong> Add or remove individual inclusions (e.g. <em>Daily Clifftop Harbour Breakfast</em>, <em>3-Course Table d&apos;Hôte Dinner</em>).
              </li>
              <li>
                <strong className="text-slate-900">Active Toggle:</strong> Easily pause or activate meal plans for instant live booking flow synchronization.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* TAB 4: Suites & Pricing */}
      {activeTab === 'pricing' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">Dynamic Pricing &amp; Revenue Suite</h3>
                <span className="text-xs text-[#821124] font-medium">Configuring Seasonal Multipliers, Weekend Surcharges &amp; Promo Codes</span>
              </div>
              <Link
                href="/admin/pricing"
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold uppercase transition-colors flex items-center gap-1.5 border border-slate-200"
              >
                <span>Open Pricing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 block">Markup Multiplier</span>
                <p className="text-slate-600">
                  Acts as a global yield factor across all suites. Setting this to <code className="text-[#821124] font-semibold font-mono">1.10</code> automatically increases all starting rates by 10% during high-demand periods without altering individual base suite rates.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 block">Seasonal Period Rules</span>
                <p className="text-slate-600">
                  Configure specific date ranges (Easter, High Summer, Festive) with custom rate adjustments (+15%, +35%) that automatically apply to bookings within those calendar windows.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 block">Weekend Surcharges &amp; Direct Promo Codes</span>
                <p className="text-slate-600">
                  Enable Friday/Saturday night surcharges and configure promotional discount codes (e.g. <code className="font-mono text-[#821124]">DIRECT2026</code> for 10% off).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 block">Statutory Taxes &amp; Levies</span>
                <p className="text-slate-600">
                  Specifies VAT (16%) and Catering Levy (2%) calculations added transparently to checkout totals.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Staff Roles & Security */}
      {activeTab === 'roles' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">Staff Roles &amp; Permissions Matrix</h3>
                <span className="text-xs text-[#821124] font-medium">Role-Based Access Control via Edge Proxy</span>
              </div>
              <Link
                href="/admin/team"
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold uppercase transition-colors flex items-center gap-1.5 border border-slate-200"
              >
                <span>Manage Staff</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Role Clearance</th>
                    <th className="py-3 px-4">Default Profile</th>
                    <th className="py-3 px-4">Operational Capabilities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#821124]">admin</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-900">admin@tamarindvillage.co.ke</td>
                    <td className="py-3.5 px-4">Full unrestricted access: Pricing, Team provision, Database logs, Settings.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-purple-700">manager</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-900">gm@tamarindvillage.co.ke</td>
                    <td className="py-3.5 px-4">Executive overview, Revenue pricing, Event authoring, Master Bookings ledger.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-blue-700">reservations</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-900">reservations.village@tamarind.co.ke</td>
                    <td className="py-3.5 px-4">Inquiry quotation engine, Package bookings, Voucher generation, Guest tracking links.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">reception</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-900">frontdesk@tamarindvillage.co.ke</td>
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
