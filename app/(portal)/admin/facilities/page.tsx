'use client';

import React, { useState, useEffect } from 'react';
import { 
  Compass, Waves, Users, Dumbbell, Coffee, Sparkles, Plus, 
  Edit3, Trash2, Check, X, RotateCw, Image as ImageIcon, 
  CheckCircle2, AlertTriangle, Clock, ShieldCheck 
} from 'lucide-react';
import toast from 'react-hot-toast';
import MediaDropzone from '@/components/ui/MediaDropzone';

interface Facility {
  id: string;
  name: string;
  description: string;
  iconName?: string;
  image?: string;
  operatingHours?: string;
  isResidentOnly?: boolean;
  status: 'operational' | 'maintenance' | 'closed';
  details: string[];
}

const ICON_OPTIONS = [
  { id: 'Waves', label: 'Pool / Ocean (Waves)', icon: Waves },
  { id: 'Users', label: 'Conference / Banquet (Users)', icon: Users },
  { id: 'Dumbbell', label: 'Fitness / Sports (Dumbbell)', icon: Dumbbell },
  { id: 'Coffee', label: 'Lounge / Cafe (Coffee)', icon: Coffee },
  { id: 'Compass', label: 'General Amenity (Compass)', icon: Compass },
];

export default function AdminFacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

  // Form state
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIcon, setFormIcon] = useState('Waves');
  const [formImage, setFormImage] = useState('');
  const [formHours, setFormHours] = useState('6:00 AM – 7:00 PM Daily');
  const [formResidentOnly, setFormResidentOnly] = useState(true);
  const [formStatus, setFormStatus] = useState<'operational' | 'maintenance' | 'closed'>('operational');
  const [formDetails, setFormDetails] = useState<string[]>([]);
  const [newDetail, setNewDetail] = useState('');
  const [saving, setSaving] = useState(false);

  const loadFacilities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings?key=facilities');
      const data = await res.json();
      if (data && Array.isArray(data.value)) {
        setFacilities(data.value);
      } else {
        setFacilities([]);
      }
    } catch (err) {
      console.error('Failed to load facilities:', err);
      toast.error('Unable to fetch facilities from database');
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  const openCreateModal = () => {
    setEditingFacility(null);
    setFormId('fac_' + Date.now());
    setFormName('');
    setFormDesc('');
    setFormIcon('Waves');
    setFormImage('');
    setFormHours('6:00 AM – 7:00 PM Daily');
    setFormResidentOnly(true);
    setFormStatus('operational');
    setFormDetails([]);
    setNewDetail('');
    setShowModal(true);
  };

  const openEditModal = (f: Facility) => {
    setEditingFacility(f);
    setFormId(f.id);
    setFormName(f.name);
    setFormDesc(f.description);
    setFormIcon(f.iconName || 'Waves');
    setFormImage(f.image || '');
    setFormHours(f.operatingHours || '6:00 AM – 7:00 PM Daily');
    setFormResidentOnly(f.isResidentOnly !== false);
    setFormStatus(f.status || 'operational');
    setFormDetails([...(f.details || [])]);
    setNewDetail('');
    setShowModal(true);
  };

  const handleAddDetail = () => {
    if (!newDetail.trim()) return;
    setFormDetails(prev => [...prev, newDetail.trim()]);
    setNewDetail('');
  };

  const handleRemoveDetail = (idx: number) => {
    setFormDetails(prev => prev.filter((_, i) => i !== idx));
  };

  const persistFacilities = async (updatedList: Facility[]) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'facilities',
        value: updatedList,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to persist facilities');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Facility name is required');
      return;
    }

    setSaving(true);
    try {
      const newFacilityObj: Facility = {
        id: editingFacility ? editingFacility.id : (formId.trim() || 'fac_' + Date.now()),
        name: formName.trim(),
        description: formDesc.trim(),
        iconName: formIcon,
        image: formImage.trim() || 'https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--14.jpg',
        operatingHours: formHours.trim(),
        isResidentOnly: formResidentOnly,
        status: formStatus,
        details: formDetails,
      };

      let updated: Facility[];
      if (editingFacility) {
        updated = facilities.map(f => f.id === editingFacility.id ? newFacilityObj : f);
      } else {
        updated = [...facilities, newFacilityObj];
      }

      await persistFacilities(updated);
      setFacilities(updated);
      setShowModal(false);
      toast.success(`Saved "${newFacilityObj.name}" successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (facility: Facility) => {
    if (!confirm(`Are you sure you want to delete "${facility.name}"?`)) return;

    try {
      const updated = facilities.filter(f => f.id !== facility.id);
      await persistFacilities(updated);
      setFacilities(updated);
      toast.success(`Deleted "${facility.name}"`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete facility');
    }
  };

  const handleToggleStatus = async (facility: Facility) => {
    const nextStatus = facility.status === 'operational' ? 'maintenance' : 'operational';
    try {
      const updated = facilities.map(f => 
        f.id === facility.id ? { ...f, status: nextStatus as any } : f
      );
      await persistFacilities(updated);
      setFacilities(updated);
      toast.success(`Status changed to ${nextStatus}`);
    } catch {
      toast.error('Failed to change status');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C59B27]/20">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Compass className="w-3.5 h-3.5" /> Resort Infrastructure
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
            Facilities &amp; Recreation Management
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Manage resident pools, conference venues, gym amenities, and operational availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadFacilities}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-3.5 py-1.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            id="btn-add-facility"
          >
            <Plus className="w-4 h-4 text-[#C59B27]" />
            <span>Add Facility</span>
          </button>
        </div>
      </div>

      {/* Facilities Grid or Empty State */}
      {loading ? (
        <div className="p-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
          <RotateCw className="w-4 h-4 animate-spin text-[#C59B27]" />
          <span>Loading facilities...</span>
        </div>
      ) : facilities.length === 0 ? (
        <div className="p-12 text-center bg-[#1F1615] rounded-xl border border-dashed border-[#C59B27]/30 max-w-xl mx-auto space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#821124]/20 text-[#821124] flex items-center justify-center mx-auto">
            <Compass className="w-5 h-5 text-[#C59B27]" />
          </div>
          <h3 className="font-serif text-lg font-bold text-white">No Facilities Created Yet</h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            There are no facilities stored in the database. Add your resort amenities (e.g. Resident Pools, Conference Center, Fitness Room) to control what is showcased to visitors.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#C59B27]" />
            <span>Add Facility</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {facilities.map((f) => (
            <div
              key={f.id}
              className="bg-[#1F1615] rounded-xl border border-[#C59B27]/25 shadow-md overflow-hidden flex flex-col justify-between transition-all hover:border-[#C59B27]/50"
              id={`facility-card-${f.id}`}
            >
              {/* Image banner */}
              <div className="relative aspect-[16/9] w-full bg-stone-900 overflow-hidden border-b border-white/10">
                {f.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.image}
                    alt={f.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-600 gap-1">
                    <ImageIcon className="w-8 h-8 opacity-40 text-[#C59B27]" />
                    <span className="text-[10px] text-stone-500 uppercase tracking-widest font-mono">No Image</span>
                  </div>
                )}

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                    f.status === 'operational'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                      : f.status === 'maintenance'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                  }`}>
                    {f.status}
                  </span>

                  {f.isResidentOnly && (
                    <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-[#C59B27] border border-[#C59B27]/30">
                      Resident Only
                    </span>
                  )}
                </div>

                {f.operatingHours && (
                  <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/85 backdrop-blur-md text-[10px] text-stone-300 border border-white/10 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#C59B27]" />
                    <span>{f.operatingHours}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-serif text-base font-bold text-white tracking-tight">
                    {f.name}
                  </h3>
                  <p className="text-xs text-stone-400 font-light leading-relaxed line-clamp-2">
                    {f.description}
                  </p>

                  {/* Details bullets */}
                  {f.details && f.details.length > 0 && (
                    <div className="pt-2 space-y-1">
                      {f.details.slice(0, 3).map((d, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-stone-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C59B27] shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{d}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleStatus(f)}
                    className={`text-[11px] font-medium px-2 py-1 rounded transition-colors cursor-pointer ${
                      f.status === 'operational'
                        ? 'text-amber-400 hover:bg-amber-950/40'
                        : 'text-emerald-400 hover:bg-emerald-950/40'
                    }`}
                  >
                    {f.status === 'operational' ? 'Set Maintenance' : 'Set Operational'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(f)}
                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-stone-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      id={`btn-edit-facility-${f.id}`}
                    >
                      <Edit3 className="w-3 h-3 text-[#C59B27]" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(f)}
                      className="p-1 rounded text-stone-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete facility"
                      id={`btn-delete-facility-${f.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create or Edit Facility */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#1F1615] rounded-xl border border-[#C59B27]/30 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-white">
                  {editingFacility ? `Edit Facility — ${editingFacility.name}` : 'Add Resort Facility'}
                </h3>
                <p className="text-[11px] text-stone-400">
                  {editingFacility ? 'Update details, hours, and status' : 'Showcase a new resident amenity on the public website'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                  Facility Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Resident Oceanfront Swimming Pools"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#16100F] border border-white/15 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-stone-300 block mb-1">Operating Hours</label>
                  <input
                    type="text"
                    placeholder="e.g. 6:30 AM – 7:00 PM Daily"
                    value={formHours}
                    onChange={(e) => setFormHours(e.target.value)}
                    className="w-full bg-[#16100F] border border-white/15 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-300 block mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-[#16100F] border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#C59B27]"
                  >
                    <option value="operational">Operational</option>
                    <option value="maintenance">Under Maintenance</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Image Input & Dropzone */}
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1">Photo URL</label>
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="https://media.tamarind.co.ke/tvl-website-assets/..."
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full bg-[#16100F] border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#C59B27]"
                  />
                  <div className="p-2 bg-black/30 rounded-lg border border-dashed border-white/10">
                    <MediaDropzone
                      onUploadComplete={(url) => setFormImage(url)}
                      maxFiles={1}
                      accept="image/*"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the facility ambiance, guidelines, or resident privileges..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-[#16100F] border border-white/15 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              {/* Bullet Details */}
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                  Features &amp; Highlights (List)
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Complimentary sun loungers & towel service"
                      value={newDetail}
                      onChange={(e) => setNewDetail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDetail();
                        }
                      }}
                      className="flex-1 bg-[#16100F] border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#C59B27]"
                    />
                    <button
                      type="button"
                      onClick={handleAddDetail}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {formDetails.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {formDetails.map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 bg-black/40 rounded border border-white/10 text-xs text-stone-300">
                          <span className="truncate">{d}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDetail(i)}
                            className="text-stone-400 hover:text-red-400 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Resident Only checkbox */}
              <div className="pt-2 border-t border-white/10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formResidentOnly}
                    onChange={(e) => setFormResidentOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-[#821124] focus:ring-0 bg-stone-900 border-white/20"
                  />
                  <span className="text-xs text-stone-300 font-medium">
                    Strictly Reserved for Staying Residents (Display badge on website)
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  id="btn-save-facility"
                >
                  {saving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-[#C59B27]" />}
                  <span>{editingFacility ? 'Save Changes' : 'Create Facility'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
