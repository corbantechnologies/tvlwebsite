'use client';

import React, { useState } from 'react';
import { Users, ShieldCheck, Plus, Trash2, Key } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminTeamPage() {
  const [staff, setStaff] = useState([
    { id: '1', name: 'System Administrator', email: 'admin@tamarind.co.ke', role: 'admin' },
    { id: '2', name: 'Front Desk Host', email: 'frontdesk@tamarind.co.ke', role: 'frontdesk' },
    { id: '3', name: 'Reservations Desk', email: 'reservations@tamarind.co.ke', role: 'reservations' },
    { id: '4', name: 'General Manager', email: 'gm@tamarind.co.ke', role: 'gm' },
  ]);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'frontdesk' | 'reservations' | 'gm'>('frontdesk');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    setStaff([
      ...staff,
      {
        id: String(Date.now()),
        name: newName,
        email: newEmail,
        role: newRole,
      }
    ]);
    setNewName('');
    setNewEmail('');
    toast.success('Staff account provisioned with default passcode!');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] font-semibold uppercase tracking-wider mb-1">
          <Users className="w-3.5 h-3.5" /> Access Control
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
          Staff Accounts &amp; Clearance Roles
        </h1>
        <p className="text-xs text-white/60">
          Manage authorized personnel across Tamarind Village Front Desk, Reservations, and Executive Management.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Table */}
        <div className="lg:col-span-2 bg-[#1F1615] rounded-2xl border border-[#C59B27]/25 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/40 border-b border-white/10 text-[#C59B27] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Role Clearance</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {staff.map((u) => (
                <tr key={u.id} className="hover:bg-white/5">
                  <td className="py-4 px-4">
                    <span className="font-bold text-white block">{u.name}</span>
                    <span className="text-white/50 text-[11px]">{u.email}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white/10 text-[#C59B27] border border-white/10">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => toast.success(`Password reset token dispatched for ${u.email}`)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold uppercase mr-2"
                    >
                      Reset Pass
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Provision Form */}
        <div className="bg-[#1F1615] rounded-2xl p-6 border border-[#C59B27]/25 shadow-xl space-y-4 h-fit">
          <h3 className="font-serif text-lg font-bold text-white border-b border-white/10 pb-3">
            Provision New Staff
          </h3>

          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Grace Achieng"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                Tamarind Email
              </label>
              <input
                type="email"
                required
                placeholder="grace.a@tamarind.co.ke"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                Role Clearance
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="frontdesk">Front Desk Agent</option>
                <option value="reservations">Reservations Manager</option>
                <option value="gm">General Manager</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider shadow-md mt-2 cursor-pointer"
            >
              Provision Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
