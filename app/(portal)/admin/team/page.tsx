'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Users, Plus, Trash2, RotateCw, UserPlus, KeyRound, Mail, Loader2, ShieldAlert, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

// Who may open this page is enforced in proxy.ts (admin and GM only).

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt?: string;
  lastLogin?: string | null;
  mustChangePassword?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  security: 'Gate / Security (event check-in only)',
  reception: 'Reception / Front Desk',
  reservations: 'Reservations Desk',
  manager: 'Resort Manager',
  gm: 'General Manager (full control)',
  admin: 'System Administrator (full control)',
};
const ROLE_ORDER = Object.keys(ROLE_LABELS);

const inputCls =
  'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#821124]';

export default function AdminTeamPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [me, setMe] = useState('');
  const [emailOn, setEmailOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('reception');
  const [secret, setSecret] = useState<{ title: string; email: string; pass: string } | null>(null);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load staff list');
      setStaff(data.staff);
      setMe(data.me);
      setEmailOn(!!data.emailConfigured);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const call = async (id: string, url: string, init: RequestInit) => {
    setBusyId(id);
    try {
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    } finally {
      setBusyId(null);
    }
  };

  const updateUser = async (u: StaffUser, patch: Partial<Pick<StaffUser, 'role' | 'active'>>) => {
    const data = await call(u.id, '/api/team', { method: 'PATCH', body: JSON.stringify({ id: u.id, ...patch }) });
    if (data) {
      setStaff((prev) => prev.map((s) => (s.id === u.id ? { ...s, ...patch } : s)));
      if (patch.role) toast.success(`${u.name} is now ${patch.role}. It applies on their next click.`);
      if (patch.active !== undefined) toast.success(`${u.name} ${patch.active ? 'reactivated' : 'deactivated and signed out'}.`);
    }
  };

  const resetPassword = async (u: StaffUser, method: 'email' | 'temporary') => {
    const what = method === 'email' ? `email ${u.email} a reset link` : `set a new temporary password for ${u.name} and sign them out`;
    if (!confirm(`Reset password: ${what}?`)) return;
    const data = await call(u.id, '/api/team/reset-password', { method: 'POST', body: JSON.stringify({ id: u.id, method }) });
    if (!data) return;
    if (data.temporaryPassword) {
      setSecret({ title: 'Temporary password set', email: u.email, pass: data.temporaryPassword });
      setStaff((prev) => prev.map((s) => (s.id === u.id ? { ...s, mustChangePassword: true } : s)));
    } else {
      toast.success(data.message);
    }
  };

  const handleDelete = async (u: StaffUser) => {
    if (!confirm(`Permanently delete ${u.name} (${u.email})? Deactivating keeps their history; use delete only for mistakes.`)) return;
    const data = await call(u.id, `/api/team?id=${encodeURIComponent(u.id)}`, { method: 'DELETE' });
    if (data) {
      toast.success(`Deleted ${u.name}`);
      setStaff((prev) => prev.filter((s) => s.id !== u.id));
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create staff account');
      if (data.temporaryPassword) {
        setSecret({ title: 'Account created', email: data.user.email, pass: data.temporaryPassword });
      } else {
        toast.success(`Account created. ${data.user.email} has been emailed a link to choose a password (valid 3 days).`);
      }
      setNewName('');
      setNewEmail('');
      setNewRole('reception');
      loadStaff();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = (current: string) => (ROLE_ORDER.includes(current) ? ROLE_ORDER : [current, ...ROLE_ORDER]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#821124] font-bold uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" /> Staff accounts
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">Staff Team &amp; Roles</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Change a role, deactivate someone who has left, or reset a forgotten password. Changes apply on the person&apos;s next click.
          </p>
        </div>
        <button
          onClick={loadStaff}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 shadow-xs disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {!loading && !emailOn && (
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-xs">
          Email is not set up (RESEND_API_KEY is missing), so invites and reset links cannot be emailed. New accounts and resets get a
          temporary password for you to pass on privately; the person chooses their own at first sign-in.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-serif text-base font-bold text-slate-900">Staff ({staff.length})</h3>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              <RotateCw className="w-6 h-6 animate-spin mx-auto text-[#821124] mb-2" />
              Loading staff...
            </div>
          ) : staff.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <ShieldAlert className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs text-slate-900 font-medium">No staff accounts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Staff member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {staff.map((u) => {
                    const busy = busyId === u.id;
                    const isMe = u.id === me;
                    return (
                      <tr key={u.id} className={u.active ? '' : 'bg-slate-50 text-slate-400'}>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">
                            {u.name} {isMe && <span className="text-[10px] text-slate-500 font-normal">(you)</span>}
                          </span>
                          <span className="text-slate-500 text-[11px] font-mono">{u.email}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {u.lastLogin ? `Last sign-in ${new Date(u.lastLogin).toLocaleDateString()}` : 'Never signed in'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            aria-label={`Role for ${u.name}`}
                            value={u.role}
                            disabled={busy || isMe}
                            title={isMe ? 'Another admin or GM must change your role' : 'Change role'}
                            onChange={(e) => updateUser(u, { role: e.target.value })}
                            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] text-slate-900 disabled:opacity-60 max-w-[11rem]"
                          >
                            {roleOptions(u.role).map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r] || r}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 space-y-1">
                          <button
                            onClick={() => updateUser(u, { active: !u.active })}
                            disabled={busy || isMe}
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border disabled:opacity-60 ${
                              u.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                            title={u.active ? 'Click to deactivate' : 'Click to reactivate'}
                          >
                            {u.active ? 'Active' : 'Deactivated'}
                          </button>
                          {u.mustChangePassword && u.active && (
                            <span className="block text-[10px] text-amber-700">Temporary password</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1">
                            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#821124] m-1.5" />}
                            {!isMe && u.active && emailOn && (
                              <button
                                onClick={() => resetPassword(u, 'email')}
                                disabled={busy}
                                className="p-1.5 text-slate-400 hover:text-[#821124] rounded-lg hover:bg-rose-50"
                                title="Email a password reset link"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!isMe && u.active && (
                              <button
                                onClick={() => resetPassword(u, 'temporary')}
                                disabled={busy}
                                className="p-1.5 text-slate-400 hover:text-[#821124] rounded-lg hover:bg-rose-50"
                                title="Set a temporary password"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!isMe && (
                              <button
                                onClick={() => handleDelete(u)}
                                disabled={busy}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                title="Delete account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4 h-fit">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#821124]" />
              Add a staff member
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {emailOn
                ? 'They get an email with a link to choose their own password (valid 3 days).'
                : 'You get a temporary password to pass on; they choose their own at first sign-in.'}
            </p>
          </div>

          <form onSubmit={handleAdd} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full name *</label>
              <input type="text" required placeholder="e.g. Grace Wanjiku" value={newName} onChange={(e) => setNewName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work email *</label>
              <input type="email" required placeholder="e.g. grace@tamarind.co.ke" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className={inputCls}>
                {ROLE_ORDER.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4 text-white" />}
              <span>Create account</span>
            </button>
          </form>
        </div>
      </div>

      {secret && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4 text-slate-900">
            <div className="text-center space-y-1">
              <KeyRound className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-slate-900">{secret.title}</h3>
              <p className="text-xs text-slate-500">
                Give this to the staff member privately. It is shown only once, and they will be asked to choose their own password when
                they sign in.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-center font-mono text-xs">
              <div className="text-slate-500 text-[10px]">EMAIL</div>
              <div className="font-semibold text-slate-900">{secret.email}</div>
              <div className="text-slate-500 text-[10px] pt-1">TEMPORARY PASSWORD</div>
              <div className="font-bold text-[#821124] text-sm tracking-wider select-all">{secret.pass}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard?.writeText(secret.pass).then(() => toast.success('Copied'))}
                className="flex-1 py-2 rounded-lg border border-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <button onClick={() => setSecret(null)} className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
