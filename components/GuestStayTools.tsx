'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarClock, ClipboardCheck, Download, FileText, MessageCircle } from 'lucide-react';
import { whatsappLink } from '@/lib/contact';
import { propertyToday } from '@/lib/dates';

// Guest self-service for a confirmed booking: e-reservation, online
// check-in, date-change request and WhatsApp. Shown inside the tracker.

type Props = {
  booking: any;
  token: string;
  onUpdated: (booking: any) => void;
};

const inputCls =
  'w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]';
const labelCls = 'block text-[10px] font-bold uppercase text-[#C59B27] mb-1';

export default function GuestStayTools({ booking, token, onUpdated }: Props) {
  const [panel, setPanel] = useState<'none' | 'checkin' | 'change'>('none');
  const [saving, setSaving] = useState(false);

  const [checkin, setCheckin] = useState({
    fullName: booking.guestName || '',
    nationality: '',
    idType: 'passport',
    idNumber: '',
    arrivalTime: '',
    arrivalBy: 'flight',
    flightOrTrain: '',
    otherGuests: '',
    carRegistration: '',
    notes: '',
  });
  const [change, setChange] = useState({ newCheckIn: booking.checkIn || '', newCheckOut: booking.checkOut || '', message: '' });

  const status = String(booking.bookingStatus || '');
  const paid = booking.paymentStatus === 'paid';
  const active = !['cancelled', 'expired', 'payment_failed', 'no_show', 'checked_out'].includes(status);
  const canCheckIn = paid && active && booking.checkOut >= propertyToday();
  const canChange = active && status !== 'in_house';
  const req = booking.changeRequest;

  const post = async (path: string, body: unknown) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/guest/booking/${encodeURIComponent(token)}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      if (data.booking) onUpdated(data.booking);
      return data;
    } finally {
      setSaving(false);
    }
  };

  const submitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await post('checkin', checkin);
      toast.success('Online check-in saved. See you soon!');
      setPanel('none');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const submitChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await post('change', change);
      toast.success(data.message || 'Request sent.');
      setPanel('none');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const tokenPath = encodeURIComponent(token);

  return (
    <div className="space-y-3">
      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {paid && (
          <a
            href={`/reservation/${tokenPath}`}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-black/30 border border-white/10 hover:border-[#C59B27]/60 text-center"
          >
            <FileText className="w-4 h-4 text-[#C59B27]" />
            <span className="text-[11px] font-bold">E-reservation</span>
          </a>
        )}
        {paid && (
          <a
            href={`/api/guest/booking/${tokenPath}/pdf`}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-black/30 border border-white/10 hover:border-[#C59B27]/60 text-center"
          >
            <Download className="w-4 h-4 text-[#C59B27]" />
            <span className="text-[11px] font-bold">Download PDF</span>
          </a>
        )}
        {canCheckIn && (
          <button
            type="button"
            onClick={() => setPanel(panel === 'checkin' ? 'none' : 'checkin')}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-black/30 border border-white/10 hover:border-[#C59B27]/60 cursor-pointer"
          >
            <ClipboardCheck className={`w-4 h-4 ${booking.checkInDone ? 'text-emerald-400' : 'text-[#C59B27]'}`} />
            <span className="text-[11px] font-bold">{booking.checkInDone ? 'Checked in online' : 'Check in online'}</span>
          </button>
        )}
        {canChange && (
          <button
            type="button"
            onClick={() => setPanel(panel === 'change' ? 'none' : 'change')}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-black/30 border border-white/10 hover:border-[#C59B27]/60 cursor-pointer"
          >
            <CalendarClock className="w-4 h-4 text-[#C59B27]" />
            <span className="text-[11px] font-bold">Change dates</span>
          </button>
        )}
        <a
          href={whatsappLink(`Hello Tamarind Village, this is ${booking.guestName} (booking ${booking.bookingReference}).`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#25D366]/15 border border-[#25D366]/40 hover:border-[#25D366] text-center"
        >
          <MessageCircle className="w-4 h-4 text-[#25D366]" />
          <span className="text-[11px] font-bold">WhatsApp us</span>
        </a>
      </div>

      {/* Status notes */}
      {req && req.status === 'open' && (
        <p className="text-[11px] text-amber-200 bg-amber-950/40 border border-amber-500/30 rounded-xl p-3">
          {req.type === 'cancel'
            ? 'Your cancellation request is with our team. They will contact you shortly.'
            : `Your request to move to ${req.newCheckIn} to ${req.newCheckOut} is with our team. They will confirm by email.`}
        </p>
      )}
      {booking.refundStatus && (
        <p className="text-[11px] text-emerald-200 bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3">
          {booking.refundStatus === 'refunded'
            ? 'Your refund has been processed.'
            : booking.refundStatus === 'failed'
              ? 'There was a problem with your refund. Our team has been alerted and will contact you.'
              : 'Your refund is being processed. Card refunds can take 5 to 10 working days.'}
        </p>
      )}

      {/* Online check-in */}
      {panel === 'checkin' && (
        <form onSubmit={submitCheckIn} className="bg-black/20 p-4 rounded-xl border border-white/10 space-y-3">
          <p className="text-[11px] text-white/70">
            Share these details now and your keys will be ready when you arrive. Reception will still ask to see the ID.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Full name (as on ID)</label>
              <input required className={inputCls} value={checkin.fullName} onChange={(e) => setCheckin({ ...checkin, fullName: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Nationality</label>
              <input required className={inputCls} value={checkin.nationality} onChange={(e) => setCheckin({ ...checkin, nationality: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>ID type</label>
              <select className={inputCls} value={checkin.idType} onChange={(e) => setCheckin({ ...checkin, idType: e.target.value })}>
                <option value="passport">Passport</option>
                <option value="national_id">Kenyan national ID</option>
                <option value="alien_id">Alien ID</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>ID / passport number</label>
              <input required className={inputCls} value={checkin.idNumber} onChange={(e) => setCheckin({ ...checkin, idNumber: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Arrival time</label>
              <input placeholder="e.g. 15:30" className={inputCls} value={checkin.arrivalTime} onChange={(e) => setCheckin({ ...checkin, arrivalTime: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Arriving by</label>
              <select className={inputCls} value={checkin.arrivalBy} onChange={(e) => setCheckin({ ...checkin, arrivalBy: e.target.value })}>
                <option value="flight">Flight</option>
                <option value="train">SGR train</option>
                <option value="car">Car</option>
                <option value="other">Other</option>
              </select>
            </div>
            {(checkin.arrivalBy === 'flight' || checkin.arrivalBy === 'train') && (
              <div>
                <label className={labelCls}>Flight / train number</label>
                <input className={inputCls} value={checkin.flightOrTrain} onChange={(e) => setCheckin({ ...checkin, flightOrTrain: e.target.value })} />
              </div>
            )}
            {checkin.arrivalBy === 'car' && (
              <div>
                <label className={labelCls}>Car registration</label>
                <input className={inputCls} value={checkin.carRegistration} onChange={(e) => setCheckin({ ...checkin, carRegistration: e.target.value })} />
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Other guests&apos; names</label>
            <input className={inputCls} value={checkin.otherGuests} onChange={(e) => setCheckin({ ...checkin, otherGuests: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Anything else we should know?</label>
            <textarea rows={2} className={inputCls} value={checkin.notes} onChange={(e) => setCheckin({ ...checkin, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setPanel('none')} className="px-3 py-1.5 rounded-lg border border-white/20 text-xs">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg bg-[#821124] text-xs font-bold uppercase tracking-wider">
              {saving ? 'Saving...' : 'Submit check-in'}
            </button>
          </div>
        </form>
      )}

      {/* Change dates */}
      {panel === 'change' && (
        <form onSubmit={submitChange} className="bg-black/20 p-4 rounded-xl border border-white/10 space-y-3">
          <p className="text-[11px] text-white/70">
            Ask to move your stay. Our team confirms the new dates and any price difference before anything changes.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>New check-in</label>
              <input type="date" required min={propertyToday()} className={inputCls} value={change.newCheckIn} onChange={(e) => setChange({ ...change, newCheckIn: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>New check-out</label>
              <input type="date" required min={change.newCheckIn || propertyToday()} className={inputCls} value={change.newCheckOut} onChange={(e) => setChange({ ...change, newCheckOut: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Message (optional)</label>
            <textarea rows={2} className={inputCls} value={change.message} onChange={(e) => setChange({ ...change, message: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setPanel('none')} className="px-3 py-1.5 rounded-lg border border-white/20 text-xs">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg bg-[#821124] text-xs font-bold uppercase tracking-wider">
              {saving ? 'Sending...' : 'Send request'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
