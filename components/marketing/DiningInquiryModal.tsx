'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Calendar, Clock, Users, Utensils, CheckCircle, ArrowRight, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DiningInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultVenue?: 'restaurant' | 'dawa_terrace' | 'dhow' | 'golden_key' | 'village_apartment';
  venueName?: string;
}

const VENUE_OPTIONS = [
  { id: 'restaurant', name: 'Tamarind Mombasa Restaurant', desc: 'Legendary seafood overlooking Tudor Creek' },
  { id: 'dawa_terrace', name: 'The Dawa Terrace', desc: 'Sunset cocktails, coastal tapas & live lounge sets' },
  { id: 'dhow', name: 'Tamarind Dhow (Nawalikoni & Babulkher)', desc: 'Lunch & dinner sailing cruises' },
  { id: 'golden_key', name: 'Golden Key Casino', desc: 'VIP gaming & entertainment lounge' },
];

export default function DiningInquiryModal({
  isOpen,
  onClose,
  defaultVenue = 'restaurant',
  venueName
}: DiningInquiryModalProps) {
  const [venue, setVenue] = useState(defaultVenue);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [guests, setGuests] = useState<number | ''>(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedToken, setConfirmedToken] = useState<string | null>(null);

  const selectedVenueObj = VENUE_OPTIONS.find(v => v.id === venue) || VENUE_OPTIONS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !date) {
      toast.error('Please complete all required contact and reservation details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'restaurant',
          venue,
          payload: {
            name,
            email,
            phone,
            venue,
            diningName: selectedVenueObj.name,
            date,
            time,
            guests: Number(guests || 2),
            specialRequests,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConfirmedToken(data.guestToken);
        toast.success(`Inquiry sent to ${selectedVenueObj.name}!`);
      } else {
        toast.error(data.error || 'Failed to submit dining inquiry');
      }
    } catch {
      toast.error('Network error submitting inquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setConfirmedToken(null);
    setName('');
    setEmail('');
    setPhone('');
    setDate('');
    setSpecialRequests('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-xl bg-[#1F1615] border border-[#C59B27]/40 shadow-2xl rounded-2xl overflow-hidden text-xs text-white max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-[#16100F] border-b border-[#C59B27]/25 px-6 py-4 flex items-center justify-between shrink-0">
            <div>
              <span className="text-[10px] font-mono text-[#C59B27] uppercase tracking-widest block">
                Gastronomy &amp; Nautical Reservations
              </span>
              <h3 className="font-serif text-lg font-bold text-white">
                {venueName || selectedVenueObj.name}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!confirmedToken ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
              {/* Venue Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                  Selected Venue
                </label>
                <select
                  value={venue}
                  onChange={(e) => setVenue(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                >
                  {VENUE_OPTIONS.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-white/50 mt-1">
                  Inquiries will be routed directly to the dedicated reservation desk at {selectedVenueObj.name}.
                </p>
              </div>

              {/* Date, Time & Guests */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                    Preferred Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 19:30"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                    Total Diners
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={guests ?? ''}
                    onChange={(e) => setGuests(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C59B27] block">
                  Your Contact Information
                </span>

                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone / WhatsApp"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <textarea
                  rows={2}
                  placeholder="Special requests: creekside table, dietary restrictions, birthday cake, or private charter requirements..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Dining Inquiry'}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-8 text-center space-y-5">
              <div className="w-12 h-12 bg-emerald-950/80 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle className="w-6 h-6" />
              </div>

              <div>
                <h4 className="font-serif text-xl font-bold text-white">Table Inquiry Sent!</h4>
                <p className="text-white/60 text-xs mt-1">
                  The reservation team at <strong>{selectedVenueObj.name}</strong> has received your inquiry.
                </p>
              </div>

              <div className="bg-black/30 p-3.5 rounded-xl border border-[#C59B27]/30 max-w-sm mx-auto text-left">
                <div className="text-[10px] text-white/50 uppercase font-bold">Inquiry Reference Code</div>
                <div className="font-mono text-base font-bold text-[#C59B27]">{confirmedToken}</div>
                <div className="text-[10px] text-white/50 mt-1">
                  You can track your reservation or add notes anytime via the guest portal.
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
