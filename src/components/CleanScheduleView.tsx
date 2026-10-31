'use client';

import React, { useState } from 'react';
import {
  Play,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Tv,
  Film,
  Layers,
  Search,
  Plus,
  Pencil,
  Trash2,
  ShieldAlert,
  Info,
  Calendar,
} from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import {
  formatDaysRemainingText,
  formatDateDisplay,
  formatShortDate,
  diffCalendarDays,
} from '@/lib/date-utils';

interface CleanScheduleViewProps {
  ads: CommercialAd[];
  shows: CommercialShow[];
  selectedShowId: string;
  onSelectAd: (ad: CommercialAd) => void;
  onEditAd: (ad: CommercialAd) => void;
  onDeleteAd: (adId: string) => void;
  onTakeOffAd: (adId: string, note?: string) => void;
  onOpenNewAdForBreak: (showId: string, breakNumber: number) => void;
}

export function CleanScheduleView({
  ads,
  shows,
  selectedShowId,
  onSelectAd,
  onEditAd,
  onDeleteAd,
  onTakeOffAd,
  onOpenNewAdForBreak,
}: CleanScheduleViewProps) {
  const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fixed reference date: 2026-10-31
  const todayStr = '2026-10-31';

  // Filter shows & ads
  const filteredShows = selectedShowId === 'all'
    ? shows
    : shows.filter((s) => s.id === selectedShowId);

  const filteredAds = ads.filter((ad) => {
    if (selectedShowId !== 'all' && ad.showId !== selectedShowId) return false;
    if (filterUrgentOnly && ad.status !== 'expired' && ad.status !== 'expiring_soon') {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ad.title.toLowerCase().includes(q) ||
        ad.advertiser.toLowerCase().includes(q) ||
        (ad.showTitle || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Urgent counts
  const expiredCount = ads.filter((a) => !a.takenOffAt && a.status === 'expired').length;
  const expiringSoonCount = ads.filter((a) => !a.takenOffAt && a.status === 'expiring_soon').length;

  // Simple progress calculation
  const getTimelineProgress = (startDateStr: string, endDateStr: string) => {
    const totalDays = Math.max(1, diffCalendarDays(startDateStr, endDateStr));
    const elapsedDays = diffCalendarDays(startDateStr, todayStr);
    const pct = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
    return { totalDays, elapsedDays, pct };
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 text-zinc-100 p-4 lg:p-8 flex flex-col">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* 1. URGENT BROADCAST BANNER (Only when expired ads exist) */}
        {expiredCount > 0 && (
          <div className="bg-rose-950/90 border-2 border-rose-500 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  PILNY KOMUNIKAT: {expiredCount} spot do natychmiastowego zdjęcia z anteny!
                </h3>
                <p className="text-xs text-rose-200 mt-0.5">
                  Koncert Cliona Hagan odbył się wczoraj (30 Października). Zdejmij ten spot z Przerwy 2 przed kolejną emisją w środę.
                </p>
              </div>
            </div>

            <button
              onClick={() => setFilterUrgentOnly(!filterUrgentOnly)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterUrgentOnly
                  ? 'bg-white text-rose-950'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow'
              }`}
            >
              {filterUrgentOnly ? 'Pokaż wszystkie spoty' : 'Pokaż tylko pilne'}
            </button>
          </div>
        )}

        {/* 2. SIMPLE FILTER & SEARCH BAR */}
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-zinc-200">
              Zaplanowane spoty w ramówce: <b className="text-white">{filteredAds.length}</b>
            </span>
            <span>&bull;</span>
            <span className="text-amber-400 font-mono font-medium">
              Dzisiejsza data kontrolna: 31 Października 2026
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj spotu lub artysty..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-60"
            />
          </div>
        </div>

        {/* 3. SHOWS & COMMERCIAL BREAKS (Clean, readable, like a cue sheet) */}
        {filteredShows.map((show) => {
          const showAds = filteredAds.filter((a) => a.showId === show.id);
          const breakNumbers = Array.from({ length: show.breakCount }, (_, i) => i + 1);

          return (
            <div key={show.id} className="space-y-4">
              {/* Show Header */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl px-5 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-3.5 h-3.5 rounded-full ${
                      show.color === 'emerald'
                        ? 'bg-emerald-400'
                        : show.color === 'amber'
                        ? 'bg-amber-400'
                        : 'bg-indigo-400'
                    }`}
                  />
                  <div>
                    <h2 className="text-base font-bold text-white">{show.title}</h2>
                    <span className="text-xs text-zinc-400 font-mono">
                      {show.channel} &bull; {show.broadcastSchedule}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono text-zinc-300 font-semibold">
                  {show.breakCount} przerwy w odcinku
                </span>
              </div>

              {/* Breaks */}
              {breakNumbers.map((breakNum) => {
                const breakAds = showAds.filter((a) => a.breakNumber === breakNum);
                const totalDuration = breakAds.reduce((sum, a) => sum + a.durationSec, 0);

                return (
                  <div
                    key={breakNum}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm"
                  >
                    {/* Break Subheader */}
                    <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <span className="font-extrabold text-xs uppercase tracking-wider text-zinc-200">
                          Przerwa {breakNum} (Break {breakNum})
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">
                          &bull; {breakAds.length} {breakAds.length === 1 ? 'spot' : 'spoty'} &bull; {totalDuration}s łącznie
                        </span>
                      </div>

                      <button
                        onClick={() => onOpenNewAdForBreak(show.id, breakNum)}
                        className="flex items-center space-x-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Dodaj spot do tej przerwy</span>
                      </button>
                    </div>

                    {/* Spot rows */}
                    {breakAds.length === 0 ? (
                      <div className="p-4 text-xs text-zinc-500 italic text-center">
                        Brak reklam w tym bloku.{' '}
                        <button
                          onClick={() => onOpenNewAdForBreak(show.id, breakNum)}
                          className="text-indigo-400 underline font-semibold ml-1"
                        >
                          + Dodaj reklamę
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-800/60">
                        {breakAds.map((ad) => {
                          const daysInfo = formatDaysRemainingText(ad.endDate);
                          const isExpired = ad.status === 'expired';
                          const isExpiring = ad.status === 'expiring_soon';
                          const isTakenOff = !!ad.takenOffAt;
                          const progress = getTimelineProgress(ad.startDate, ad.endDate);

                          return (
                            <div
                              key={ad.id}
                              className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                                isExpired ? 'bg-rose-950/20' : 'hover:bg-zinc-850/40'
                              }`}
                            >
                              {/* Left: Thumbnail & Essential Info */}
                              <div
                                onClick={() => onSelectAd(ad)}
                                className="flex items-center space-x-3.5 min-w-0 flex-1 cursor-pointer"
                              >
                                {/* Thumbnail (16:9) with Play overlay */}
                                <div className="relative w-24 aspect-video rounded-xl overflow-hidden bg-black shrink-0 ring-1 ring-zinc-800 shadow group/thumb">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={ad.frameGrabUrl}
                                    alt=""
                                    className="w-full h-full object-cover transition-transform group-hover/thumb:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 flex items-center justify-center transition-colors">
                                    <div className="w-7 h-7 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow">
                                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                    </div>
                                  </div>
                                  <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 font-mono text-[9px] font-bold text-white shadow">
                                    {ad.durationSec}s
                                  </span>
                                </div>

                                {/* Title, Advertiser, Context */}
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center space-x-1.5 mb-0.5">
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-indigo-300 font-bold">
                                      Slot #{ad.slotIndex}
                                    </span>
                                    <span className="text-xs text-zinc-400 font-medium truncate">
                                      {ad.advertiser}
                                    </span>
                                  </div>

                                  <h3 className="text-sm font-bold text-white truncate hover:text-indigo-300 transition-colors">
                                    {ad.title}
                                  </h3>

                                  {ad.eventDate && (
                                    <span className="text-[11px] text-amber-400 font-semibold mt-0.5">
                                      Wydarzenie: {ad.eventDate}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Middle: Clean Visual Timeline Indicator (Start -> Today -> End) */}
                              <div className="w-full sm:w-56 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 shrink-0 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                                  <span>{formatShortDate(ad.startDate)}</span>
                                  <span className="text-amber-400 font-bold">DZIŚ (31 Paź)</span>
                                  <span className="font-bold text-zinc-200">
                                    {formatShortDate(ad.endDate)}
                                  </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 w-full bg-zinc-850 rounded-full overflow-hidden relative">
                                  <div
                                    style={{ width: `${progress.pct}%` }}
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isExpired
                                        ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                                        : isExpiring
                                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                                        : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]'
                                    }`}
                                  />
                                </div>

                                <div className="text-[9px] text-right font-mono text-zinc-500">
                                  {progress.pct}% okresu kampanii
                                </div>
                              </div>

                              {/* Right: When to Take Off & Actions */}
                              <div className="shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                                {/* Expiry Status Badge */}
                                <div
                                  className={`px-3 py-1 rounded-xl text-xs font-mono font-black uppercase flex items-center space-x-1.5 shadow-sm ${
                                    isTakenOff
                                      ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                      : isExpired
                                      ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/30'
                                      : isExpiring
                                      ? 'bg-amber-500 text-zinc-950 font-black shadow-amber-500/20'
                                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                  }`}
                                >
                                  {isExpired ? (
                                    <>
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      <span>ZDEJMIJ Z ANTENY!</span>
                                    </>
                                  ) : (
                                    <span>{daysInfo.text}</span>
                                  )}
                                </div>

                                {/* Deadline Date */}
                                <span className="text-[11px] font-mono text-zinc-400">
                                  Zdejmij do:{' '}
                                  <b className={isExpired ? 'text-rose-400 font-bold' : 'text-zinc-200'}>
                                    {formatDateDisplay(ad.endDate)}
                                  </b>
                                </span>

                                {/* Quick Action Buttons */}
                                <div className="flex items-center space-x-2 pt-1">
                                  {!isTakenOff && (
                                    <button
                                      onClick={() => onTakeOffAd(ad.id)}
                                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-950 hover:text-rose-300 text-zinc-300 text-[11px] font-bold transition-colors"
                                      title="Oznacz jako zdjętą z ramówki"
                                    >
                                      Zdejmij
                                    </button>
                                  )}

                                  <button
                                    onClick={() => onEditAd(ad)}
                                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                    title="Edytuj dane spotu"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (confirm(`Usunąć reklamę "${ad.title}"?`)) {
                                        onDeleteAd(ad.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-500 hover:text-rose-400 transition-colors"
                                    title="Usuń z bazy"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
