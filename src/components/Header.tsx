'use client';

import React from 'react';
import {
  Tv,
  AlertTriangle,
  Plus,
  FileSpreadsheet,
  TvMinimalPlay,
  Trash2,
} from 'lucide-react';
import { CommercialShow } from '@/types/timeline';

interface HeaderProps {
  shows: CommercialShow[];
  selectedShowId: string;
  onSelectShow: (showId: string) => void;
  onOpenNewAd: () => void;
  onOpenNewShow: () => void;
  onOpenCueSheet: () => void;
  expiredCount: number;
  expiringSoonCount: number;
  onDeleteShow?: (showId: string) => void;
}

export function Header({
  shows,
  selectedShowId,
  onSelectShow,
  onOpenNewAd,
  onOpenNewShow,
  onOpenCueSheet,
  expiredCount,
  onDeleteShow,
}: HeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-40 select-none">
      <div className="px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Branding & Simple Show Switcher */}
        <div className="flex items-center space-x-4 overflow-hidden">
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block leading-none">
                Instant Productions
              </span>
              <h1 className="text-sm font-bold text-white leading-tight">
                Harmonogram Emisji Reklam
              </h1>
            </div>
          </div>

          {/* Clean Show Selector */}
          <div className="hidden sm:flex items-center space-x-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
            <button
              onClick={() => onSelectShow('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedShowId === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Wszystkie programy ({shows.length})
            </button>

            {shows.map((show) => {
              const isSelected = selectedShowId === show.id;
              return (
                <div key={show.id} className="relative group/pill flex items-center">
                  <button
                    onClick={() => onSelectShow(show.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        show.color === 'emerald'
                          ? 'bg-emerald-400'
                          : show.color === 'amber'
                          ? 'bg-amber-400'
                          : 'bg-indigo-400'
                      }`}
                    />
                    <span className="truncate max-w-[150px]">{show.title}</span>
                  </button>

                  {/* Delete show on hover */}
                  {isSelected && onDeleteShow && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Usunąć program "${show.title}" i wszystkie jego reklamy?`)) {
                          onDeleteShow(show.id);
                        }
                      }}
                      className="opacity-0 group-hover/pill:opacity-100 p-1 hover:text-rose-400 text-zinc-500 transition-opacity ml-0.5"
                      title="Usuń ten program"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {/* Urgent alert counter badge if expired ads exist */}
          {expiredCount > 0 && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 border border-rose-500/50 text-rose-300 text-xs font-black animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{expiredCount} do zdjęcia!</span>
            </div>
          )}

          {/* Cue sheet */}
          <button
            onClick={onOpenCueSheet}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
            title="Metryka emisji MCR dla reżyserki"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Metryka MCR</span>
          </button>

          {/* Add Show */}
          <button
            onClick={onOpenNewShow}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
            title="Dodaj nowy program TV"
          >
            <TvMinimalPlay className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">+ Nowy Program</span>
          </button>

          {/* Add Ad */}
          <button
            onClick={onOpenNewAd}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Dodaj Reklamę</span>
          </button>
        </div>
      </div>
    </header>
  );
}
