'use client';

import React from 'react';
import {
  Layers,
  Plus,
  Minus,
  Pencil,
  Play,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Film,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import { formatDaysRemainingText, formatDateDisplay } from '@/lib/date-utils';

interface BreaksSlotMatrixProps {
  ads: CommercialAd[];
  shows: CommercialShow[];
  selectedShowId: string;
  onEditAd: (ad: CommercialAd) => void;
  onOpenNewAdForBreak: (showId: string, breakNumber: number) => void;
  onAddBreak: (showId: string) => void;
  onRemoveBreak: (showId: string, breakNumber: number) => void;
  onDeleteAd: (adId: string) => void;
  onTakeOffAd: (adId: string) => void;
  onRestoreAd: (adId: string) => void;
}

export function BreaksSlotMatrix({
  ads,
  shows,
  selectedShowId,
  onEditAd,
  onOpenNewAdForBreak,
  onAddBreak,
  onRemoveBreak,
  onDeleteAd,
  onTakeOffAd,
  onRestoreAd,
}: BreaksSlotMatrixProps) {
  // If 'all', render all shows; if specific show, render that show
  const activeShows = selectedShowId === 'all'
    ? shows
    : shows.filter((s) => s.id === selectedShowId);

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-8 max-w-7xl mx-auto w-full select-none overflow-y-auto">
      {activeShows.map((show) => {
        const breakNumbers = Array.from({ length: show.breakCount }, (_, i) => i + 1);

        return (
          <div key={show.id} className="space-y-4">
            {/* Show Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 gap-3 flex-wrap">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    show.color === 'emerald'
                      ? 'bg-emerald-400'
                      : show.color === 'amber'
                      ? 'bg-amber-400'
                      : show.color === 'cyan'
                      ? 'bg-cyan-400'
                      : 'bg-indigo-400'
                  }`}
                />
                <div>
                  <h2 className="text-base font-bold text-zinc-100">{show.title}</h2>
                  <p className="text-xs text-zinc-400">
                    {show.channel} &bull; <span className="text-amber-400">{show.broadcastSchedule}</span> &bull; {show.breakCount} commercial breaks
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onAddBreak(show.id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition-colors"
                title="Add a new commercial break at the end"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add commercial break</span>
              </button>
            </div>

            {/* Breaks Columns / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {breakNumbers.map((breakNum) => {
                const breakAds = ads.filter(
                  (a) => a.showId === show.id && a.breakNumber === breakNum
                );

                const totalDuration = breakAds.reduce((acc, a) => acc + a.durationSec, 0);

                return (
                  <div
                    key={breakNum}
                    className="flex flex-col rounded-2xl bg-zinc-900/60 border border-zinc-850 p-4 shadow-xl justify-between"
                  >
                    <div>
                      {/* Break Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
                        <div className="flex items-center space-x-2">
                          <Layers className="w-4 h-4 text-indigo-400" />
                          <h3 className="text-sm font-bold text-zinc-200">
                            Break {breakNum}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-[11px] font-mono text-zinc-400 mr-1">
                            {totalDuration}s total
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenNewAdForBreak(show.id, breakNum)}
                            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                            title="Add ad to this break"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          {show.breakCount > 1 && (
                            <button
                              type="button"
                              onClick={() => onRemoveBreak(show.id, breakNum)}
                              className="p-1 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 transition-colors"
                              title="Remove this commercial break"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Spot Cards in Break */}
                      <div className="space-y-3">
                        {breakAds.length === 0 ? (
                          <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
                            Empty commercial break.
                            <button
                              onClick={() => onOpenNewAdForBreak(show.id, breakNum)}
                              className="text-indigo-400 hover:underline block mx-auto mt-1 font-semibold"
                            >
                              + Insert spot
                            </button>
                          </div>
                        ) : (
                          breakAds.map((ad, idx) => {
                            const daysInfo = formatDaysRemainingText(ad.endDate);
                            const isExpired = ad.status === 'expired';
                            const isExpiring = ad.status === 'expiring_soon';
                            const isTakenOff = !!ad.takenOffAt;

                            return (
                              <div
                                key={ad.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => onEditAd(ad)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onEditAd(ad);
                                  }
                                }}
                                className={`rounded-xl border p-3 transition-all flex flex-col justify-between cursor-pointer ${
                                  isTakenOff
                                    ? 'bg-zinc-950/40 border-zinc-800 opacity-60'
                                    : isExpired
                                    ? 'bg-rose-950/20 border-rose-500/80 shadow-md shadow-rose-950/30'
                                    : isExpiring
                                    ? 'bg-amber-950/20 border-amber-500/60'
                                    : 'bg-zinc-950/80 border-zinc-800 hover:border-indigo-500/60 hover:ring-1 hover:ring-indigo-500/30'
                                }`}
                              >
                                <div>
                                  {/* Slot tag & Expiration pill */}
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-850 text-zinc-400">
                                      Spot #{idx + 1} &bull; {ad.durationSec}s
                                    </span>
                                    <span
                                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border ${daysInfo.badgeClass}`}
                                    >
                                      {daysInfo.text}
                                    </span>
                                  </div>

                                  {/* Thumbnail & Title */}
                                  <div className="flex items-start space-x-2.5">
                                    <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0 group/vid ring-1 ring-zinc-800">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={ad.frameGrabUrl}
                                        alt={ad.title}
                                        className="w-full h-full object-cover transition-transform group-hover/vid:scale-105"
                                      />
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/vid:bg-black/20">
                                        <Play className="w-3 h-3 text-white fill-current" />
                                      </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-xs font-bold text-zinc-200 group-hover:text-indigo-300 transition-colors line-clamp-1">
                                        {ad.title}
                                      </h4>
                                      <p className="text-[10px] text-zinc-400 truncate">
                                        {ad.advertiser}
                                      </p>
                                      <p className="text-[10px] text-zinc-500 mt-0.5">
                                        Pull by: <b className="text-zinc-300">{formatDateDisplay(ad.endDate)}</b>
                                      </p>
                                    </div>
                                  </div>

                                  {/* Replacement prompt if expired or expiring */}
                                  {(isExpired || isExpiring) && (
                                    <div className="mt-2 text-[10px] p-1.5 rounded bg-zinc-900 border border-zinc-800 text-amber-300/90 leading-tight">
                                      <b>Instruction: </b>{ad.replacementAction}
                                    </div>
                                  )}
                                </div>

                                {/* Card footer actions */}
                                <div className="mt-3 pt-2 border-t border-zinc-850 flex items-center justify-between text-[11px]">
                                  <span className="text-indigo-400 font-semibold flex items-center gap-1">
                                    <Pencil className="w-3 h-3" />
                                    Click to edit
                                  </span>

                                  <div className="flex items-center space-x-2">
                                    {isTakenOff ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onRestoreAd(ad.id);
                                        }}
                                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5"
                                        title="Restore spot on air (undo Pull)"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                        Restore
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onTakeOffAd(ad.id);
                                        }}
                                        className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                                        title="Take this spot off air"
                                      >
                                        Pull
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete spot "${ad.title}"?`)) {
                                          onDeleteAd(ad.id);
                                        }
                                      }}
                                      className="text-zinc-500 hover:text-rose-400 p-0.5"
                                      title="Delete ad"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Add button inside break */}
                    <div className="mt-4 pt-3 border-t border-zinc-850 text-center">
                      <button
                        onClick={() => onOpenNewAdForBreak(show.id, breakNum)}
                        className="w-full py-1.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add spot to Break {breakNum}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

