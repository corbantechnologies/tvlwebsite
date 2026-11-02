'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, CreditCard, ExternalLink, Loader2, Mail, MessageCircle, RotateCcw, X } from 'lucide-react';
import { toWhatsAppNumber, whatsappLink } from '@/lib/contact';
import { MANAGEMENT } from '@/lib/auth/roles';

// Side panel on the Bookings Ledger: everything about one booking that
// the table has no room for, plus the staff actions on it.

type Props = {
  booking: any;
  staffRole: string;
  onClose: () => void;
  onUpdated: (booking: any) => void;
};

function money(cur: string | null | undefined, n: unknown) {
  return `${(cur || 'USD').toUpperCase()} ${Number(n || 0).toLocaleString()}`;
}

export default function BookingDetailsPanel({ booking: b, staffRole, onClose, onUpdated }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const isManager = MANAGEMENT.includes((staffRole || '').toLowerCase());
  const paidCurrency = (b.chargeCurrency || b.currency || 'USD').toUpperCase();
  const paidAmount = Number(b.amountPaid ?? b.chargeAmount ?? b.totalAmount) || 0;
  const ci = b.checkInDetails;
  const req = b.changeRequest;
  const guestWa = toWhatsAppNumber(b.guestPhone);

  const call = async (key: string, url: string, init: RequestInit, success: string) => {
    setBusy(key);
    try {
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed.');
      if (data.booking) onUpdated(data.booking);
      toast.success(data.message || success);
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const issueRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountText = refundAmount.trim() ? `${paidCurrency} ${refundAmount}` : `the full ${paidCurrency} ${paidAmount.toLocaleString()}`;
    if (!window.confirm(`Refund ${amountText} to ${b.guestName} through Paystack? This cannot be undone.`)) return;
    const ok = await call(
      'refund',
      `/api/bookings/${b.id}/refund`,
      { method: 'POST', body: JSON.stringify({ amount: refundAmount.trim() || undefined, reason: refundReason }) },
      'Refund started. Paystack will confirm when it completes.'
    );
    if (ok) setRefundOpen(false);
  };

  const row = (label: string, value: React.ReactNode) =>
    value === null || value === undefined || value === '' ? null : (
      <div className="grid grid-cols-[120px_1fr] gap-2 py-1.5 text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-900 break-words">{value}</span>
      </div>
    );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30" onClick={onClose}>
      <aside
        className="w-full max-w-md h-full overflow-y-auto bg-white border-l border-slate-200 shadow-2xl p-5 space-y-5"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Booking ${b.bookingReference}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#821124]">Booking</p>
            <h2 className="font-mono font-bold text-lg text-slate-900">{b.bookingReference}</h2>
            <p className="text-xs text-slate-500">{b.apartmentName} · {b.checkIn} to {b.checkOut}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest request needing action */}
        {req && req.status === 'open' && (
          <section className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-2">
            <p className="text-xs font-bold text-amber-900">
              {req.type === 'cancel' ? 'Guest asked to cancel (inside the free-cancellation period)' : `Guest asked to move to ${req.newCheckIn} to ${req.newCheckOut}`}
            </p>
            {req.message && <p className="text-xs text-amber-900">“{req.message}”</p>}
            <p className="text-[11px] text-amber-800">
              {req.type === 'cancel'
                ? 'Decide on the cancellation, update the status with Edit, refund if agreed, then mark this done.'
                : 'Change the dates with Edit, settle any price difference, then mark this done.'}
            </p>
            <div className="flex gap-2">
              <button
                disabled={!!busy}
                onClick={() => call('req', `/api/bookings/${b.id}`, { method: 'PATCH', body: JSON.stringify({ changeRequestStatus: 'done', note: 'Guest request handled.' }) }, 'Marked done.')}
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-semibold"
              >
                Mark done
              </button>
              <button
                disabled={!!busy}
                onClick={() => call('req', `/api/bookings/${b.id}`, { method: 'PATCH', body: JSON.stringify({ changeRequestStatus: 'declined', note: 'Guest request declined.' }) }, 'Marked declined.')}
                className="px-3 py-1.5 rounded-lg border border-amber-400 text-amber-900 text-[11px] font-semibold"
              >
                Decline
              </button>
            </div>
          </section>
        )}

        {/* Guest */}
        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Guest</h3>
          {row('Name', b.guestName)}
          {row('Email', <a className="text-[#821124] underline" href={`mailto:${b.guestEmail}`}>{b.guestEmail}</a>)}
          {row('Phone', b.guestPhone)}
          {row('Guests', `${b.adults} adult(s)${b.children ? `, ${b.children} child(ren)` : ''}`)}
          {row('Meal plan', b.mealPlanName)}
          {row('Requests', b.specialRequests)}
          <div className="flex flex-wrap gap-2 mt-2">
            {guestWa && (
              <a
                href={whatsappLink(`Hello ${b.guestName}, this is Tamarind Village about your booking ${b.bookingReference}.`, guestWa)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-[11px] font-semibold inline-flex items-center gap-1"
              >
                <MessageCircle className="w-3 h-3" /> WhatsApp guest
              </a>
            )}
            {b.guestToken && b.paymentStatus === 'paid' && (
              <a
                href={`/reservation/${encodeURIComponent(b.guestToken)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> E-reservation
              </a>
            )}
            {b.paymentStatus === 'paid' && (
              <button
                disabled={!!busy}
                onClick={() => {
                  if (window.confirm(`Email the confirmation and e-reservation to ${b.guestEmail}?`)) {
                    call('resend', `/api/bookings/${b.id}/resend-confirmation`, { method: 'POST' }, 'Confirmation sent.');
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
              >
                {busy === 'resend' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />} Resend confirmation
              </button>
            )}
          </div>
        </section>

        {/* Online check-in */}
        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
            <ClipboardCheck className="w-3.5 h-3.5" /> Online check-in
          </h3>
          {ci ? (
            <>
              {row('Submitted', new Date(ci.submittedAt).toLocaleString())}
              {row('Name on ID', ci.fullName)}
              {row('Nationality', ci.nationality)}
              {row('ID', `${String(ci.idType).replace('_', ' ')}: ${ci.idNumber}`)}
              {row('Arrival', [ci.arrivalTime, ci.arrivalBy, ci.flightOrTrain].filter(Boolean).join(' · '))}
              {row('Other guests', ci.otherGuests)}
              {row('Car', ci.carRegistration)}
              {row('Notes', ci.notes)}
            </>
          ) : (
            <p className="text-xs text-slate-500">Not done yet. The guest can do it from their confirmation email or the Track page.</p>
          )}
        </section>

        {/* Payment */}
        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" /> Payment
          </h3>
          {row('Booking total', money(b.currency, b.totalAmount))}
          {row('Paid', b.paymentStatus === 'paid' || b.paymentStatus === 'refunded' ? `${money(paidCurrency, paidAmount)}${b.paidAt ? ` on ${new Date(b.paidAt).toLocaleDateString()}` : ''}` : b.paymentStatus)}
          {row('Method', b.paymentMethod)}
          {row('Paystack ref', b.paymentReference && <span className="font-mono">{b.paymentReference}</span>)}
          {row('Refund', b.refundStatus && `${b.refundStatus}${b.refundAmount ? ` (${money(paidCurrency, b.refundAmount)})` : ''}`)}

          {b.paymentStatus === 'paid' && !['processing', 'refunded'].includes(b.refundStatus || '') && (
            isManager ? (
              !refundOpen ? (
                <button
                  onClick={() => setRefundOpen(true)}
                  className={`mt-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 ${
                    b.refundStatus === 'due' ? 'bg-rose-600 text-white' : 'border border-rose-300 text-rose-700'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" /> {b.refundStatus === 'due' ? 'Issue refund (due)' : 'Refund'}
                </button>
              ) : (
                <form onSubmit={issueRefund} className="mt-2 space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <label className="block text-[11px] text-rose-900">
                    Amount in {paidCurrency} (leave empty for the full {paidAmount.toLocaleString()})
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={paidAmount}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="mt-1 w-full border border-rose-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                    />
                  </label>
                  <label className="block text-[11px] text-rose-900">
                    Reason
                    <input
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="e.g. Cancelled within free period"
                      className="mt-1 w-full border border-rose-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button type="submit" disabled={!!busy} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-semibold">
                      {busy === 'refund' ? 'Sending...' : 'Refund via Paystack'}
                    </button>
                    <button type="button" onClick={() => setRefundOpen(false)} className="px-3 py-1.5 rounded-lg border border-rose-300 text-[11px]">
                      Cancel
                    </button>
                  </div>
                </form>
              )
            ) : (
              b.refundStatus === 'due' && <p className="text-[11px] text-rose-700 mt-1">Refund due: ask a manager to issue it.</p>
            )
          )}
        </section>

        {/* Notes */}
        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Activity and notes</h3>
          {Array.isArray(b.staffNotes) && b.staffNotes.length > 0 ? (
            <ul className="space-y-2">
              {[...b.staffNotes].reverse().map((n: any, i: number) => (
                <li key={i} className={`text-xs rounded-lg p-2 ${String(n.text).startsWith('ACTION NEEDED') ? 'bg-rose-50 border border-rose-200' : 'bg-slate-50'}`}>
                  <p className="text-slate-900">{n.text}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{n.author} · {n.timestamp ? new Date(n.timestamp).toLocaleString() : ''}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">No notes yet.</p>
          )}
        </section>
      </aside>
    </div>
  );
}
