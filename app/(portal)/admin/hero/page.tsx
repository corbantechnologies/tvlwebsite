'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Save, Sparkles, RotateCw, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaDropzone from '@/components/ui/MediaDropzone';

export default function AdminHeroPage() {
  const [heroMediaUrl, setHeroMediaUrl] = useState('https://media.tamarind.co.ke/hero/harbour-clifftop.jpg');
  const [headline, setHeadline] = useState('Coastal Grandeur & Private Luxury Suites Overlooking Tudor Creek');
  const [subtext, setSubtext] = useState('Experience Mombasa’s most iconic sanctuary. Elegant Swahili-styled oceanfront apartments, world-renowned fresh seafood at Tamarind Restaurant, and unforgettable sunset voyages aboard the Tamarind Dhow.');
  const [bannerAlert, setBannerAlert] = useState('Direct Booking Perk: Complimentary Sunset Welcome Cocktail & Dhow Priority Seating');
  const [bannerActive, setBannerActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load current settings from database via /api/settings
  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        if (data.settings.hero) {
          const h = data.settings.hero;
          if (h.headline) setHeadline(h.headline);
          if (h.subtext) setSubtext(h.subtext);
          if (h.heroMediaUrl) setHeroMediaUrl(h.heroMediaUrl);
        }
        if (data.settings.banner) {
          const b = data.settings.banner;
          if (b.text !== undefined) setBannerAlert(b.text);
          if (b.active !== undefined) setBannerActive(b.active);
        }
      }
    } catch {
      console.warn('Using default hero state');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            hero: {
              headline: headline.trim(),
              subtext: subtext.trim(),
              heroMediaUrl: heroMediaUrl.trim(),
            },
            banner: {
              active: bannerActive,
              text: bannerAlert.trim(),
            },
          },
        }),
      });

      if (res.ok) {
        toast.success('Hero announcements updated on live marketing site!');
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to update hero settings');
      }
    } catch {
      toast.error('Network error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" /> Homepage Experience
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Hero Banner &amp; Announcements
          </h1>
          <p className="text-xs text-white/60">
            Customize the primary landing headline, direct perks ribbon, and seasonal promo alerts. Persisted in database.
          </p>
        </div>

        <button
          onClick={loadSettings}
          disabled={loading}
          className="p-2 rounded-lg bg-[#1F1615] border border-[#C59B27]/25 text-[#C59B27] hover:bg-[#821124] hover:text-white transition-all cursor-pointer"
          title="Reload Settings"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-[#1F1615] rounded-xl p-5 border border-[#C59B27]/25 space-y-4 shadow-lg">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
            Main Hero Headline
          </label>
          <input
            type="text"
            required
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
          />
        </div>

        <MediaDropzone
          folder="hero"
          currentUrl={heroMediaUrl}
          onUploadComplete={setHeroMediaUrl}
        />

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
            Hero Subtext
          </label>
          <textarea
            rows={3}
            required
            value={subtext}
            onChange={(e) => setSubtext(e.target.value)}
            className="w-full bg-black/40 border border-white/15 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#C59B27]"
          />
        </div>

        <div className="pt-3 border-t border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C59B27]">
              Top Promotional Alert Ribbon
            </span>
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={bannerActive}
                onChange={(e) => setBannerActive(e.target.checked)}
                className="rounded text-[#821124]"
              />
              <span className="text-white/80 text-[11px]">Active on Public Site</span>
            </label>
          </div>

          <input
            type="text"
            value={bannerAlert}
            onChange={(e) => setBannerAlert(e.target.value)}
            className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
          />
        </div>

        <div className="pt-3 flex justify-end border-t border-white/10">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white font-bold text-xs uppercase tracking-wider shadow flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {saving ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Publish Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
