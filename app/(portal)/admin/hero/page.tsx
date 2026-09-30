'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layers, Plus, Trash2, Edit, Save, CheckCircle2, 
  RotateCw, Eye, Sparkles, Image as ImageIcon, Video, X, 
  Globe, AlertCircle, Loader2, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import MediaDropzone from '@/components/ui/MediaDropzone';

export interface HeroCampaign {
  id: string;
  campaignTitle: string;
  seasonTag?: string;
  headline: string;
  subtext: string;
  bannerText: string;
  bannerActive: boolean;
  primaryMediaUrl: string;
  mediaType: 'image' | 'video';
  gallery: string[];
  isPublic: boolean;
  createdAt: string;
}

const DEFAULT_CAMPAIGNS: HeroCampaign[] = [
  {
    id: 'hero_default_clifftop',
    campaignTitle: 'Iconic Clifftop Sanctuary (Evergreen)',
    seasonTag: 'All Season',
    headline: 'Coastal Grandeur & Private Luxury Suites Overlooking Tudor Creek',
    subtext: 'Experience Mombasa’s most iconic sanctuary. Elegant Swahili-styled oceanfront apartments, world-renowned fresh seafood at Tamarind Restaurant, and unforgettable sunset voyages aboard the Tamarind Dhow.',
    bannerText: 'Direct Booking Perk: Complimentary Sunset Welcome Cocktail & Dhow Priority Seating',
    bannerActive: true,
    primaryMediaUrl: 'https://media.tamarind.co.ke/hero/harbour-clifftop.jpg',
    mediaType: 'image',
    gallery: [
      'https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--2.jpg',
      'https://media.tamarind.co.ke/tvl-website-assets/dhow_sunset_cruise.jpg',
      'https://media.tamarind.co.ke/tvl-website-assets/pool_overview.jpg'
    ],
    isPublic: true,
    createdAt: new Date().toISOString(),
  }
];

