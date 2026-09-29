'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Ship, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1F1615] text-[#FAF6F0] pt-16 pb-24 lg:pb-12 border-t border-[#C59B27]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        
        {/* Brand Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 p-1 border border-[#C59B27]/40 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.png" alt="Tamarind Village" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg tracking-wider text-white block">
                TAMARIND VILLAGE
              </span>
              <span className="text-[10px] tracking-widest uppercase text-[#C59B27] block">
                Mombasa, Kenya
              </span>
            </div>
          </div>

          <p className="text-xs text-white/70 leading-relaxed font-light">
            Luxury sea-facing apartments overlooking the historic Mombasa Old Port, Tudor Creek, and coral clifftops. 
            Home to Tamarind Restaurant and the legendary Tamarind Dhow.
          </p>

          <div className="pt-2 text-xs text-[#C59B27] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Direct Booking Rate Guarantee
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#C59B27]">
            The Experience
          </h4>
          <ul className="space-y-2 text-xs text-white/80">
            <li>
              <Link href="/apartments" className="hover:text-[#C59B27] transition-colors flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-[#821124]" /> Luxury Sea-Facing Suites
              </Link>
            </li>
            <li>
              <Link href="/dining" className="hover:text-[#C59B27] transition-colors flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-[#821124]" /> Tamarind Restaurant Mombasa
              </Link>
            </li>
            <li>
              <Link href="/dining" className="hover:text-[#C59B27] transition-colors flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-[#821124]" /> Tamarind Dhow Sunset Cruises
              </Link>
            </li>
            <li>
              <Link href="/events" className="hover:text-[#C59B27] transition-colors flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-[#821124]" /> Live Events &amp; Moonlit Dining
              </Link>
            </li>
            <li>
              <Link href="/packages" className="hover:text-[#C59B27] transition-colors flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-[#821124]" /> Honeymoon &amp; Escape Packages
              </Link>
            </li>
            <li>
              <Link href="/transfers" className="hover:text-[#C59B27] transition-colors flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-[#821124]" /> Airport &amp; SGR VIP Transfers
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#C59B27]">
            Concierge &amp; Reservations
          </h4>
          <div className="space-y-2.5 text-xs text-white/80">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#C59B27] shrink-0 mt-0.5" />
              <span>Cement Silo Road, Nyali, Mombasa, Kenya (Opposite Old Port)</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#C59B27] shrink-0" />
              <a href="tel:+254722205138" className="hover:underline">+254 722 205 138 / +254 733 623 583</a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#C59B27] shrink-0" />
              <a href="mailto:reservations@tamarind.co.ke" className="hover:underline">reservations@tamarind.co.ke</a>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C59B27] shrink-0" />
              <span>Front Desk &amp; Security: 24 Hours / 7 Days</span>
            </div>
          </div>
        </div>

        {/* Portal Access & Security */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#C59B27]">
            Staff Operations
          </h4>
          <p className="text-xs text-white/70">
            Authorized Tamarind Village management, front desk, and reservations personnel.
          </p>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
            <span>Staff Portal Access</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 mt-12 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50">
        <p>© {new Date().getFullYear()} Tamarind Village Mombasa. All rights reserved.</p>
        <p className="mt-2 sm:mt-0">The Quintessential Coastal Experience • Crafted with Excellence</p>
      </div>
    </footer>
  );
}
