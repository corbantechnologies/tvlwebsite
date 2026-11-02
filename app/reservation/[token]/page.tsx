import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ensureDatabaseSeeded } from '@/lib/db/seed';
import { bookingByGuestToken } from '@/lib/guestLookup';
import { eReservationQrSvg, stayRows } from '@/lib/eReservation';
import { PROPERTY, freeCancellationHours, whatsappLink } from '@/lib/contact';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your e-reservation | Tamarind Village',
  robots: { index: false, follow: false },
};

export default async function EReservationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await ensureDatabaseSeeded();
  const booking = await bookingByGuestToken(token);
  if (!booking || booking.bookingStatus === 'pending_payment') notFound();

  const qrSvg = await eReservationQrSvg(booking);
  const cancelled = ['cancelled', 'no_show'].includes(booking.bookingStatus);
  const confirmed = booking.paymentStatus === 'paid' && !cancelled;
  const trackUrl = `/track?token=${encodeURIComponent(booking.guestToken || '')}`;

  return (
    <main className="min-h-screen bg-[#FAF6F0] py-8 px-4 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto bg-white border border-[#e2d9d0] shadow-sm print:shadow-none print:border-0">
        <header className="bg-[#821124] text-white px-6 sm:px-8 py-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-serif text-2xl font-bold tracking-wider">TAMARIND VILLAGE</p>
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#C59B27] mt-1">E-RESERVATION</p>
          </div>
          <p className="font-mono font-bold text-sm sm:text-base text-right break-all">{booking.bookingReference}</p>
        </header>

        <section className="px-6 sm:px-8 py-6 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6">
          <div>
            <h1 className={`font-serif text-xl font-bold mb-4 ${confirmed ? 'text-[#1F1615]' : 'text-[#821124]'}`}>
              {confirmed ? 'Reservation confirmed' : cancelled ? 'This reservation was cancelled' : 'Awaiting payment'}
            </h1>
            <dl className="text-sm divide-y divide-[#f0e9e1]">
              {stayRows(booking).map(([label, value]) => (
                <div key={label} className="py-2 grid grid-cols-[120px_1fr] gap-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-[#8b7355] pt-0.5">{label}</dt>
                  <dd className="text-[#1F1615] break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {!cancelled && (
            <div className="flex flex-col items-center sm:items-end">
              <div className="w-36 h-36" aria-label="QR code to show at reception" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <p className="text-[10px] text-[#8b7355] mt-1">Show this code at reception</p>
            </div>
          )}
        </section>

        {!cancelled && (
          <section className="px-6 sm:px-8 pb-6">
            <h2 className="font-serif text-base font-bold text-[#821124] border-t border-[#C59B27]/40 pt-5 mb-2">Before you arrive</h2>
            <ul className="text-sm text-[#1F1615] space-y-1.5 list-disc pl-5">
              <li>
                {booking.checkInDetails ? 'Online check-in is done. Thank you!' : (
                  <>Save time at reception: <Link href={trackUrl} className="text-[#821124] underline print:no-underline">check in online</Link>.</>
                )}
              </li>
              <li>Bring the passport or national ID of every adult guest.</li>
              <li>Free cancellation until {freeCancellationHours()} hours before check-in (2 pm). After that, contact reservations.</li>
              <li>Need an airport or SGR transfer? Message us and we will arrange it.</li>
            </ul>
          </section>
        )}

        <footer className="px-6 sm:px-8 py-4 bg-[#f5f0eb] text-xs text-[#6b5d54] flex flex-wrap items-center justify-between gap-3">
          <span>{PROPERTY.address} · {PROPERTY.phoneDisplay} · {PROPERTY.email}</span>
          <span className="flex flex-wrap gap-2 print:hidden">
            <a
              href={`/api/guest/booking/${encodeURIComponent(booking.guestToken || '')}/pdf`}
              className="px-4 py-2 bg-[#821124] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#680e1c]"
            >
              Download PDF
            </a>
            <PrintButton />
            <a
              href={whatsappLink(`Hello Tamarind Village, this is ${booking.guestName} (booking ${booking.bookingReference}).`)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#25D366] text-white text-xs font-bold uppercase tracking-wider"
            >
              WhatsApp us
            </a>
          </span>
        </footer>
      </div>
      <p className="text-center mt-4 print:hidden">
        <Link href={trackUrl} className="text-xs text-[#821124] underline">Manage this booking</Link>
      </p>
    </main>
  );
}
