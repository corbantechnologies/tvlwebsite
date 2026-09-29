'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Search, CheckCircle2, Clock, Mail, Phone, MessageSquare, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [quoteKes, setQuoteKes] = useState('');
  const [notes, setNotes] = useState('');

  const fetchInquiries = async () => {
    try {
      const res = await fetch('/api/inquiries');
      const data = await res.json();
      if (data.inquiries) {
        setInquiries(data.inquiries);
      }
    } catch {
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleSendQuote = async () => {
    if (!selectedInquiry) return;
    try {
      const res = await fetch(`/api/inquiries/${selectedInquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'quote_sent',
          quoted_rate_kes: quoteKes ? Number(quoteKes) : undefined,
          internal_notes: notes,
        })
      });

      if (res.ok) {
        toast.success('Quote & token recorded. Guest notified.');
        setSelectedInquiry(null);
        fetchInquiries();
      } else {
        toast.error('Could not update inquiry.');
      }
    } catch {
      toast.error('Network error updating inquiry.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
          <Bell className="w-3.5 h-3.5" /> Direct Inquiries Inbox
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
          Guest Reservation Inquiries
        </h1>
        <p className="text-xs text-white/60">
          Respond with locked-in quotes, track guest requests, and convert website inquiries into confirmed stays.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Inquiries List */}
        <div className="lg:col-span-2 space-y-4">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              onClick={() => {
                setSelectedInquiry(inq);
                setQuoteKes(inq.quoted_rate_kes ? String(inq.quoted_rate_kes) : '');
                setNotes(inq.internal_notes || '');
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                selectedInquiry?.id === inq.id
                  ? 'bg-[#1F1615] border-[#821124] ring-2 ring-[#821124]/40 shadow-xl'
                  : 'bg-[#1F1615] border-[#C59B27]/25 hover:border-white/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-[#C59B27] block">
                    TOKEN: {inq.secure_token || inq.id}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-white">
                    {inq.guest_name}
                  </h3>
                  <span className="text-xs text-white/60">
                    {inq.guest_email} • {inq.guest_phone || 'No phone'}
                  </span>
                </div>

                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                  inq.status === 'confirmed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                  inq.status === 'quote_sent' ? 'bg-blue-950 text-blue-400 border border-blue-500/30' :
                  'bg-amber-950 text-amber-400 border border-amber-500/30'
                }`}>
                  {inq.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs py-3 border-y border-white/5 mt-3 text-white/80">
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Dates:</span>
                  <span className="font-semibold">{inq.check_in} → {inq.check_out}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Category:</span>
                  <span className="font-semibold">{inq.apartment_id}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Quoted:</span>
                  <span className="font-bold text-[#C59B27]">
                    {inq.quoted_rate_kes ? `KES ${inq.quoted_rate_kes.toLocaleString()}` : 'Pending'}
                  </span>
                </div>
              </div>

              {inq.special_requests && (
                <div className="text-xs text-white/70 pt-2 italic">
                  &ldquo;{inq.special_requests}&rdquo;
                </div>
              )}
            </div>
          ))}

          {inquiries.length === 0 && !loading && (
            <div className="p-8 text-center text-white/50 bg-[#1F1615] rounded-2xl border border-white/10">
              No inquiries lodged yet. New inquiries from the public website will appear here in real-time.
            </div>
          )}
        </div>

        {/* Right Col: Quote & Response Inspector */}
        <div className="bg-[#1F1615] p-6 rounded-2xl border border-[#C59B27]/25 shadow-xl space-y-5 h-fit">
          <h3 className="font-serif text-lg font-bold text-white border-b border-white/10 pb-3">
            Inquiry Actions &amp; Quotation
          </h3>

          {selectedInquiry ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase text-white/50 block font-bold">Selected Guest</span>
                <span className="text-sm font-bold text-white">{selectedInquiry.guest_name}</span>
                <span className="text-xs text-[#C59B27] block">{selectedInquiry.guest_email}</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                  Quoted Total Rate (KES)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 75000"
                  value={quoteKes}
                  onChange={(e) => setQuoteKes(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                  Internal Host Notes / Guest Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. High season rate applied, champagne inclusion verified..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleSendQuote}
                  className="w-full py-3 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update &amp; Lock-In Quote</span>
                </button>

                <button
                  onClick={() => {
                    const trackUrl = `${window.location.origin}/?token=${selectedInquiry.secure_token}`;
                    navigator.clipboard.writeText(trackUrl);
                    toast.success('Guest tracking link copied to clipboard!');
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Copy Guest Tracking Link
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-white/50 text-center py-6">
              Select an inquiry from the left to view full guest details and issue a quotation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
