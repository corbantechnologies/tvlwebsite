import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GuideLayout, { Tip, type GuideSection } from '@/components/GuideLayout';
import { PROPERTY, freeCancellationHours, whatsappLink } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Guest guide: booking and managing your stay | Tamarind Village',
  description:
    'How to book a Tamarind Village apartment, pay by card or M-Pesa, find your e-reservation, check in online, change dates, cancel and get help.',
};

const hours = freeCancellationHours();
const wa = whatsappLink('Hello Tamarind Village, I have a question about booking.');

const sections: GuideSection[] = [
  {
    id: 'book',
    title: 'Book an apartment',
    body: (
      <>
        <ol>
          <li>Open <Link href="/apartments">Apartments</Link> and choose a one, two or three-bedroom apartment.</li>
          <li>Pick your check-in and check-out dates. We tell you straight away if the apartment is free; if it is not, try other dates or another apartment.</li>
          <li>Choose the number of guests, a meal plan (room only, bed and breakfast or half board) and any extras such as an airport transfer.</li>
          <li>Enter a promo code if you have one, then your name, email and phone number.</li>
          <li>Choose how to pay (see the next section) and select <strong>Proceed to Payment</strong>.</li>
        </ol>
        <p>Your apartment is held for 30 minutes while you pay. Check-in is from 2:00 pm and check-out is by 10:00 am.</p>
      </>
    ),
  },
  {
    id: 'pay',
    title: 'Pay by card or M-Pesa',
    body: (
      <>
        <p>Payments go through Paystack, a secure payment provider. You choose the currency before paying:</p>
        <table>
          <thead><tr><th>Pay in</th><th>Use it for</th></tr></thead>
          <tbody>
            <tr><td><strong>USD</strong></td><td>International Visa and Mastercard cards.</td></tr>
            <tr><td><strong>KES</strong></td><td>M-Pesa and Kenyan cards. The price is converted from USD at the rate shown on the form.</td></tr>
          </tbody>
        </table>
        <p>For M-Pesa, Paystack sends a prompt to your phone; enter your M-Pesa PIN to approve. Keep the payment page open until it confirms.</p>
        <Tip>If the payment page closes before it confirms, don&apos;t pay again. Check your email first, or message us with your phone number and we will confirm it for you.</Tip>
      </>
    ),
  },
  {
    id: 'confirmation',
    title: 'Your confirmation and e-reservation',
    body: (
      <>
        <p>As soon as payment goes through you receive an email with:</p>
        <ul>
          <li>Your <strong>booking reference</strong> (it starts with TVL-) and your <strong>access code</strong> (for example TVL-7K2Q9X).</li>
          <li>Your <strong>e-reservation</strong> as a PDF. Show its QR code at reception on arrival, on your phone or printed.</li>
          <li>Buttons to view the e-reservation online, check in online and message us on WhatsApp.</li>
        </ul>
        <p>No email after a few minutes? Check your spam folder, then contact us with your name and travel dates.</p>
      </>
    ),
  },
  {
    id: 'manage',
    title: 'Find and manage your booking',
    body: (
      <>
        <p>
          Open <Link href="/track">Manage booking</Link> and enter your access code, or use the link in your confirmation email. There you can:
        </p>
        <ul>
          <li>see your dates, apartment, payment and, closer to arrival, your apartment number;</li>
          <li>view or download your e-reservation;</li>
          <li>add special requests, dietary needs and your arrival time;</li>
          <li>check in online, ask to change dates, or cancel.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'checkin',
    title: 'Check in online',
    body: (
      <>
        <p>Save time at reception by checking in online before you travel:</p>
        <ol>
          <li>Open your booking and select <strong>Check in online</strong>.</li>
          <li>Enter the lead guest&apos;s name as it appears on their ID, nationality, and passport or ID number.</li>
          <li>Add your arrival time and flight or train number so we can plan your welcome, and the names of other guests.</li>
          <li>Select <strong>Submit check-in</strong>. You can update it until your stay begins.</li>
        </ol>
        <p>Please still bring the passport or national ID of every adult guest; reception will ask to see them.</p>
      </>
    ),
  },
  {
    id: 'change',
    title: 'Change your dates',
    body: (
      <>
        <p>
          Open your booking, select <strong>Change dates</strong>, choose the new dates and send the request. We show you whether the new dates look available. Your booking does not change until our team confirms it by email, including any difference in price.
        </p>
      </>
    ),
  },
  {
    id: 'cancel',
    title: 'Cancel and refunds',
    body: (
      <>
        <table>
          <thead><tr><th>When you cancel</th><th>What happens</th></tr></thead>
          <tbody>
            <tr><td>Before you have paid</td><td>The booking is cancelled straight away.</td></tr>
            <tr><td>More than {hours} hours before check-in (2 pm)</td><td>The booking is cancelled and you get a full refund to the card or M-Pesa number you paid with.</td></tr>
            <tr><td>Less than {hours} hours before check-in</td><td>Your request goes to our team, who will contact you. The booking stays active until then.</td></tr>
          </tbody>
        </table>
        <p>To cancel, open your booking and select <strong>Cancel Reservation</strong>. Card refunds usually reach you in 5 to 10 working days; M-Pesa refunds are faster.</p>
      </>
    ),
  },
  {
    id: 'more',
    title: 'Events, dining and transfers',
    body: (
      <ul>
        <li><strong>Event tickets</strong>: choose an event on <Link href="/events">Events</Link>, pay online, and you receive an e-ticket by email. Show it at the entrance.</li>
        <li><strong>Restaurant, Dawa Terrace and the Dhow</strong>: send a reservation request from <Link href="/dining">Dining</Link>; the venue team replies by email.</li>
        <li><strong>Airport and SGR transfers</strong>: add one when you book, use <Link href="/transfers">Transfers</Link>, or ask us on WhatsApp.</li>
      </ul>
    ),
  },
  {
    id: 'help',
    title: 'Get help',
    body: (
      <>
        <ul>
          <li>WhatsApp: <a href={wa} target="_blank" rel="noopener noreferrer">chat with reservations</a></li>
          <li>Phone: {PROPERTY.phoneDisplay}</li>
          <li>Email: <a href={`mailto:${PROPERTY.email}`}>{PROPERTY.email}</a></li>
          <li>Address: {PROPERTY.address}</li>
        </ul>
        <p>Have your booking reference or access code ready so we can find your booking quickly.</p>
      </>
    ),
  },
];

export default function GuestGuidePage() {
  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <header className="border-b border-[#e2d9d0] bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="font-serif font-bold tracking-wider text-[#1F1615]">TAMARIND VILLAGE</Link>
          <Link href="/" className="text-xs text-[#821124] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to the site
          </Link>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#821124]">Guest guide</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1F1615] mt-1">Booking and managing your stay</h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          Everything you can do on this website, from booking to check-out. Can&apos;t find an answer? <a className="text-[#821124] underline" href={wa} target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a>.
        </p>
        <div className="mt-8">
          <GuideLayout sections={sections} theme="warm" />
        </div>
      </div>
    </main>
  );
}
