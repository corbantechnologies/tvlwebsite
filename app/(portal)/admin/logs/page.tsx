'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, RefreshCw, Search, Loader2 } from 'lucide-react';

export default function AuditLogsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingClearance, setCheckingClearance] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setCurrentUser(d.user);
          const role = (d.user.role || '').toLowerCase();
          if (role === 'admin' || role === 'gm') {
            fetchLogs();
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false))
      .finally(() => setCheckingClearance(false));
  }, []);

  const filtered = logs.filter(l =>
    !search ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.actor?.toLowerCase().includes(search.toLowerCase()) ||
    l.details?.toLowerCase().includes(search.toLowerCase())
  );

  const userRole = (currentUser?.role || '').toLowerCase();
  const isAuthorized = userRole === 'admin' || userRole === 'gm';

  if (checkingClearance) {
    return (
      <div className="py-24 text-center text-slate-500 text-xs">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#821124] mb-2" />
        Verifying administrative credentials...
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-[#821124] rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            System audit trail records require <strong>Master Administrator</strong> or <strong>General Manager</strong> clearance.
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono inline-block">
            Your Active Role Clearance: <span className="font-bold text-[#821124] uppercase">{currentUser?.role || 'Staff'}</span>
          </div>
          <div className="pt-2">
            <Link
              href="/admin/frontdesk"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
            >
              <span>Return to Front Desk</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 px-2 sm:px-4">
      <div className="pb-4 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 text-xs text-[#821124] font-bold uppercase tracking-wider mb-1">
          <ShieldAlert className="w-3.5 h-3.5" /> Activity Log
        </div>
        <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
          System Activity &amp; Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          A chronological tamper-resistant record of all actions taken by authorized personnel across the portal.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by action, staff, or detail..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#821124] focus:ring-1 focus:ring-[#821124] shadow-xs"
          />
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-16 text-xs flex items-center justify-center gap-2 bg-white rounded-xl border border-slate-200 shadow-xs">
          <Loader2 className="w-4 h-4 animate-spin text-[#821124]" />
          <span>Loading activity log...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-slate-500 py-16 bg-white rounded-xl border border-dashed border-slate-300 shadow-xs">
          <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-900">{search ? 'No matching entries found.' : 'No activity recorded yet.'}</p>
          <p className="text-xs text-slate-400 mt-1">Actions performed in the portal will be logged automatically.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-start gap-3 hover:border-slate-300 transition-colors"
            >
              <div className="text-[11px] font-mono text-slate-400 whitespace-nowrap shrink-0 pt-0.5">
                {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900">{log.action}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200 uppercase tracking-wider">{log.category}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{log.details}</p>
                <span className="text-[11px] text-slate-400 mt-1 block">by <strong className="text-slate-700 font-medium">{log.actor}</strong> ({log.actorRole})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
