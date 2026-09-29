'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, Calendar, Search, Phone, Mail, 
  MapPin, Sparkles, ChevronRight, Compass, ShieldCheck 
} from 'lucide-react';

interface NavbarProps {
  onOpenBooking?: (pkgId?: string) => void;
  onOpenTracking?: () => void;
}

export default function Navbar({ onOpenBooking, onOpenTracking }: NavbarProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Accommodations', href: '/apartments' },
    { label: 'Dining & Dhow', href: '/dining' },
    { label: 'Events', href: '/events', badge: 'Live' },
    { label: 'Curated Packages', href: '/packages', badge: 'Offers' },
    { label: 'Transfers', href: '/transfers' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#FAF6F0]/95 backdrop-blur-md shadow-md py-3 border-b border-[#C59B27]/20' 
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5 text-white'
      }`}
    >
      {/* Top micro-bar on desktop before scroll */}
      {!isScrolled && (
        <div className="max-w-7xl mx-auto px-6 mb-2 hidden lg:flex items-center justify-between text-xs tracking-wider uppercase text-white/80 border-b border-white/10 pb-2">
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#C59B27]" /> Nyali Overlooking Mombasa Old Port
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#C59B27]" /> +254 722 205 138
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={onOpenTracking}
              className="flex items-center gap-1.5 hover:text-[#C59B27] transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" /> Track Reservation / Inquiry
            </button>
            <span className="text-white/30">|</span>
            <span className="text-[#C59B27] font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Direct Booking Best Rate Guarantee
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-[#C59B27]/40 shadow-sm bg-white/10 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/assets/logo.png" 
              alt="Tamarind Village" 
              className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform" 
            />
          </div>
          <div>
            <span className={`font-serif font-bold text-lg sm:text-xl tracking-wider block ${
              isScrolled ? 'text-[#1F1615]' : 'text-white'
            }`}>
              TAMARIND VILLAGE
            </span>
            <span className={`text-[10px] tracking-[0.25em] uppercase font-sans block ${
              isScrolled ? 'text-[#821124]' : 'text-[#C59B27]'
            }`}>
              Mombasa • Luxury Coastal Suites
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center space-x-7">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium tracking-wide transition-colors relative py-1 ${
                  isScrolled
                    ? isActive ? 'text-[#821124] font-semibold' : 'text-[#1F1615]/80 hover:text-[#821124]'
                    : isActive ? 'text-[#C59B27] font-semibold' : 'text-white/90 hover:text-[#C59B27]'
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className="ml-1.5 text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-[#821124] text-white font-semibold tracking-normal">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#821124] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden sm:flex items-center space-x-3">
          <button
            onClick={onOpenTracking}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              isScrolled
                ? 'border-[#1F1615]/20 text-[#1F1615] hover:bg-[#1F1615]/5'
                : 'border-white/30 text-white hover:bg-white/10'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Track Booking</span>
          </button>

          <button
            onClick={() => onOpenBooking ? onOpenBooking() : null}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[#821124] hover:bg-[#680e1c] text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Direct</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`lg:hidden p-2 rounded-lg transition-colors ${
            isScrolled ? 'text-[#1F1615]' : 'text-white'
          }`}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF6F0] text-[#1F1615] border-t border-[#C59B27]/20 shadow-2xl px-6 py-6 mt-3 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-3 pb-4 border-b border-[#1F1615]/10">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 text-base font-medium hover:text-[#821124]"
              >
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#821124] text-white font-bold">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#C59B27]" />
                )}
              </Link>
            ))}
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTracking?.();
              }}
              className="w-full py-3 rounded-lg border border-[#1F1615]/20 text-sm font-semibold flex items-center justify-center gap-2 text-[#1F1615]"
            >
              <Search className="w-4 h-4 text-[#C59B27]" /> Track Reservation Status
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking?.();
              }}
              className="w-full py-3.5 rounded-lg bg-[#821124] text-white text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
            >
              <Calendar className="w-4 h-4" /> Book Directly & Save
            </button>
          </div>

          <div className="text-xs text-center text-[#1F1615]/60 pt-2 flex items-center justify-center gap-4">
            <a href="tel:+254722205138" className="flex items-center gap-1 hover:text-[#821124]">
              <Phone className="w-3.5 h-3.5 text-[#C59B27]" /> +254 722 205 138
            </a>
            <span>•</span>
            <Link href="/admin/login" className="text-[#821124] hover:underline font-medium">
              Staff Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
