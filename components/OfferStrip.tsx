'use client';

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { offerValidity } from "@/lib/offerDisplay";
import { useFeaturedOffer } from "@/lib/useFeaturedOffer";
import { closedRecently, offerPromoHiddenOn, rememberClosed } from "@/lib/offerStorage";

// A thin strip across the top of the site naming the current special offer.
// Closing it hides that offer's strip for a few days.

const CLOSED_DAYS = 3;
const CLOSED_KEY = "tv-offer-strip-dismissed";

function shortValidity(v: string | null): string | null {
  return v ? v.replace(/^Valid /, "") : null;
}

export default function OfferStrip() {
  const pathname = usePathname() || "/";
  const hiddenHere = offerPromoHiddenOn(pathname);
  const offer = useFeaturedOffer(!hiddenHere);
  const [closedId, setClosedId] = useState<string | null>(null);

  // The offer only arrives in the browser, so reading storage here is safe.
  if (hiddenHere || !offer || closedId === offer.id || closedRecently(CLOSED_KEY, offer.id, CLOSED_DAYS)) return null;

  const dates = shortValidity(offerValidity(offer));

  return (
    <div className="relative bg-[#821124] text-white text-xs" id="offer-strip">
      <div className="max-w-7xl mx-auto pl-4 pr-10 sm:px-12 py-2 flex items-center justify-center gap-2 sm:gap-3 text-center">
        <Sparkles className="hidden sm:block w-3.5 h-3.5 text-[#E8C766] shrink-0" />
        <p className="min-w-0 leading-snug">
          <span className="font-bold">{offer.name}</span>
          {dates && <span className="hidden sm:inline text-white/80"> · {dates}</span>}
        </p>
        <Link
          href="/offers"
          className="shrink-0 inline-flex items-center gap-1 font-bold uppercase tracking-wider text-[10px] text-[#E8C766] hover:text-white underline underline-offset-4"
          id="offer-strip-link"
        >
          View offer
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <button
        type="button"
        onClick={() => {
          setClosedId(offer.id);
          rememberClosed(CLOSED_KEY, offer.id);
        }}
        aria-label="Hide offer strip"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
        id="offer-strip-close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
