import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import GuideLayout, { Tip, type GuideSection } from '@/components/GuideLayout';
import { freeCancellationHours } from '@/lib/contact';

// Staff guide: how to run the portal day to day. Kept in plain language for
// front desk, reservations and managers; the last section is for whoever
// looks after the website settings.

const hours = freeCancellationHours();

const sections: GuideSection[] = [
  {
    id: 'start',
    title: 'Signing in and your role',
    tag: 'Everyone',
    body: (
      <>
        <p>
          Sign in at <Link href="/admin/login">/admin/login</Link> with your work email. Forgot your password? Select <strong>Forgot your password?</strong> on that page; a reset link valid for one hour is emailed to you. New passwords need at least 10 characters with a letter and a number.
        </p>
        <p>What you see in the menu depends on your role. The website enforces the same rules, so a hidden page cannot be opened by typing its address.</p>
        <table>
          <thead><tr><th>Role</th><th>Can do</th></tr></thead>
          <tbody>
            <tr><td><strong>Admin / General Manager</strong></td><td>Everything, including staff accounts and audit logs.</td></tr>
            <tr><td><strong>Manager</strong></td><td>Apartments, dining, events, pricing, policies, homepage content, reports and refunds.</td></tr>
            <tr><td><strong>Reservations</strong></td><td>Bookings, inquiries, availability and blocks, rate periods, meal plans, extras and promo codes.</td></tr>
            <tr><td><strong>Reception / Front desk</strong></td><td>Front desk hub, bookings, unit allocation, transfers, ticket ledger and gate check-in.</td></tr>
            <tr><td><strong>Gate / Security</strong></td><td>Event gate check-in only.</td></tr>
          </tbody>
        </table>
      </>
    ),
  },
  {
    id: 'daily',
    title: 'Your daily routine',
    tag: 'Front desk · Reservations',
    body: (
      <>
        <p>Every morning at about 6:00 am the reservations inbox receives a <strong>Daily briefing</strong> email. Work through it in this order:</p>
        <ol>
          <li><strong>Today&apos;s arrivals</strong>, with whether each guest has checked in online. Allocate units in <Link href="/admin/bookings">Bookings</Link>.</li>
          <li><strong>Guest requests waiting for you</strong>: date changes and late cancellations (see section 4).</li>
          <li><strong>Refunds to issue</strong>: guests who cancelled within the free period. A manager issues these (section 5).</li>
          <li><strong>Payments recovered from Paystack</strong>: payments the website missed and has now recorded. These guests were not emailed; open the booking and select <strong>Resend confirmation</strong>.</li>
          <li><strong>Abandoned checkouts</strong>: guests who started paying but did not finish. A friendly call or WhatsApp often wins the booking back.</li>
        </ol>
        <p>During the day, the <Link href="/admin/frontdesk">Front Desk Hub</Link> shows arrivals, in-house guests and departures.</p>
      </>
    ),
  },
  {
    id: 'bookings',
    title: 'Bookings ledger and booking details',
    tag: 'Front desk · Reservations',
    body: (
      <>
        <p>Open <Link href="/admin/bookings">Bookings</Link>. Badges under the guest name tell you what needs attention: <strong>Checked in online</strong>, <strong>Date change request</strong>, <strong>Cancel request</strong>, <strong>Refund due</strong> and <strong>Action needed</strong>.</p>
        <p>Select <strong>Details</strong> on any booking to see:</p>
        <ul>
          <li>guest contact details, with <strong>WhatsApp guest</strong> to message them from your phone or WhatsApp Web;</li>
          <li>the online check-in form (ID, nationality, arrival time, flight, other guests);</li>
          <li>payment: amount, currency (KES or USD), Paystack reference and refund status;</li>
          <li>the full activity history, including notes from the system and the guest.</li>
        </ul>
        <p>Use <strong>Edit</strong> to change dates, guests, status or amounts, and <strong>Allocate</strong> to assign the physical unit (the guest sees it in their booking).</p>
        <table>
          <thead><tr><th>Status</th><th>Meaning</th></tr></thead>
          <tbody>
            <tr><td>pending payment</td><td>The guest is on the Paystack page. The unit is held for 30 minutes.</td></tr>
            <tr><td>confirmed</td><td>Paid and confirmed.</td></tr>
            <tr><td>expired / payment failed</td><td>The guest did not finish paying. The unit is free again.</td></tr>
            <tr><td>in house / checked out / no show</td><td>Set by the front desk during the stay.</td></tr>
            <tr><td>cancelled</td><td>Cancelled by the guest or staff. The unit is free again.</td></tr>
          </tbody>
        </table>
        <Tip>An <strong>ACTION NEEDED</strong> note means the payment arrived but something is wrong: the guest paid less than the total, or the dates were blocked or full by the time payment arrived. Contact the guest to fix it, relocate them, or refund.</Tip>
      </>
    ),
  },
  {
    id: 'requests',
    title: 'Date changes and cancellations',
    tag: 'Reservations',
    body: (
      <>
        <p><strong>Date change requests.</strong> The guest&apos;s booking does not change until you act. The request email tells you whether the new dates are free and the room rate for them.</p>
        <ol>
          <li>Open the booking, select <strong>Edit</strong> and change the dates.</li>
          <li>If the price changes, agree it with the guest: send a payment link or note the difference for check-out.</li>
          <li>In <strong>Details</strong>, select <strong>Mark done</strong>, or <strong>Decline</strong> and tell the guest why.</li>
        </ol>
        <p><strong>Cancellations</strong> follow the policy automatically:</p>
        <ul>
          <li>Unpaid bookings cancel straight away.</li>
          <li>Paid bookings more than {hours} hours before check-in cancel straight away and show <strong>Refund due</strong>.</li>
          <li>Paid bookings inside {hours} hours become a <strong>Cancel request</strong> for you to decide. If you agree, set the status to cancelled with Edit, refund if appropriate, then select Mark done.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'payments',
    title: 'Payments, M-Pesa and refunds',
    tag: 'Managers',
    body: (
      <>
        <p>Guests choose to pay in <strong>USD</strong> (international cards) or <strong>KES</strong> (M-Pesa and Kenyan cards). Prices are set in USD; the KES amount uses the exchange rate set by the administrator. The booking shows both: for example, &quot;KES 26,000 (USD 200)&quot;.</p>
        <p><strong>To refund</strong> (managers only):</p>
        <ol>
          <li>Open the booking and select <strong>Details</strong>, then <strong>Refund</strong>.</li>
          <li>Leave the amount empty for a full refund, or enter a partial amount in the currency the guest paid.</li>
          <li>Add a reason and confirm. The refund goes back through Paystack to the same card or M-Pesa number.</li>
        </ol>
        <p>The refund shows <strong>processing</strong> until Paystack confirms, then <strong>refunded</strong>. If it shows <strong>failed</strong>, check the Paystack dashboard and contact the guest.</p>
        <Tip>Refunds cannot be undone. Double-check the booking reference and amount before you confirm.</Tip>
      </>
    ),
  },
  {
    id: 'missing',
    title: 'A payment is in Paystack but not in the portal',
    tag: 'Reservations · Managers',
    body: (
      <>
        <p>This should now be rare. Every booking is created before the guest pays, and each night the website checks Paystack for the last 3 days and records anything it missed. Recovered payments appear in the next daily briefing.</p>
        <p>If you need it sooner:</p>
        <ol>
          <li>Search the Bookings ledger for the Paystack reference (it starts with TVL-).</li>
          <li>If it is not there, check <Link href="/admin/logs">Audit logs</Link> for &quot;Unmatched Paystack Payment&quot; or &quot;Payment Fulfillment Failed&quot;.</li>
          <li>Ask your administrator to run the Paystack sync (section 12), or wait for the nightly check.</li>
        </ol>
      </>
    ),
  },
  {
    id: 'availability',
    title: 'Availability, blocks and rates',
    tag: 'Reservations',
    body: (
      <>
        <p>Open <Link href="/admin/availability">Availability &amp; Blocks</Link>.</p>
        <ul>
          <li><strong>Block dates</strong>: choose the apartment type (or the whole property), the <strong>First Blocked Night</strong> and the <strong>Reopens On</strong> date. The Reopens On date is the first night guests can book again, so blocking 10 to 12 December means First Blocked Night 10 December and Reopens On 13 December.</li>
          <li><strong>Units</strong>: set how many apartments of each type exist. The website never sells more than this number for any night.</li>
          <li><strong>Rate periods</strong>: set a different nightly rate and a minimum stay for peak dates such as Christmas.</li>
        </ul>
        <p>Blocked and sold-out dates are refused before payment, and guests see this as soon as they pick dates.</p>
      </>
    ),
  },
  {
    id: 'inquiries',
    title: 'Inquiries',
    tag: 'Reservations',
    body: (
      <p>
        Requests from the dining, dhow, events and contact forms arrive in <Link href="/admin/inquiries">Guest Inquiries</Link> and in the matching venue inbox. Update the status as you go (Contacted, Quoted, Booked, Declined) so the reports show your conversion rate.
      </p>
    ),
  },
  {
    id: 'events',
    title: 'Events and gate check-in',
    tag: 'Managers · Front desk · Gate',
    body: (
      <>
        <ul>
          <li><strong>Set up an event</strong> in <Link href="/admin/events">Events</Link>: brand, date, price in KES, capacity, and turn on online payment when ready. Ticket money goes to the brand&apos;s Paystack subaccount.</li>
          <li><strong>Ticket ledger</strong>: every ticket sold, searchable by name or reference. Each sale is also emailed to the brand&apos;s inbox.</li>
          <li><strong>Gate check-in</strong>: open <Link href="/admin/events/checkin">Gate Entrance Scan</Link> on a phone, enter the event PIN, then type the ticket code from the guest&apos;s e-ticket. A ticket can be checked in only once.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'offers',
    title: 'Meal plans, extras and promo codes',
    tag: 'Reservations',
    body: (
      <ul>
        <li><strong>Meal plans</strong> are priced per person per night and added to the room rate.</li>
        <li><strong>Extras</strong> (transfers, experiences, celebrations) are offered to guests while booking. Keep prices and photos current; this is where most upsell revenue comes from.</li>
        <li><strong>Promo codes</strong> can be a percentage or fixed amount, limited by dates, number of uses and minimum spend. The website recalculates the discount when the guest pays, so a code cannot be misused.</li>
      </ul>
    ),
  },
  {
    id: 'reports',
    title: 'Reports',
    tag: 'Managers',
    body: (
      <>
        <p><Link href="/admin/reports">Reports</Link> covers website bookings for the period you choose, including &quot;next 30 days&quot; to see what is on the books.</p>
        <table>
          <tbody>
            <tr><td><strong>Occupancy</strong></td><td>Room nights sold divided by room nights available (units × days).</td></tr>
            <tr><td><strong>ADR</strong></td><td>Average room revenue per night sold.</td></tr>
            <tr><td><strong>RevPAR</strong></td><td>Room revenue divided by all available room nights.</td></tr>
            <tr><td><strong>Lead time</strong></td><td>Average days between booking and arrival.</td></tr>
          </tbody>
        </table>
        <p>Only paid, non-cancelled stays count. A stay that crosses the start or end of the period counts only the nights inside it.</p>
      </>
    ),
  },
  {
    id: 'admin',
    title: 'Staff accounts and website settings',
    tag: 'Admin',
    body: (
      <>
        <p><strong>Staff accounts.</strong> In <Link href="/admin/team">Staff Team</Link>, add people with the narrowest role that fits their job. If you leave the password empty, a random temporary password is shown once; give it to the person privately and ask them to change it with Forgot your password. Remove accounts on the day someone leaves.</p>
        <p><strong>Website settings</strong> live in Vercel (Project, Settings, Environment Variables). The ones staff most often ask about:</p>
        <table>
          <tbody>
            <tr><td><code>NEXT_PUBLIC_USD_TO_KES_RATE</code></td><td>Exchange rate for KES payments. Update it when the rate moves, then redeploy.</td></tr>
            <tr><td><code>NEXT_PUBLIC_FREE_CANCELLATION_HOURS</code></td><td>Free-cancellation window (default 48).</td></tr>
            <tr><td><code>NEXT_PUBLIC_WHATSAPP_NUMBER</code></td><td>WhatsApp number for guest buttons, e.g. 254725959552.</td></tr>
            <tr><td><code>EMAIL_VILLAGE</code>, <code>EMAIL_RESTAURANT</code>, ...</td><td>Which inbox gets each brand&apos;s notifications.</td></tr>
            <tr><td><code>OPS_ALERT_EMAIL</code></td><td>Who gets urgent website alerts (failed payments, failed nightly checks).</td></tr>
            <tr><td><code>REVIEW_EMAILS_ENABLED</code>, <code>GOOGLE_REVIEW_URL</code></td><td>Turn on the thank-you and review email sent after check-out.</td></tr>
            <tr><td><code>CRON_SECRET</code></td><td>Lets Vercel run the nightly checks. Required.</td></tr>
          </tbody>
        </table>
        <p><strong>Health check.</strong> <code>/api/health</code> returns OK when the site can reach the database. Point an uptime monitor at it.</p>
        <p><strong>Manual Paystack sync</strong> (developer machine with the production settings): <code>npm run sync:paystack</code> lists missing payments; add <code>--apply</code> to record them. It never emails guests.</p>
      </>
    ),
  },
];

export default function AdminGuidePage() {
  return (
    <div className="max-w-6xl mx-auto pb-12 px-2 sm:px-4 space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[#821124] text-xs font-bold tracking-wider uppercase">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Staff guide</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-3">How to run the Tamarind portal</h1>
        <p className="text-sm text-slate-600 max-w-3xl mt-2">
          Day-to-day tasks for front desk, reservations and managers. Sections are tagged with the roles they apply to. The guest-facing guide is at{' '}
          <Link href="/guide" className="text-[#821124] underline">/guide</Link>; share it with guests who need help.
        </p>
      </div>
      <GuideLayout sections={sections} />
    </div>
  );
}
