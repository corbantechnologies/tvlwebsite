'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Search } from 'lucide-react';

export default function AuditLogsPage() {
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

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter(l =>
    !search ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.actor?.toLowerCase().includes(search.toLowerCase()) ||
    l.details?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
          <ShieldAlert className="w-3.5 h-3.5" /> Activity Log
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
          System Activity Log
        </h1>
        <p className="text-xs text-white/60 mt-1">
          A chronological record of all actions taken by staff across the portal.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by action, staff, or detail..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#1F1615] border border-[#C59B27]/25 rounded-xl text-white text-xs placeholder-white/40 focus:outline-none focus:border-[#C59B27]/60"
          />
        </div>
        <button
          onClick={fetchLogs}
          className="p-2.5 rounded-xl bg-[#1F1615] border border-[#C59B27]/25 text-[#C59B27] hover:bg-[#821124] hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className={"w-4 h-4 " + (loading ? "animate-spin" : "")} />
        </button>
      </div>

      {loading ? (
        <div className="text-center text-white/50 py-12 text-sm">Loading activity log...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-white/40 py-16">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? 'No matching entries found.' : 'No activity recorded yet.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-xl bg-[#1F1615] border border-[#C59B27]/15 flex flex-col sm:flex-row sm:items-start gap-3"
            >
              <div className="text-[10px] font-mono text-white/40 whitespace-nowrap shrink-0 pt-0.5">
                {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-white">{log.action}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#C59B27]/20 text-[#C59B27] font-medium capitalize">{log.category}</span>
                </div>
                <p className="text-xs text-white/60 mt-0.5">{log.details}</p>
                <span className="text-[10px] text-white/30 mt-0.5 block">by {log.actor} ({log.actorRole})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
