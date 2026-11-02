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
  ChevronUp,
  ChevronDown,
  CopyPlus,
  ArrowRightLeft,
  ClipboardCopy,
  CirclePause,
} from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import { formatDaysRemainingText, formatDateDisplay, tracksPullDeadline } from '@/lib/date-utils';
import { useAppDialog } from '@/components/app-dialog/AppDialogProvider';
import { MatrixIconButton } from '@/components/MatrixIconButton';
import { adPosterSrc } from '@/lib/media-display';

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
  onMoveSpot: (
    showId: string,
    breakNumber: number,
    adId: string,
    direction: 'up' | 'down'
  ) => void;
  onDuplicateBreak: (showId: string, sourceBreakNumber: number) => void;
  onCopyBreakTo: (showId: string, sourceBreakNumber: number, targetBreakNumber: number) => void;
  onOpenMoveBreak: (showId: string, sourceBreakNumber: number, spotCount: number) => void;
  onCopySpot: (ad: CommercialAd) => void;
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
  onMoveSpot,
  onDuplicateBreak,
  onCopyBreakTo,
  onOpenMoveBreak,
  onCopySpot,
}: BreaksSlotMatrixProps) {
  const dialog = useAppDialog();

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
                const breakAds = ads
                  .filter((a) => a.showId === show.id && a.breakNumber === breakNum)
                  .sort(
                    (a, b) =>
                      a.slotIndex - b.slotIndex || a.createdAt.localeCompare(b.createdAt)
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
                        <div className="flex items-center gap-0.5 overflow-visible">
                          <span className="text-[11px] font-mono text-zinc-400 mr-1">
                            {totalDuration}s total
                          </span>
                          {breakAds.length > 0 && (
                            <>
                              <MatrixIconButton
                                label={
                                  show.breakCount >= 6
                                    ? 'Max 6 breaks — copy spots into another break instead'
                                    : 'Duplicate entire break (new break at end)'
                                }
                                onClick={() => onDuplicateBreak(show.id, breakNum)}
                                disabled={show.breakCount >= 6}
                                variant="cyan"
                              >
                                <CopyPlus className="w-3.5 h-3.5" />
                              </MatrixIconButton>
                              <MatrixIconButton
                                label="Move all spots to another programme"
                                onClick={() =>
                                  onOpenMoveBreak(show.id, breakNum, breakAds.length)
                                }
                                variant="emerald"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </MatrixIconButton>
                              <MatrixIconButton
                                label="Copy all spots into another break (same programme)"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void (async () => {
                                    const raw = await dialog.prompt({
                                      title: 'Copy to break',
                                      message: `Copy ${breakAds.length} spot(s) from Break ${breakNum} into break number (1–${show.breakCount}):`,
                                      defaultValue: String(breakNum),
                                      confirmLabel: 'Copy',
                                    });
                                    if (raw == null) return;
                                    const target = parseInt(raw, 10);
                                    if (
                                      !Number.isFinite(target) ||
                                      target < 1 ||
                                      target > show.breakCount
                                    ) {
                                      await dialog.alert({
                                        title: 'Invalid break number',
                                        message: `Enter a break number between 1 and ${show.breakCount}.`,
                                      });
                                      return;
                                    }
                                    onCopyBreakTo(show.id, breakNum, target);
                                  })();
                                }}
                              >
                                <ClipboardCopy className="w-3.5 h-3.5" />
                              </MatrixIconButton>
                            </>
                          )}
                          <MatrixIconButton
                            label="Add spot to this break"
                            onClick={() => onOpenNewAdForBreak(show.id, breakNum)}
                            variant="indigo"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </MatrixIconButton>
                          {show.breakCount > 1 && (
                            <MatrixIconButton
                              label="Remove this commercial break"
                              onClick={() => onRemoveBreak(show.id, breakNum)}
                              variant="rose"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </MatrixIconButton>
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
                            const daysInfo = formatDaysRemainingText(ad.endDate, undefined, ad);
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
                                      Slot #{ad.slotIndex} &bull; {ad.durationSec}s
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
                                        src={adPosterSrc(ad)}
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
                                  {tracksPullDeadline(ad) && (isExpired || isExpiring) && (
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

                                  <div className="flex items-center gap-0.5">
                                    <div className="flex flex-col -my-0.5">
                                      <MatrixIconButton
                                        label="Move spot up in break"
                                        disabled={idx === 0}
                                        variant="indigo"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onMoveSpot(show.id, breakNum, ad.id, 'up');
                                        }}
                                      >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      </MatrixIconButton>
                                      <MatrixIconButton
                                        label="Move spot down in break"
                                        disabled={idx === breakAds.length - 1}
                                        variant="indigo"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onMoveSpot(show.id, breakNum, ad.id, 'down');
                                        }}
                                      >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </MatrixIconButton>
                                    </div>
                                    {isTakenOff ? (
                                      <MatrixIconButton
                                        label="Restore on air (undo Pull)"
                                        variant="emerald"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onRestoreAd(ad.id);
                                        }}
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                      </MatrixIconButton>
                                    ) : (
                                      <MatrixIconButton
                                        label="Pull spot off air"
                                        variant="rose"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onTakeOffAd(ad.id);
                                        }}
                                      >
                                        <CirclePause className="w-3.5 h-3.5" />
                                      </MatrixIconButton>
                                    )}
                                    <MatrixIconButton
                                      label="Duplicate spot to another break"
                                      variant="cyan"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onCopySpot(ad);
                                      }}
                                    >
                                      <CopyPlus className="w-3.5 h-3.5" />
                                    </MatrixIconButton>
                                    <MatrixIconButton
                                      label="Delete spot"
                                      variant="rose"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void (async () => {
                                          const ok = await dialog.confirm({
                                            title: 'Delete spot',
                                            message: `Delete spot "${ad.title}"?`,
                                            confirmLabel: 'Delete',
                                            tone: 'danger',
                                          });
                                          if (ok) onDeleteAd(ad.id);
                                        })();
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </MatrixIconButton>
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

