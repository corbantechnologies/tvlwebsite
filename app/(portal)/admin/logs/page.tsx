'use client';

import React from 'react';
import { Activity, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

export default function AdminLogsPage() {
  const auditLogs = [
    {
      id: 'log_01',
      timestamp: '2026-09-29 14:45:12',
      user: 'admin@tamarind.co.ke',
      action: 'Drizzle Postgres Migration Complete',
      details: 'Self-healing schemas & resort tables verified in neon/postgres cloud',
      level: 'INFO'
    },
    {
      id: 'log_02',
      timestamp: '2026-09-29 14:20:00',
      user: 'reservations@tamarind.co.ke',
      action: 'Quote Lodged for Inquiry #inq_01',
      details: 'Quoted KES 75,000 with Dhow dinner perk',
      level: 'ACTION'
    },
    {
      id: 'log_03',
      timestamp: '2026-09-29 13:10:33',
      user: 'gm@tamarind.co.ke',
      action: 'Published Incoming Event: Sunset Dhow Saxophone',
      details: 'Capacity 65, Ticket KES 8,500',
      level: 'SUCCESS'
    },
    {
      id: 'log_04',
      timestamp: '2026-09-29 11:00:15',
      user: 'frontdesk@tamarind.co.ke',
      action: 'Guest Check-In Keycard Generated',
      details: 'Room 201 assigned to Claire Sterling',
      level: 'SUCCESS'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
          <Activity className="w-3.5 h-3.5" /> Security &amp; Compliance
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
          Operational Audit Logs
        </h1>
        <p className="text-xs text-white/60">
          Chronological record of staff actions, rate updates, inventory modifications, and security events.
        </p>
      </div>

      <div className="bg-[#1F1615] rounded-2xl border border-[#C59B27]/25 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-black/40 border-b border-white/10 text-[#C59B27] uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Timestamp</th>
              <th className="py-3.5 px-4">Actor</th>
              <th className="py-3.5 px-4">Action</th>
              <th className="py-3.5 px-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {auditLogs.map((l) => (
              <tr key={l.id} className="hover:bg-white/5">
                <td className="py-3.5 px-4 font-mono text-[11px] text-white/60">{l.timestamp}</td>
                <td className="py-3.5 px-4 font-bold text-white">{l.user}</td>
                <td className="py-3.5 px-4 text-[#C59B27] font-semibold">{l.action}</td>
                <td className="py-3.5 px-4 text-white/70">{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
