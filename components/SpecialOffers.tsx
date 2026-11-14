'use client';

import React, { useEffect, useState } from "react";
import { ArrowRight, Utensils, CheckCircle2 } from "lucide-react";
import type { ProfitroomOffer } from "@/lib/profitroomOffers";
import { openProfitroomOffer } from "@/lib/profitroomBooking";

type Props = {
  /** "dark" for the home page section, "light" for the offers page. */
  variant?: "dark" | "light";
  /** Show at most this many offers (home page). */
  limit?: number;
  /** Called once offers have loaded, with how many there are. */
  onLoaded?: (count: number) => void;
};

function formatPrice(o: ProfitroomOffer): string | null {
  if (o.minPrice == null) return null;
  const amount = Number.isInteger(o.minPrice) ? o.minPrice.toLocaleString() : o.minPrice.toFixed(2);
  return `${o.currency} ${amount}`;
}

function priceBasis(o: ProfitroomOffer): string | null {
  const parts: string[] = [];
  if (o.priceNights) parts.push(`${o.priceNights} night${o.priceNights === 1 ? "" : "s"}`);
  if (o.priceOccupancy) parts.push(`${o.priceOccupancy} guest${o.priceOccupancy === 1 ? "" : "s"}`);
  return parts.length ? `for ${parts.join(", ")}` : null;
}

export default function SpecialOffers({ variant = "light", limit, onLoaded }: Props) {
  const [offers, setOffers] = useState<ProfitroomOffer[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/offers")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const list: ProfitroomOffer[] = Array.isArray(d.offers) ? d.offers : [];
        setOffers(list);
        onLoaded?.(list.length);
      })
      .catch(() => {
        if (cancelled) return;
        setOffers([]);
        onLoaded?.(0);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dark = variant === "dark";

  if (offers === null) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-96 animate-pulse ${dark ? "bg-stone-800/60" : "bg-stone-200/70"}`} />
        ))}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <p className={`text-center text-sm font-light ${dark ? "text-stone-400" : "text-stone-500"}`}>
        No special offers are running right now. Please check back soon.
      </p>
    );
  }

  const shown = typeof limit === "number" ? offers.slice(0, limit) : offers;

  return (
    <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
      {shown.map((o) => {
        const price = formatPrice(o);
        const basis = priceBasis(o);
        const blurb = o.summary || o.descriptionLines.filter((l) => !l.startsWith("•")).join(" ");
        const bullets = o.descriptionLines.filter((l) => l.startsWith("•")).map((l) => l.replace(/^•\s*/, ""));
        return (
          <article
            key={o.id}
            className={`w-full max-w-sm flex flex-col overflow-hidden border shadow-md group ${
              dark ? "bg-[#2D2926] border-stone-800 hover:border-brand-teal/80" : "bg-white border-stone-200 hover:border-[#821124]/40"
            } transition-colors`}
            id={`offer-card-${o.id}`}
          >
            <div className="relative w-full h-48 overflow-hidden bg-stone-900 flex-shrink-0">
              {o.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={o.image}
                  alt={o.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              )}
              {o.meals && (
                <span className="absolute bottom-2.5 left-4 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-1 bg-black/70 text-stone-100">
                  <Utensils className="w-3 h-3" />
                  {o.meals}
                </span>
              )}
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <h3 className={`font-serif text-lg font-bold leading-snug ${dark ? "text-white" : "text-[#1F1615]"}`}>
                {o.name}
              </h3>
              {blurb && (
                <p className={`mt-3 text-xs font-light leading-relaxed ${dark ? "text-stone-400" : "text-stone-600"}`}>
                  {blurb}
                </p>
              )}
              {bullets.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {bullets.map((b, i) => (
                    <li key={i} className={`flex gap-2 items-start text-xs ${dark ? "text-stone-300" : "text-stone-700"}`}>
                      <CheckCircle2 className="w-4 h-4 text-brand-teal flex-shrink-0 mt-0.5" />
                      <span className="font-light leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className={`mt-auto pt-6 border-t ${dark ? "border-stone-800" : "border-stone-200"} space-y-4`}>
                {price && (
                  <div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${dark ? "text-[#C59B27]" : "text-[#821124]"}`}>From</span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-serif font-bold ${dark ? "text-white" : "text-[#1F1615]"}`}>{price}</span>
                      {basis && <span className={`text-[11px] font-light ${dark ? "text-stone-400" : "text-stone-500"}`}>{basis}</span>}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => openProfitroomOffer(o.id)}
                  className="w-full py-3 bg-[#821124] hover:bg-[#680e1c] text-white font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                  id={`btn-offer-book-${o.id}`}
                >
                  <span>Book This Offer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