export default function AdminHeroPage() {
  const [campaigns, setCampaigns] = useState<HeroCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal state (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<HeroCampaign | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formCampaignTitle, setFormCampaignTitle] = useState('');
  const [formSeasonTag, setFormSeasonTag] = useState('Summer Special');
  const [formHeadline, setFormHeadline] = useState('');
  const [formSubtext, setFormSubtext] = useState('');
  const [formBannerText, setFormBannerText] = useState('');
  const [formBannerActive, setFormBannerActive] = useState(true);
  const [formPrimaryMediaUrl, setFormPrimaryMediaUrl] = useState('');
  const [formMediaType, setFormMediaType] = useState<'image' | 'video'>('image');
  const [formGallery, setFormGallery] = useState<string[]>([]);
  const [formGalleryInput, setFormGalleryInput] = useState('');

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings?key=hero_announcements');
      const data = await res.json();
      if (data.value && Array.isArray(data.value) && data.value.length > 0) {
        setCampaigns(data.value);
      } else {
        // Check single hero setting
        const singleRes = await fetch('/api/settings?key=hero');
        const singleData = await singleRes.json();
        if (singleData.value) {
          const legacyCampaign: HeroCampaign = {
            id: 'hero_live',
            campaignTitle: 'Primary Landing Hero',
            seasonTag: 'Current Live',
            headline: singleData.value.headline || DEFAULT_CAMPAIGNS[0].headline,
            subtext: singleData.value.subtext || DEFAULT_CAMPAIGNS[0].subtext,
            bannerText: 'Direct Booking Perk: Complimentary Sunset Welcome Cocktail',
            bannerActive: true,
            primaryMediaUrl: singleData.value.heroMediaUrl || DEFAULT_CAMPAIGNS[0].primaryMediaUrl,
            mediaType: 'image',
            gallery: [],
            isPublic: true,
            createdAt: new Date().toISOString(),
          };
          setCampaigns([legacyCampaign]);
        } else {
          setCampaigns(DEFAULT_CAMPAIGNS);
        }
      }
    } catch {
      setCampaigns(DEFAULT_CAMPAIGNS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const persistCampaigns = async (newList: HeroCampaign[]) => {
    // Determine active campaign to sync to legacy 'hero' and 'banner' keys for marketing site
    const active = newList.find((c) => c.isPublic) || newList[0];

    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: {
          hero_announcements: newList,
          hero: {
            headline: active?.headline || '',
            subtext: active?.subtext || '',
            heroMediaUrl: active?.primaryMediaUrl || '',
          },
          banner: {
            active: active?.bannerActive ?? true,
            text: active?.bannerText || '',
          },
          hero_images: active?.gallery && active.gallery.length > 0 ? active.gallery : [active?.primaryMediaUrl],
        },
      }),
    });

    return res.ok;
  };

  const handleTogglePublic = async (campaignId: string) => {
    setTogglingId(campaignId);
    try {
      const updated = campaigns.map((c) => ({
        ...c,
        isPublic: c.id === campaignId,
      }));

      const ok = await persistCampaigns(updated);
      if (ok) {
        setCampaigns(updated);
        toast.success('Campaign is now live on the public website!');
      } else {
        toast.error('Failed to update live campaign');
      }
    } catch {
      toast.error('Network error updating live campaign');
    } finally {
      setTogglingId(null);
    }
  };

  const openCreateModal = () => {
    setEditingCampaign(null);
    setFormCampaignTitle('');
    setFormSeasonTag('Summer Special');
    setFormHeadline('');
    setFormSubtext('');
    setFormBannerText('Direct Booking Perk: Complimentary Sunset Welcome Cocktail & Dhow Priority Seating');
    setFormBannerActive(true);
    setFormPrimaryMediaUrl('https://media.tamarind.co.ke/hero/harbour-clifftop.jpg');
    setFormMediaType('image');
    setFormGallery([]);
    setShowModal(true);
  };

  const openEditModal = (c: HeroCampaign) => {
    setEditingCampaign(c);
    setFormCampaignTitle(c.campaignTitle);
    setFormSeasonTag(c.seasonTag || 'Summer Special');
    setFormHeadline(c.headline);
    setFormSubtext(c.subtext);
    setFormBannerText(c.bannerText);
    setFormBannerActive(c.bannerActive);
    setFormPrimaryMediaUrl(c.primaryMediaUrl);
    setFormMediaType(c.mediaType || 'image');
    setFormGallery(c.gallery || []);
    setShowModal(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formHeadline.trim() || !formCampaignTitle.trim()) {
      toast.error('Campaign title and headline are required');
      return;
    }

    setIsSubmitting(true);
    try {
      let updated: HeroCampaign[];

      if (editingCampaign) {
        updated = campaigns.map((c) =>
          c.id === editingCampaign.id
            ? {
                ...c,
                campaignTitle: formCampaignTitle.trim(),
                seasonTag: formSeasonTag.trim(),
                headline: formHeadline.trim(),
                subtext: formSubtext.trim(),
                bannerText: formBannerText.trim(),
                bannerActive: formBannerActive,
                primaryMediaUrl: formPrimaryMediaUrl.trim(),
                mediaType: formMediaType,
                gallery: formGallery,
              }
            : c
        );
      } else {
        const newCampaign: HeroCampaign = {
          id: 'camp_' + Date.now(),
          campaignTitle: formCampaignTitle.trim(),
          seasonTag: formSeasonTag.trim(),
          headline: formHeadline.trim(),
          subtext: formSubtext.trim(),
          bannerText: formBannerText.trim(),
          bannerActive: formBannerActive,
          primaryMediaUrl: formPrimaryMediaUrl.trim(),
          mediaType: formMediaType,
          gallery: formGallery,
          isPublic: campaigns.length === 0,
          createdAt: new Date().toISOString(),
        };
        updated = [newCampaign, ...campaigns];
      }

      const ok = await persistCampaigns(updated);
      if (ok) {
        setCampaigns(updated);
        toast.success(editingCampaign ? 'Campaign updated!' : 'New seasonal campaign created!');
        setShowModal(false);
      } else {
        toast.error('Failed to save campaign');
      }
    } catch {
      toast.error('Network error saving campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete campaign "${title}"?`)) return;
    setDeletingId(id);
    try {
      const updated = campaigns.filter((c) => c.id !== id);
      if (updated.length > 0 && !updated.some((c) => c.isPublic)) {
        updated[0].isPublic = true;
      }
      const ok = await persistCampaigns(updated);
      if (ok) {
        setCampaigns(updated);
        toast.success('Campaign removed');
      } else {
        toast.error('Failed to delete campaign');
      }
    } catch {
      toast.error('Network error deleting campaign');
    } finally {
      setDeletingId(null);
    }
  };

  const addGalleryItem = () => {
    if (!formGalleryInput.trim()) return;
    setFormGallery([...formGallery, formGalleryInput.trim()]);
    setFormGalleryInput('');
  };

  const removeGalleryItem = (index: number) => {
    setFormGallery(formGallery.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#821124] font-semibold uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" /> Seasonal Landing Manager
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Hero Announcements &amp; Media Campaigns
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create seasonal hero experiences, upload videos and gallery slides, and switch which campaign is live on the public site.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadCampaigns}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            title="Refresh Campaigns"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 rounded-lg bg-[#821124] hover:bg-[#6b0d1d] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Hero Campaign</span>
          </button>
        </div>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#821124]" />
          <p>Loading seasonal hero campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="p-16 text-center text-slate-500 space-y-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <Layers className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-800">No Hero Campaigns Created</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create your first seasonal hero banner with clifftop imagery, video backgrounds, and promotional ribbons.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#6b0d1d] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Campaign</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {campaigns.map((c) => {
            const isLive = c.isPublic;
            const isToggling = togglingId === c.id;
            const isDeleting = deletingId === c.id;

            return (
              <div
                key={c.id}
                className={`bg-white rounded-xl border transition-all duration-200 shadow-sm flex flex-col justify-between overflow-hidden ${
                  isLive ? 'border-[#821124] ring-2 ring-[#821124]/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Media Preview Header */}
                  <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                    {c.mediaType === 'video' ? (
                      <video
                        src={c.primaryMediaUrl}
                        className="w-full h-full object-cover opacity-80"
                        muted
                        loop
                        autoPlay
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.primaryMediaUrl}
                        alt={c.campaignTitle}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                    {/* Tags Top Left */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 text-slate-900 backdrop-blur-md shadow-sm">
                        {c.seasonTag || 'Campaign'}
                      </span>
                      {c.mediaType === 'video' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-900/80 text-white flex items-center gap-1">
                          <Video className="w-3 h-3 text-[#C59B27]" /> Video Hero
                        </span>
                      )}
                    </div>

                    {/* Public Live Badge Top Right */}
                    <div className="absolute top-3 right-3">
                      {isLive ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
                          <Check className="w-3 h-3" /> Live on Website
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 text-slate-300 backdrop-blur-md">
                          Draft / Inactive
                        </span>
                      )}
                    </div>

                    {/* Headline overlay bottom */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-serif text-base font-bold leading-snug line-clamp-1">
                        {c.campaignTitle}
                      </h3>
                      <p className="text-[11px] text-white/80 line-clamp-1 font-light">
                        {c.headline}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {c.subtext}
                    </p>

                    {/* Promotional Alert Ribbon Preview */}
                    <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">
                          Promo Ribbon Alert
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                          c.bannerActive ? 'bg-amber-200/60 text-amber-900' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {c.bannerActive ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-950 font-medium truncate">
                        {c.bannerText}
                      </p>
                    </div>

                    {/* Media Gallery Chips */}
                    {c.gallery && c.gallery.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          Additional Slides ({c.gallery.length} Media Assets)
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                          {c.gallery.map((url, i) => (
                            <div key={i} className="w-12 h-9 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/60">
                  <div>
                    {isLive ? (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Active on Homepage
                      </span>
                    ) : (
                      <button
                        onClick={() => handleTogglePublic(c.id)}
                        disabled={isToggling}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-[#821124] text-slate-700 hover:text-[#821124] text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isToggling ? (
                          <Loader2 className="w-3 h-3 animate-spin text-[#821124]" />
                        ) : (
                          <Globe className="w-3 h-3" />
                        )}
                        <span>Publish to Live Site</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(c)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDelete(c.id, c.campaignTitle)}
                      disabled={isDeleting || isLive}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title={isLive ? 'Cannot delete live campaign' : 'Delete Campaign'}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT CAMPAIGN MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 border border-slate-200 shadow-xl relative text-slate-900 space-y-4 my-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">
                {editingCampaign ? `Edit Campaign: ${editingCampaign.campaignTitle}` : 'Create New Hero Campaign'}
              </h2>
              <p className="text-xs text-slate-500">
                Configure seasonal headline, clifftop backdrop media, promo alert ribbon, and gallery slides.
              </p>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5 max-h-[72vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Campaign / Season Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Coastal Escape 2026"
                    value={formCampaignTitle}
                    onChange={(e) => setFormCampaignTitle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Season Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Easter Special"
                    value={formSeasonTag}
                    onChange={(e) => setFormSeasonTag(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Primary Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coastal Grandeur & Private Luxury Suites Overlooking Tudor Creek"
                  value={formHeadline}
                  onChange={(e) => setFormHeadline(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Subtext Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Experience Mombasa’s most iconic sanctuary..."
                  value={formSubtext}
                  onChange={(e) => setFormSubtext(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                />
              </div>

              {/* Primary Media (Image or Video) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Primary Background Media (Image or Video)
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="mediaType"
                        checked={formMediaType === 'image'}
                        onChange={() => setFormMediaType('image')}
                        className="text-[#821124]"
                      />
                      <span className="text-slate-700 text-xs">Image</span>
                    </label>
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="mediaType"
                        checked={formMediaType === 'video'}
                        onChange={() => setFormMediaType('video')}
                        className="text-[#821124]"
                      />
                      <span className="text-slate-700 text-xs">Video</span>
                    </label>
                  </div>
                </div>

                <MediaDropzone
                  folder="hero"
                  currentUrl={formPrimaryMediaUrl}
                  onUploadComplete={setFormPrimaryMediaUrl}
                  label={formMediaType === 'video' ? 'Upload Video Clip (MP4/WebM)' : 'Upload Hero Photo'}
                  helperText="Drag & drop asset here or paste direct CDN / media URL"
                />
              </div>

              {/* Additional Gallery Media (Slides / Videos) */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Additional Carousel Media (Images &amp; Videos)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter image or video URL to add to carousel..."
                    value={formGalleryInput}
                    onChange={(e) => setFormGalleryInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                  />
                  <button
                    type="button"
                    onClick={addGalleryItem}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Add Slide
                  </button>
                </div>

                {formGallery.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                    {formGallery.map((url, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden bg-slate-100 border border-slate-200 h-14">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryItem(idx)}
                          className="absolute inset-0 bg-rose-900/80 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Alert Ribbon */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Promotional Alert Ribbon
                  </span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formBannerActive}
                      onChange={(e) => setFormBannerActive(e.target.checked)}
                      className="rounded text-[#821124]"
                    />
                    <span className="text-slate-600 text-xs font-medium">Show on Website</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Direct Booking Perk: Complimentary Sunset Welcome Cocktail"
                  value={formBannerText}
                  onChange={(e) => setFormBannerText(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-[#821124] hover:bg-[#6b0d1d] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Campaign...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingCampaign ? 'Save Changes' : 'Create Campaign'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
