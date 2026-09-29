'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, Search, CheckCircle2, Clock, Mail, Phone, MessageSquare, 
  ArrowRight, Filter, Calendar, Building2, CreditCard, DollarSign, 
  UserCheck, ShieldCheck, X, RotateCw, ExternalLink, Copy, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Editing state for selected inquiry
  const [quoteKes, setQuoteKes] = useState('');
  const [notes, setNotes] = useState('');
  const [currentStatus, setCurrentStatus] = useState('Pending');
  const [savingAction, setSavingAction] = useState(false);

  // Conversion Modal State
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertForm, setConvertForm] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    apartmentId: '',
    apartmentName: '',
    roomAllocated: '',
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    totalAmount: 0,
    currency: 'KES',
    paymentMethod: 'mpesa',
    paymentReference: '',
    paymentStatus: 'deposit_paid',
    notes: '',
  });

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const [inqRes, aptRes] = await Promise.all([
        fetch('/api/inquiries'),
        fetch('/api/apartments')
      ]);
      const inqData = await inqRes.json();
      const aptData = await aptRes.json();
      
      if (inqData.inquiries) {
        setInquiries(inqData.inquiries);
      }
      if (aptData.apartments) {
        setApartments(aptData.apartments);
      }
    } catch {
      toast.error('Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleSelect = (inq: any) => {
    setSelectedInquiry(inq);
    setQuoteKes(inq.payload?.quotedRateKes ? String(inq.payload.quotedRateKes) : '');
    setNotes(inq.payload?.internalNotes || '');
    setCurrentStatus(inq.status || 'Pending');
  };

  const handleUpdateInquiry = async (newStatus?: string) => {
    if (!selectedInquiry) return;
    setSavingAction(true);
    const targetStatus = newStatus || currentStatus;

    try {
      const res = await fetch(`/api/inquiries/${selectedInquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          payload: {
            quotedRateKes: quoteKes ? Number(quoteKes) : undefined,
            internalNotes: notes
          },
          auditAction: `Inquiry updated to ${targetStatus}`,
          auditDetails: `Updated quotation (KES ${quoteKes || 'none'}) and notes for inquiry ${selectedInquiry.id}`
        })
      });

      if (res.ok) {
        toast.success(`Inquiry status updated to ${targetStatus}`);
        fetchInquiries();
      } else {
        toast.error('Could not update inquiry.');
      }
    } catch {
      toast.error('Network error updating inquiry.');
    } finally {
      setSavingAction(false);
    }
  };

  // Open Conversion Modal with prefilled details
  const openConvertModal = (inq: any) => {
    const payload = inq.payload || {};
    const defaultApt = apartments.find(a => 
      a.id === payload.apartmentId || 
      a.name?.toLowerCase().includes((payload.apartmentName || '').toLowerCase())
    ) || apartments[0];

    setConvertForm({
      guestName: payload.name || inq.guest_name || '',
      guestEmail: payload.email || inq.guest_email || '',
      guestPhone: payload.phone || inq.guest_phone || '',
      apartmentId: defaultApt?.id || '1-bedroom',
      apartmentName: defaultApt?.name || payload.apartmentName || '1-Bedroom Suite',
      roomAllocated: payload.roomAllocated || '',
      checkIn: payload.checkIn && payload.checkIn !== 'Flexible / Not specified' ? payload.checkIn : new Date().toISOString().split('T')[0],
      checkOut: payload.checkOut && payload.checkOut !== 'Flexible / Not specified' ? payload.checkOut : new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      adults: Number(payload.adults || payload.guests) || 1,
      children: Number(payload.children) || 0,
      totalAmount: Number(payload.quotedRateKes) || Number(payload.totalCost) || 0,
      currency: 'KES',
      paymentMethod: 'mpesa',
      paymentReference: '',
      paymentStatus: 'deposit_paid',
      notes: notes || payload.internalNotes || '',
    });
    setShowConvertModal(true);
  };

  const handleConfirmConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;
    setConverting(true);

    try {
      const res = await fetch(`/api/inquiries/${selectedInquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Booked',
          ...convertForm,
          payload: {
            ...selectedInquiry.payload,
            roomAllocated: convertForm.roomAllocated,
            paymentReference: convertForm.paymentReference,
            paymentMethod: convertForm.paymentMethod,
            paymentStatus: convertForm.paymentStatus,
            quotedRateKes: convertForm.totalAmount,
            internalNotes: convertForm.notes
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Converted! Reservation created and linked to ledger.`);
        setShowConvertModal(false);
        fetchInquiries();
      } else {
        toast.error(data.error || 'Failed to convert to booking.');
      }
    } catch {
      toast.error('Network error during booking conversion.');
    } finally {
      setConverting(false);
    }
  };

  const filteredInquiries = inquiries.filter(inq => {
    const p = inq.payload || {};
    const name = (p.name || inq.guest_name || '').toLowerCase();
    const email = (p.email || inq.guest_email || '').toLowerCase();
    const phone = (p.phone || inq.guest_phone || '').toLowerCase();
    const ref = (p.guestToken || inq.id || '').toLowerCase();
    const q = search.toLowerCase();

    const matchesSearch = !search || name.includes(q) || email.includes(q) || phone.includes(q) || ref.includes(q);
    const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Bell className="w-3.5 h-3.5" /> Direct Inquiries Inbox
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Guest Reservation Inquiries
          </h1>
          <p className="text-xs text-white/60">
            Track inquiries lodged directly on the website, respond with quotes, and convert them into confirmed bookings.
          </p>
        </div>

        <button
          onClick={fetchInquiries}
          disabled={loading}
          className="p-2.5 rounded-xl bg-[#1F1615] border border-[#C59B27]/25 text-[#C59B27] hover:bg-[#821124] hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-bold uppercase tracking-wider w-fit"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-[#1F1615] border border-[#C59B27]/25 rounded-2xl">
          {[
            { id: 'all', label: 'All Inquiries' },
            { id: 'Pending', label: 'Pending' },
            { id: 'Contacted', label: 'Contacted' },
            { id: 'Offer Sent', label: 'Offer Sent' },
            { id: 'Booked', label: 'Booked / Confirmed' },
            { id: 'Declined', label: 'Declined' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#821124] text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ref, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1F1615] border border-[#C59B27]/25 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C59B27]"
          />
        </div>
      </div>

      {/* Main Grid: Inquiries Stream + Details Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inquiries List */}
        <div className="lg:col-span-7 space-y-4">
          {filteredInquiries.map((inq) => {
            const p = inq.payload || {};
            const isSelected = selectedInquiry?.id === inq.id;
            const refToken = p.guestToken || inq.id;
            const isBooked = inq.status === 'Booked' || inq.status === 'confirmed';

            return (
              <div
                key={inq.id}
                onClick={() => handleSelect(inq)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1F1615] border-[#C59B27] ring-2 ring-[#C59B27]/40 shadow-2xl'
                    : 'bg-[#1F1615] border-[#C59B27]/20 hover:border-white/30 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-[#C59B27] uppercase tracking-wider font-semibold">
                        REF: {refToken.toString().toUpperCase()}
                      </span>
                      {p.bookingReference && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase">
                          Booking: {p.bookingReference}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-lg font-bold text-white">
                      {p.name || inq.guest_name || 'Website Guest'}
                    </h3>
                    <div className="text-xs text-white/60 flex items-center gap-2 flex-wrap mt-0.5">
                      <span>{p.email || inq.guest_email || 'No email'}</span>
                      <span>•</span>
                      <span>{p.phone || inq.guest_phone || 'No phone'}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full whitespace-nowrap ${
                    isBooked ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                    inq.status === 'Offer Sent' ? 'bg-blue-950 text-blue-400 border border-blue-500/30' :
                    inq.status === 'Contacted' ? 'bg-sky-950 text-sky-400 border border-sky-500/30' :
                    inq.status === 'Declined' ? 'bg-stone-900 text-stone-400 border border-stone-700' :
                    'bg-amber-950 text-amber-400 border border-amber-500/30'
                  }`}>
                    {inq.status}
                  </span>
                </div>

                {/* Details Bar */}
                <div className="grid grid-cols-3 gap-2 text-xs py-3 border-y border-white/10 mt-3 text-white/80">
                  <div>
                    <span className="text-white/40 block text-[9px] uppercase tracking-wider">Stay Dates:</span>
                    <span className="font-semibold text-white truncate block">
                      {p.checkIn && p.checkIn !== 'Flexible / Not specified' ? p.checkIn : 'Flexible'} → {p.checkOut && p.checkOut !== 'Flexible / Not specified' ? p.checkOut : 'Flexible'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[9px] uppercase tracking-wider">Suite / Guests:</span>
                    <span className="font-semibold text-white truncate block">
                      {p.apartmentName || inq.apartment_id || 'Suite Inquiry'} ({p.adults || p.guests || 1}A, {p.children || 0}C)
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[9px] uppercase tracking-wider">Quoted Rate:</span>
                    <span className="font-bold text-[#C59B27] block">
                      {p.quotedRateKes ? `KES ${Number(p.quotedRateKes).toLocaleString()}` : 'Pending Quote'}
                    </span>
                  </div>
                </div>

                {p.specialRequests && (
                  <p className="text-xs text-white/70 pt-2.5 italic line-clamp-2">
                    &ldquo;{p.specialRequests}&rdquo;
                  </p>
                )}

                {p.roomAllocated && (
                  <div className="mt-2 text-[11px] text-emerald-400 font-medium">
                    Allocated: {p.roomAllocated}
                  </div>
                )}
              </div>
            );
          })}

          {filteredInquiries.length === 0 && !loading && (
            <div className="p-12 text-center text-white/50 bg-[#1F1615] rounded-2xl border border-white/10 space-y-2">
              <Bell className="w-10 h-10 mx-auto text-[#C59B27]/40 mb-2" />
              <p className="text-sm font-semibold text-white">No inquiries found</p>
              <p className="text-xs text-white/40">
                {search || statusFilter !== 'all' 
                  ? 'No inquiries match your current search or filter criteria.' 
                  : 'New direct inquiries submitted by visitors on the website will stream here in real-time.'}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Actions & Quotation Panel */}
        <div className="lg:col-span-5">
          <div className="bg-[#1F1615] p-6 rounded-2xl border border-[#C59B27]/25 shadow-xl space-y-5 sticky top-24">
            <h3 className="font-serif text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center justify-between">
              <span>Inquiry Inspector</span>
              {selectedInquiry && (
                <span className="text-xs font-sans font-normal text-[#C59B27]">
                  REF: {(selectedInquiry.payload?.guestToken || selectedInquiry.id).toString().toUpperCase()}
                </span>
              )}
            </h3>

            {selectedInquiry ? (
              <div className="space-y-4">
                {/* Guest Summary Card */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-white/40 font-bold tracking-wider">Guest Profile</span>
                    <span className="text-[10px] text-white/50 font-mono">
                      Received: {new Date(selectedInquiry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-base font-bold text-white">
                    {selectedInquiry.payload?.name || selectedInquiry.guest_name || 'Guest'}
                  </div>
                  <div className="text-xs text-[#C59B27]">
                    {selectedInquiry.payload?.email || 'No email provided'}
                  </div>
                  <div className="text-xs text-white/70">
                    {selectedInquiry.payload?.phone || 'No phone provided'}
                  </div>
                </div>

                {/* Status Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#C59B27] mb-1.5">
                    Pipeline Status
                  </label>
                  <select
                    value={currentStatus}
                    onChange={(e) => {
                      setCurrentStatus(e.target.value);
                      handleUpdateInquiry(e.target.value);
                    }}
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  >
                    <option value="Pending">Pending (New Inquiry)</option>
                    <option value="Contacted">Contacted (Staff Reached Out)</option>
                    <option value="Offer Sent">Offer Sent (Quote Provided)</option>
                    <option value="Booked">Booked (Converted to Stay)</option>
                    <option value="Declined">Declined / Unavailable</option>
                  </select>
                </div>

                {/* Quoted Total Rate */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Quoted Total Rate (KES)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 85000"
                    value={quoteKes}
                    onChange={(e) => setQuoteKes(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                {/* Internal Host Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Internal Follow-Up Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Offered sea-view suite upgrade, awaiting deposit confirmation..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => handleUpdateInquiry()}
                    disabled={savingAction}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C59B27]" />
                    <span>Save Quote &amp; Notes</span>
                  </button>

                  {/* CONVERT TO CONFIRMED BOOKING BUTTON */}
                  <button
                    onClick={() => openConvertModal(selectedInquiry)}
                    className="w-full py-3 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Convert to Confirmed Booking</span>
                  </button>

                  <button
                    onClick={() => {
                      const token = selectedInquiry.payload?.guestToken || selectedInquiry.id;
                      const trackUrl = `${window.location.origin}/?token=${token}`;
                      navigator.clipboard.writeText(trackUrl);
                      toast.success('Guest tracking link copied to clipboard!');
                    }}
                    className="w-full py-2 rounded-xl bg-black/30 hover:bg-black/50 text-white/70 hover:text-white text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Guest Tracking Link</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-white/40 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs">
                  Select an inquiry from the left to view guest details, adjust pricing, or convert into a confirmed booking.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONVERT TO CONFIRMED BOOKING MODAL */}
      {showConvertModal && selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1F1615] rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-[#C59B27]/40 shadow-2xl relative text-white space-y-5 my-8">
            <button
              onClick={() => setShowConvertModal(false)}
              className="absolute top-5 right-5 text-white/60 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Reservation Conversion Engine
              </div>
              <h2 className="font-serif text-2xl font-bold text-white">
                Convert Inquiry to Confirmed Booking
              </h2>
              <p className="text-xs text-white/60 mt-0.5">
                Lock in unit allocation, final stay dates, payment reference, and deposit record into the master ledger.
              </p>
            </div>

            <form onSubmit={handleConfirmConversion} className="space-y-4 max-h-[72vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={convertForm.guestName}
                    onChange={(e) => setConvertForm({ ...convertForm, guestName: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Guest Email
                  </label>
                  <input
                    type="email"
                    value={convertForm.guestEmail}
                    onChange={(e) => setConvertForm({ ...convertForm, guestEmail: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Guest Phone Number
                  </label>
                  <input
                    type="text"
                    value={convertForm.guestPhone}
                    onChange={(e) => setConvertForm({ ...convertForm, guestPhone: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Room / Unit Allocated
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Suite 104, Harbour Wing 2B..."
                    value={convertForm.roomAllocated}
                    onChange={(e) => setConvertForm({ ...convertForm, roomAllocated: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Suite Type *
                  </label>
                  <select
                    value={convertForm.apartmentId}
                    onChange={(e) => {
                      const apt = apartments.find(a => a.id === e.target.value);
                      setConvertForm({
                        ...convertForm,
                        apartmentId: e.target.value,
                        apartmentName: apt?.name || e.target.value
                      });
                    }}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  >
                    {apartments.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Adults</label>
                    <input
                      type="number"
                      min="1"
                      value={convertForm.adults}
                      onChange={(e) => setConvertForm({ ...convertForm, adults: parseInt(e.target.value) || 1 })}
                      className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Children</label>
                    <input
                      type="number"
                      min="0"
                      value={convertForm.children}
                      onChange={(e) => setConvertForm({ ...convertForm, children: parseInt(e.target.value) || 0 })}
                      className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Check-In Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={convertForm.checkIn}
                    onChange={(e) => setConvertForm({ ...convertForm, checkIn: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Check-Out Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={convertForm.checkOut}
                    onChange={(e) => setConvertForm({ ...convertForm, checkOut: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              {/* Payment Details */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                  Financial &amp; Deposit Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-white/60 mb-1">Total Agreed Rate</label>
                    <input
                      type="number"
                      value={convertForm.totalAmount}
                      onChange={(e) => setConvertForm({ ...convertForm, totalAmount: Number(e.target.value) })}
                      className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-white/60 mb-1">Currency</label>
                    <select
                      value={convertForm.currency}
                      onChange={(e) => setConvertForm({ ...convertForm, currency: e.target.value })}
                      className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="KES">KES (Shillings)</option>
                      <option value="USD">USD (Dollars)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-white/60 mb-1">Payment Status</label>
                    <select
                      value={convertForm.paymentStatus}
                      onChange={(e) => setConvertForm({ ...convertForm, paymentStatus: e.target.value })}
                      className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="deposit_paid">Deposit Paid</option>
                      <option value="fully_paid">Fully Paid</option>
                      <option value="unpaid">Unpaid / Pay on Arrival</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-white/60 mb-1">Payment Channel</label>
                    <select
                      value={convertForm.paymentMethod}
                      onChange={(e) => setConvertForm({ ...convertForm, paymentMethod: e.target.value })}
                      className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="mpesa">M-Pesa Express / Till</option>
                      <option value="paystack">Paystack Direct</option>
                      <option value="card">Credit / Debit Card</option>
                      <option value="bank_transfer">Bank Wire / EFT</option>
                      <option value="opera_pms">Opera PMS Direct Folio</option>
                      <option value="cash">Cash on Arrival</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-white/60 mb-1">Transaction / Folio Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. M-Pesa QK8912, Opera Folio #12093..."
                      value={convertForm.paymentReference}
                      onChange={(e) => setConvertForm({ ...convertForm, paymentReference: e.target.value })}
                      className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                  Staff Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={convertForm.notes}
                  onChange={(e) => setConvertForm({ ...convertForm, notes: e.target.value })}
                  placeholder="Special guest requests, complimentary welcome package, arrival time..."
                  className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/20 text-white/70 text-xs font-bold uppercase tracking-wider hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {converting ? <RotateCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirm &amp; Create Booking</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
