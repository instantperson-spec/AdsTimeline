'use client';

import React, { useState } from 'react';
import {
  Tv,
  AlertTriangle,
  Plus,
  FileSpreadsheet,
  TvMinimalPlay,
  Trash2,
  Link2,
} from 'lucide-react';
import { AdminNavView, CommercialShow } from '@/types/timeline';
import { ClientLinkModal } from '@/components/ClientLinkModal';

interface HeaderProps {
  shows: CommercialShow[];
  selectedShowId: string;
  adminView?: AdminNavView;
  onSelectShow: (showId: string) => void;
  onOpenNewAd: () => void;
  onOpenNewShow: () => void;
  onOpenCueSheet: () => void;
  expiredCount: number;
  onDeleteShow?: (showId: string) => void;
}

export function Header({
  shows,
  selectedShowId,
  adminView = 'cards',
  onSelectShow,
  onOpenNewAd,
  onOpenNewShow,
  onOpenCueSheet,
  expiredCount,
  onDeleteShow,
}: HeaderProps) {
  const currentShow = shows.find((s) => s.id === selectedShowId);
  const [clientLinkOpen, setClientLinkOpen] = useState(false);

  const clientLinkInitialViews =
    adminView === 'gantt' ? (['timeline'] as const) : (['list'] as const);

  return (
    <>
    <header className="border-b border-zinc-700 bg-zinc-900 sticky top-0 z-40 shrink-0">
      <div className="px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-white leading-tight">Commercial schedule</p>
            <p className="text-sm text-zinc-300 leading-snug">Faith World TV · Instant Productions</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setClientLinkOpen(true)}
            title="Set programme and views — generate client link"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-sm font-medium text-zinc-100 hover:bg-zinc-700 hover:border-zinc-500"
          >
            <Link2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Client link</span>
          </button>

          <button
            type="button"
            onClick={onOpenCueSheet}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-sm font-medium text-zinc-100 hover:bg-zinc-700"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-300 shrink-0" />
            <span className="hidden sm:inline">MCR cue sheet</span>
            <span className="sm:hidden">MCR</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewShow}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-sm font-medium text-zinc-100 hover:bg-zinc-700"
          >
            <TvMinimalPlay className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Show</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewAd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white shadow-sm"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Ad</span>
          </button>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-3 bg-zinc-950 border-t border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label htmlFor="show-filter" className="text-sm font-semibold text-zinc-200 shrink-0">
            Show:
          </label>

          <select
            id="show-filter"
            value={selectedShowId}
            onChange={(e) => onSelectShow(e.target.value)}
            className="sm:hidden w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-sm font-medium text-white"
          >
            <option value="all">All programmes ({shows.length})</option>
            {shows.map((show) => (
              <option key={show.id} value={show.id}>
                {show.title}
              </option>
            ))}
          </select>

          <div className="hidden sm:flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectShow('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                selectedShowId === 'all'
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-zinc-800 border-zinc-600 text-zinc-100 hover:border-zinc-500'
              }`}
            >
              All ({shows.length})
            </button>

            {shows.map((show) => {
              const isSelected = selectedShowId === show.id;
              return (
                <div key={show.id} className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => onSelectShow(show.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors max-w-[220px] truncate ${
                      isSelected
                        ? 'bg-zinc-100 border-zinc-300 text-zinc-900'
                        : 'bg-zinc-800 border-zinc-600 text-zinc-100 hover:border-zinc-500'
                    }`}
                    title={show.title}
                  >
                    {show.title}
                  </button>
                  {isSelected && onDeleteShow && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete show "${show.title}" and all its ads?`)) {
                          onDeleteShow(show.id);
                        }
                      }}
                      className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 border border-transparent hover:border-zinc-700"
                      title="Delete show"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {expiredCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-rose-200 sm:ml-auto">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong className="text-white">{expiredCount}</strong> spot(s) past pull date
              </span>
            </div>
          )}

          {!expiredCount && currentShow && (
            <p className="text-sm text-zinc-400 sm:ml-auto truncate max-w-md">
              {currentShow.broadcastSchedule}
            </p>
          )}
        </div>
      </div>
    </header>

    <ClientLinkModal
      isOpen={clientLinkOpen}
      onClose={() => setClientLinkOpen(false)}
      shows={shows}
      initialShowId={selectedShowId}
      initialViews={[...clientLinkInitialViews]}
    />
    </>
  );
}
