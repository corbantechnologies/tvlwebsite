'use client';

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar, Plus, Trash2, Settings, RefreshCw, CheckCircle2,
  XCircle, AlertTriangle, Layers, Edit3, Save, X, BedDouble
} from "lucide-react";
import toast from "react-hot-toast";

interface InventoryItem {
  id: string;
  totalUnits: number;
  notes?: string;
  updatedAt?: string;
}

interface AvailabilityBlock {
  id: string;
  apartmentId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  blockedBy?: string;
  createdAt?: string;
}

interface Apartment {
  id: string;
  name: string;
}

interface Props {
  apartments: Apartment[];
  currentUserName: string;
}

const REASONS = [
  "Maintenance / Refurbishment",
  "Reserved — Opera Booking",
  "Staff Use",
  "Property Closed",
  "Custom"
];

export default function AvailabilityManager({ apartments, currentUserName }: Props) {
  const [activeTab, setActiveTab] = useState<"inventory" | "blocks">("inventory");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(false);

  // Inventory edit
  const [editingInv, setEditingInv] = useState<Record<string, number>>({});

  // New block form
  const [blockApartmentId, setBlockApartmentId] = useState("all");
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState(REASONS[0]);
  const [blockCustomReason, setBlockCustomReason] = useState("");
  const [addingBlock, setAddingBlock] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, blockRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/availability/blocks")
      ]);
      const invData = await invRes.json();
      const blockData = await blockRes.json();
      if (invData.success) setInventory(invData.inventory || []);
      if (blockData.success) setBlocks(blockData.blocks || []);
    } catch {
      toast.error("Failed to load availability data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Initialize edit state from loaded inventory
  useEffect(() => {
    const map: Record<string, number> = {};
    apartments.forEach(apt => {
      const inv = inventory.find(i => i.id === apt.id);
      map[apt.id] = inv?.totalUnits ?? 1;
    });
    setEditingInv(map);
  }, [inventory, apartments]);

  const handleSaveInventory = async (aptId: string) => {
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentId: aptId,
          totalUnits: editingInv[aptId] ?? 1,
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Inventory updated successfully!");
      fetchData();
    } catch (e: any) {
      toast.error("Failed to save inventory: " + e.message);
    }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockStart || !blockEnd) { toast.error("Please select start and end dates."); return; }
    if (blockStart >= blockEnd) { toast.error("End date must be after start date."); return; }
    setAddingBlock(true);
    try {
      const reasonText = blockReason === "Custom" ? blockCustomReason : blockReason;
      const res = await fetch("/api/availability/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentId: blockApartmentId,
          startDate: blockStart,
          endDate: blockEnd,
          reason: reasonText,
          blockedBy: currentUserName
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Dates blocked successfully.");
      setShowBlockForm(false);
      setBlockStart(""); setBlockEnd(""); setBlockReason(REASONS[0]); setBlockCustomReason("");
      fetchData();
    } catch (e: any) {
      toast.error("Failed to block dates: " + e.message);
    } finally {
      setAddingBlock(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!window.confirm("Remove this date block?")) return;
    try {
      const res = await fetch(`/api/availability/blocks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Block removed.");
      fetchData();
    } catch (e: any) {
      toast.error("Failed to remove block: " + e.message);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const activeBlocks = useMemo(
    () => blocks.filter(b => b.endDate >= todayStr),
    [blocks, todayStr]
  );
  const pastBlocks = useMemo(
    () => blocks.filter(b => b.endDate < todayStr),
    [blocks, todayStr]
  );

  const getAptName = (id: string) =>
    id === "all" ? "All Apartments" : apartments.find(a => a.id === id)?.name || id;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1F1615] rounded-2xl border border-[#C59B27]/25 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C59B27] mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Availability &amp; Unit Management</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
            Room Inventory &amp; Date Blocks
          </h2>
          <p className="text-xs text-white/60 mt-1">
            Set how many physical units you have, and block out dates for maintenance or Opera PMS reservations.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#C59B27] hover:bg-[#821124] hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1.5 bg-[#1F1615] border border-[#C59B27]/25 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "inventory"
              ? "bg-[#821124] text-white shadow-lg"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          Unit Inventory
        </button>
        <button
          onClick={() => setActiveTab("blocks")}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "blocks"
              ? "bg-[#821124] text-white shadow-lg"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          Date Blocks ({activeBlocks.length})
        </button>
      </div>

      {/* INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex gap-3 text-xs text-amber-200/90 leading-relaxed shadow-lg">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">How this works:</strong> Set the total number of physical units you have for each apartment type.
              When direct website bookings are confirmed, the system automatically checks remaining capacity so guests only see available suites.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {apartments.map(apt => {
              const inv = inventory.find(i => i.id === apt.id);
              const total = editingInv[apt.id] ?? inv?.totalUnits ?? 1;
              return (
                <div key={apt.id} className="bg-[#1F1615] rounded-2xl border border-[#C59B27]/25 p-6 space-y-5 shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Unit Type</span>
                      </div>
                      <h3 className="font-serif font-bold text-white text-lg leading-tight">{apt.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-serif font-bold text-white">{total}</div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">total unit{total !== 1 ? "s" : ""}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">Physical Units:</span>
                      <span className="font-mono text-[#C59B27] font-bold">{total} Configured</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={editingInv[apt.id] ?? 1}
                        onChange={e => setEditingInv(prev => ({ ...prev, [apt.id]: Number(e.target.value) }))}
                        className="w-24 text-center text-sm py-2 px-3 bg-black/50 border border-white/20 rounded-xl text-white font-bold focus:outline-none focus:border-[#C59B27]"
                      />
                      <button
                        onClick={() => handleSaveInventory(apt.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Units
                      </button>
                    </div>

                    {inv?.updatedAt && (
                      <p className="text-[10px] text-white/40 text-center">
                        Last updated: {new Date(inv.updatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BLOCKS TAB */}
      {activeTab === "blocks" && (
        <div className="space-y-6">
          {/* Add Block Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowBlockForm(v => !v)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-lg"
            >
              {showBlockForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showBlockForm ? "Cancel Block" : "Block Out Dates"}
            </button>
          </div>

          {/* Add Block Form */}
          {showBlockForm && (
            <div className="bg-[#1F1615] rounded-2xl border border-[#C59B27]/40 p-6 sm:p-8 shadow-2xl space-y-4">
              <h3 className="text-base font-serif font-bold text-white mb-2">Block Out Dates (Maintenance / Opera PMS)</h3>
              <form onSubmit={handleAddBlock} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Suite / Property
                  </label>
                  <select
                    value={blockApartmentId}
                    onChange={e => setBlockApartmentId(e.target.value)}
                    className="w-full text-xs px-4 py-2.5 rounded-xl border border-white/20 bg-black/50 text-white focus:outline-none focus:border-[#C59B27]"
                  >
                    <option value="all">All Apartments (Property Closed)</option>
                    {apartments.map(apt => (
                      <option key={apt.id} value={apt.id}>{apt.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    Reason
                  </label>
                  <select
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                    className="w-full text-xs px-4 py-2.5 rounded-xl border border-white/20 bg-black/50 text-white focus:outline-none focus:border-[#C59B27]"
                  >
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {blockReason === "Custom" && (
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                      Custom Reason
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VIP delegation reservation in Opera..."
                      value={blockCustomReason}
                      onChange={e => setBlockCustomReason(e.target.value)}
                      className="w-full text-xs px-4 py-2.5 rounded-xl border border-white/20 bg-black/50 text-white focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={blockStart}
                    min={todayStr}
                    onChange={e => setBlockStart(e.target.value)}
                    required
                    className="w-full text-xs px-4 py-2.5 rounded-xl border border-white/20 bg-black/50 text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C59B27] mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={blockEnd}
                    min={blockStart || todayStr}
                    onChange={e => setBlockEnd(e.target.value)}
                    required
                    className="w-full text-xs px-4 py-2.5 rounded-xl border border-white/20 bg-black/50 text-white focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBlockForm(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/20 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingBlock}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#821124] hover:bg-[#680e1c] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow"
                  >
                    {addingBlock ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    Confirm Block
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Blocks */}
          <div className="bg-[#1F1615] rounded-2xl border border-[#C59B27]/25 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Active Date Blocks ({activeBlocks.length})
                </h3>
              </div>
              <span className="text-[10px] text-white/40">These dates are blocked from website booking</span>
            </div>

            {activeBlocks.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/50">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-80" />
                No dates are currently blocked. All units are open for direct website inquiries.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {activeBlocks.map(block => (
                  <div key={block.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{getAptName(block.apartmentId)}</span>
                        {block.apartmentId === "all" && (
                          <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/30 text-red-400 text-[9px] font-bold uppercase">PROPERTY-WIDE</span>
                        )}
                      </div>
                      <div className="text-xs text-white/70">
                        <span className="font-mono text-[#C59B27]">{block.startDate}</span> → <span className="font-mono text-[#C59B27]">{block.endDate}</span>
                        {block.reason && <span className="ml-2 text-white/50">· {block.reason}</span>}
                      </div>
                      {block.blockedBy && (
                        <div className="text-[10px] text-white/40">Blocked by: {block.blockedBy}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-2 hover:bg-red-950/80 hover:text-red-400 text-white/40 transition-colors cursor-pointer rounded-xl"
                      title="Remove block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Blocks */}
          {pastBlocks.length > 0 && (
            <div className="bg-[#1F1615] rounded-2xl border border-white/10 opacity-60">
              <div className="px-6 py-3 border-b border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">
                  Past Blocks Archive ({pastBlocks.length})
                </h3>
              </div>
              <div className="divide-y divide-white/5">
                {pastBlocks.slice(0, 5).map(block => (
                  <div key={block.id} className="flex items-center justify-between px-6 py-3 text-xs">
                    <div>
                      <span className="text-white/60 line-through">{getAptName(block.apartmentId)}</span>
                      <div className="text-[11px] text-white/40 font-mono">{block.startDate} → {block.endDate}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-1.5 hover:text-red-400 text-white/30 cursor-pointer rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
