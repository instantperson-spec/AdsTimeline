'use client';

import React, { useState, useMemo } from 'react';
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
  SlidersHorizontal,
  Calendar,
  List,
} from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import {
  formatDaysRemainingText,
  formatDateDisplay,
  formatShortDate,
  diffCalendarDays,
} from '@/lib/date-utils';

interface ClientTimelineScreenProps {
  ads: CommercialAd[];
  shows: CommercialShow[];
  selectedShowId: string;
  onSelectShow: (showId: string) => void;
  onSelectAd: (ad: CommercialAd) => void;
  onOpenNewAd?: () => void;
  onOpenAdminPanel?: () => void;
}

export function ClientTimelineScreen({
  ads,
  shows,
  selectedShowId,
  onSelectShow,
  onSelectAd,
  onOpenNewAd,
  onOpenAdminPanel,
}: ClientTimelineScreenProps) {
  const [viewStyle, setViewStyle] = useState<'timeline_cards' | 'simple_list'>('timeline_cards');
  const [statusFilter, setStatusFilter] = useState<'all' | 'urgent_only'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fixed reference date: 2026-10-31
  const todayStr = '2026-10-31';

  // Filter shows & ads
  const filteredShows = useMemo(() => {
    if (selectedShowId === 'all') return shows;
    return shows.filter((s) => s.id === selectedShowId);
  }, [shows, selectedShowId]);

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      if (selectedShowId !== 'all' && ad.showId !== selectedShowId) return false;
      if (statusFilter === 'urgent_only' && ad.status !== 'expired' && ad.status !== 'expiring_soon') {
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
  }, [ads, selectedShowId, statusFilter, searchQuery]);

  // Urgent counts
  const expiredCount = useMemo(
    () => ads.filter((a) => !a.takenOffAt && a.status === 'expired').length,
    [ads]
  );
  const expiringSoonCount = useMemo(
    () => ads.filter((a) => !a.takenOffAt && a.status === 'expiring_soon').length,
    [ads]
  );

  const currentShow = shows.find((s) => s.id === selectedShowId);

  // Helper for simple timeline bar percentage:
  const getTimelineProgress = (startDateStr: string, endDateStr: string) => {
    const totalDays = Math.max(1, diffCalendarDays(startDateStr, endDateStr));
    const elapsedDays = diffCalendarDays(startDateStr, todayStr);
    const pct = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
    return { totalDays, elapsedDays, pct };
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 overflow-y-auto font-sans select-none">
      {/* 1. TOP BAR: PROGRAMME PICKER & URGENT STATUS */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 px-4 lg:px-8 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold shrink-0">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              INSTANT PRODUCTIONS &bull; EMISJA REKLAM
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white">
                {currentShow ? currentShow.title : 'Wszystkie Programy TV'}
              </span>
              {currentShow && (
                <span className="text-xs text-zinc-400 font-mono">
                  ({currentShow.broadcastSchedule})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Programme Switcher Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => onSelectShow('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              selectedShowId === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            Wszystkie
          </button>
          {shows.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectShow(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                selectedShowId === s.id
                  ? 'bg-zinc-100 text-zinc-950 shadow'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* 2. URGENT ALERT BANNER (If any ad is expired) */}
      {expiredCount > 0 && (
        <div className="bg-rose-950/80 border-b border-rose-800/80 px-4 lg:px-8 py-3 flex items-center justify-between text-xs text-rose-200 shrink-0">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
            <span>
              <b className="text-white uppercase">Pilna informacja:</b> <b>{expiredCount} spot</b> wymaga natychmiastowego zdjęcia z anteny (termin minął)!
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('urgent_only')}
            className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors shrink-0 text-[11px]"
          >
            Pokaż tylko pilne ({expiredCount + expiringSoonCount})
          </button>
        </div>
      )}

      {/* 3. CONTROLS BAR: SEARCH & VIEW SWITCH */}
      <div className="px-4 lg:px-8 py-3 flex items-center justify-between border-b border-zinc-850 bg-zinc-950/60 text-xs shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-zinc-400 text-xs font-medium">
            Pokazujesz: <b className="text-white">{filteredAds.length} spotów</b>
          </span>
          {statusFilter === 'urgent_only' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="text-xs text-indigo-400 hover:underline font-semibold"
            >
              &times; Wyłącz filtr pilnych
            </button>
          )}
        </div>

        {/* View Switcher: Timeline vs Simple Table */}
        <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setViewStyle('timeline_cards')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
              viewStyle === 'timeline_cards'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Oś Czasu (Timeline)</span>
          </button>
          <button
            onClick={() => setViewStyle('simple_list')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
              viewStyle === 'simple_list'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5 text-indigo-400" />
            <span>Prosta Tabela (Lista)</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA: CLEAN, ORGANIZED BY BREAKS */}
      <div className="flex-1 p-4 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
        {filteredShows.map((show) => {
          const showAds = filteredAds.filter((a) => a.showId === show.id);
          const breakNumbers = Array.from({ length: show.breakCount }, (_, i) => i + 1);

          return (
            <div key={show.id} className="space-y-6">
              {/* Show Title (When in Combined View) */}
              {selectedShowId === 'all' && (
                <div className="flex items-center space-x-2 border-b border-zinc-800 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  <h2 className="text-base font-bold text-white">{show.title}</h2>
                  <span className="text-xs text-zinc-400 font-mono">
                    ({show.channel} &bull; {show.broadcastSchedule})
                  </span>
                </div>
              )}

              {/* Breaks */}
              {breakNumbers.map((breakNum) => {
                const breakAds = showAds.filter((a) => a.breakNumber === breakNum);
                const totalSec = breakAds.reduce((sum, a) => sum + a.durationSec, 0);

                return (
                  <div
                    key={breakNum}
                    className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm"
                  >
                    {/* Clean Break Header */}
                    <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-xs uppercase tracking-wider text-zinc-200">
                          Przerwa {breakNum} (Commercial Break {breakNum})
                        </span>
                      </div>
                      <span className="text-xs font-mono text-zinc-400">
                        {breakAds.length} {breakAds.length === 1 ? 'spot' : 'spoty'} &bull; {totalSec}s łącznie
                      </span>
                    </div>

                    {/* Spots Inside Break */}
                    {breakAds.length === 0 ? (
                      <div className="p-4 text-xs text-zinc-500 italic text-center">
                        Brak zaplanowanych reklam w tym bloku
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-800/60">
                        {breakAds.map((ad) => {
                          const daysInfo = formatDaysRemainingText(ad.endDate);
                          const isExpired = ad.status === 'expired';
                          const isExpiring = ad.status === 'expiring_soon';
                          const progress = getTimelineProgress(ad.startDate, ad.endDate);

                          return (
                            <div
                              key={ad.id}
                              onClick={() => onSelectAd(ad)}
                              className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-850/60 transition-colors ${
                                isExpired ? 'bg-rose-950/20' : ''
                              }`}
                            >
                              {/* Left: Thumbnail & Essential Details */}
                              <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                                {/* Video Thumbnail with Duration */}
                                <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0 ring-1 ring-zinc-800 shadow">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={ad.frameGrabUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/30 hover:bg-black/10 flex items-center justify-center transition-colors">
                                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
                                      <Play className="w-3 h-3 fill-current ml-0.5" />
                                    </div>
                                  </div>
                                  <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 font-mono text-[9px] text-zinc-300">
                                    {ad.durationSec}s
                                  </span>
                                </div>

                                {/* Title, Advertiser & Event Date */}
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center space-x-1.5 mb-0.5">
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-indigo-300 font-bold">
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
                                    <span className="text-[11px] text-amber-400 font-medium mt-0.5">
                                      Koncert: {ad.eventDate}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Middle: Clean Single-Line Timeline (No 40-column mess!) */}
                              {viewStyle === 'timeline_cards' && (
                                <div className="w-full sm:w-56 bg-zinc-950 p-2 rounded-xl border border-zinc-800/80 shrink-0 space-y-1">
                                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                                    <span>{formatShortDate(ad.startDate)}</span>
                                    <span className="text-amber-400 font-bold">DZIŚ (31 Paź)</span>
                                    <span className="font-bold text-zinc-200">
                                      {formatShortDate(ad.endDate)}
                                    </span>
                                  </div>
                                  {/* Progress Line */}
                                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden relative">
                                    <div
                                      style={{ width: `${progress.pct}%` }}
                                      className={`h-full rounded-full ${
                                        isExpired
                                          ? 'bg-rose-500'
                                          : isExpiring
                                          ? 'bg-amber-400'
                                          : 'bg-emerald-500'
                                      }`}
                                    />
                                  </div>
                                  <div className="text-[9px] text-right font-mono text-zinc-500">
                                    {progress.pct}% okresu emisji
                                  </div>
                                </div>
                              )}

                              {/* Right: When to Take Off & Status */}
                              <div className="shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1">
                                <div
                                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase flex items-center space-x-1.5 shadow-sm ${
                                    isExpired
                                      ? 'bg-rose-600 text-white animate-pulse'
                                      : isExpiring
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
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

                                <span className="text-[11px] font-mono text-zinc-400">
                                  Zdejmij do:{' '}
                                  <b className={isExpired ? 'text-rose-400' : 'text-zinc-200'}>
                                    {formatDateDisplay(ad.endDate)}
                                  </b>
                                </span>
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
