'use client';

import React, { useState } from 'react';
import { Layers, Save, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaDropzone from '@/components/ui/MediaDropzone';

export default function AdminHeroPage() {
  const [heroMediaUrl, setHeroMediaUrl] = useState('https://media.tamarind.co.ke/hero/harbour-clifftop.jpg');
  const [headline, setHeadline] = useState('Coastal Grandeur & Private Luxury Suites Overlooking Tudor Creek');
  const [subtext, setSubtext] = useState('Experience Mombasa’s most iconic sanctuary. Elegant Swahili-styled oceanfront apartments, world-renowned fresh seafood at Tamarind Restaurant, and unforgettable sunset voyages aboard the Tamarind Dhow.');
  const [bannerAlert, setBannerAlert] = useState('Direct Booking Perk: Complimentary Sunset Welcome Cocktail & Dhow Priority Seating');
  const [bannerActive, setBannerActive] = useState(true);

  const handleSave = () => {
    toast.success('Hero announcements updated on public marketing platform!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
          <Layers className="w-3.5 h-3.5" /> Homepage Experience
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
          Hero Banner &amp; Announcements
        </h1>
        <p className="text-xs text-white/60">
          Customize the primary landing headline, direct perks ribbon, and seasonal promo alerts.
        </p>
      </div>

      <div className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#C59B27] mb-1">
            Main Hero Headline
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#C59B27]"
          />
        </div>

        <MediaDropzone
          value={heroMediaUrl}
          onChange={setHeroMediaUrl}
          folder="hero"
          label="Hero Background Media / Video (MinIO)"
          helperText="Drag & drop clifftop pool/harbour image or video"
        />

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#C59B27] mb-1">
            Hero Subtext
          </label>
          <textarea
            rows={3}
            value={subtext}
            onChange={(e) => setSubtext(e.target.value)}
            className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#C59B27]"
          />
        </div>

        <div className="pt-2 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C59B27]">
              Top Promotional Alert Ribbon
            </span>
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={bannerActive}
                onChange={(e) => setBannerActive(e.target.checked)}
                className="rounded text-[#821124]"
              />
              <span className="text-white/80">Active on Public Site</span>
            </label>
          </div>

          <input
            type="text"
            value={bannerAlert}
            onChange={(e) => setBannerAlert(e.target.value)}
            className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#C59B27]"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Publish Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
