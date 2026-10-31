'use client';

import React from 'react';
import { LayoutGrid, CalendarDays, Pencil, Layers } from 'lucide-react';
import type { AdminNavView } from '@/types/timeline';

interface AdminSidebarProps {
  activeView: AdminNavView;
  onChangeView: (view: AdminNavView) => void;
  expiredCount: number;
}

function navBtn(active: boolean) {
  return `w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
    active
      ? 'bg-indigo-600 text-white shadow-sm'
      : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
  }`;
}

export function AdminSidebar({ activeView, onChangeView, expiredCount }: AdminSidebarProps) {
  return (
    <aside
      className="w-44 sm:w-56 shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col py-4 px-2 gap-4 min-h-0 overflow-y-auto"
      aria-label="Main menu"
    >
      <div>
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
          Timeline
        </p>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onChangeView('cards')}
            className={navBtn(activeView === 'cards')}
          >
            <LayoutGrid className="w-4 h-4 shrink-0 opacity-90" />
            <span className="leading-tight">Cards & schedule</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeView('gantt')}
            className={navBtn(activeView === 'gantt')}
          >
            <CalendarDays className="w-4 h-4 shrink-0 opacity-90" />
            <span className="leading-tight">Full timeline</span>
            {expiredCount > 0 && activeView !== 'gantt' && (
              <span className="ml-auto px-1.5 py-0.5 rounded bg-rose-600 text-[10px] font-bold">
                {expiredCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div>
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
          Traffic
        </p>
        <button
          type="button"
          onClick={() => onChangeView('edit')}
          className={navBtn(activeView === 'edit')}
        >
          <Pencil className="w-4 h-4 shrink-0 opacity-90" />
          <span className="leading-tight">Edit panel</span>
          {expiredCount > 0 && (
            <span className="ml-auto px-1.5 py-0.5 rounded bg-rose-600 text-[10px] font-bold">
              {expiredCount}
            </span>
          )}
        </button>
        <p className="px-3 mt-2 text-[11px] text-zinc-500 leading-snug flex gap-1.5">
          <Layers className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Breaks, Pull / Restore, spots
        </p>
      </div>
    </aside>
  );
}
