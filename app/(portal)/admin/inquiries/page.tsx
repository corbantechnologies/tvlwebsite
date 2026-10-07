'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, Search, CheckCircle2, Clock, Mail, Phone, MessageSquare, 
  ArrowRight, Filter, Calendar, Building2, CreditCard, DollarSign, 
  UserCheck, ShieldCheck, X, RotateCw, ExternalLink, Copy, Check, Loader2, Trash2 
} from 'lucide-react';
import toast from 'react-hot-toast';

function formatInquiryDate(dateStr?: string) {
  if (!dateStr) return 'Recently received';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Delete state
  const [inquiryToDelete, setInquiryToDelete] = useState<any | null>(null);
  const [deletingInquiry, setDeletingInquiry] = useState(false);

  // Editing state for selected inquiry
  const [quoteKes, setQuoteKes] = useState('');
  const [notes, setNotes] = useState('');
  const [currentStatus, setCurrentStatus] = useState('Pending');
  const [savingAction, setSavingAction] = useState(false);

  // Conversion Modal State
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertForm, setConvertForm] = useState<{
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    apartmentId: string;
    apartmentName: string;
    roomAllocated: string;
    checkIn: string;
    checkOut: string;
    adults: number | '';
    children: number | '';
    totalAmount: number | '';
    currency: string;
    paymentMethod: string;
    paymentReference: string;
    paymentStatus: string;
    notes: string;
  }>({
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
        fetch('/api/apartments?all=true')
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
        toast.success(`Inquiry updated to ${targetStatus}`);
        fetchInquiries();
      } else {
        toast.error('Failed to update inquiry status');
      }
    } catch {
      toast.error('Network error updating inquiry');
    } finally {
      setSavingAction(false);
    }
  };

  const confirmDeleteInquiry = async () => {
    if (!inquiryToDelete) return;
    setDeletingInquiry(true);
    try {
      const res = await fetch(`/api/inquiries/${inquiryToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Deleted inquiry from ${inquiryToDelete.payload?.name || inquiryToDelete.guest_name || 'Guest'}`);
        if (selectedInquiry?.id === inquiryToDelete.id) {
          setSelectedInquiry(null);
        }
        setInquiryToDelete(null);
        fetchInquiries();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete inquiry');
      }
    } catch {
      toast.error('Network error deleting inquiry');
    } finally {
      setDeletingInquiry(false);
    }
  };

  const openConvertModal = (inq: any) => {
    const p = inq.payload || {};
    const defaultApt = apartments.find(a => a.id === inq.apartment_id || a.id === p.apartmentId) || apartments[0];
    
    setConvertForm({
      guestName: p.name || inq.guest_name || '',
      guestEmail: p.email || inq.guest_email || '',
      guestPhone: p.phone || inq.guest_phone || '',
      apartmentId: defaultApt?.id || '1-bedroom',
      apartmentName: defaultApt?.name || '1-Bedroom Luxury Suite',
      roomAllocated: p.roomAllocated || '',
      checkIn: p.checkIn || new Date().toISOString().split('T')[0],
      checkOut: p.checkOut || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      adults: Number(p.adults || p.guests || 2),
      children: Number(p.children || 0),
      totalAmount: Number(p.quotedRateKes || quoteKes || 45000),
      currency: 'KES',
      paymentMethod: 'mpesa',
      paymentReference: '',
      paymentStatus: 'deposit_paid',
      notes: notes || p.specialRequests || '',
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
          adults: Number(convertForm.adults) || 1,
          children: Number(convertForm.children) || 0,
          totalAmount: Number(convertForm.totalAmount) || 0,
          payload: {
            ...selectedInquiry.payload,
            roomAllocated: convertForm.roomAllocated,
            paymentReference: convertForm.paymentReference,
            paymentMethod: convertForm.paymentMethod,
            paymentStatus: convertForm.paymentStatus,
            quotedRateKes: Number(convertForm.totalAmount) || 0,
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#821124] font-bold uppercase tracking-wider mb-1">
            <Bell className="w-3.5 h-3.5" /> Direct Inquiries Inbox
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Guest Reservation Inquiries
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track inquiries lodged directly on the website, respond with quotes, and convert them into confirmed bookings.
          </p>
        </div>

        <button
          onClick={fetchInquiries}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#821124] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ref, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124] shadow-xs"
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

            const isInquiryDining = inq.type === 'restaurant' || inq.venue === 'dhow' || inq.venue === 'dawa_terrace' || !!p.diningName;
            const isInquiryApartment = inq.type === 'apartment' || !!p.apartmentName || (!!p.checkIn && p.checkIn !== 'Flexible / Not specified');
            const guestMessage = p.message || p.requests || p.specialRequests || p.details || p.comments;

            return (
              <div
                key={inq.id}
                onClick={() => handleSelect(inq)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-white border-[#821124] ring-2 ring-[#821124]/30 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-[10px] text-[#821124] uppercase tracking-wider font-semibold">
                        REF: {refToken.toString().toUpperCase()}
                      </span>
                      {isInquiryDining ? (
                        <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[9px] font-bold uppercase">
                          Dining & Experiences
                        </span>
                      ) : isInquiryApartment ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-bold uppercase">
                          Apartment Stay
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[9px] font-bold uppercase">
                          {p.department ? `Contact: ${p.department}` : 'General Inquiry'}
                        </span>
                      )}
                      {p.bookingReference && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-bold uppercase">
                          Booking: {p.bookingReference}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-lg font-bold text-slate-900">
                      {p.name || inq.guest_name || 'Website Guest'}
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
                      <span>{p.email || inq.guest_email || 'No email'}</span>
                      <span>•</span>
                      <span>{p.phone || inq.guest_phone || 'No phone'}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatInquiryDate(inq.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full whitespace-nowrap ${
                      isBooked ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      inq.status === 'Offer Sent' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      inq.status === 'Contacted' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                      inq.status === 'Declined' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {inq.status}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInquiryToDelete(inq);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete inquiry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details Bar */}
                {isInquiryApartment ? (
                  <div className="grid grid-cols-3 gap-2 text-xs py-3 border-y border-slate-100 mt-3 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Stay Dates:</span>
                      <span className="font-semibold text-slate-900 truncate block">
                        {p.checkIn && p.checkIn !== 'Flexible / Not specified' ? p.checkIn : 'Flexible'} → {p.checkOut && p.checkOut !== 'Flexible / Not specified' ? p.checkOut : 'Flexible'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Suite / Guests:</span>
                      <span className="font-semibold text-slate-900 truncate block">
                        {p.apartmentName || inq.apartment_id || 'Suite Inquiry'} ({p.adults || p.guests || 1}A, {p.children || 0}C)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Quoted Rate:</span>
                      <span className="font-bold text-[#821124] block">
                        {p.quotedRateKes ? `KES ${Number(p.quotedRateKes).toLocaleString()}` : 'Pending Quote'}
                      </span>
                    </div>
                  </div>
                ) : isInquiryDining ? (
                  <div className="grid grid-cols-3 gap-2 text-xs py-3 border-y border-slate-100 mt-3 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Experience / Venue:</span>
                      <span className="font-semibold text-slate-900 truncate block">
                        {p.diningName || inq.venue || 'Tamarind Dining'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Reservation Time:</span>
                      <span className="font-semibold text-slate-900 truncate block">
                        {p.date ? `${p.date}${p.time ? ` at ${p.time}` : ''}` : 'Date Flexible'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Party Size:</span>
                      <span className="font-semibold text-[#821124] block">
                        {p.guests ? `${p.guests} Guests` : 'Party TBD'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-xs py-3 border-y border-slate-100 mt-3 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Department:</span>
                      <span className="font-semibold text-slate-900 truncate block">
                        {p.department || 'Guest Relations'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Channel:</span>
                      <span className="font-semibold text-slate-900 truncate block">
                        Website Contact Form
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Status:</span>
                      <span className="font-semibold text-[#821124] block">
                        {inq.status || 'Pending Response'}
                      </span>
                    </div>
                  </div>
                )}

                {guestMessage && (
                  <p className="text-xs text-slate-700 pt-2.5 italic line-clamp-2 bg-slate-50/70 p-2 rounded-lg border border-slate-100/80 mt-2">
                    &ldquo;{guestMessage}&rdquo;
                  </p>
                )}

                {p.roomAllocated && (
                  <div className="mt-2 text-[11px] text-emerald-700 font-medium">
                    Allocated: {p.roomAllocated}
                  </div>
                )}
              </div>
            );
          })}

          {filteredInquiries.length === 0 && !loading && (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300 space-y-2 shadow-xs">
              <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-900">No inquiries found</p>
              <p className="text-xs text-slate-500">
                {search || statusFilter !== 'all' 
                  ? 'No inquiries match your current search or filter criteria.' 
                  : 'New direct inquiries submitted by visitors on the website will stream here in real-time.'}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Actions & Quotation Panel */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 sticky top-24">
            <h3 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Inquiry Inspector</span>
              {selectedInquiry && (
                <span className="text-xs font-sans font-normal text-[#821124]">
                  REF: {(selectedInquiry.payload?.guestToken || selectedInquiry.id).toString().toUpperCase()}
                </span>
              )}
            </h3>

            {selectedInquiry ? (
              <div className="space-y-4">
                {/* Guest Summary Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Guest Profile</span>
                    <span className="text-[10px] text-slate-600 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatInquiryDate(selectedInquiry.createdAt)}
                    </span>
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    {selectedInquiry.payload?.name || selectedInquiry.guest_name || 'Guest'}
                  </div>
                  <div className="text-xs text-[#821124] font-medium">
                    {selectedInquiry.payload?.email || 'No email provided'}
                  </div>
                  <div className="text-xs text-slate-600">
                    {selectedInquiry.payload?.phone || 'No phone provided'}
                  </div>
                </div>

                {/* Full Guest Message if provided */}
                {(selectedInquiry.payload?.message || selectedInquiry.payload?.requests || selectedInquiry.payload?.specialRequests || selectedInquiry.payload?.details || selectedInquiry.payload?.comments) && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 text-xs text-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                      Inquiry Message / Request:
                    </span>
                    <p className="italic leading-relaxed whitespace-pre-line text-slate-700">
                      &ldquo;{selectedInquiry.payload?.message || selectedInquiry.payload?.requests || selectedInquiry.payload?.specialRequests || selectedInquiry.payload?.details || selectedInquiry.payload?.comments}&rdquo;
                    </p>
                  </div>
                )}

                {/* Status Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Pipeline Status
                  </label>
                  <select
                    value={currentStatus}
                    onChange={(e) => {
                      setCurrentStatus(e.target.value);
                      handleUpdateInquiry(e.target.value);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quoted Total Rate (KES)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 85000"
                    value={quoteKes}
                    onChange={(e) => setQuoteKes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#821124]"
                  />
                </div>

                {/* Internal Host Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Internal Follow-Up Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Offered sea-view suite upgrade, awaiting deposit confirmation..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleUpdateInquiry()}
                    disabled={savingAction}
                    className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-slate-200"
                  >
                    {savingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>Save Quote &amp; Notes</span>
                  </button>

                  {/* CONVERT TO CONFIRMED BOOKING BUTTON */}
                  <button
                    onClick={() => openConvertModal(selectedInquiry)}
                    className="w-full py-2.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-white" />
                    <span>Convert to Confirmed Booking</span>
                  </button>

                  <button
                    onClick={() => {
                      const token = selectedInquiry.payload?.guestToken || selectedInquiry.id;
                      const trackUrl = `${window.location.origin}/?token=${token}`;
                      navigator.clipboard.writeText(trackUrl);
                      toast.success('Guest tracking link copied to clipboard!');
                    }}
                    className="w-full py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Guest Tracking Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInquiryToDelete(selectedInquiry)}
                    className="w-full py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Inquiry</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative text-slate-900 space-y-5 my-8">
            <button
              onClick={() => setShowConvertModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Reservation Conversion Engine
              </div>
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                Convert Inquiry to Confirmed Booking
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Lock in unit allocation, final stay dates, payment reference, and deposit record into the master ledger.
              </p>
            </div>

            <form onSubmit={handleConfirmConversion} className="space-y-4 max-h-[72vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={convertForm.guestName}
                    onChange={(e) => setConvertForm({ ...convertForm, guestName: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guest Email
                  </label>
                  <input
                    type="email"
                    value={convertForm.guestEmail}
                    onChange={(e) => setConvertForm({ ...convertForm, guestEmail: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guest Phone Number
                  </label>
                  <input
                    type="text"
                    value={convertForm.guestPhone}
                    onChange={(e) => setConvertForm({ ...convertForm, guestPhone: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Room / Unit Allocated
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Suite 104, Harbour Wing 2B..."
                    value={convertForm.roomAllocated}
                    onChange={(e) => setConvertForm({ ...convertForm, roomAllocated: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#821124]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  >
                    {apartments.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Adults</label>
                    <input
                      type="number"
                      min="1"
                      value={convertForm.adults ?? ''}
                      onChange={(e) => setConvertForm({ ...convertForm, adults: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Children</label>
                    <input
                      type="number"
                      min="0"
                      value={convertForm.children ?? ''}
                      onChange={(e) => setConvertForm({ ...convertForm, children: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Check-In Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={convertForm.checkIn}
                    onChange={(e) => setConvertForm({ ...convertForm, checkIn: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Check-Out Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={convertForm.checkOut}
                    onChange={(e) => setConvertForm({ ...convertForm, checkOut: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              </div>

              {/* Payment Details */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Financial &amp; Deposit Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Total Agreed Rate</label>
                    <input
                      type="number"
                      value={convertForm.totalAmount ?? ''}
                      onChange={(e) => setConvertForm({ ...convertForm, totalAmount: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Currency</label>
                    <select
                      value={convertForm.currency}
                      onChange={(e) => setConvertForm({ ...convertForm, currency: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                    >
                      <option value="KES">KES (Shillings)</option>
                      <option value="USD">USD (Dollars)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Payment Status</label>
                    <select
                      value={convertForm.paymentStatus}
                      onChange={(e) => setConvertForm({ ...convertForm, paymentStatus: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                    >
                      <option value="deposit_paid">Deposit Paid</option>
                      <option value="fully_paid">Fully Paid</option>
                      <option value="unpaid">Unpaid / Pay on Arrival</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Payment Channel</label>
                    <select
                      value={convertForm.paymentMethod}
                      onChange={(e) => setConvertForm({ ...convertForm, paymentMethod: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
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
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Transaction / Folio Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. M-Pesa QK8912, Opera Folio #12093..."
                      value={convertForm.paymentReference}
                      onChange={(e) => setConvertForm({ ...convertForm, paymentReference: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={convertForm.notes}
                  onChange={(e) => setConvertForm({ ...convertForm, notes: e.target.value })}
                  placeholder="Special guest requests, complimentary welcome package, arrival time..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {converting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Confirm &amp; Create Booking</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE INQUIRY CONFIRMATION MODAL */}
      {inquiryToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative text-slate-900 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">Delete Inquiry</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete the inquiry from{' '}
                  <strong className="text-slate-800">
                    {inquiryToDelete.payload?.name || inquiryToDelete.guest_name || 'this guest'}
                  </strong>
                  ? This record will be removed from the database and cannot be recovered.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={deletingInquiry}
                onClick={() => setInquiryToDelete(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingInquiry}
                onClick={confirmDeleteInquiry}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingInquiry ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
