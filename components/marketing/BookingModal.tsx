'use client';

import React, { useState } from 'react';
import { 
  X, Calendar, Users, ShieldCheck, Sparkles, 
  CheckCircle, ArrowRight, Loader2, Phone, Mail, Car 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedApartmentId?: string;
  preSelectedPkg?: string;
}

export default function BookingModal({
  isOpen,
  onClose,
  preSelectedApartmentId = '1-bedroom',
  preSelectedPkg = 'ro'
}: BookingModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [confirmedToken, setConfirmedToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    apartmentId: preSelectedApartmentId,
    packagePlan: preSelectedPkg,
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: 0,
    specialRequests: '',
    needTransfer: false,
    arrivalDetails: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName || !formData.guestEmail || !formData.checkIn || !formData.checkOut) {
      toast.error('Please fill in your name, email, and travel dates.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: formData.guestName,
          guest_email: formData.guestEmail,
          guest_phone: formData.guestPhone,
          apartment_id: formData.apartmentId,
          package_plan: formData.packagePlan,
          check_in: formData.checkIn,
          check_out: formData.checkOut,
          adults: Number(formData.adults),
          children: Number(formData.children),
          special_requests: formData.specialRequests + (formData.needTransfer ? ' [Airport/SGR VIP Transfer Requested: ' + formData.arrivalDetails + ']' : ''),
          source: 'website_direct'
        })
      });

      const data = await res.json();
      if (res.ok && data.inquiry) {
        setConfirmedToken(data.inquiry.secure_token);
        toast.success('Your reservation inquiry has been confirmed!');
      } else {
        toast.error(data.error || 'Failed to submit inquiry. Please try again.');
      }
    } catch (err: any) {
      toast.error('Could not connect to reservation server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#FAF6F0] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#C59B27]/40 text-[#1F1615] animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#1F1615]/60 hover:text-[#821124] hover:bg-black/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {confirmedToken ? (
          <div className="py-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-400">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-2xl font-bold text-[#821124]">
                Reservation Request Received
              </h3>
              <p className="text-sm text-[#1F1615]/80 max-w-md mx-auto">
                Thank you, <span className="font-bold">{formData.guestName}</span>. Your direct reservation inquiry has been lodged with our Tamarind Village reservations desk.
              </p>
            </div>

            {/* Reference Token Badge */}
            <div className="p-4 rounded-xl bg-white border border-[#C59B27]/30 max-w-sm mx-auto">
              <span className="text-[11px] uppercase tracking-wider text-[#1F1615]/60 block mb-1">
                Your Direct Inquiry Token
              </span>
              <span className="font-mono text-base font-bold text-[#821124] select-all">
                {confirmedToken}
              </span>
            </div>

            <p className="text-xs text-[#1F1615]/70 max-w-md mx-auto">
              Our guest relations host will reach out via email or WhatsApp within 2 hours with your locked-in rate quotation and secure reservation link.
            </p>

            <div className="pt-3 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg bg-[#821124] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#680e1c] cursor-pointer"
              >
                Close &amp; Continue Browsing
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#821124] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" /> Direct Reservation &amp; Best Rate Guarantee
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#1F1615]">
                Plan Your Stay at Tamarind Village
              </h2>
              <p className="text-xs text-[#1F1615]/70">
                Lock in exclusive direct-booking benefits: complimentary arrival cocktails &amp; priority Dhow seating.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#821124] mb-1">
                    Apartment Category
                  </label>
                  <select
                    value={formData.apartmentId}
                    onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
                    className="w-full text-xs font-medium bg-white border border-[#1F1615]/20 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#821124]"
                  >
                    <option value="1-bedroom">1-Bedroom Sea View Apartment</option>
                    <option value="2-bedroom">2-Bedroom Garden/Sea View</option>
                    <option value="3-bedroom">3-Bedroom Grand Villa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#821124] mb-1">
                    Board / Package Plan
                  </label>
                  <select
                    value={formData.packagePlan}
                    onChange={(e) => setFormData({ ...formData, packagePlan: e.target.value })}
                    className="w-full text-xs font-medium bg-white border border-[#1F1615]/20 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#821124]"
                  >
                    <option value="ro">Room Only (Self Catering)</option>
                    <option value="bb">Bed &amp; Breakfast (Harbour Clifftop)</option>
                    <option value="dhow_stay">Swahili Coast &amp; Dhow Experience</option>
                    <option value="honeymoon">Romantic Honeymoon Package</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#821124] mb-1">
                    Check-In
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    className="w-full text-xs font-medium bg-white border border-[#1F1615]/20 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div className="col-span-2 sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#821124] mb-1">
                    Check-Out
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    className="w-full text-xs font-medium bg-white border border-[#1F1615]/20 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#821124] mb-1">
                    Adults
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={formData.adults}
                    onChange={(e) => setFormData({ ...formData, adults: Number(e.target.value) })}
                    className="w-full text-xs font-medium bg-white border border-[#1F1615]/20 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#821124] mb-1">
                    Children
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={8}
                    value={formData.children}
                    onChange={(e) => setFormData({ ...formData, children: Number(e.target.value) })}
                    className="w-full text-xs font-medium bg-white border border-[#1F1615]/20 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#821124] mb-1">
                    Full Guest Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jane Muthoni"
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    className="w-full text-xs font-medium bg-white border border-[#1F1615]/20 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#821124] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={formData.guestEmail}
                    onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                    className="w-full text-xs font-medium bg-white border border-[#1F1615]/20 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#821124] mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+254 712 345 678"
                    value={formData.guestPhone}
                    onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                    className="w-full text-xs font-medium bg-white border border-[#1F1615]/20 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={formData.needTransfer}
                      onChange={(e) => setFormData({ ...formData, needTransfer: e.target.checked })}
                      className="rounded border-[#1F1615]/30 text-[#821124] focus:ring-[#821124]"
                    />
                    <span>Add Airport or SGR VIP Chauffeur Transfer</span>
                  </label>
                </div>
              </div>

              {formData.needTransfer && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#821124] mb-1">
                    Flight / Train Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KQ 604 landing at MBA 14:30 or SGR Express arriving 13:45"
                    value={formData.arrivalDetails}
                    onChange={(e) => setFormData({ ...formData, arrivalDetails: e.target.value })}
                    className="w-full text-xs font-medium bg-white border border-[#1F1615]/20 rounded-lg px-3 py-2 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#821124] mb-1">
                  Special Requests or Dietary Preferences
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Ocean view preferred, honeymoon setup, gluten-free dining..."
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  className="w-full text-xs font-medium bg-white border border-[#1F1615]/20 rounded-lg px-3 py-2 focus:outline-none focus:border-[#821124]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Checking Availability &amp; Lodging Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Confirm &amp; Lock-in Direct Rate</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
