'use client';

import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Plus, Trash2, Key, RotateCw, UserPlus, CheckCircle2, ShieldAlert, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export default function AdminTeamPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'manager' | 'reservations' | 'reception'>('reception');
  const [tempPasswordModal, setTempPasswordModal] = useState<{ email: string; pass: string } | null>(null);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (data.staff) {
        setStaff(data.staff);
      }
    } catch {
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error('Please enter both name and email');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          role: newRole,
          password: newPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Staff account created for ${newName}!`);
        if (data.temporaryPassword) {
          setTempPasswordModal({ email: newEmail.trim(), pass: data.temporaryPassword });
        }
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('reception');
        loadStaff();
      } else {
        toast.error(data.error || 'Failed to create staff account');
      }
    } catch {
      toast.error('Network error creating staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: StaffUser) => {
    if (!confirm(`Are you sure you want to revoke access for ${user.name} (${user.email})?`)) return;

    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/team?id=${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Access revoked for ${user.name}`);
        setStaff((prev) => prev.filter((s) => s.id !== user.id));
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to remove user');
      }
    } catch {
      toast.error('Network error deleting user');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#821124] font-bold uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" /> Staff Accounts &amp; Access Control
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Team Clearance &amp; Roles
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorized staff accounts authenticated via PostgreSQL database. Passwords hashed with bcrypt.
          </p>
        </div>

        <button
          onClick={loadStaff}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          title="Refresh Staff List"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-serif text-base font-bold text-slate-900">
              Active Authorized Personnel ({staff.length})
            </h3>
            <span className="text-[10px] text-[#821124] uppercase tracking-wider font-semibold">
              Live Database
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              <RotateCw className="w-6 h-6 animate-spin mx-auto text-[#821124] mb-2" />
              Loading authorized staff...
            </div>
          ) : staff.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <ShieldAlert className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs text-slate-900 font-medium">No additional staff provisioned</p>
              <p className="text-[11px] text-slate-500">Only the master administrator account currently exists.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Role Clearance</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {staff.map((u) => {
                    const isDeleting = deletingId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900 block">{u.name}</span>
                          <span className="text-slate-500 text-[11px] font-mono">{u.email}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-rose-50 text-[#821124] border border-rose-200'
                              : u.role === 'manager'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-500 font-mono">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never logged in'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={isDeleting}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                            title="Revoke Access"
                          >
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Provision Form */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4 h-fit">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#821124]" />
              Provision Staff Account
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Create an authorized login for resort desk or reservations.
            </p>
          </div>

          <form onSubmit={handleAdd} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Grace Wanjiku"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#821124]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Staff Email *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. grace@tamarindvillage.co.ke"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#821124]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role &amp; Privilege Clearance
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]"
              >
                <option value="reception">Reception / Front Desk (Arrivals &amp; Keys)</option>
                <option value="reservations">Reservations Desk (Bookings &amp; Inquiries)</option>
                <option value="manager">Resort Manager (Pricing, Content, Dining)</option>
                <option value="admin">System Administrator (Full Control)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Password (Optional)
              </label>
              <input
                type="password"
                placeholder="Leave blank to auto-generate"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#821124]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4 text-white" />}
              <span>Create Staff Member</span>
            </button>
          </form>
        </div>
      </div>

      {/* Temp Password Reveal Modal */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4 text-slate-900">
            <div className="text-center space-y-1">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-slate-900">Account Ready</h3>
              <p className="text-xs text-slate-500">Provide this temporary credential to the staff member:</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-center font-mono text-xs">
              <div className="text-slate-500 text-[10px]">EMAIL</div>
              <div className="font-semibold text-slate-900">{tempPasswordModal.email}</div>
              <div className="text-slate-500 text-[10px] pt-1">TEMPORARY PASSWORD</div>
              <div className="font-bold text-[#821124] text-sm tracking-wider select-all">{tempPasswordModal.pass}</div>
            </div>

            <button
              onClick={() => setTempPasswordModal(null)}
              className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
