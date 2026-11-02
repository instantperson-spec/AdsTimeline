'use client';

import React from 'react';
import {
  LayoutGrid,
  CalendarDays,
  Pencil,
  Radio,
  Film,
  Eye,
  PencilLine,
} from 'lucide-react';
import type { AdminNavView } from '@/types/timeline';
import { ADMIN_VIEW_META, PRESENTATION_VIEWS, EDITING_VIEWS } from '@/lib/admin-nav';

interface AdminSidebarProps {
  activeView: AdminNavView;
  onChangeView: (view: AdminNavView) => void;
  expiredCount: number;
}

function navBtn(active: boolean, layer: 'presentation' | 'editing') {
  if (active) {
    return layer === 'presentation'
      ? 'w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400/30'
      : 'w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors bg-amber-600 text-zinc-950 shadow-sm ring-1 ring-amber-400/40';
  }
  return 'w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-zinc-300 hover:bg-zinc-800 hover:text-white';
}

function presentationIcon(view: (typeof PRESENTATION_VIEWS)[number]) {
  switch (view) {
    case 'cards':
      return <LayoutGrid className="w-4 h-4 shrink-0 opacity-90" />;
    case 'gantt':
      return <CalendarDays className="w-4 h-4 shrink-0 opacity-90" />;
  }
}

function editingIcon(view: (typeof EDITING_VIEWS)[number]) {
  switch (view) {
    case 'programmes':
      return <Radio className="w-4 h-4 shrink-0 opacity-90" />;
    case 'edit':
      return <Pencil className="w-4 h-4 shrink-0 opacity-90" />;
    case 'media':
      return <Film className="w-4 h-4 shrink-0 opacity-90" />;
  }
}

export function AdminSidebar({ activeView, onChangeView, expiredCount }: AdminSidebarProps) {
  return (
    <aside
      className="w-48 sm:w-60 shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col py-3 px-2 gap-3 min-h-0 overflow-y-auto"
      aria-label="Main menu"
    >
      <section
        className="rounded-xl border border-cyan-900/40 bg-cyan-950/15 p-2 flex flex-col gap-1"
        aria-labelledby="nav-presentation-heading"
      >
        <div
          id="nav-presentation-heading"
          className="px-2 pb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-cyan-400/90"
        >
          <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span>Presentation</span>
        </div>
        {PRESENTATION_VIEWS.map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => onChangeView(view)}
            className={navBtn(activeView === view, 'presentation')}
            title={ADMIN_VIEW_META[view].subtitle}
          >
            {presentationIcon(view)}
            <span className="leading-tight">{ADMIN_VIEW_META[view].title}</span>
            {view === 'gantt' && expiredCount > 0 && activeView !== 'gantt' && (
              <span className="ml-auto px-1.5 py-0.5 rounded bg-rose-600 text-[10px] font-bold text-white">
                {expiredCount}
              </span>
            )}
          </button>
        ))}
      </section>

      <section
        className="rounded-xl border border-amber-900/35 bg-amber-950/10 p-2 flex flex-col gap-1"
        aria-labelledby="nav-editing-heading"
      >
        <div
          id="nav-editing-heading"
          className="px-2 pb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-amber-400/90"
        >
          <PencilLine className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span>Editing</span>
        </div>
        {EDITING_VIEWS.map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => onChangeView(view)}
            className={navBtn(activeView === view, 'editing')}
            title={ADMIN_VIEW_META[view].subtitle}
          >
            {editingIcon(view)}
            <span className="leading-tight">{ADMIN_VIEW_META[view].title}</span>
            {view === 'edit' && expiredCount > 0 && (
              <span className="ml-auto px-1.5 py-0.5 rounded bg-rose-600 text-[10px] font-bold text-white">
                {expiredCount}
              </span>
            )}
          </button>
        ))}
      </section>
    </aside>
  );
}
