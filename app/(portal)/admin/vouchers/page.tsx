'use client';

import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Edit, 
  RotateCw, 
  CheckCircle2, 
  X, 
  Calendar, 
  DollarSign, 
  Percent, 
  Tag, 
  Copy, 
  Check, 
  AlertCircle,
  Clock,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Voucher {
  id: string;
  code: string;
  description?: string | null;
  discountType: 'percentage' | 'fixed_usd' | 'fixed_kes';
  discountValue: number;
  minSpendUsd?: number | null;
  maxDiscountUsd?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  usageLimit?: number | null;
  usedCount?: number | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminVouchersPage() {
  const [vouchersList, setVouchersList] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_usd' | 'fixed_kes'>('percentage');
  const [discountValue, setDiscountValue] = useState<number | ''>(10);
  const [minSpendUsd, setMinSpendUsd] = useState<number | ''>(0);
  const [maxDiscountUsd, setMaxDiscountUsd] = useState<number | ''>('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vouchers');
      const data = await res.json();
      if (data.vouchers) {
        setVouchersList(data.vouchers);
      }
    } catch (err: any) {
      toast.error('Failed to load vouchers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  const openCreateModal = () => {
    setEditingVoucher(null);
    setCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue(10);
    setMinSpendUsd(0);
    setMaxDiscountUsd('');
    setValidFrom('');
    setValidUntil('');
    setUsageLimit('');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (v: Voucher) => {
    setEditingVoucher(v);
    setCode(v.code);
    setDescription(v.description || '');
    setDiscountType(v.discountType);
    setDiscountValue(v.discountValue);
    setMinSpendUsd(v.minSpendUsd ?? 0);
    setMaxDiscountUsd(v.maxDiscountUsd ?? '');
    setValidFrom(v.validFrom || '');
    setValidUntil(v.validUntil || '');
    setUsageLimit(v.usageLimit ?? '');
    setIsActive(v.isActive);
    setShowModal(true);
  };

  const handleCopy = (c: string) => {
    navigator.clipboard.writeText(c);
    setCopiedCode(c);
    toast.success(`Copied '${c}' to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = async (v: Voucher) => {
    try {
      const nextActive = !v.isActive;
      setVouchersList(prev => prev.map(item => item.id === v.id ? { ...item, isActive: nextActive } : item));
      const res = await fetch('/api/vouchers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: v.id, isActive: nextActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(nextActive ? `Voucher '${v.code}' activated` : `Voucher '${v.code}' paused`);
    } catch {
      toast.error('Failed to update voucher status');
      loadVouchers();
    }
  };

  const handleDelete = async (id: string, codeName: string) => {
    if (!confirm(`Are you sure you want to delete promo code '${codeName}'?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/vouchers?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success(`Voucher '${codeName}' deleted`);
      setVouchersList(prev => prev.filter(v => v.id !== id));
    } catch {
      toast.error('Failed to delete voucher');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || discountValue === '') {
      toast.error('Please enter a voucher code and discount value');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        description,
        discountType,
        discountValue: Number(discountValue),
        minSpendUsd: minSpendUsd === '' ? 0 : Number(minSpendUsd),
        maxDiscountUsd: maxDiscountUsd === '' ? null : Number(maxDiscountUsd),
        validFrom: validFrom || null,
        validUntil: validUntil || null,
        usageLimit: usageLimit === '' ? null : Number(usageLimit),
        isActive,
      };

      if (editingVoucher) {
        const res = await fetch('/api/vouchers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingVoucher.id, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update voucher');
        toast.success(`Voucher '${payload.code}' updated successfully!`);
      } else {
        const res = await fetch('/api/vouchers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create voucher');
        toast.success(`Voucher '${payload.code}' created successfully!`);
      }

      setShowModal(false);
      loadVouchers();
    } catch (err: any) {
      toast.error(err.message || 'Error saving voucher');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = vouchersList.filter(v => v.isActive).length;
  const totalUsed = vouchersList.reduce((acc, v) => acc + (v.usedCount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#821124] font-bold uppercase tracking-wider mb-1">
            <Ticket className="w-3.5 h-3.5" />
            <span>Promotional Engine</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Vouchers &amp; Promo Codes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure discount codes, percentages, fixed currency deductions, and campaign expiration dates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadVouchers}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh List"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-3.5 py-1.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create Promo Code</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#821124]/10 text-[#821124]">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Codes</span>
            <span className="text-xl font-serif font-bold text-slate-900">{vouchersList.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Codes</span>
            <span className="text-xl font-serif font-bold text-emerald-700">{activeCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Times Redeemed</span>
            <span className="text-xl font-serif font-bold text-slate-900">{totalUsed}</span>
          </div>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            Loading promotional vouchers...
          </div>
        ) : vouchersList.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Ticket className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-base font-bold text-slate-800">No Vouchers Configured</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first promotional voucher code to offer guests seasonal or VIP discounts during checkout.
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-[#821124] text-white text-xs font-semibold rounded-lg hover:bg-[#680e1c] cursor-pointer"
            >
              + Create First Voucher
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Promo Code</th>
                  <th className="py-3 px-4">Discount Value</th>
                  <th className="py-3 px-4">Min Spend / Cap</th>
                  <th className="py-3 px-4">Validity Window</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {vouchersList.map((v) => {
                  const isDeleting = deletingId === v.id;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(v.code)}
                            className="font-mono font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            title="Click to copy code"
                          >
                            <span>{v.code}</span>
                            {copiedCode === v.code ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        </div>
                        {v.description && (
                          <span className="text-[11px] text-slate-500 block mt-0.5">{v.description}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold">
                        {v.discountType === 'percentage' && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                            {v.discountValue}% OFF
                          </span>
                        )}
                        {v.discountType === 'fixed_usd' && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                            ${v.discountValue} USD OFF
                          </span>
                        )}
                        {v.discountType === 'fixed_kes' && (
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                            KES {v.discountValue.toLocaleString()} OFF
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        <div>Min: {v.minSpendUsd ? `$${v.minSpendUsd}` : 'None'}</div>
                        {v.maxDiscountUsd && (
                          <div className="text-[10px] text-slate-400">Cap: ${v.maxDiscountUsd}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {v.validFrom || v.validUntil ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {v.validFrom || 'Now'} → {v.validUntil || 'Ongoing'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No expiry</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold text-slate-800">
                          {v.usedCount || 0}
                        </span>
                        <span className="text-slate-400">
                          {v.usageLimit ? ` / ${v.usageLimit}` : ' (Unlimited)'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(v)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                            v.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {v.isActive ? 'Active' : 'Paused'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(v)}
                            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Edit Voucher"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(v.id, v.code)}
                            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            title="Delete Voucher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#821124]" />
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  {editingVoucher ? 'Edit Voucher' : 'Create New Promo Code'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Voucher Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SPECIAL2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold uppercase focus:outline-none focus:border-[#821124] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Campaign / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15% Long-Stay discount on oceanfront suites"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#821124] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#821124] focus:bg-white"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed_usd">Fixed Amount (USD $)</option>
                    <option value="fixed_kes">Fixed Amount (KES)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="e.g. 15"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#821124] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Min Spend (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0 = no minimum"
                    value={minSpendUsd}
                    onChange={(e) => setMinSpendUsd(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#821124] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Max Discount Cap (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Leave empty for uncapped"
                    value={maxDiscountUsd}
                    onChange={(e) => setMaxDiscountUsd(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#821124] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Valid From (Optional)
                  </label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#821124] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Valid Until (Optional)
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#821124] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Usage Limit (Max Redemptions)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Leave empty for unlimited"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#821124] focus:bg-white"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#821124] cursor-pointer"
                    />
                    <span className="font-semibold text-slate-800">Active Code</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#821124] hover:bg-[#680e1c] text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>{saving ? 'Saving...' : editingVoucher ? 'Update Voucher' : 'Create Voucher'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
