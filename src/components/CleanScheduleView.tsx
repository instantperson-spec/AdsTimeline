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
  Table,
  Columns,
  Calendar,
} from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import {
  formatDaysRemainingText,
  formatDateDisplay,
  formatShortDate,
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
  // Two ultra-clean layout options: 'table' (Czysta Tabela Emisyjna) vs 'columns' (Kolumny Przerw 1, 2, 3)
  const [layoutStyle, setLayoutStyle] = useState<'table' | 'columns'>('table');
  const [filterUrgent, setFilterUrgent] = useState(false);

  // Filter shows & ads
  const filteredShows = selectedShowId === 'all'
    ? shows
    : shows.filter((s) => s.id === selectedShowId);

  const filteredAds = ads.filter((ad) => {
    if (selectedShowId !== 'all' && ad.showId !== selectedShowId) return false;
    if (filterUrgent && ad.status !== 'expired' && ad.status !== 'expiring_soon') {
      return false;
    }
    return true;
  });

  const expiredCount = ads.filter((a) => !a.takenOffAt && a.status === 'expired').length;
  const expiringSoonCount = ads.filter((a) => !a.takenOffAt && a.status === 'expiring_soon').length;

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 text-zinc-100 p-4 lg:p-8 flex flex-col font-sans select-none">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* ========================================================================= */}
        {/* 1. URGENT BANNER: CLEAR, DIRECT MESSAGE (NO CLUTTER)                     */}
        {/* ========================================================================= */}
        {expiredCount > 0 && (
          <div className="bg-rose-950/80 border-2 border-rose-500 rounded-xl p-4 flex items-center justify-between text-xs text-rose-100 shadow-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
              <div>
                <span className="font-extrabold text-white uppercase tracking-wide block">
                  PILNY ALERT: 1 spot wymaga natychmiastowego zdjęcia z anteny!
                </span>
                <span className="text-rose-200 mt-0.5 block">
                  Koncert <b>Cliona Hagan</b> odbył się wczoraj (30 Października). Zdejmij ten materiał przed kolejną środową emisją programu!
                </span>
              </div>
            </div>

            <button
              onClick={() => setFilterUrgent(!filterUrgent)}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-colors shrink-0 ${
                filterUrgent ? 'bg-white text-rose-950' : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {filterUrgent ? 'Pokaż całą ramówkę' : 'Pokaż tylko pilne spoty'}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. SUB-HEADER: SIMPLE VIEW SELECTOR (TABELA vs KOLUMNY PRZERW)           */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs">
          <div className="flex items-center space-x-2 text-zinc-400">
            <span>Dziś: <b className="text-white">31 Października 2026</b></span>
            <span>&bull;</span>
            <span>Zaplanowane reklamy: <b className="text-zinc-200">{filteredAds.length}</b></span>
            {expiredCount > 0 && (
              <>
                <span>&bull;</span>
                <span className="text-rose-400 font-bold">{expiredCount} do zdjęcia!</span>
              </>
            )}
          </div>

          {/* Simple 2-button layout toggle */}
          <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setLayoutStyle('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                layoutStyle === 'table'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-indigo-400" />
              <span>Czysta Tabela Emisji</span>
            </button>

            <button
              onClick={() => setLayoutStyle('columns')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                layoutStyle === 'columns'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kolumny Bloków (1, 2, 3)</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OPTION A: CZYSTA TABELA EMISYJNA (TRAFFIC LOG TABLE)                      */}
        {/* ========================================================================= */}
        {layoutStyle === 'table' && (
          <div className="space-y-6">
            {filteredShows.map((show) => {
              const showAds = filteredAds.filter((a) => a.showId === show.id);

              return (
                <div key={show.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                  {/* Show Title Bar */}
                  <div className="bg-zinc-900 px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="w-3 h-3 rounded-full bg-indigo-400" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wide">{show.title}</h2>
                      <span className="text-xs text-zinc-400 font-mono">
                        ({show.channel} &bull; {show.broadcastSchedule})
                      </span>
                    </div>

                    <span className="text-xs text-zinc-400 font-mono">
                      {showAds.length} {showAds.length === 1 ? 'spot' : 'spoty'} w ramówce
                    </span>
                  </div>

                  {/* Clean Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800/80 bg-zinc-950/60 text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                          <th className="py-3 px-4 w-28">Pasmo</th>
                          <th className="py-3 px-3 w-28">Wideo</th>
                          <th className="py-3 px-4">Nazwa Reklamy / Wydarzenie</th>
                          <th className="py-3 px-4 w-36">Emisja (Od ➔ Do)</th>
                          <th className="py-3 px-4 w-48 text-right">KIEDY ZDJĄĆ / STATUS</th>
                          <th className="py-3 px-4 w-32 text-right">Akcje</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                        {showAds.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-zinc-500 italic">
                              Brak spotów reklamowych w tym programie
                            </td>
                          </tr>
                        ) : (
                          showAds.map((ad) => {
                            const daysInfo = formatDaysRemainingText(ad.endDate);
                            const isExpired = ad.status === 'expired';
                            const isExpiring = ad.status === 'expiring_soon';
                            const isTakenOff = !!ad.takenOffAt;

                            return (
                              <tr
                                key={ad.id}
                                className={`hover:bg-zinc-850/50 transition-colors ${
                                  isExpired ? 'bg-rose-950/20' : ''
                                }`}
                              >
                                {/* 1. Break & Slot */}
                                <td className="py-3.5 px-4 font-mono">
                                  <span className="font-bold text-white">Przerwa {ad.breakNumber}</span>
                                  <span className="text-zinc-500 block text-[11px]">Slot #{ad.slotIndex}</span>
                                </td>

                                {/* 2. Video Thumbnail (Click to play) */}
                                <td className="py-3.5 px-3">
                                  <div
                                    onClick={() => onSelectAd(ad)}
                                    className="relative w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0 ring-1 ring-zinc-800 cursor-pointer group shadow-sm"
                                    title="Kliknij, aby odtworzyć wideo"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={ad.frameGrabUrl}
                                      alt=""
                                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                                      <Play className="w-3.5 h-3.5 text-white fill-current" />
                                    </div>
                                    <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 font-mono text-[8px] text-zinc-300">
                                      {ad.durationSec}s
                                    </span>
                                  </div>
                                </td>

                                {/* 3. Title & Context */}
                                <td className="py-3.5 px-4">
                                  <div
                                    onClick={() => onSelectAd(ad)}
                                    className="font-bold text-white hover:text-indigo-300 transition-colors cursor-pointer text-xs leading-tight"
                                  >
                                    {ad.title}
                                  </div>
                                  <div className="text-zinc-400 text-[11px] mt-0.5">
                                    <span>{ad.advertiser}</span>
                                    {ad.eventDate && (
                                      <span className="text-amber-400 ml-2 font-medium">
                                        &bull; {ad.eventDate}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* 4. Flight Dates */}
                                <td className="py-3.5 px-4 font-mono text-zinc-300 text-[11px]">
                                  <span>{formatShortDate(ad.startDate)}</span>
                                  <span className="text-zinc-500 mx-1.5">&rarr;</span>
                                  <span className="font-bold text-white">{formatShortDate(ad.endDate)}</span>
                                </td>

                                {/* 5. WHEN TO TAKE OFF & STATUS */}
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex flex-col items-end space-y-1">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase inline-flex items-center space-x-1 ${
                                        isTakenOff
                                          ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                          : isExpired
                                          ? 'bg-rose-600 text-white animate-pulse'
                                          : isExpiring
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      }`}
                                    >
                                      {isExpired ? '🚨 ZDEJMIJ!' : daysInfo.text}
                                    </span>
                                    <span className="text-[11px] font-mono text-zinc-400">
                                      Termin: <b className={isExpired ? 'text-rose-400' : 'text-zinc-200'}>{formatDateDisplay(ad.endDate)}</b>
                                    </span>
                                  </div>
                                </td>

                                {/* 6. Actions */}
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end space-x-1.5">
                                    {!isTakenOff && (
                                      <button
                                        onClick={() => onTakeOffAd(ad.id)}
                                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-rose-950 hover:text-rose-300 text-zinc-300 text-[10px] font-bold transition-colors"
                                        title="Zdejmij z ramówki"
                                      >
                                        Zdejmij
                                      </button>
                                    )}
                                    <button
                                      onClick={() => onEditAd(ad)}
                                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                      title="Edytuj dane"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Usunąć reklamę "${ad.title}"?`)) {
                                          onDeleteAd(ad.id);
                                        }
                                      }}
                                      className="p-1 rounded bg-zinc-800 hover:bg-rose-950 text-zinc-500 hover:text-rose-400 transition-colors"
                                      title="Usuń spot"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* OPTION B: KOLUMNY BLOKÓW REKLAMOWYCH (STUDIO BOARD VIEW)                  */}
        {/* ========================================================================= */}
        {layoutStyle === 'columns' && (
          <div className="space-y-6">
            {filteredShows.map((show) => {
              const showAds = filteredAds.filter((a) => a.showId === show.id);
              const breakNumbers = Array.from({ length: show.breakCount }, (_, i) => i + 1);

              return (
                <div key={show.id} className="space-y-3">
                  <div className="flex items-center space-x-2 border-b border-zinc-800 pb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <h2 className="text-sm font-bold text-white">{show.title}</h2>
                    <span className="text-xs text-zinc-400 font-mono">
                      ({show.channel} &bull; {show.broadcastSchedule})
                    </span>
                  </div>

                  {/* Columns Grid: Break 1, Break 2, Break 3 side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {breakNumbers.map((breakNum) => {
                      const breakAds = showAds.filter((a) => a.breakNumber === breakNum);
                      const totalSec = breakAds.reduce((sum, a) => sum + a.durationSec, 0);

                      return (
                        <div
                          key={breakNum}
                          className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col space-y-3 shadow-sm"
                        >
                          {/* Column Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                            <div className="flex items-center space-x-2">
                              <Layers className="w-4 h-4 text-indigo-400" />
                              <span className="font-bold text-xs uppercase tracking-wider text-white">
                                Przerwa {breakNum}
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              {breakAds.length} spoty &bull; {totalSec}s
                            </span>
                          </div>

                          {/* Spots in this column */}
                          {breakAds.length === 0 ? (
                            <div className="py-6 text-center text-xs text-zinc-500 italic">
                              Brak spotów w tym bloku
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {breakAds.map((ad) => {
                                const daysInfo = formatDaysRemainingText(ad.endDate);
                                const isExpired = ad.status === 'expired';
                                const isExpiring = ad.status === 'expiring_soon';

                                return (
                                  <div
                                    key={ad.id}
                                    className={`p-3 rounded-xl border transition-all ${
                                      isExpired
                                        ? 'bg-rose-950/30 border-rose-500/80'
                                        : isExpiring
                                        ? 'bg-amber-950/20 border-amber-500/40'
                                        : 'bg-zinc-950 border-zinc-800'
                                    }`}
                                  >
                                    {/* Thumbnail + Title */}
                                    <div
                                      onClick={() => onSelectAd(ad)}
                                      className="flex items-start space-x-3 cursor-pointer"
                                    >
                                      <div className="relative w-16 aspect-video rounded-lg overflow-hidden bg-black shrink-0 ring-1 ring-zinc-800">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={ad.frameGrabUrl}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                        <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 font-mono text-[8px] text-zinc-300">
                                          {ad.durationSec}s
                                        </span>
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <span className="text-[9px] font-mono font-bold text-indigo-400 block">
                                          Slot #{ad.slotIndex}
                                        </span>
                                        <h4 className="text-xs font-bold text-white truncate hover:text-indigo-300 transition-colors">
                                          {ad.title}
                                        </h4>
                                        <span className="text-[10px] text-zinc-400 truncate block">
                                          {ad.advertiser}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Deadline & Status */}
                                    <div className="mt-2.5 pt-2 border-t border-zinc-850 flex items-center justify-between text-[10px] font-mono">
                                      <span className="text-zinc-400">
                                        Zdejmij do: <b className={isExpired ? 'text-rose-400' : 'text-zinc-200'}>{formatShortDate(ad.endDate)}</b>
                                      </span>

                                      <span
                                        className={`px-2 py-0.5 rounded font-bold uppercase ${
                                          isExpired
                                            ? 'bg-rose-600 text-white'
                                            : isExpiring
                                            ? 'bg-amber-500/20 text-amber-300'
                                            : 'bg-emerald-500/20 text-emerald-300'
                                        }`}
                                      >
                                        {isExpired ? '🚨 ZDEJMIJ!' : daysInfo.text}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <button
                            onClick={() => onOpenNewAdForBreak(show.id, breakNum)}
                            className="w-full py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Dodaj spot</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
