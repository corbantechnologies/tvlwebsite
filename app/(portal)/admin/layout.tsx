'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BookOpen, Building2, Users, Calendar, Ship, Sparkles, Tag, Car, 
  HelpCircle, Settings, ShieldAlert, LogOut, ChevronLeft, 
  ChevronRight, ExternalLink, Menu, X, Bell, Layers,
  Compass, BarChart3, Clock, CheckCircle2, DollarSign,
  UtensilsCrossed, Hotel, Activity
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // If we are on the login page, render children without sidebar shell
  const isLoginPage = pathname === '/admin/login';

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load session from /api/auth/session
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

  // Handle logout
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
      <div className="min-h-screen bg-[#1F1615] text-[#FAF6F0]">
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
        { label: 'Village & Dhow Events', href: '/admin/events', icon: Sparkles, highlight: true },
        { label: 'Curated Packages', href: '/admin/packages', icon: Tag, highlight: true },
        { label: 'VIP Transfers', href: '/admin/transfers', icon: Car },
        { label: 'Resort Facilities', href: '/admin/facilities', icon: Compass },
      ],
    },
    {
      title: 'Management & Control',
      items: [
        { label: 'Hero & Announcements', href: '/admin/hero', icon: Layers },
        { label: 'Revenue & Pricing', href: '/admin/pricing', icon: DollarSign },
        { label: 'Staff Team', href: '/admin/team', icon: Users },
        { label: 'Audit Logs', href: '/admin/logs', icon: Activity },
        { label: 'Admin User Guide', href: '/admin/guide', icon: BookOpen, badge: 'Guide' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#16100F] text-[#FAF6F0] flex">
      <Toaster position="top-right" />

      {/* Desktop Sidebar Drawer */}
      <aside
        className={`hidden lg:flex flex-col border-r border-[#C59B27]/20 bg-[#1F1615] transition-all duration-300 relative z-30 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-[#C59B27]/20">
          <Link href="/admin" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-white/10 p-1 border border-[#C59B27]/40 shrink-0 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.png" alt="Tamarind Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-serif font-bold text-sm tracking-wider text-white block truncate">
                  TAMARIND PORTAL
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#C59B27] block truncate">
                  Mombasa Operations
                </span>
              </div>
            )}
          </Link>

          {/* Drawer collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#C59B27]/80 px-3 mb-2">
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-[#821124] text-white shadow-md font-semibold'
                        : item.highlight
                        ? 'text-white/90 hover:bg-[#821124]/30 hover:text-white border border-[#C59B27]/20'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : item.highlight ? 'text-[#C59B27]' : 'text-white/60 group-hover:text-white'
                    }`} />
                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-[#C59B27]/30 text-[#FAF6F0] font-bold">
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

        {/* User Card & Logout */}
        <div className="p-3 border-t border-[#C59B27]/20 bg-black/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#821124] text-[#FAF6F0] text-xs font-bold flex items-center justify-center shrink-0 border border-[#C59B27]/40">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">
                    {currentUser?.name || 'Staff User'}
                  </span>
                  <span className="text-[10px] text-[#C59B27] uppercase tracking-wider block truncate">
                    {currentUser?.role || 'Authorized'}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-white/50 hover:text-[#821124] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
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
        <header className="h-16 border-b border-[#C59B27]/20 bg-[#1F1615] px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Live Cloud Status Beacon */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Drizzle Postgres Engine Online • Profitroom Active</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live website link */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-white/70 hover:text-[#C59B27] px-3 py-1.5 rounded-lg border border-white/10 hover:border-[#C59B27]/40 transition-colors"
            >
              <span>View Live Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Quick Staff Badge */}
            <div className="text-right">
              <span className="text-xs font-bold text-white block">
                {currentUser?.name || 'Tamarind Staff'}
              </span>
              <span className="text-[10px] text-[#C59B27] uppercase tracking-wider block">
                {currentUser?.role || 'Desk Operations'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Inner Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#16100F]">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-[#1F1615] h-full flex flex-col z-10 border-r border-[#C59B27]/30 shadow-2xl">
            <div className="p-4 border-b border-[#C59B27]/20 flex items-center justify-between">
              <span className="font-serif font-bold text-sm tracking-wider text-white">
                TAMARIND VILLAGE
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {navSections.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#C59B27] mb-2 px-2">
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
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium ${
                          isActive ? 'bg-[#821124] text-white' : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-[#C59B27]" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[#C59B27]/20 flex items-center justify-between">
              <span className="text-xs text-white/70">{currentUser?.name || 'Staff User'}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-[#821124] font-bold uppercase flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
