'use client';

import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Plus, Trash2, Key, RotateCw, UserPlus, CheckCircle2, ShieldAlert } from 'lucide-react';
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
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" /> Staff Accounts &amp; Access Control
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Team Clearance &amp; Roles
          </h1>
          <p className="text-xs text-white/60">
            Real staff accounts authenticated via PostgreSQL database. Passwords hashed with bcrypt.
          </p>
        </div>

        <button
          onClick={loadStaff}
          disabled={loading}
          className="p-2 rounded-lg bg-[#1F1615] border border-[#C59B27]/25 text-[#C59B27] hover:bg-[#821124] hover:text-white transition-all cursor-pointer self-start sm:self-auto"
          title="Refresh Staff List"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Table */}
        <div className="lg:col-span-2 bg-[#1F1615] rounded-xl border border-[#C59B27]/25 overflow-hidden shadow-lg">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-white">
              Active Authorized Personnel ({staff.length})
            </h3>
            <span className="text-[10px] text-[#C59B27] uppercase tracking-wider font-semibold">
              Live Database
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-white/50 text-xs">
              <RotateCw className="w-6 h-6 animate-spin mx-auto text-[#C59B27] mb-2" />
              Loading authorized staff...
            </div>
          ) : staff.length === 0 ? (
            <div className="p-12 text-center text-white/40 space-y-2">
              <ShieldAlert className="w-8 h-8 mx-auto text-[#C59B27] opacity-40" />
              <p className="text-xs text-white font-medium">No additional staff provisioned</p>
              <p className="text-[11px] text-white/40">Use the form on the right to invite front desk, reservations, or manager accounts.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/30 border-b border-white/10 text-white/50 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Role Clearance</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {staff.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white block">{u.name}</span>
                        <span className="text-white/40 text-[11px] font-mono">{u.email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-[#821124]/30 text-[#FAF6F0] border border-[#821124]'
                            : u.role === 'manager'
                            ? 'bg-[#C59B27]/20 text-[#C59B27] border border-[#C59B27]/30'
                            : 'bg-white/10 text-white/80 border border-white/10'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-white/40 font-mono">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never logged in'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1.5 text-white/40 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                          title="Revoke Access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Provision Form */}
        <div className="bg-[#1F1615] rounded-xl p-5 border border-[#C59B27]/25 shadow-lg space-y-4 h-fit">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#C59B27]" />
              Provision Staff Account
            </h3>
            <p className="text-[11px] text-white/50 mt-0.5">
              Create an authorized login for resort desk or reservations.
            </p>
          </div>

          <form onSubmit={handleAdd} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Grace Wanjiku"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                Staff Email *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. grace@tamarindvillage.co.ke"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                Clearance Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C59B27]"
              >
                <option value="reception">Reception / Front Desk (Arrivals &amp; Keys)</option>
                <option value="reservations">Reservations (Inquiries &amp; Allocations)</option>
                <option value="manager">Resort Manager (Full Operations)</option>
                <option value="admin">System Administrator (Master Control)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                Initial Password (Optional)
              </label>
              <input
                type="password"
                placeholder="Defaults to Tamarind@2026 if blank"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C59B27]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-3 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Provisioning...' : 'Create Account'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Temp Password Dialog */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1F1615] border border-[#C59B27]/40 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h4 className="font-serif font-bold text-white text-base">Account Provisioned</h4>
            </div>
            <p className="text-xs text-white/70">
              Account created for <strong className="text-white">{tempPasswordModal.email}</strong>. Share the temporary password below:
            </p>
            <div className="bg-black/60 p-3 rounded-lg font-mono text-center text-sm font-bold text-[#C59B27] select-all border border-white/10">
              {tempPasswordModal.pass}
            </div>
            <button
              onClick={() => setTempPasswordModal(null)}
              className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
