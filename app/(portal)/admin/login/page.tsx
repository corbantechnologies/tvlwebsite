'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, Sparkles, Key } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
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
        router.push('/admin/frontdesk');
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

  const quickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

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

        {/* Form */}
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
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="mt-8 pt-6 border-t border-white/10 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block text-center">
            Quick Fast-Access Test Profiles:
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => quickFill('admin@tamarind.co.ke', 'admin123')}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer text-left"
            >
              <span className="font-bold block text-[#C59B27]">System Admin</span>
              <span className="text-[10px] text-white/50 truncate block">admin@tamarind.co.ke</span>
            </button>

            <button
              type="button"
              onClick={() => quickFill('frontdesk@tamarind.co.ke', 'desk123')}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer text-left"
            >
              <span className="font-bold block text-emerald-400">Front Desk</span>
              <span className="text-[10px] text-white/50 truncate block">frontdesk@tamarind.co.ke</span>
            </button>

            <button
              type="button"
              onClick={() => quickFill('reservations@tamarind.co.ke', 'res123')}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer text-left"
            >
              <span className="font-bold block text-blue-400">Reservations</span>
              <span className="text-[10px] text-white/50 truncate block">reservations@tamarind.co.ke</span>
            </button>

            <button
              type="button"
              onClick={() => quickFill('gm@tamarind.co.ke', 'gm123')}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer text-left"
            >
              <span className="font-bold block text-purple-400">General Manager</span>
              <span className="text-[10px] text-white/50 truncate block">gm@tamarind.co.ke</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
