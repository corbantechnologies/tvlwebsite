import React from 'react';

// Shared layout for the guest guide (/guide) and the staff guide
// (/admin/guide): a contents list on the left and numbered sections.

export type GuideSection = {
  id: string;
  title: string;
  /** Optional tag shown next to the heading, e.g. the roles a section is for. */
  tag?: string;
  body: React.ReactNode;
};

export default function GuideLayout({
  sections,
  theme = 'light',
}: {
  sections: GuideSection[];
  theme?: 'light' | 'warm';
}) {
  const accent = 'text-[#821124]';
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
      <nav aria-label="Guide contents" className="lg:sticky lg:top-6 self-start">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Contents</p>
        <ol className="space-y-1 text-sm">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="block py-1 hover:text-[#821124] text-slate-700">
                <span className="text-slate-400 mr-1.5">{i + 1}.</span>
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="space-y-6 min-w-0">
        {sections.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            className={`scroll-mt-6 rounded-2xl border p-5 sm:p-6 ${theme === 'warm' ? 'bg-white border-[#e2d9d0]' : 'bg-white border-slate-200'}`}
          >
            <h2 className="font-serif text-xl font-bold text-slate-900 flex flex-wrap items-center gap-2">
              <span className={accent}>{i + 1}.</span> {s.title}
              {s.tag && (
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {s.tag}
                </span>
              )}
            </h2>
            <div className="mt-3 text-sm text-slate-700 leading-relaxed space-y-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-slate-900 [&_a]:text-[#821124] [&_a]:underline [&_table]:w-full [&_table]:text-xs [&_th]:text-left [&_th]:py-1.5 [&_th]:pr-3 [&_th]:text-slate-500 [&_td]:py-1.5 [&_td]:pr-3 [&_td]:align-top [&_tr]:border-b [&_tr]:border-slate-100">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function Tip({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3">{children}</p>;
}
