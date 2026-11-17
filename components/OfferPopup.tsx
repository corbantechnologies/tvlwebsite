'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { X, CalendarDays, ArrowRight, Sparkles } from "lucide-react";
import type { ProfitroomOffer } from "@/lib/profitroomOffers";
import { openProfitroomOffer } from "@/lib/profitroomBooking";
import { offerValidity, formatOfferPrice, pickFeaturedOffer } from "@/lib/offerDisplay";

// A small card that slides in to highlight the current special offer from the
// ProfitRoom Suite. Shown once per visit, a few seconds after the page opens.
// Closing it hides that offer for a few days; a new offer shows again.

const SHOW_AFTER_MS = 5000;
const DISMISS_DAYS = 3;
const SEEN_KEY = "tv-offer-popup-seen";
const DISMISS_KEY = "tv-offer-popup-dismissed";

/** Pages where the pop-up would get in the way. */
const HIDDEN_ON = ["/offers", "/booking-confirmed", "/track", "/guide"];

function storageGet(store: "local" | "session", key: string): string | null {
  try {
    return (store === "local" ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

function storageSet(store: "local" | "session", key: string, value: string) {
  try {
    (store === "local" ? window.localStorage : window.sessionStorage).setItem(key, value);
  } catch {
    // Storage blocked (private mode): the pop-up may show again, which is fine.
  }
}

function dismissedRecently(offerId: string): boolean {
  const raw = storageGet("local", DISMISS_KEY);
  if (!raw) return false;
  try {
    const { id, at } = JSON.parse(raw) as { id: string; at: number };
    return id === offerId && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function OfferPopup() {
  const pathname = usePathname() || "/";
  const hiddenHere = HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const [offer, setOffer] = useState<ProfitroomOffer | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hiddenHere || storageGet("session", SEEN_KEY)) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    fetch("/api/offers")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const list: ProfitroomOffer[] = Array.isArray(d.offers) ? d.offers : [];
        const featured = pickFeaturedOffer(list);
        if (!featured || dismissedRecently(featured.id)) return;
        setOffer(featured);
        timer = setTimeout(() => {
          if (cancelled) return;
          setOpen(true);
          storageSet("session", SEEN_KEY, "1");
        }, SHOW_AFTER_MS);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [hiddenHere]);

  const close = () => {
    setOpen(false);
    if (offer) storageSet("local", DISMISS_KEY, JSON.stringify({ id: offer.id, at: Date.now() }));
  };

  if (hiddenHere || !offer) return null;

  const valid = offerValidity(offer);
  const price = formatOfferPrice(offer);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          role="dialog"
          aria-label={`Special offer: ${offer.name}`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed z-50 left-3 right-3 bottom-[72px] md:left-6 md:right-auto md:bottom-6 md:w-[360px] bg-white border border-stone-200 shadow-2xl overflow-hidden"
          id="offer-popup"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close offer"
            className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white cursor-pointer"
            id="offer-popup-close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex md:block">
            <div className="relative w-28 shrink-0 md:w-full md:h-40 bg-stone-900">
              {offer.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={offer.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <span className="absolute top-1.5 left-1.5 md:top-2 md:left-2 inline-flex items-center gap-1 px-1.5 md:px-2 py-1 bg-[#C59B27] text-[#1F1615] text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">
                <Sparkles className="hidden md:block w-3 h-3" />
                Special offer
              </span>
            </div>

            <div className="p-4 md:p-5 min-w-0 flex-1">
              <h2 className="font-serif text-base md:text-lg font-bold leading-snug text-[#1F1615] pr-6 md:pr-0">{offer.name}</h2>
              {valid && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#821124]">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {valid}
                </p>
              )}
              {offer.summary && (
                <p className="hidden md:block mt-2 text-xs font-light leading-relaxed text-stone-600 line-clamp-3">{offer.summary}</p>
              )}
              {price && (
                <p className="mt-2 text-xs text-stone-500">
                  From <span className="font-serif text-lg font-bold text-[#1F1615]">{price}</span>
                </p>
              )}
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openProfitroomOffer(offer.id);
                  }}
                  className="px-4 py-2.5 bg-[#821124] hover:bg-[#680e1c] text-white font-bold text-[10px] uppercase tracking-widest inline-flex items-center gap-1.5 cursor-pointer"
                  id="offer-popup-book"
                >
                  Book this offer
                  <ArrowRight className="w-3 h-3" />
                </button>
                <Link
                  href="/offers"
                  onClick={() => setOpen(false)}
                  className="text-[10px] font-semibold uppercase tracking-wider text-stone-600 hover:text-[#821124] underline underline-offset-4 decoration-stone-300"
                  id="offer-popup-all"
                >
                  All offers
                </Link>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
