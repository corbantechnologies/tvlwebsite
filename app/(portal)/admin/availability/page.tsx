'use client';

import AvailabilityManager from "@/components/ui/AvailabilityManager";
import { useEffect, useState } from "react";

export default function AvailabilityPage() {
  const [apartments, setApartments] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/apartments")
      .then((r) => r.json())
      .then((d) => {
        if (d.apartments) {
          setApartments(d.apartments.map((a: any) => ({ id: a.id, name: a.name })));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Apartment Availability, Rates &amp; Closures
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monthly swimlane calendar, seasonal period pricing, maintenance blocks, and unit capacity
          </p>
        </div>
      </div>

      <AvailabilityManager
        apartments={apartments}
        currentUserName="Reservations Staff"
      />
    </div>
  );
}
