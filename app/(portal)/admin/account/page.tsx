'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { homePageFor } from '@/lib/auth/roles';

const inputCls =
  'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#821124]';

export default function MyAccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string; mustChangePassword: boolean } | null>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      toast.error('The two new passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not change the password.');
      toast.success(data.message);
      setCurrent('');
      setNext('');
      setConfirm('');
      if (user?.mustChangePassword) {
        router.push(homePageFor(user.role));
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 px-2 space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-slate-900">My account</h1>
        {user && (
          <p className="text-xs text-slate-500 mt-1">
            {user.name} · {user.email} · <span className="uppercase">{user.role}</span>
          </p>
        )}
      </div>

      {user?.mustChangePassword && (
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-xs flex gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>You are signed in with a temporary password. Choose your own password to continue to the portal.</span>
        </div>
      )}

      <form onSubmit={submit} className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3.5">
        <h2 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#821124]" /> Change password
        </h2>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {user?.mustChangePassword ? 'Temporary password' : 'Current password'}
          </label>
          <input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">New password</label>
          <input type="password" required minLength={10} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
          <p className="text-[10px] text-slate-500 mt-1">At least 10 characters, with a letter and a number.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm new password</label>
          <input type="password" required minLength={10} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>Save new password</span>
        </button>
        <p className="text-[10px] text-slate-500">Changing your password signs you out on every other device.</p>
      </form>
    </div>
  );
}
