'use client';

import React from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface AvailabilityStatusProps {
  /** Both dates chosen; nothing is shown until then. */
  hasDates: boolean;
  checking: boolean;
  available: boolean;
  notice: string | null;
  className?: string;
}

/** Inline availability message shown right under the date pickers. */
export default function AvailabilityStatus({ hasDates, checking, available, notice, className = "" }: AvailabilityStatusProps) {
  if (!hasDates) return null;

  if (checking) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 text-xs text-stone-600 bg-stone-50 border border-stone-200 ${className}`} role="status">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Checking availability for your dates…</span>
      </div>
    );
  }

  if (!available) {
    return (
      <div className={`flex items-start gap-2 px-3 py-2 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 ${className}`} role="alert">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>{notice || "This apartment is not available for the selected dates."} Please choose different dates or another suite.</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 ${className}`} role="status">
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>Available for your dates</span>
    </div>
  );
}
