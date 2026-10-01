'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApartmentType } from '@/types';
import ApartmentDetail from '@/components/ApartmentDetail';
import BookingModal from '@/components/BookingModal';
import TransferModal from '@/components/TransferModal';
import GuestBookingTrackerModal from '@/components/GuestBookingTrackerModal';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileBookingBar from '@/components/MobileBookingBar';
import { Home, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface ApartmentPageProps {
  params: Promise<{ slug: string }>;
}

export default function DedicatedApartmentPage({ params }: ApartmentPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const rawSlug = decodeURIComponent(resolvedParams.slug || '').toLowerCase().trim();

  const [apartmentsList, setApartmentsList] = useState<ApartmentType[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/apartments')
      .then((r) => r.json())
      .then((d) => {
        if (d.apartments && d.apartments.length > 0) {
          setApartmentsList(d.apartments.filter((a: any) => a.isActive !== false));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Robust apartment matching supporting:
  // - "two-bedroom Apartment" / "two-bedroom%20Apartment"
  // - "two-bedroom" / "2-bedroom"
  // - "1-bedroom" / "one-bedroom"
  // - "3-bedroom" / "three-bedroom"
  // - Any custom ID or Name
  const apartment: ApartmentType | undefined = apartmentsList.find((a) => {
    const aId = (a.id || '').toLowerCase().trim();
    const aName = (a.name || '').toLowerCase().trim();
    const cleanSlug = rawSlug.replace(/[^a-z0-9]/g, '');
    const cleanId = aId.replace(/[^a-z0-9]/g, '');
    const cleanName = aName.replace(/[^a-z0-9]/g, '');

    // 1. Direct or sanitized match
    if (aId === rawSlug || aName === rawSlug) return true;
    if (cleanId === cleanSlug || cleanName === cleanSlug) return true;

    // 2. Keyword/Bedroom count match
    const hasOne = rawSlug.includes('1') || rawSlug.includes('one');
    const hasTwo = rawSlug.includes('2') || rawSlug.includes('two');
    const hasThree = rawSlug.includes('3') || rawSlug.includes('three');

    if (hasOne && (aId.includes('1') || aId.includes('one') || a.bedrooms === 1)) return true;
    if (hasTwo && (aId.includes('2') || aId.includes('two') || a.bedrooms === 2)) return true;
    if (hasThree && (aId.includes('3') || aId.includes('three') || a.bedrooms === 3)) return true;

    return false;
  });

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [preSelectedPkg, setPreSelectedPkg] = useState('ro');
  const [bookingPrefill, setBookingPrefill] = useState<{
    apartmentId: string;
    packageId?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    promocode?: string;
  } | null>(null);

  const handleSelectApartment = (id: string) => {
    const lower = (id || '').toLowerCase();
    let slug = 'one-bedroom';
    if (lower.includes('2') || lower.includes('two')) slug = 'two-bedroom';
    else if (lower.includes('3') || lower.includes('three')) slug = 'three-bedroom';
    else if (lower.includes('1') || lower.includes('one')) slug = 'one-bedroom';
    else slug = lower.replace(/\s+/g, '-');
    router.push(`/apartments/${slug}`);
  };

  const handleBookNow = (data: any, pkgId?: string) => {
    if (typeof data === 'string') {
      setBookingPrefill({
        apartmentId: data,
        packageId: pkgId || 'room-only'
      });
      setPreSelectedPkg(pkgId || 'ro');
    } else {
      setBookingPrefill(data);
      setPreSelectedPkg(data.packageId || 'ro');
    }
    setIsBookingOpen(true);
  };

  // Loading state while fetching from database
  if (!loaded) {
    return (
      <div className="min-h-screen bg-brand-sand font-sans text-brand-dark flex flex-col w-full">
        <Navbar
          onNavigate={(sectionId) => router.push(`/#${sectionId}`)}
          onOpenBooking={() => setIsBookingOpen(true)}
          onOpenTransferModal={() => setIsTransferOpen(true)}
          onOpenTracking={() => setIsTrackingOpen(true)}
          activeView="detail"
          onGoHome={() => router.push('/')}
        />
        <main className="flex-1 flex flex-col items-center justify-center p-6 pt-32 space-y-3">
          <Loader2 className="w-8 h-8 text-[#821124] animate-spin" />
          <p className="text-xs uppercase tracking-widest font-bold text-stone-500">Loading Residence...</p>
        </main>
      </div>
    );
  }

  // If apartment is inactive or does not exist
  if (!apartment) {
    return (
      <div className="min-h-screen bg-brand-sand font-sans text-brand-dark flex flex-col w-full">
        <Navbar
          onNavigate={(sectionId) => router.push(`/#${sectionId}`)}
          onOpenBooking={() => setIsBookingOpen(true)}
          onOpenTransferModal={() => setIsTransferOpen(true)}
          onOpenTracking={() => setIsTrackingOpen(true)}
          activeView="detail"
          onGoHome={() => router.push('/')}
        />
        <main className="flex-1 flex items-center justify-center p-6 pt-32">
          <div className="max-w-md w-full bg-white p-8 rounded-none border border-stone-200 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">Residence Not Available</h1>
            <p className="text-xs text-stone-600 leading-relaxed">
              This residence is currently private or undergoing maintenance and is not available for online reservation.
            </p>
            <div className="pt-2">
              <Link
                href="/apartments"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>View Available Suites</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer
          onNavigate={(sectionId) => router.push(`/#${sectionId}`)}
          onSelectApartment={handleSelectApartment}
          onSelectDining={(dId) => router.push(`/dining/${dId}`)}
          onGoHome={() => router.push('/')}
          onOpenStaffPinModal={() => { window.location.href = '/admin/login'; }}
          onOpenTracking={() => setIsTrackingOpen(true)}
        />
      </div>
    );
  }

  const currentApartment = apartment;

  return (
    <div className="min-h-screen bg-brand-sand font-sans text-brand-dark selection:bg-brand-teal selection:text-white flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Sticky Header */}
      <Navbar
        onNavigate={(sectionId) => router.push(`/#${sectionId}`)}
        onOpenBooking={() => setIsBookingOpen(true)}
        onOpenTransferModal={() => setIsTransferOpen(true)}
        onOpenTracking={() => setIsTrackingOpen(true)}
        activeView="detail"
        onGoHome={() => router.push('/')}
      />

      <main className="flex-1 pt-24 pb-16">
        {/* Breadcrumb Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <nav className="flex items-center gap-2 text-xs text-stone-500 font-medium">
            <Link href="/" className="hover:text-brand-teal flex items-center gap-1 transition-colors">
              <Home className="w-3.5 h-3.5" /> Home
            </Link>
            <span>/</span>
            <Link href="/apartments" className="hover:text-brand-teal transition-colors">
              Accommodations
            </Link>
            <span>/</span>
            <span className="text-brand-dark font-bold">{currentApartment.name}</span>
          </nav>
        </div>

        {/* Dedicated Apartment Detail View */}
        <ApartmentDetail
          apartment={currentApartment}
          onBack={() => router.push('/apartments')}
          onSelectApartment={handleSelectApartment}
          allApartments={apartmentsList}
          onBookNow={handleBookNow}
        />
      </main>

      {/* Footer */}
      <Footer
        onNavigate={(sectionId) => router.push(`/#${sectionId}`)}
        onSelectApartment={handleSelectApartment}
        onSelectDining={(dId) => router.push(`/dining/${dId}`)}
        onGoHome={() => router.push('/')}
        onOpenStaffPinModal={() => { window.location.href = '/admin/login'; }}
        onOpenTracking={() => setIsTrackingOpen(true)}
      />

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setBookingPrefill(null);
        }}
        initialApartmentId={bookingPrefill?.apartmentId || currentApartment.id}
        initialPackageId={bookingPrefill?.packageId || preSelectedPkg}
        initialCheckIn={bookingPrefill?.checkIn}
        initialCheckOut={bookingPrefill?.checkOut}
        initialAdults={bookingPrefill?.guests}
        initialPromocode={bookingPrefill?.promocode}
        apartmentsList={apartmentsList}
      />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
      />

      {/* Guest Booking Tracker Modal */}
      <GuestBookingTrackerModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        onOpenBookingModal={() => {
          setIsTrackingOpen(false);
          setIsBookingOpen(true);
        }}
      />

      {/* Mobile Sticky Booking Bar */}
      <MobileBookingBar
        onOpenBooking={() => setIsBookingOpen(true)}
        startingPrice={currentApartment.pricePerNight}
        isLive={false}
      />
    </div>
  );
}
