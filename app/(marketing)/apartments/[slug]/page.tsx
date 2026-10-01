'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APARTMENTS } from '@/data';
import { ApartmentType } from '@/types';
import ApartmentDetail from '@/components/ApartmentDetail';
import BookingModal from '@/components/BookingModal';
import TransferModal from '@/components/TransferModal';
import GuestBookingTrackerModal from '@/components/GuestBookingTrackerModal';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileBookingBar from '@/components/MobileBookingBar';
import { Home, AlertCircle, ArrowLeft } from 'lucide-react';

interface ApartmentPageProps {
  params: Promise<{ slug: string }>;
}

export default function DedicatedApartmentPage({ params }: ApartmentPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const rawSlug = resolvedParams.slug.toLowerCase();

  // Normalize slug variations:
  // "one-bedroom" <-> "1-bedroom"
  // "two-bedroom" <-> "2-bedroom"
  // "three-bedroom" <-> "3-bedroom"
  const normalizedId = rawSlug
    .replace('one-bedroom', '1-bedroom')
    .replace('two-bedroom', '2-bedroom')
    .replace('three-bedroom', '3-bedroom');

  const [apartmentsList, setApartmentsList] = useState<ApartmentType[]>(
    APARTMENTS.filter(a => a.isActive !== false)
  );
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

  const apartment: ApartmentType | undefined =
    apartmentsList.find((a) => a.id.toLowerCase() === rawSlug || a.id.toLowerCase() === normalizedId);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [preSelectedPkg, setPreSelectedPkg] = useState('ro');

  const handleSelectApartment = (id: string) => {
    const slug = id
      .replace('1-bedroom', 'one-bedroom')
      .replace('2-bedroom', 'two-bedroom')
      .replace('3-bedroom', 'three-bedroom');
    router.push(`/apartments/${slug}`);
  };

  const handleBookNow = (aptId: string, pkgId: string) => {
    setPreSelectedPkg(pkgId);
    setIsBookingOpen(true);
  };

  // If apartment is inactive or does not exist
  if (loaded && !apartment) {
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

  // Fallback while loading initial state
  const currentApartment = apartment || apartmentsList[0] || APARTMENTS[0];

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
        onClose={() => setIsBookingOpen(false)}
        initialApartmentId={currentApartment.id}
        initialPackageId={preSelectedPkg}
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
