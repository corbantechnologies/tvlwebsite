'use client';

import React, { useState } from 'react';
import { 
  X, Search, ShieldCheck, CheckCircle2, Clock, 
  MapPin, Calendar, Users, Phone, Mail, Loader2, ArrowRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface GuestBookingTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialToken?: string;
}

export default function GuestBookingTrackerModal({
  isOpen,
  onClose,
  initialToken = ''
}: GuestBookingTrackerModalProps) {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [inquiryData, setInquiryData] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      toast.error('Please enter your reservation or inquiry token.');
      return;
    }

    setLoading(true);
    setInquiryData(null);
    try {
      const res = await fetch(`/api/guest/inquiry/${encodeURIComponent(tokenInput.trim())}`);
      const data = await res.json();
      if (res.ok && data.inquiry) {
        setInquiryData(data.inquiry);
      } else {
        toast.error(data.error || 'No matching reservation found for this reference.');
      }
    } catch (err) {
      toast.error('Could not connect to reservation server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#FAF6F0] rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#C59B27]/40 text-[#1F1615] animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#1F1615]/60 hover:text-[#821124] hover:bg-black/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#821124] uppercase tracking-wider">
            <Search className="w-3.5 h-3.5 text-[#C59B27]" /> Live Guest Tracking
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1F1615]">
            Check Reservation / Inquiry Status
          </h2>
          <p className="text-xs text-[#1F1615]/70">
            Enter the secure token received upon submitting your inquiry or quote reference.
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. tv_guest_c14a2b9..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1 font-mono text-xs sm:text-sm bg-white border border-[#1F1615]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#821124]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Lookup</span>
            </button>
          </div>
        </form>

        {/* Results Display */}
        {inquiryData && (
          <div className="mt-6 pt-6 border-t border-[#1F1615]/10 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#C59B27]/30">
              <div>
                <span className="text-[10px] text-[#1F1615]/60 uppercase tracking-wider block">Status</span>
                <span className={`text-sm font-bold uppercase tracking-wide ${
                  inquiryData.status === 'confirmed' ? 'text-emerald-700' :
                  inquiryData.status === 'quote_sent' ? 'text-blue-700' : 'text-amber-700'
                }`}>
                  {inquiryData.status}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#1F1615]/60 uppercase tracking-wider block">Guest</span>
                <span className="text-sm font-bold text-[#1F1615]">{inquiryData.guest_name}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-[#1F1615]/10">
              <div>
                <span className="text-[#1F1615]/60 block mb-0.5">Stay Dates:</span>
                <span className="font-semibold text-[#1F1615]">{inquiryData.check_in} → {inquiryData.check_out}</span>
              </div>
              <div>
                <span className="text-[#1F1615]/60 block mb-0.5">Apartment Category:</span>
                <span className="font-semibold text-[#1F1615]">{inquiryData.apartment_id}</span>
              </div>
              <div>
                <span className="text-[#1F1615]/60 block mb-0.5">Party Size:</span>
                <span className="font-semibold text-[#1F1615]">{inquiryData.adults} Adults, {inquiryData.children} Children</span>
              </div>
              <div>
                <span className="text-[#1F1615]/60 block mb-0.5">Quoted Rate:</span>
                <span className="font-bold text-[#821124]">
                  {inquiryData.quoted_rate_kes ? `KES ${inquiryData.quoted_rate_kes.toLocaleString()}` : 'Rate under host review'}
                </span>
              </div>
            </div>

            {inquiryData.internal_notes && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                <span className="font-bold block mb-1">Host Note:</span>
                {inquiryData.internal_notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
