'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BookOpen, Building2, Users, Calendar, Ship, Sparkles, Tag, Car, 
  HelpCircle, Settings, ShieldAlert, LogOut, ChevronLeft, 
  ChevronRight, ExternalLink, Menu, X, Bell, Layers,
  Compass, BarChart3, Clock, CheckCircle2, DollarSign,
  UtensilsCrossed, Hotel, Activity, ShieldCheck, Ticket,
  ClipboardList, QrCode
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // If on login page, render children cleanly without sidebar shell
  const isLoginPage = pathname === '/admin/login';

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (isLoginPage) return;
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setCurrentUser(d.user);
        }
      })
      .catch(() => {});
  }, [isLoginPage]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Signed out securely');
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    }
  };

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Toaster position="top-right" />
        {children}
      </div>
    );
  }

  interface NavItem {
    label: string;
    href: string;
    icon: any;
    badge?: string;
    highlight?: boolean;
  }
  interface NavSection {
    title: string;
    items: NavItem[];
  }
  const navSections: NavSection[] = [
    {
      title: 'Operations',
      items: [
        { label: 'Front Desk Hub', href: '/admin/frontdesk', icon: Hotel, badge: 'Live' },
        { label: 'Bookings Ledger', href: '/admin/bookings', icon: Calendar },
        { label: 'Guest Inquiries', href: '/admin/inquiries', icon: Bell, badge: 'Inbox' },
        { label: 'Availability & Blocks', href: '/admin/availability', icon: Clock },
      ],
    },
    {
      title: 'Resort & Lifestyle Engine',
      items: [
        { label: 'Apartments & Suites', href: '/admin/apartments', icon: Building2 },
        { label: 'Dining & Dhow', href: '/admin/dining', icon: UtensilsCrossed },
        { label: 'Events & Experiences', href: '/admin/events', icon: Sparkles, highlight: true },
        { label: 'Event Tickets Ledger', href: '/admin/events/ledger', icon: ClipboardList, badge: 'Desk' },
        { label: 'Gate Entrance Scan', href: '/admin/events/checkin', icon: QrCode },
        { label: 'Meal Plans', href: '/admin/packages', icon: Tag, highlight: true },
        { label: 'Extras & Add-ons', href: '/admin/extras', icon: Sparkles },
        { label: 'Vouchers & Promos', href: '/admin/vouchers', icon: Ticket, badge: 'New', highlight: true },
        { label: 'VIP Transfers', href: '/admin/transfers', icon: Car },
        { label: 'Resort Facilities', href: '/admin/facilities', icon: Compass },
      ],
    },
    {
      title: 'Management & Control',
      items: [
        { label: 'Booking Conditions', href: '/admin/policies', icon: ShieldCheck, badge: 'Guest' },
        { label: 'Hero & Announcements', href: '/admin/hero', icon: Layers },
        { label: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
        { label: 'Revenue & Pricing', href: '/admin/pricing', icon: DollarSign },
        { label: 'Staff Team', href: '/admin/team', icon: Users },
        { label: 'Audit Logs', href: '/admin/logs', icon: Activity },
        { label: 'Admin User Guide', href: '/admin/guide', icon: BookOpen, badge: 'Guide' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex">
      <Toaster position="top-right" />

      {/* Desktop Sidebar — 100% Full Viewport Height, Sticky, Scrollable Middle Links */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 border-r border-slate-200 bg-white transition-all duration-300 z-30 shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Fixed Header */}
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-slate-100 p-1 border border-slate-200 shrink-0 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.png" alt="Tamarind Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-serif font-bold text-xs tracking-wider text-slate-900 block truncate">
                  TAMARIND PORTAL
                </span>
                <span className="text-[9px] uppercase tracking-widest text-[#821124] font-semibold block truncate">
                  Operations Suite
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable Navigation Links (Middle Section) */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-[#821124] text-white shadow-sm font-semibold'
                        : item.highlight
                        ? 'text-slate-700 hover:bg-slate-100 hover:text-[#821124]'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-white' : item.highlight ? 'text-[#821124]' : 'text-slate-400 group-hover:text-slate-700'
                    }`} />
                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Fixed Footer (Account & Logout) */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#821124] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 block truncate">
                    {currentUser?.name || 'Administrator'}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block truncate">
                    {currentUser?.role || 'Master Control'}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Operational Navigation Bar */}
        <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Cloud Status Beacon */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Portal Active • Direct Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <span>Live Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-800 block">
                {currentUser?.name || 'Tamarind Admin'}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                {currentUser?.role || 'Executive'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Inner Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8F9FA]">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col z-10 border-r border-slate-200 shadow-xl">
            <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
              <span className="font-serif font-bold text-xs tracking-wider text-slate-900">
                TAMARIND VILLAGE
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-5">
              {navSections.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">
                    {section.title}
                  </div>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-[#821124] text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#821124]'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-700 font-medium">{currentUser?.name || 'Administrator'}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-600 font-bold uppercase flex items-center gap-1 hover:text-rose-700"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
