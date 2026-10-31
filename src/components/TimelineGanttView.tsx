'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  Play,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Info,
} from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import { formatDaysRemainingText, formatDateDisplay, formatShortDate } from '@/lib/date-utils';

interface TimelineGanttViewProps {
  ads: CommercialAd[];
  shows: CommercialShow[];
  selectedShowId: string;
  onSelectAd: (ad: CommercialAd) => void;
  onOpenNewAd: () => void;
}

export function TimelineGanttView({
  ads,
  shows,
  selectedShowId,
  onSelectAd,
  onOpenNewAd,
}: TimelineGanttViewProps) {
  const [zoomRangeDays, setZoomRangeDays] = useState<number>(30); // 14, 30, 45
  const [statusFilter, setStatusFilter] = useState<'all' | 'urgent_only' | 'active_only'>('all');

  // Baseline timeline window centered around current date (2026-10-31)
  const today = useMemo(() => new Date('2026-10-31T00:00:00'), []);

  // Compute start and end dates for the timeline view
  const timelineStart = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 10); // start 10 days before today
    return d;
  }, [today]);

  const timelineEnd = useMemo(() => {
    const d = new Date(timelineStart);
    d.setDate(d.getDate() + zoomRangeDays);
    return d;
  }, [timelineStart, zoomRangeDays]);

  // Generate array of day columns
  const dayColumns = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(timelineStart);
    while (current <= timelineEnd) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [timelineStart, timelineEnd]);

  // Filter shows to render
  const filteredShows = useMemo(() => {
    if (selectedShowId === 'all') return shows;
    return shows.filter((s) => s.id === selectedShowId);
  }, [shows, selectedShowId]);

  // Filter ads
  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      if (selectedShowId !== 'all' && ad.showId !== selectedShowId) return false;
      if (statusFilter === 'urgent_only' && ad.status !== 'expired' && ad.status !== 'expiring_soon') {
        return false;
      }
      if (statusFilter === 'active_only' && (ad.status === 'expired' || ad.takenOffAt)) {
        return false;
      }
      return true;
    });
  }, [ads, selectedShowId, statusFilter]);

  // Calculate percentage position on timeline
  const totalMs = timelineEnd.getTime() - timelineStart.getTime();

  const getPositionStyles = (startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr + 'T00:00:00').getTime();
    const end = new Date(endDateStr + 'T23:59:59').getTime();

    const left = Math.max(0, ((start - timelineStart.getTime()) / totalMs) * 100);
    const right = Math.min(100, ((end - timelineStart.getTime()) / totalMs) * 100);
    const width = Math.max(2, right - left);

    return { left: `${left}%`, width: `${width}%` };
  };

  const todayLeftPercent = ((today.getTime() - timelineStart.getTime()) / totalMs) * 100;

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto w-full select-none overflow-hidden">
      {/* Timeline Controls Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-850 text-xs">
        {/* Filter Pills */}
        <div className="flex items-center space-x-2">
          <span className="text-zinc-500 font-semibold text-[11px]">Widok:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Wszystkie reklamy ({ads.length})
          </button>
          <button
            onClick={() => setStatusFilter('urgent_only')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              statusFilter === 'urgent_only'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            Tylko pilne / wygasające
          </button>
          <button
            onClick={() => setStatusFilter('active_only')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              statusFilter === 'active_only'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            Tylko aktywne
          </button>
        </div>

        {/* Zoom Level Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-zinc-500 font-semibold text-[11px]">Horyzont czasu:</span>
          {[14, 30, 45].map((days) => (
            <button
              key={days}
              onClick={() => setZoomRangeDays(days)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all ${
                zoomRangeDays === days
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {days} dni
            </button>
          ))}
        </div>
      </div>

      {/* Main Gantt Grid Canvas */}
      <div className="flex-1 bg-zinc-950 border border-zinc-850 rounded-2xl overflow-x-auto shadow-2xl flex flex-col min-h-[500px]">
        {/* Timeline Header (Date Ruler) */}
        <div className="sticky top-0 z-20 flex bg-zinc-900 border-b border-zinc-800 min-w-[1000px]">
          {/* Left fixed column label */}
          <div className="w-72 shrink-0 p-3 border-r border-zinc-800 font-bold text-xs text-zinc-400 flex items-center justify-between">
            <span>PROGRAM & BLOK REKLAMOWY</span>
            <span className="text-[10px] text-zinc-500 font-mono">SLOT</span>
          </div>

          {/* Date Axis Columns */}
          <div className="flex-1 relative flex text-[10px] font-mono text-zinc-400">
            {dayColumns.map((day, idx) => {
              const isToday = day.toDateString() === today.toDateString();
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <div
                  key={idx}
                  className={`flex-1 border-r border-zinc-850/60 py-2.5 text-center flex flex-col items-center justify-center shrink-0 ${
                    isToday ? 'bg-amber-500/15 text-amber-300 font-bold' : isWeekend ? 'bg-zinc-950/40 text-zinc-500' : ''
                  }`}
                >
                  <span className="text-[9px] uppercase">
                    {day.toLocaleDateString('pl-PL', { weekday: 'narrow' })}
                  </span>
                  <span className="text-[11px] font-semibold">{day.getDate()}</span>
                  <span className="text-[8px] opacity-70">
                    {day.toLocaleDateString('pl-PL', { month: 'narrow' })}
                  </span>
                </div>
              );
            })}

            {/* Today vertical line marker */}
            {todayLeftPercent >= 0 && todayLeftPercent <= 100 && (
              <div
                style={{ left: `${todayLeftPercent}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-30 shadow-[0_0_10px_rgba(251,191,36,0.8)] pointer-events-none"
              >
                <div className="absolute -top-1 -translate-x-1/2 bg-amber-400 text-zinc-950 text-[9px] font-black px-1.5 py-0.2 rounded font-sans uppercase">
                  DZIŚ
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rows by Show and Break */}
        <div className="flex-1 min-w-[1000px] divide-y divide-zinc-850">
          {filteredShows.map((show) => {
            const breaks = Array.from({ length: show.breakCount }, (_, i) => i + 1);

            return (
              <div key={show.id} className="flex flex-col">
                {/* Show Header Group */}
                <div className="flex items-center bg-zinc-900/80 px-3 py-2 border-b border-zinc-800 text-xs font-bold text-zinc-200">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mr-2 ${
                      show.color === 'emerald'
                        ? 'bg-emerald-400'
                        : show.color === 'amber'
                        ? 'bg-amber-400'
                        : show.color === 'cyan'
                        ? 'bg-cyan-400'
                        : 'bg-indigo-400'
                    }`}
                  />
                  <span>{show.title}</span>
                  <span className="text-zinc-500 font-mono text-[10px] ml-2">
                    ({show.channel} &bull; {show.broadcastSchedule})
                  </span>
                </div>

                {/* Rows for each break */}
                {breaks.map((breakNum) => {
                  const breakAds = filteredAds.filter(
                    (a) => a.showId === show.id && a.breakNumber === breakNum
                  );

                  return (
                    <div
                      key={breakNum}
                      className="flex border-b border-zinc-850/60 hover:bg-zinc-900/30 transition-colors relative min-h-[58px]"
                    >
                      {/* Left: Break Label */}
                      <div className="w-72 shrink-0 p-3 border-r border-zinc-800 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <Layers className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="font-semibold text-zinc-200">
                            Przerwa {breakNum} (Break {breakNum})
                          </span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                          {breakAds.length} {breakAds.length === 1 ? 'spot' : 'spoty'}
                        </span>
                      </div>

                      {/* Right: Gantt Timeline Row */}
                      <div className="flex-1 relative flex items-center p-1.5">
                        {/* Background grid day lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                          {dayColumns.map((day, idx) => (
                            <div
                              key={idx}
                              className={`flex-1 border-r border-zinc-850/40 ${
                                day.toDateString() === today.toDateString() ? 'bg-amber-500/5' : ''
                              }`}
                            />
                          ))}
                        </div>

                        {/* Today vertical line continuing down */}
                        {todayLeftPercent >= 0 && todayLeftPercent <= 100 && (
                          <div
                            style={{ left: `${todayLeftPercent}%` }}
                            className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-10 pointer-events-none"
                          />
                        )}

                        {/* Ad Flight Bars */}
                        {breakAds.length === 0 ? (
                          <div className="text-[11px] text-zinc-600 pl-4 italic">
                            Brak aktywnych reklam w tym bloku
                          </div>
                        ) : (
                          breakAds.map((ad) => {
                            const pos = getPositionStyles(ad.startDate, ad.endDate);
                            const daysInfo = formatDaysRemainingText(ad.endDate);
                            const isExpired = ad.status === 'expired';
                            const isExpiring = ad.status === 'expiring_soon';

                            return (
                              <div
                                key={ad.id}
                                onClick={() => onSelectAd(ad)}
                                style={{ left: pos.left, width: pos.width }}
                                className={`absolute h-10 rounded-xl px-2.5 flex items-center justify-between cursor-pointer shadow-lg transition-all duration-200 hover:scale-[1.01] hover:z-30 border ${
                                  ad.takenOffAt
                                    ? 'bg-zinc-800/60 border-zinc-700 text-zinc-400 line-through'
                                    : isExpired
                                    ? 'bg-rose-950/80 border-rose-500 text-rose-100 shadow-rose-900/40 ring-1 ring-rose-400 animate-pulse'
                                    : isExpiring
                                    ? 'bg-amber-950/80 border-amber-500 text-amber-100 shadow-amber-900/30'
                                    : 'bg-indigo-950/70 border-indigo-500/70 text-indigo-100 hover:border-indigo-400'
                                }`}
                                title={`${ad.title} (${formatDateDisplay(ad.startDate)} - ${formatDateDisplay(ad.endDate)})\n${daysInfo.text}`}
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  {/* Small Thumbnail */}
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={ad.frameGrabUrl}
                                    alt=""
                                    className="w-6 h-6 rounded-md object-cover ring-1 ring-white/10 shrink-0"
                                  />
                                  <div className="flex flex-col truncate">
                                    <span className="text-[11px] font-bold truncate">
                                      {ad.title}
                                    </span>
                                    <span className="text-[9px] opacity-75 truncate">
                                      {ad.advertiser} &bull; {ad.durationSec}s
                                    </span>
                                  </div>
                                </div>

                                <div className="shrink-0 ml-2">
                                  <span
                                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                      isExpired
                                        ? 'bg-rose-600 text-white'
                                        : isExpiring
                                        ? 'bg-amber-500 text-zinc-950'
                                        : 'bg-zinc-900 text-zinc-300'
                                    }`}
                                  >
                                    {isExpired ? 'ZDEJMIJ!' : daysInfo.text}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
