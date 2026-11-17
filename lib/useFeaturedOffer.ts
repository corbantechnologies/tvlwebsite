'use client';

import { useEffect, useState } from "react";
import type { ProfitroomOffer } from "@/lib/profitroomOffers";
import { pickFeaturedOffer } from "@/lib/offerDisplay";

// One /api/offers request per page load, shared by the offer strip and pop-up.
let request: Promise<ProfitroomOffer | null> | null = null;

function loadFeaturedOffer(): Promise<ProfitroomOffer | null> {
  if (!request) {
    request = fetch("/api/offers")
      .then((r) => r.json())
      .then((d) => pickFeaturedOffer<ProfitroomOffer>(Array.isArray(d.offers) ? d.offers : []))
      .catch(() => {
        request = null; // try again on the next page
        return null;
      });
  }
  return request;
}

/** The offer to feature site-wide, or null while loading / when there is none. */
export function useFeaturedOffer(enabled = true): ProfitroomOffer | null {
  const [offer, setOffer] = useState<ProfitroomOffer | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadFeaturedOffer().then((o) => {
      if (!cancelled) setOffer(o);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return offer;
}
