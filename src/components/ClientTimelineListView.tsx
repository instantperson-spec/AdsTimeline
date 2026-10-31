'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Layers,
  Play,
  AlertTriangle,
  CheckCircle2,
  Search,
  Crosshair,
  Tv,
  Film,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  LayoutGrid,
  Columns,
  Plus,
  Radio,
  Check,
  Info,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import {
  formatDaysRemainingText,
  formatDateDisplay,
  formatShortDate,
  diffCalendarDays,
  toISODateString,
} from '@/lib/date-utils';
import { headerBroadcastColumnClass, unionBroadcastWeekdays } from '@/lib/broadcast-schedule';
import {
  GanttDayGridBase,
  GanttShowBroadcastOverlay,
  type GanttDayColumn,
} from '@/components/GanttBroadcastDayGrid';

const GANTT_VISIBLE_DAYS = 42;

/** Distinct lane styling per commercial break (physical + color separation). */
const BREAK_LANE_THEME: Record<
  number,
  {
    label: string;
    header: string;
    lane: string;
    bar: string;
    accent: string;
    slotTag: string;
  }
> = {
  1: {
    label: 'Break 1',
    header: 'bg-indigo-950/90 border-indigo-500/50 text-indigo-100',
    lane: 'bg-indigo-950/25 border-l-4 border-l-indigo-500',
    bar: 'bg-indigo-900/90 border-indigo-400/70 hover:border-indigo-300',
    accent: 'border-indigo-500',
    slotTag: 'text-indigo-300',
  },
  2: {
    label: 'Break 2',
    header: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100',
    lane: 'bg-emerald-950/25 border-l-4 border-l-emerald-500',
    bar: 'bg-emerald-900/90 border-emerald-400/70 hover:border-emerald-300',
    accent: 'border-emerald-500',
    slotTag: 'text-emerald-300',
  },
  3: {
    label: 'Break 3',
    header: 'bg-amber-950/90 border-amber-500/50 text-amber-100',
    lane: 'bg-amber-950/25 border-l-4 border-l-amber-500',
    bar: 'bg-amber-900/90 border-amber-400/70 hover:border-amber-300',
    accent: 'border-amber-500',
    slotTag: 'text-amber-300',
  },
};

function breakTheme(breakNumber: number) {
  return BREAK_LANE_THEME[breakNumber] ?? BREAK_LANE_THEME[((breakNumber - 1) % 3) + 1];
}

const GANTT_DAY_SCALES: { label: string; width: number }[] = [
  { label: 'Minimal grid (48px)', width: 48 },
  { label: 'Compact (56px)', width: 56 },
  { label: 'Standard (72px)', width: 72 },
  { label: 'Wide (96px)', width: 96 },
];

const GANTT_LABEL_COL_PX = 360;

/** Fixed column width — border included so header + body stay aligned. */
function dayColumnStyle(dayWidth: number): React.CSSProperties {
  return {
    width: dayWidth,
    minWidth: dayWidth,
    maxWidth: dayWidth,
    flex: `0 0 ${dayWidth}px`,
  };
}

const DAY_COLUMN_BORDER = 'box-border border-r border-zinc-700/80 shrink-0';

type GanttDay = GanttDayColumn & {
  date: Date;
  dateStr: string;
  dayOfMonth: number;
  dayOfWeekName: string;
};

function labelColumnStyle(): React.CSSProperties {
  return {
    width: GANTT_LABEL_COL_PX,
    minWidth: GANTT_LABEL_COL_PX,
    maxWidth: GANTT_LABEL_COL_PX,
    flex: `0 0 ${GANTT_LABEL_COL_PX}px`,
  };
}

function timelineTrackStyle(totalTimelineWidth: number): React.CSSProperties {
  return {
    width: totalTimelineWidth,
    minWidth: totalTimelineWidth,
    maxWidth: totalTimelineWidth,
    flex: `0 0 ${totalTimelineWidth}px`,
  };
}

function defaultGanttWindowStart(today: Date): Date {
  const start = new Date(today);
  start.setDate(start.getDate() - 10);
  return start;
}

export type TimelineSubView = 'cards_timeline' | 'gantt_timeline';

interface ClientTimelineListViewProps {
  ads: CommercialAd[];
  shows: CommercialShow[];
  selectedShowId: string;
  onSelectAd: (ad: CommercialAd) => void;
  subView: TimelineSubView;
  isClientView?: boolean;
  onTakeOffAd?: (adId: string, note?: string) => void;
  onOpenNewAd?: () => void;
}

