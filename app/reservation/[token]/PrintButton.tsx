'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-4 py-2 border border-[#1F1615] text-[#1F1615] text-xs font-bold uppercase tracking-wider hover:bg-[#1F1615] hover:text-white transition-colors cursor-pointer"
    >
      Print
    </button>
  );
}
