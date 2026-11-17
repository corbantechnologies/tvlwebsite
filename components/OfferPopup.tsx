'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { X, CalendarDays, ArrowRight, Sparkles } from "lucide-react";
import { openProfitroomOffer } from "@/lib/profitroomBooking";
import { offerValidity, formatOfferPrice } from "@/lib/offerDisplay";
import { useFeaturedOffer } from "@/lib/useFeaturedOffer";
import { closedRecently, offerPromoHiddenOn, rememberClosed, storageGet, storageSet } from "@/lib/offerStorage";

// A pop-up in the middle of the screen featuring the current special offer
// from the ProfitRoom Suite. Shown once per visit, shortly after the page
// opens. Closing it hides that offer for a few days; a new offer shows again.

const SHOW_AFTER_MS = 1500;
const CLOSED_DAYS = 3;
const SEEN_KEY = "tv-offer-popup-seen";
const CLOSED_KEY = "tv-offer-popup-dismissed";

export default function OfferPopup() {
  const pathname = usePathname() || "/";
  const hiddenHere = offerPromoHiddenOn(pathname);
  const [alreadySeen] = useState(() => typeof window !== "undefined" && storageGet("session", SEEN_KEY) === "1");
  const offer = useFeaturedOffer(!hiddenHere && !alreadySeen);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!offer || closedRecently(CLOSED_KEY, offer.id, CLOSED_DAYS)) return;
    const timer = setTimeout(() => {
      setOpen(true);
      storageSet("session", SEEN_KEY, "1");
    }, SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [offer]);

  const close = () => {
    setOpen(false);
    if (offer) rememberClosed(CLOSED_KEY, offer.id);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (hiddenHere || !offer) return null;

  const valid = offerValidity(offer);
  const price = formatOfferPrice(offer);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="offer-popup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
          onClick={close}
          id="offer-popup-backdrop"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-popup-title"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white shadow-2xl"
            id="offer-popup"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close offer"
              className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white cursor-pointer"
              id="offer-popup-close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative w-full h-44 sm:h-56 bg-stone-900">
              {offer.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={offer.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#C59B27] text-[#1F1615] text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Special offer
              </span>
            </div>

            <div className="p-6 text-center">
              <h2 id="offer-popup-title" className="font-serif text-xl sm:text-2xl font-bold leading-snug text-[#1F1615]">
                {offer.name}
              </h2>
              {valid && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#821124]">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {valid}
                </p>
              )}
              {offer.summary && (
                <p className="mt-3 text-sm font-light leading-relaxed text-stone-600">{offer.summary}</p>
              )}
              {price && (
                <p className="mt-4 text-xs uppercase tracking-wider text-stone-500">
                  From <span className="font-serif normal-case tracking-normal text-2xl font-bold text-[#1F1615]">{price}</span>
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  close();
                  openProfitroomOffer(offer.id);
                }}
                className="mt-5 w-full py-3.5 bg-[#821124] hover:bg-[#680e1c] text-white font-bold text-xs uppercase tracking-widest inline-flex items-center justify-center gap-2 cursor-pointer"
                id="offer-popup-book"
              >
                Book this offer
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <div className="mt-3 flex items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-wider">
                <Link
                  href="/offers"
                  onClick={close}
                  className="text-stone-600 hover:text-[#821124] underline underline-offset-4 decoration-stone-300"
                  id="offer-popup-all"
                >
                  See all offers
                </Link>
                <button type="button" onClick={close} className="text-stone-400 hover:text-stone-600 cursor-pointer" id="offer-popup-later">
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
