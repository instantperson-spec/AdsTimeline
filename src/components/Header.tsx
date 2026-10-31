'use client';

import React from 'react';
import {
  Tv,
  Layers,
  AlertTriangle,
  Clock,
  Plus,
  FileSpreadsheet,
  TvMinimalPlay,
  Film,
  Sparkles,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { CommercialShow, TimelineViewMode } from '@/types/timeline';

interface HeaderProps {
  shows: CommercialShow[];
  selectedShowId: string; // 'all' or showId
  onSelectShow: (showId: string) => void;
  viewMode: TimelineViewMode;
  onChangeViewMode: (mode: TimelineViewMode) => void;
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
  viewMode,
  onChangeViewMode,
  onOpenNewAd,
  onOpenNewShow,
  onOpenCueSheet,
  expiredCount,
  expiringSoonCount,
  onDeleteShow,
}: HeaderProps) {
  const currentShow = shows.find((s) => s.id === selectedShowId);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 select-none">
      {/* Top Branding & Main Controls */}
      <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Branding & Show Selector */}
        <div className="flex items-center space-x-4 overflow-hidden">
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/20 ring-1 ring-white/10">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400">
                  Instant Productions
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950/80 text-rose-300 font-mono border border-rose-800/60 font-semibold">
                  ADS TIMELINE
                </span>
              </div>
              <h1 className="text-sm font-bold text-zinc-100 flex items-center space-x-1.5">
                <span>Kalendarz & Kontrola Emisji Reklam</span>
              </h1>
            </div>
          </div>

          {/* Show Selector Pill Dropdown */}
          <div className="hidden sm:flex items-center space-x-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
            <button
              onClick={() => onSelectShow('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedShowId === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200'
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        show.color === 'emerald'
                          ? 'bg-emerald-400'
                          : show.color === 'amber'
                          ? 'bg-amber-400'
                          : show.color === 'cyan'
                          ? 'bg-cyan-400'
                          : 'bg-indigo-400'
                      }`}
                    />
                    <span className="truncate max-w-[140px]">{show.title}</span>
                  </button>

                  {/* Show delete action on hover for specific show */}
                  {isSelected && onDeleteShow && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete show "${show.title}" and all its ads?`)) {
                          onDeleteShow(show.id);
                        }
                      }}
                      className="opacity-0 group-hover/pill:opacity-100 p-1 hover:text-rose-400 text-zinc-500 transition-opacity ml-0.5"
                      title="Delete this show"
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
          {/* Cue Sheet Print / Export */}
          <button
            onClick={onOpenCueSheet}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
            title="Metryka emisji dla MCR / reżyserki emisji"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Metryka MCR</span>
          </button>

          {/* New Show Button */}
          <button
            onClick={onOpenNewShow}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
            title="Dodaj nowy program TV"
          >
            <TvMinimalPlay className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">+ Nowy Program</span>
          </button>

          {/* New Ad Button */}
          <button
            onClick={onOpenNewAd}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Dodaj Reklamę</span>
          </button>
        </div>
      </div>

      {/* Subheader: View Mode Switcher & Urgent Alerts Bar */}
      <div className="px-4 lg:px-6 h-12 border-t border-zinc-850 bg-zinc-950/70 flex items-center justify-between text-xs overflow-x-auto gap-4">
        {/* View Tabs */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => onChangeViewMode('client')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'client'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-indigo-300" />
            <span>👁️ Widok Klienta (Timeline)</span>
          </button>

          <button
            onClick={() => onChangeViewMode('timeline')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'timeline'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Karty & Terminarz (Studio)</span>
          </button>

          <button
            onClick={() => onChangeViewMode('matrix')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'matrix'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Bloki Reklamowe
              {currentShow ? ` (${currentShow.breakCount} przerwy)` : ''}
            </span>
          </button>

          {/* Urgent Radar / Take-down Center */}
          <button
            onClick={() => onChangeViewMode('urgent_radar')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
              viewMode === 'urgent_radar'
                ? 'bg-rose-950/80 text-rose-300 shadow-sm border border-rose-800'
                : expiredCount > 0
                ? 'bg-rose-950/40 text-rose-400 hover:bg-rose-950/70 border border-rose-900/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                expiredCount > 0 ? 'text-rose-400 animate-pulse' : 'text-amber-400'
              }`}
            />
            <span>Centrum Zdejmowania</span>

            {expiredCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                {expiredCount} do zdjęcia!
              </span>
            )}
            {expiredCount === 0 && expiringSoonCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 text-[10px] font-bold">
                {expiringSoonCount} wkrótce
              </span>
            )}
          </button>
        </div>

        {/* Current Show Info or Global Summary */}
        <div className="flex items-center space-x-3 text-zinc-400 text-[11px] shrink-0">
          {currentShow ? (
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-zinc-200">{currentShow.title}</span>
              <span>&bull;</span>
              <span className="font-mono text-zinc-400">{currentShow.channel}</span>
              <span>&bull;</span>
              <span className="text-amber-400 font-medium">{currentShow.broadcastSchedule}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-zinc-400">Widok zbiorczy wszystkich programów</span>
              <span>&bull;</span>
              <span className="text-zinc-300 font-semibold">{shows.length} programy TV</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

