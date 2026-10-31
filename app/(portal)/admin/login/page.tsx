'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <LoginCard />
    </Suspense>
  );
}

function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get('reset');
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>(resetToken ? 'reset' : 'login');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Welcome back, ${data.user.name}!`);
        const callbackUrl = searchParams.get('callbackUrl');
        router.push(callbackUrl && callbackUrl.startsWith('/admin') ? callbackUrl : '/admin/frontdesk');
        router.refresh();
      } else {
        toast.error(data.error || 'Invalid credentials.');
      }
    } catch {
      toast.error('Network error during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed.');
      setNotice(data.message);
    } catch (err: any) {
      toast.error(err.message || 'Could not send the reset link.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('The two passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed.');
      toast.success(data.message);
      setMode('login');
      setNewPassword('');
      setConfirmPassword('');
      router.replace('/admin/login');
    } catch (err: any) {
      toast.error(err.message || 'Could not reset the password.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C59B27] transition-colors';
  const labelCls = 'block text-xs font-bold uppercase tracking-wider text-[#C59B27] mb-1';
  const buttonCls =
    'w-full py-3.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#16100F] via-[#1F1615] to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1F1615]/90 border border-[#C59B27]/30 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#821124]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#C59B27]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-full bg-white/10 p-2 mx-auto border border-[#C59B27]/40 shadow-lg flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo.png" alt="Tamarind Village" className="w-full h-full object-contain" />
          </div>

          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Tamarind Staff Portal
            </h1>
            <p className="text-xs text-[#C59B27] uppercase tracking-widest mt-1">
              Authorized Management &amp; Desk Access
            </p>
          </div>
        </div>

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <p className="text-xs text-white/70 leading-relaxed">
              Enter your staff email. If it belongs to an active account, we will email you a link to choose a new password.
            </p>
            <div>
              <label className={labelCls}>Staff Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input type="email" required placeholder="name@tamarind.co.ke" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
              </div>
            </div>
            {notice && <p className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-700/40 rounded-lg p-3">{notice}</p>}
            <button type="submit" disabled={loading} className={buttonCls}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>Email me a reset link</span>
            </button>
            <button type="button" onClick={() => { setMode('login'); setNotice(''); }} className="w-full text-[11px] text-white/60 hover:text-white underline cursor-pointer">
              Back to sign in
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-xs text-white/70 leading-relaxed">
              Choose a new password: at least 10 characters, with a letter and a number.
            </p>
            <div>
              <label className={labelCls}>New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input type="password" required minLength={10} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input type="password" required minLength={10} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} />
              </div>
            </div>
            <button type="submit" disabled={loading} className={buttonCls}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Save new password</span>
            </button>
          </form>
        )}

        {/* Form */}
        {mode === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#C59B27] mb-1">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="name@tamarind.co.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C59B27] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#C59B27] mb-1">
              Secret Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C59B27] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Clearance...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Enter Operations Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <button type="button" onClick={() => setMode('forgot')} className="w-full text-[11px] text-white/60 hover:text-white underline cursor-pointer">
            Forgot your password?
          </button>
        </form>
        )}

      </div>
    </div>
  );
}