export function ClientTimelineListView({
  ads,
  shows,
  selectedShowId,
  onSelectAd,
  subView,
  isClientView = false,
  onTakeOffAd,
  onOpenNewAd,
}: ClientTimelineListViewProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'urgent_only' | 'active_only'>(
    isClientView ? 'active_only' : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [dayWidth, setDayWidth] = useState<number>(48);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Baseline reference today: 2026-10-31
  const todayStr = '2026-10-31';
  const todayDate = useMemo(() => new Date(todayStr + 'T00:00:00'), [todayStr]);

  const [ganttWindowStart, setGanttWindowStart] = useState<Date>(() =>
    defaultGanttWindowStart(new Date(todayStr + 'T00:00:00'))
  );

  const scrollGanttToDate = useCallback(
    (dateStr: string, smooth = true) => {
      const el = scrollContainerRef.current;
      if (!el) return;
      const startStr = toISODateString(ganttWindowStart);
      const diff = diffCalendarDays(startStr, dateStr);
      el.scrollTo({
        left: Math.max(0, diff * dayWidth - el.clientWidth / 3),
        behavior: smooth ? 'smooth' : 'auto',
      });
    },
    [ganttWindowStart, dayWidth]
  );

  const shiftGanttWindow = (dayDelta: number) => {
    setGanttWindowStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + dayDelta);
      return next;
    });
  };

  const jumpGanttToToday = () => {
    setGanttWindowStart(defaultGanttWindowStart(todayDate));
    requestAnimationFrame(() => scrollGanttToDate(todayStr));
  };

  useEffect(() => {
    if (subView === 'gantt_timeline') {
      requestAnimationFrame(() => scrollGanttToDate(todayStr, false));
    }
  }, [subView, ganttWindowStart, dayWidth, scrollGanttToDate, todayStr]);

  // Timeline window for Gantt — user can pan with prev/next controls
  const { timelineStartDate, dayList, weekHeaders } = useMemo(() => {
    const start = new Date(ganttWindowStart);

    const days: GanttDay[] = [];

    const weeks: { weekLabel: string; spanDays: number; startIdx: number }[] = [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let currentWeekDays = 0;
    let currentWeekStart = 0;
    let currentWeekTitle = '';

    for (let i = 0; i < GANTT_VISIBLE_DAYS; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);

      const dStr = toISODateString(d);
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = dStr === todayStr;

      days.push({
        date: d,
        dateStr: dStr,
        dayOfMonth: d.getDate(),
        dayOfWeekName: dayNames[dayOfWeek],
        dayOfWeek,
        isWeekend,
        isToday,
      });

      if (dayOfWeek === 1 || i === 0) {
        if (currentWeekDays > 0) {
          weeks.push({
            weekLabel: currentWeekTitle,
            spanDays: currentWeekDays,
            startIdx: currentWeekStart,
          });
        }
        currentWeekStart = i;
        currentWeekDays = 1;
        currentWeekTitle = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      } else {
        currentWeekDays++;
      }
    }

    if (currentWeekDays > 0) {
      weeks.push({
        weekLabel: currentWeekTitle,
        spanDays: currentWeekDays,
        startIdx: currentWeekStart,
      });
    }

    return {
      timelineStartDate: start,
      dayList: days,
      weekHeaders: weeks,
    };
  }, [ganttWindowStart]);

  const timelineStartStr = toISODateString(timelineStartDate);
  const totalTimelineWidth = dayList.length * dayWidth;

  // Filter shows & ads
  const filteredShows = useMemo(() => {
    if (selectedShowId === 'all') return shows;
    return shows.filter((s) => s.id === selectedShowId);
  }, [shows, selectedShowId]);

  const headerBroadcastDays = useMemo(
    () => new Set(unionBroadcastWeekdays(filteredShows)),
    [filteredShows]
  );

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      if (selectedShowId !== 'all' && ad.showId !== selectedShowId) return false;

      // Status filter
      if (statusFilter === 'urgent_only') {
        if (ad.status !== 'expired' && ad.status !== 'expiring_soon') return false;
      }
      if (statusFilter === 'active_only') {
        if (ad.status === 'expired' || ad.takenOffAt) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ad.title.toLowerCase().includes(q);
        const matchAdvertiser = ad.advertiser.toLowerCase().includes(q);
        const matchShow = (ad.showTitle || '').toLowerCase().includes(q);
        if (!matchTitle && !matchAdvertiser && !matchShow) return false;
      }

      return true;
    });
  }, [ads, selectedShowId, statusFilter, searchQuery]);

  // Overall counts
  const expiredCount = useMemo(
    () => ads.filter((a) => !a.takenOffAt && a.status === 'expired').length,
    [ads]
  );
  const expiringCount = useMemo(
    () => ads.filter((a) => !a.takenOffAt && a.status === 'expiring_soon').length,
    [ads]
  );
  const activeCount = useMemo(
    () => ads.filter((a) => !a.takenOffAt && a.status === 'active').length,
    [ads]
  );

  // Position calculation for full Gantt mode
  const calculateBarPixels = (startDateStr: string, endDateStr: string) => {
    const startDiff = diffCalendarDays(timelineStartStr, startDateStr);
    const durationDays = Math.max(1, diffCalendarDays(startDateStr, endDateStr) + 1);

    const left = startDiff * dayWidth;
    const width = durationDays * dayWidth;
    return { left, width };
  };

  const todayLeftPixel = useMemo(() => {
    const diff = diffCalendarDays(timelineStartStr, todayStr);
    return diff * dayWidth;
  }, [timelineStartStr, todayStr, dayWidth]);

  // Helper for progress bar within each card
  const calculateCampaignProgress = (startDateStr: string, endDateStr: string) => {
    const totalDays = Math.max(1, diffCalendarDays(startDateStr, endDateStr));
    const elapsedDays = diffCalendarDays(startDateStr, todayStr);
    const percentage = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
    return { totalDays, elapsedDays, percentage };
  };

  const ganttRangeLabel = dayList.length
    ? `${formatShortDate(dayList[0].dateStr)} – ${formatShortDate(dayList[dayList.length - 1].dateStr)}`
    : '';

  return (
    <div
      className={`flex-1 min-w-0 flex flex-col space-y-6 p-4 lg:p-6 min-h-0 bg-zinc-950 ${
        subView === 'gantt_timeline' ? 'overflow-hidden' : 'overflow-y-auto'
      }`}
    >
      {/* 1. TOP HEADER & URGENT BROADCAST NOTICE */}
      {!isClientView && expiredCount > 0 && (
        <div className="bg-gradient-to-r from-rose-950/90 via-rose-900/80 to-zinc-900 border-2 border-rose-500 rounded-3xl p-5 shadow-2xl shadow-rose-950/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/40 animate-pulse">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500 text-white">
                  URGENT ON-AIR ALERT
                </span>
                <span className="text-xs text-rose-300 font-mono font-bold">
                  {expiredCount} {expiredCount === 1 ? 'spot to pull' : 'spots to pull'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Spots past deadline are still in the schedule!
              </h2>
              <p className="text-xs text-rose-200/90 mt-0.5">
                Review expired spots and pull them before the next broadcast on Faith World TV.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const firstExpired = ads.find((a) => !a.takenOffAt && a.status === 'expired');
              if (firstExpired) onSelectAd(firstExpired);
            }}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-950 text-xs font-extrabold shadow-lg transition-transform active:scale-95 flex items-center space-x-2"
          >
            <span>Go to spot & Pull</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. STATS PILLS & VIEW MODE SWITCHER */}
      {!isClientView && (
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3.5 backdrop-blur-md">
        {/* Left: Quick Status Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              statusFilter === 'all'
                ? 'bg-zinc-100 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white bg-zinc-800/60'
            }`}
          >
            <span>All spots ({ads.length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('urgent_only')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              statusFilter === 'urgent_only'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-rose-400 hover:bg-rose-950/40 border border-rose-900/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pull from air ({expiredCount + expiringCount})</span>
            {expiredCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setStatusFilter('active_only')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              statusFilter === 'active_only'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-emerald-400 hover:bg-emerald-950/30 border border-emerald-900/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Safe / Active ({activeCount})</span>
          </button>
        </div>

        <div className="flex items-center w-full md:w-auto md:ml-auto justify-end">
          <div className="relative w-full md:w-auto">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ads or artist..."
              className="w-full md:w-56 pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
      )}

      {/* 3. MAIN CONTENT: MODE 1 - CARDS WITH INTEGRATED TIMELINE (ULTRA READABLE FOR CLIENT) */}
      {subView === 'cards_timeline' && (
        <div className="space-y-8">
          {filteredShows.map((show) => {
            const showAds = filteredAds.filter((a) => a.showId === show.id);
            const breakNumbers = Array.from({ length: show.breakCount }, (_, i) => i + 1);

            return (
              <div
                key={show.id}
                className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-5 lg:p-6 shadow-xl space-y-6"
              >
                {/* Show Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3.5 h-3.5 rounded-full ring-4 ${
                        show.color === 'emerald'
                          ? 'bg-emerald-400 ring-emerald-500/20'
                          : show.color === 'amber'
                          ? 'bg-amber-400 ring-amber-500/20'
                          : 'bg-indigo-400 ring-indigo-500/20'
                      }`}
                    />
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                        <span>{show.title}</span>
                      </h2>
                      <div className="flex items-center space-x-2 text-xs text-zinc-400 mt-0.5">
                        <span className="font-semibold text-zinc-300">{show.channel}</span>
                        <span>&bull;</span>
                        <span className="text-amber-400 font-mono font-medium">
                          {show.broadcastSchedule}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs px-3 py-1 rounded-full bg-zinc-800/80 text-zinc-300 font-semibold border border-zinc-700/60">
                      {showAds.length} {showAds.length === 1 ? 'active spot' : 'active spots'}
                    </span>
                    {onOpenNewAd && (
                      <button
                        type="button"
                        onClick={onOpenNewAd}
                        className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add spot</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Breaks & Spots */}
                <div className="space-y-6">
                  {breakNumbers.map((breakNum) => {
                    const breakAds = showAds.filter((a) => a.breakNumber === breakNum);

                    return (
                      <div key={breakNum} className="space-y-3">
                        {/* Break Label */}
                        <div className="flex items-center justify-between px-2">
                          <div className="flex items-center space-x-2 text-xs font-bold text-zinc-300">
                            <Layers className="w-4 h-4 text-indigo-400" />
                            <span className="uppercase tracking-wider">
                              Break {breakNum} (Commercial Break {breakNum})
                            </span>
                            <span className="text-[11px] text-zinc-500 font-normal font-mono">
                              &bull; {breakAds.length} {breakAds.length === 1 ? 'spot' : 'spots'} in break
                            </span>
                          </div>
                        </div>

                        {/* Ad Cards or Empty Break State */}
                        {breakAds.length === 0 ? (
                          <div className="bg-zinc-950/40 border border-dashed border-zinc-800/80 rounded-2xl p-5 text-center text-xs text-zinc-500">
                            No spots scheduled in this commercial break.
                            {onOpenNewAd && (
                              <>
                                {' '}
                                <button
                                  type="button"
                                  onClick={onOpenNewAd}
                                  className="text-indigo-400 hover:text-indigo-300 underline font-semibold"
                                >
                                  + Schedule new spot
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {breakAds.map((ad) => {
                              const daysInfo = formatDaysRemainingText(ad.endDate, undefined, ad);
                              const isExpired = ad.status === 'expired';
                              const isExpiring = ad.status === 'expiring_soon';
                              const isTakenOff = !!ad.takenOffAt;
                              const progress = calculateCampaignProgress(ad.startDate, ad.endDate);

                              return (
                                <div
                                  key={ad.id}
                                  className={`relative rounded-3xl p-4 lg:p-5 border transition-all duration-200 shadow-lg ${
                                    isTakenOff
                                      ? 'bg-zinc-900/30 border-zinc-800/60 opacity-60'
                                      : isExpired
                                      ? 'bg-gradient-to-r from-rose-950/50 via-zinc-900/90 to-zinc-900/90 border-rose-500/80 shadow-rose-950/40 ring-1 ring-rose-500/40'
                                      : isExpiring
                                      ? 'bg-gradient-to-r from-amber-950/40 via-zinc-900/90 to-zinc-900/90 border-amber-500/60 shadow-amber-950/30'
                                      : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 shadow-zinc-950/50'
                                  }`}
                                >
                                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                                    {/* SECTION 1: VIDEO THUMBNAIL (16:9 large) */}
                                    <div
                                      onClick={() => onSelectAd(ad)}
                                      className="relative w-full sm:w-52 aspect-video rounded-2xl overflow-hidden bg-black shrink-0 ring-1 ring-white/10 group/thumb cursor-pointer shadow-md"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={ad.frameGrabUrl}
                                        alt={ad.title}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                                      />
                                      {/* Play Overlay */}
                                      <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 flex items-center justify-center transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
                                          <Play className="w-5 h-5 fill-current ml-0.5" />
                                        </div>
                                      </div>

                                      {/* Duration Pill */}
                                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md font-mono text-[11px] font-bold text-white shadow">
                                        {ad.durationSec}s
                                      </span>

                                      {/* Slot Pill */}
                                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-zinc-900/90 backdrop-blur-md text-[10px] font-bold text-indigo-300 border border-indigo-500/30 shadow">
                                        Slot #{ad.slotIndex}
                                      </span>
                                    </div>

                                    {/* SECTION 2: AD TITLE, ADVERTISER & CONTEXT */}
                                    <div className="flex-1 min-w-0 space-y-1.5 w-full">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                          Break {ad.breakNumber} &bull; Slot #{ad.slotIndex}
                                        </span>
                                      </div>

                                      <h3
                                        onClick={() => onSelectAd(ad)}
                                        className="text-base lg:text-lg font-bold text-white hover:text-indigo-300 transition-colors cursor-pointer truncate"
                                      >
                                        {ad.title}
                                      </h3>

                                      <div className="text-xs text-zinc-400 flex items-center space-x-2">
                                        <span className="text-zinc-200 font-semibold">
                                          {ad.advertiser}
                                        </span>
                                        {ad.eventDate && (
                                          <>
                                            <span>&bull;</span>
                                            <span className="text-amber-400 font-medium">
                                              Wydarzenie: {ad.eventDate}
                                            </span>
                                          </>
                                        )}
                                      </div>

                                      {/* Replacement notice if applicable */}
                                      {ad.replacementAction && (
                                        <div className="text-[11px] text-zinc-400 bg-zinc-950/60 px-3 py-1.5 rounded-xl border border-zinc-800/80 inline-flex items-center space-x-1.5 mt-1">
                                          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                          <span>
                                            <b>Traffic instruction:</b> {ad.replacementAction}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* SECTION 3: INTEGRATED TIMELINE BAR (Visual progress from start to end) */}
                                    <div className="w-full lg:w-72 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2 shrink-0">
                                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                                        <span>Start: {formatShortDate(ad.startDate)}</span>
                                        <span className="font-bold text-zinc-200">
                                          End: {formatShortDate(ad.endDate)}
                                        </span>
                                      </div>

                                      {/* Visual Timeline Bar */}
                                      <div className="h-3 w-full bg-zinc-800/80 rounded-full overflow-hidden relative">
                                        <div
                                          style={{ width: `${progress.percentage}%` }}
                                          className={`h-full rounded-full transition-all duration-500 ${
                                            isExpired
                                              ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                                              : isExpiring
                                              ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                                              : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]'
                                          }`}
                                        />
                                      </div>

                                      {/* Today marker label */}
                                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                                        <span className="text-amber-400 font-bold flex items-center space-x-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
                                          <span>Today: 31 Oct</span>
                                        </span>
                                        <span>{progress.percentage}% okresu emisji</span>
                                      </div>
                                    </div>

                                    {/* SECTION 4: EXPIRY STATUS & PULL ACTION BUTTON */}
                                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto shrink-0 gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-800">
                                      {/* Status Badge */}
                                      <div
                                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black uppercase flex items-center space-x-1.5 shadow-md ${
                                          isTakenOff
                                            ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                            : isExpired
                                            ? 'bg-rose-600 text-white animate-bounce shadow-rose-600/40'
                                            : isExpiring
                                            ? 'bg-amber-500 text-zinc-950 font-black shadow-amber-500/30'
                                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                        }`}
                                      >
                                        {isExpired ? (
                                          <>
                                            <AlertTriangle className="w-3.5 h-3.5 text-white fill-current" />
                                            <span>PULL FROM AIR!</span>
                                          </>
                                        ) : (
                                          <span>{daysInfo.text}</span>
                                        )}
                                      </div>

                                      {/* Exact Expiry Date */}
                                      <span className="text-xs font-mono text-zinc-400 text-right">
                                        Termin:{' '}
                                        <b className={isExpired ? 'text-rose-400' : 'text-zinc-200'}>
                                          {formatDateDisplay(ad.endDate)}
                                        </b>
                                      </span>

                                      {/* One-click Action to Take off */}
                                      {!isTakenOff && onTakeOffAd ? (
                                        <button
                                          type="button"
                                          onClick={() => onTakeOffAd(ad.id)}
                                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center space-x-1.5 shadow ${
                                            isExpired
                                              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/40'
                                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700'
                                          }`}
                                          title="Pull immediately from playout log"
                                        >
                                          <ShieldAlert className="w-3.5 h-3.5" />
                                          <span>Pull from air</span>
                                        </button>
                                      ) : (
                                        <span className="text-[11px] text-zinc-500 font-semibold italic">
                                          ✓ Pulled from schedule
                                        </span>
                                      )}
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
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MAIN CONTENT: MODE 2 - HORIZONTAL GANTT STUDIO (CLEAN, NO DENSE PRISON BARS) */}
      {subView === 'gantt_timeline' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col flex-1 min-h-0">
          {/* Gantt Top Controls */}
          <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-100 uppercase tracking-wider text-sm">
                Broadcast timeline (Gantt)
              </span>
              <span className="text-zinc-400 font-mono text-sm">Range: {ganttRangeLabel}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-950 overflow-hidden">
                <button
                  type="button"
                  onClick={() => shiftGanttWindow(-14)}
                  className="px-3 py-2 text-zinc-200 hover:bg-zinc-800 font-semibold flex items-center gap-1"
                  title="Back 2 weeks"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">−2 wk</span>
                </button>
                <button
                  type="button"
                  onClick={() => shiftGanttWindow(-7)}
                  className="px-2 py-2 text-zinc-400 hover:bg-zinc-800 border-x border-zinc-800"
                  title="Back 1 week"
                >
                  −7 days
                </button>
                <button
                  type="button"
                  onClick={jumpGanttToToday}
                  className="px-3 py-2 text-amber-200 hover:bg-amber-950/50 font-bold"
                  title="Centre on today"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => shiftGanttWindow(7)}
                  className="px-2 py-2 text-zinc-400 hover:bg-zinc-800 border-x border-zinc-800"
                  title="Forward 1 week"
                >
                  +7 days
                </button>
                <button
                  type="button"
                  onClick={() => shiftGanttWindow(14)}
                  className="px-3 py-2 text-zinc-200 hover:bg-zinc-800 font-semibold flex items-center gap-1"
                  title="Forward 2 weeks"
                >
                  <span className="hidden sm:inline">+2 wk</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => scrollGanttToDate(todayStr)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 border border-amber-500/50 text-amber-100 font-bold transition-all"
              >
                <Crosshair className="w-4 h-4 text-amber-300" />
                <span>Jump to today (31 Oct)</span>
              </button>

              <span
                className="text-[10px] text-zinc-400 font-medium px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-950/80 shrink-0"
                title="Kolumny z oznaczeniem TX to dni emisji programu (wg harmonogramu)"
              >
                <span className="font-black text-violet-300">TX</span> = dzień emisji programu
              </span>

              <div className="flex flex-wrap items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 max-w-full">
                <span className="text-[10px] text-zinc-500 font-bold px-1.5 shrink-0">Day grid:</span>
                {GANTT_DAY_SCALES.map((z) => (
                  <button
                    key={z.width}
                    type="button"
                    onClick={() => setDayWidth(z.width)}
                    className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold transition-all whitespace-nowrap ${
                      dayWidth === z.width
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scrollable Canvas */}
          <div
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-x-auto overflow-y-auto relative flex flex-col overscroll-x-contain touch-pan-x"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Header Ruler */}
            <div
              style={{ width: GANTT_LABEL_COL_PX + totalTimelineWidth }}
              className="sticky top-0 z-30 flex bg-zinc-900 border-b border-zinc-800 shrink-0 select-none shadow-md"
            >
              {/* Left sticky title */}
              <div
                style={labelColumnStyle()}
                className="box-border shrink-0 p-3.5 border-r border-zinc-800 bg-zinc-900 flex items-center justify-between sticky left-0 z-40 shadow-xl"
              >
                <span className="font-bold text-xs uppercase tracking-wider text-zinc-300">
                  Show & ad
                </span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">
                  Slot / time
                </span>
              </div>

              {/* Day numbers */}
              <div
                style={timelineTrackStyle(totalTimelineWidth)}
                className="flex h-10 relative shrink-0"
              >
                {dayList.map((day, idx) => (
                  <div
                    key={idx}
                    style={dayColumnStyle(dayWidth)}
                    className={`${DAY_COLUMN_BORDER} flex flex-col items-center justify-center relative ${
                      day.isToday
                        ? 'bg-amber-400/15 text-amber-100'
                        : day.isWeekend
                        ? 'bg-zinc-950/70 text-zinc-500'
                        : 'text-zinc-400'
                    } ${headerBroadcastColumnClass(headerBroadcastDays.has(day.dayOfWeek))}`}
                  >
                    {headerBroadcastDays.has(day.dayOfWeek) && (
                      <span
                        className="absolute top-0.5 right-0.5 text-[7px] font-black uppercase text-violet-300/90"
                        title="Programme broadcast day"
                      >
                        TX
                      </span>
                    )}
                    {dayWidth >= 56 && (
                      <span className="text-[9px] font-semibold uppercase leading-none opacity-70">
                        {day.dayOfWeekName}
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-mono font-bold leading-tight ${
                        day.isToday
                          ? 'mt-0.5 px-1 py-px rounded bg-amber-400 text-zinc-950'
                          : dayWidth >= 56
                          ? 'mt-0.5'
                          : ''
                      }`}
                    >
                      {day.dayOfMonth}
                    </span>
                  </div>
                ))}

                {/* Persistent Today line */}
                {todayLeftPixel >= 0 && (
                  <div
                    style={{ left: `${todayLeftPixel + dayWidth / 2}px` }}
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-30 shadow-[0_0_12px_rgba(251,191,36,0.9)] pointer-events-none"
                  >
                    <div className="absolute top-0.5 -translate-x-1/2 bg-amber-400 text-zinc-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shadow">
                      TODAY
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Gantt Rows — one shared day grid so columns match the header */}
            <div
              style={{ width: GANTT_LABEL_COL_PX + totalTimelineWidth }}
              className="flex flex-col relative"
            >
              <div
                className="absolute top-0 bottom-0 z-0 pointer-events-none flex"
                style={{ left: GANTT_LABEL_COL_PX, ...timelineTrackStyle(totalTimelineWidth) }}
              >
                <GanttDayGridBase
                  dayList={dayList}
                  dayWidth={dayWidth}
                  broadcastWeekdays={unionBroadcastWeekdays(filteredShows)}
                />
              </div>
              {filteredShows.map((show) => {
                const showAds = filteredAds.filter((a) => a.showId === show.id);
                const breakNumbers = Array.from({ length: show.breakCount }, (_, i) => i + 1);

                return (
                  <div key={show.id} className="relative flex flex-col border-b-4 border-zinc-800">
                    <div
                      className="absolute top-0 bottom-0 z-[1] flex pointer-events-none"
                      style={{ left: GANTT_LABEL_COL_PX, ...timelineTrackStyle(totalTimelineWidth) }}
                    >
                      <GanttShowBroadcastOverlay
                        dayList={dayList}
                        dayWidth={dayWidth}
                        show={show}
                      />
                    </div>
                    {/* Show Group Header */}
                    <div className="sticky left-0 z-20 flex items-center justify-between bg-zinc-900/95 backdrop-blur-md px-4 py-2 border-b border-zinc-700">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            show.color === 'emerald'
                              ? 'bg-emerald-400'
                              : show.color === 'amber'
                              ? 'bg-amber-400'
                              : 'bg-indigo-400'
                          }`}
                        />
                        <h4 className="text-sm font-bold text-white">{show.title}</h4>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          ({show.broadcastSchedule})
                        </span>
                      </div>
                    </div>

                    {breakNumbers.map((breakNum) => {
                      const theme = breakTheme(breakNum);
                      const breakAds = showAds
                        .filter((a) => a.breakNumber === breakNum)
                        .sort((a, b) => a.slotIndex - b.slotIndex);

                      return (
                        <div
                          key={breakNum}
                          className={`flex flex-col border-y-2 ${theme.accent}`}
                        >
                          <div className="flex border-b border-zinc-800/80 min-h-[2px]">
                            <div
                              style={labelColumnStyle()}
                              className={`box-border shrink-0 sticky left-0 z-[19] px-4 py-2 flex items-center gap-2 border-r border-zinc-800 ${theme.header}`}
                            >
                              <Layers className="w-4 h-4 shrink-0 opacity-90" />
                              <span className="text-sm font-black uppercase tracking-wide">
                                {theme.label}
                              </span>
                              <span className="text-xs font-mono opacity-80">
                                {breakAds.length} spot(s) ·{' '}
                                {breakAds.reduce((s, a) => s + a.durationSec, 0)}s
                              </span>
                            </div>
                            <div
                              style={timelineTrackStyle(totalTimelineWidth)}
                              className="relative shrink-0 h-full min-h-[36px]"
                            />
                          </div>

                          {breakAds.length === 0 ? (
                            <div className="flex h-12 border-b border-zinc-800/80">
                              <div
                                style={labelColumnStyle()}
                                className="box-border shrink-0 sticky left-0 z-10 px-4 flex items-center text-sm text-zinc-500 italic bg-zinc-950 border-r border-zinc-800"
                              >
                                Empty commercial break
                              </div>
                              <div style={timelineTrackStyle(totalTimelineWidth)} className="relative shrink-0" />
                            </div>
                          ) : null}

                          {breakAds.map((ad) => {
                      const barPos = calculateBarPixels(ad.startDate, ad.endDate);
                      const daysInfo = formatDaysRemainingText(ad.endDate, undefined, ad);
                      const isExpired = ad.status === 'expired';
                      const isExpiring = ad.status === 'expiring_soon';
                      const isTakenOff = !!ad.takenOffAt;

                      const laneTheme = breakTheme(ad.breakNumber);

                      return (
                        <div
                          key={ad.id}
                          className={`flex border-b border-zinc-800/80 hover:bg-black/10 transition-colors h-20 relative group/lane ${
                            isExpired ? 'bg-rose-950/20' : ''
                          } ${theme.lane}`}
                        >
                          {/* Left sticky card */}
                          <div
                            onClick={() => onSelectAd(ad)}
                            style={labelColumnStyle()}
                            className={`box-border shrink-0 p-3 border-r border-zinc-700 bg-zinc-950 sticky left-0 z-20 flex items-center justify-between cursor-pointer group-hover/lane:bg-zinc-900 transition-colors shadow-lg border-l-4 ${laneTheme.accent}`}
                          >
                            <div className="flex items-center space-x-3 overflow-hidden min-w-0 pr-2">
                              {/* Thumbnail */}
                              <div className="relative w-16 aspect-video rounded-xl overflow-hidden bg-black shrink-0 ring-1 ring-zinc-800 shadow">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={ad.frameGrabUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 font-mono text-[8px] text-zinc-300">
                                  {ad.durationSec}s
                                </span>
                              </div>

                              <div className="flex flex-col truncate min-w-0">
                                <span
                                  className={`text-[10px] font-mono font-bold ${laneTheme.slotTag}`}
                                >
                                  {laneTheme.label} &bull; Slot #{ad.slotIndex}
                                </span>
                                <h5 className="text-xs font-bold text-white truncate">
                                  {ad.title}
                                </h5>
                                <span className="text-[11px] text-zinc-400 truncate">
                                  {ad.advertiser}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
                                isTakenOff
                                  ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                  : daysInfo.badgeClass
                              }`}
                            >
                              {isExpired ? '🚨 PULL!' : daysInfo.text}
                            </span>
                          </div>

                          {/* Right timeline lane */}
                          <div
                            style={timelineTrackStyle(totalTimelineWidth)}
                            className="relative z-[1] h-full flex items-center p-2 shrink-0 overflow-hidden"
                          >
                            {/* Today line */}
                            {todayLeftPixel >= 0 && (
                              <div
                                style={{ left: `${todayLeftPixel + dayWidth / 2}px` }}
                                className="absolute top-0 bottom-0 w-0.5 bg-amber-400/60 z-10 pointer-events-none"
                              />
                            )}

                            {/* Bar */}
                            <div
                              onClick={() => onSelectAd(ad)}
                              style={{ left: `${barPos.left}px`, width: `${barPos.width}px` }}
                              className={`absolute z-[5] h-12 rounded-xl px-3 flex items-center justify-between cursor-pointer shadow-lg transition-all duration-200 hover:scale-[1.01] hover:z-20 border-2 select-none ${
                                isTakenOff
                                  ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500 line-through opacity-60'
                                  : isExpired
                                  ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-rose-500 text-rose-100 ring-2 ring-rose-500/50 shadow-rose-950/60'
                                  : isExpiring
                                  ? `bg-gradient-to-r from-amber-950/80 to-zinc-900 border-amber-500 text-amber-100 ${laneTheme.bar}`
                                  : `${laneTheme.bar} text-zinc-100`
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate min-w-0">
                                <span className="text-xs font-bold truncate text-white">
                                  {ad.title}
                                </span>
                                <span className="text-[10px] text-zinc-400">({ad.durationSec}s)</span>
                              </div>

                              <div className="shrink-0 ml-2">
                                <span
                                  className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                                    isExpired
                                      ? 'bg-rose-600 text-white'
                                      : isExpiring
                                      ? 'bg-amber-500 text-zinc-950'
                                      : 'bg-zinc-800 text-emerald-300'
                                  }`}
                                >
                                  {formatShortDate(ad.endDate)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
