'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams ? searchParams.toString() : '';
    const destination = params ? `/booking-confirmed?${params}` : '/booking-confirmed';
    router.replace(destination);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#821124] mb-3" />
      <p className="text-sm font-medium text-slate-600">Redirecting to your booking confirmation...</p>
    </div>
  );
}

export default function BookingConfirmationRedirect() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA]" />}>
      <RedirectContent />
    </Suspense>
  );
}
