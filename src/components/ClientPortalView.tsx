'use client';

import React, { useMemo } from 'react';
import { Layers, Play } from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import { formatDateDisplay, formatDaysRemainingText } from '@/lib/date-utils';

interface ClientPortalViewProps {
  ads: CommercialAd[];
  shows: CommercialShow[];
  selectedShowId: string;
  onSelectShow: (showId: string) => void;
  onSelectAd: (ad: CommercialAd) => void;
  /** When filters live in the page header (client portal). */
  hideShowPicker?: boolean;
  /** Client portal: title block is in page header. */
  hideIntroCard?: boolean;
}

const BREAK_LABEL: Record<number, string> = {
  1: 'Break 1',
  2: 'Break 2',
  3: 'Break 3',
};

const BREAK_RING: Record<number, string> = {
  1: 'border-l-indigo-500',
  2: 'border-l-emerald-500',
  3: 'border-l-amber-500',
};

function breakLabel(n: number) {
  return BREAK_LABEL[n] ?? `Break ${n}`;
}

function breakRing(n: number) {
  return BREAK_RING[n] ?? BREAK_RING[((n - 1) % 3) + 1];
}

export function ClientPortalView({
  ads,
  shows,
  selectedShowId,
  onSelectShow,
  onSelectAd,
  hideShowPicker = false,
  hideIntroCard = false,
}: ClientPortalViewProps) {
  const show =
    selectedShowId === 'all'
      ? null
      : (shows.find((s) => s.id === selectedShowId) ?? shows[0]);

  const visibleShows = !hideShowPicker && shows.length > 1;

  const showAds = useMemo(() => {
    const list =
      selectedShowId === 'all'
        ? ads.filter((a) => !a.takenOffAt)
        : ads.filter((a) => a.showId === selectedShowId && !a.takenOffAt);
    return [...list].sort((a, b) =>
      a.breakNumber !== b.breakNumber
        ? a.breakNumber - b.breakNumber
        : a.slotIndex - b.slotIndex
    );
  }, [ads, selectedShowId]);

  const programsToRender = useMemo(() => {
    if (selectedShowId === 'all') {
      return shows.filter((s) => showAds.some((a) => a.showId === s.id));
    }
    return show ? [show] : [];
  }, [selectedShowId, show, showAds, shows]);

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 px-4 py-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {visibleShows && (
          <div>
            <label htmlFor="client-show" className="block text-sm font-medium text-zinc-300 mb-2">
              Show
            </label>
            <select
              id="client-show"
              value={selectedShowId}
              onChange={(e) => onSelectShow(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-base text-white"
            >
              <option value="all">All programmes</option>
              {shows.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {!hideIntroCard &&
          (selectedShowId === 'all' ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-4">
              <h2 className="text-lg font-bold text-white">All programmes</h2>
              <p className="text-sm text-zinc-400 mt-2">
                Active ads across all schedules — click a card to preview the spot.
              </p>
            </div>
          ) : (
            show && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-4">
                <h2 className="text-lg font-bold text-white">{show.title}</h2>
                <p className="text-sm text-amber-400/95 mt-1">{show.broadcastSchedule}</p>
                <p className="text-sm text-zinc-400 mt-2">
                  Your ads in this schedule — click a card to preview the spot.
                </p>
              </div>
            )
          ))}

        {showAds.length === 0 ? (
          <p className="text-center text-zinc-500 py-12">No active ads in this programme.</p>
        ) : (
          programsToRender.map((program) => {
            const programAds = showAds.filter((a) => a.showId === program.id);
            const breakNumbers = Array.from({ length: program.breakCount }, (_, i) => i + 1);

            return (
              <div key={program.id} className="space-y-6">
                {selectedShowId === 'all' && (
                  <div className="border-b border-zinc-800 pb-2">
                    <h3 className="text-base font-bold text-white">{program.title}</h3>
                    <p className="text-xs text-amber-400/90 mt-0.5">{program.broadcastSchedule}</p>
                  </div>
                )}

                {breakNumbers.map((breakNum) => {
                  const breakAds = programAds.filter((a) => a.breakNumber === breakNum);
                  if (breakAds.length === 0) return null;

                  return (
                    <section key={`${program.id}-${breakNum}`} className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-zinc-200 uppercase tracking-wide">
                        <Layers className="w-4 h-4 text-zinc-400" />
                        {breakLabel(breakNum)}
                      </div>

                      <div className="space-y-2">
                        {breakAds.map((ad) => {
                          const days = formatDaysRemainingText(ad.endDate);
                          const isUrgent =
                            ad.status === 'expired' || ad.status === 'expiring_soon';

                          return (
                            <button
                              key={ad.id}
                              type="button"
                              onClick={() => onSelectAd(ad)}
                              className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-600 transition-colors border-l-4 ${breakRing(breakNum)}`}
                            >
                              <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={ad.frameGrabUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <Play className="w-6 h-6 text-white fill-white" />
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-white line-clamp-2">
                                  {ad.title}
                                </p>
                                <p className="text-sm text-zinc-400 mt-1">
                                  On air until:{' '}
                                  <span className="text-zinc-200 font-medium">
                                    {formatDateDisplay(ad.endDate)}
                                  </span>
                                </p>
                              </div>

                              <span
                                className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg ${
                                  isUrgent
                                    ? days.badgeClass
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                }`}
                              >
                                {ad.status === 'expired' ? 'Past deadline' : days.text}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
