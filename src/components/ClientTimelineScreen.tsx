'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Info,
  ChevronRight,
  Maximize2,
  SlidersHorizontal,
  ChevronLeft,
} from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import {
  formatDaysRemainingText,
  formatDateDisplay,
  formatShortDate,
  diffCalendarDays,
  toISODateString,
} from '@/lib/date-utils';
import {
  headerBroadcastColumnClass,
  isBroadcastDayOfWeek,
  unionBroadcastWeekdays,
  showBroadcastColumnClass,
} from '@/lib/broadcast-schedule';
import { GanttShowBroadcastOverlay } from '@/components/GanttBroadcastDayGrid';

interface ClientTimelineScreenProps {
  ads: CommercialAd[];
  shows: CommercialShow[];
  selectedShowId: string;
  onSelectShow: (showId: string) => void;
  onSelectAd: (ad: CommercialAd) => void;
  onOpenAdminPanel?: () => void;
}

// Break color scheme definitions to prevent visual blending
const BREAK_THEMES: Record<
  number,
  {
    borderAccent: string;
    headerBg: string;
    headerText: string;
    badgeBg: string;
    badgeText: string;
    laneTint: string;
    laneBorder: string;
    label: string;
  }
> = {
  1: {
    borderAccent: 'border-indigo-500',
    headerBg: 'bg-indigo-950/70',
    headerText: 'text-indigo-200',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
    laneTint: 'bg-indigo-950/10',
    laneBorder: 'border-indigo-900/40',
    label: 'Break 1',
  },
  2: {
    borderAccent: 'border-emerald-500',
    headerBg: 'bg-emerald-950/70',
    headerText: 'text-emerald-200',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    laneTint: 'bg-emerald-950/10',
    laneBorder: 'border-emerald-900/40',
    label: 'Break 2',
  },
  3: {
    borderAccent: 'border-amber-500',
    headerBg: 'bg-amber-950/70',
    headerText: 'text-amber-200',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-zinc-950',
    laneTint: 'bg-amber-950/10',
    laneBorder: 'border-amber-900/40',
    label: 'Break 3',
  },
  4: {
    borderAccent: 'border-purple-500',
    headerBg: 'bg-purple-950/70',
    headerText: 'text-purple-200',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    laneTint: 'bg-purple-950/10',
    laneBorder: 'border-purple-900/40',
    label: 'Break 4',
  },
  5: {
    borderAccent: 'border-cyan-500',
    headerBg: 'bg-cyan-950/70',
    headerText: 'text-cyan-200',
    badgeBg: 'bg-cyan-600',
    badgeText: 'text-zinc-950',
    laneTint: 'bg-cyan-950/10',
    laneBorder: 'border-cyan-900/40',
    label: 'Break 5',
  },
};

export function ClientTimelineScreen({
  ads,
  shows,
  selectedShowId,
  onSelectShow,
  onSelectAd,
  onOpenAdminPanel,
}: ClientTimelineScreenProps) {
  // Day column width: 72px (compact), 88px (standard), 110px (wide)
  const [dayWidth, setDayWidth] = useState<number>(88);
  const [statusFilter, setStatusFilter] = useState<'all' | 'urgent_only' | 'active_only'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Baseline reference today: 2026-10-31
  const todayStr = '2026-10-31';
  const todayDate = useMemo(() => new Date(todayStr + 'T00:00:00'), [todayStr]);

  // Timeline window: 12 days before today to 24 days after today (36 days total)
  const { timelineStartDate, dayList, weekHeaders } = useMemo(() => {
    const start = new Date(todayDate);
    start.setDate(start.getDate() - 12); // Monday 19 Oct 2026

    const days: {
      date: Date;
      dateStr: string;
      dayOfMonth: number;
      dayOfWeekName: string;
      dayOfWeek: number;
      isWeekend: boolean;
      isToday: boolean;
    }[] = [];

    const weeks: { weekLabel: string; spanDays: number; startIdx: number }[] = [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let currentWeekDays = 0;
    let currentWeekStart = 0;
    let currentWeekTitle = '';

    for (let i = 0; i < 36; i++) {
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

      // Group weeks
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
  }, [todayDate, todayStr]);

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

  // Urgent counts
  const expiredCount = useMemo(
    () => ads.filter((a) => !a.takenOffAt && a.status === 'expired').length,
    [ads]
  );
  const expiringSoonCount = useMemo(
    () => ads.filter((a) => !a.takenOffAt && a.status === 'expiring_soon').length,
    [ads]
  );
  const activeCount = useMemo(
    () => ads.filter((a) => !a.takenOffAt && a.status === 'active').length,
    [ads]
  );

  // Position calculation for timeline bar (FULL FLIGHT CONTINUOUS BAR)
  const calculateBarPixels = (startDateStr: string, endDateStr: string) => {
    const startDiff = diffCalendarDays(timelineStartStr, startDateStr);
    const durationDays = Math.max(1, diffCalendarDays(startDateStr, endDateStr) + 1);

    const rawLeft = startDiff * dayWidth;
    const rawWidth = durationDays * dayWidth;
    const rawRight = rawLeft + rawWidth;

    // Visible clamp within ruler:
    const visibleLeft = Math.max(0, rawLeft);
    const visibleWidth = Math.max(120, rawRight - visibleLeft);
    const startedBeforeWindow = rawLeft < 0;

    return { rawLeft, rawWidth, visibleLeft, visibleWidth, startedBeforeWindow, durationDays };
  };

  const todayLeftPixel = useMemo(() => {
    const diff = diffCalendarDays(timelineStartStr, todayStr);
    return diff * dayWidth;
  }, [timelineStartStr, todayStr, dayWidth]);

  // Center timeline on TODAY on initial mount
  useEffect(() => {
    if (scrollContainerRef.current && todayLeftPixel >= 0) {
      const containerWidth = scrollContainerRef.current.clientWidth || 1000;
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, todayLeftPixel - containerWidth / 3),
        behavior: 'smooth',
      });
    }
  }, [todayLeftPixel]);

  const scrollToToday = () => {
    if (scrollContainerRef.current && todayLeftPixel >= 0) {
      const containerWidth = scrollContainerRef.current.clientWidth || 1000;
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, todayLeftPixel - containerWidth / 3),
        behavior: 'smooth',
      });
    }
  };

  const currentShow = shows.find((s) => s.id === selectedShowId);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans select-none">
      {/* ========================================================================= */}
      {/* 1. CLIENT HEADER: DEDICATED PRESENTATION PORTAL (NO EDITING IN THIS VIEW) */}
      {/* ========================================================================= */}
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 shrink-0">
        <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Branding & Show Picker */}
          <div className="flex items-center space-x-4 overflow-hidden">
            <div className="flex items-center space-x-3 shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/20 ring-1 ring-white/10">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Instant Productions
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 font-mono font-bold border border-indigo-800/60 shadow-sm">
                    PORTAL KLIENTA (TIMELINE)
                  </span>
                </div>
                <h1 className="text-sm font-bold text-white flex items-center space-x-1.5">
                  <span>Commercial broadcast schedule</span>
                </h1>
              </div>
            </div>

            {/* Read-only Show Selector Tabs */}
            <div className="hidden sm:flex items-center space-x-1 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <button
                onClick={() => onSelectShow('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedShowId === 'all'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All programmes ({shows.length})
              </button>

              {shows.map((show) => {
                const isSelected = selectedShowId === show.id;
                return (
                  <button
                    key={show.id}
                    onClick={() => onSelectShow(show.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                      isSelected
                        ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        show.color === 'emerald'
                          ? 'bg-emerald-400'
                          : show.color === 'amber'
                          ? 'bg-amber-400'
                          : 'bg-indigo-400'
                      }`}
                    />
                    <span className="truncate max-w-[150px]">{show.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Urgent Status Notice & Admin Switcher */}
          <div className="flex items-center space-x-3 shrink-0">
            {expiredCount > 0 && (
              <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-black animate-pulse shadow-lg shadow-rose-950/40">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{expiredCount} to pull from schedule!</span>
              </div>
            )}

            {expiringSoonCount > 0 && (
              <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{expiringSoonCount} expiring soon</span>
              </div>
            )}

            {/* Quick Switch to Full Management / Admin Panel */}
            {onOpenAdminPanel && (
              <button
                onClick={onOpenAdminPanel}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
                title="Open full admin management panel"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Management panel (Admin)</span>
              </button>
            )}
          </div>
        </div>

        {/* Subheader: Programme Broadcast Info & Filter Controls */}
        <div className="px-4 lg:px-6 h-12 border-t border-zinc-850 bg-zinc-950/90 flex items-center justify-between text-xs overflow-x-auto gap-4">
          {/* Current Show Broadcast Details */}
          <div className="flex items-center space-x-2 text-zinc-400 shrink-0">
            {currentShow ? (
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-white text-sm">{currentShow.title}</span>
                <span>&bull;</span>
                <span className="font-mono text-zinc-300">{currentShow.channel}</span>
                <span>&bull;</span>
                <span className="text-amber-400 font-bold font-mono">
                  {currentShow.broadcastSchedule}
                </span>
                <span>&bull;</span>
                <span className="text-indigo-400 font-semibold">
                  {currentShow.breakCount} bloki reklamowe
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-zinc-200 font-bold">Widok zbiorczy wszystkich pasm TV</span>
                <span>&bull;</span>
                <span className="text-zinc-400 font-mono">
                  {filteredAds.length} spots in schedules
                </span>
              </div>
            )}
          </div>

          {/* Timeline Jump & Scale Controls */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Quick Status Filter */}
            <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  statusFilter === 'all'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All ({ads.length})
              </button>
              <button
                onClick={() => setStatusFilter('urgent_only')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center space-x-1 ${
                  statusFilter === 'urgent_only'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-rose-400 hover:text-rose-200'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Pull ({expiredCount + expiringSoonCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('active_only')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  statusFilter === 'active_only'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-400 hover:text-emerald-200'
                }`}
              >
                Aktywne ({activeCount})
              </button>
            </div>

            {/* Jump to Today Button */}
            <button
              onClick={scrollToToday}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-extrabold transition-all active:scale-95 shadow-md shadow-amber-950/40"
              title="Scroll to today on timeline"
            >
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>TODAY (31 Oct)</span>
            </button>

            {/* Scale Switcher */}
            <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-500 font-bold px-1.5">SKALA:</span>
              {[
                { label: 'Compact', width: 72 },
                { label: 'Standard (88px)', width: 88 },
                { label: 'Wide (110px)', width: 110 },
              ].map((z) => (
                <button
                  key={z.width}
                  onClick={() => setDayWidth(z.width)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
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
      </header>

      {/* ========================================================================= */}
      {/* 2. THE CLIENT TIMELINE CANVAS (FULL CONTINUOUS BARS & COLORED BREAKS)      */}
      {/* ========================================================================= */}
      <main className="flex-1 overflow-hidden flex flex-col bg-zinc-950 relative">
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative flex flex-col scroll-smooth"
        >
          {/* HEADER RULER (Sticky Top) */}
          <div
            style={{ width: `${440 + totalTimelineWidth}px` }}
            className="sticky top-0 z-30 flex bg-zinc-900 border-b border-zinc-800 shrink-0 select-none shadow-2xl"
          >
            {/* Left Header: Sticky Commercial Details Card Header */}
            <div className="w-[440px] shrink-0 p-3.5 border-r border-zinc-800 bg-zinc-900 flex items-center justify-between sticky left-0 z-40 shadow-xl">
              <div className="flex items-center space-x-2">
                <Tv className="w-4 h-4 text-indigo-400" />
                <span className="font-extrabold text-xs uppercase tracking-wider text-zinc-100">
                  Break & ad card
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">
                Pull by / status
              </span>
            </div>

            {/* Right Header: Calendar Ruler with Months & Days */}
            <div style={{ width: `${totalTimelineWidth}px` }} className="flex flex-col relative shrink-0">
              {/* Month / Week Labels */}
              <div className="flex h-6 border-b border-zinc-800/80 bg-zinc-950/70 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {weekHeaders.map((w, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${w.spanDays * dayWidth}px` }}
                    className="shrink-0 px-3 border-r border-zinc-800/60 flex items-center justify-between text-indigo-300"
                  >
                    <span>{w.weekLabel}</span>
                    <span className="text-zinc-500 font-mono text-[9px]">
                      {w.spanDays} days
                    </span>
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              <div className="flex h-12 relative border-b border-zinc-800/80">
                {dayList.map((day, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${dayWidth}px` }}
                    className={`shrink-0 border-r border-zinc-800/50 flex flex-col items-center justify-center transition-colors relative ${
                      day.isToday
                        ? 'bg-amber-400/20 text-amber-200 font-black'
                        : day.isWeekend
                        ? 'bg-zinc-950/60 text-zinc-500'
                        : 'text-zinc-300'
                    } ${headerBroadcastColumnClass(headerBroadcastDays.has(day.dayOfWeek))}`}
                  >
                    {headerBroadcastDays.has(day.dayOfWeek) && (
                      <span
                        className="absolute top-0.5 right-0.5 text-[7px] font-black uppercase text-violet-300/90"
                        title="Dzień emisji programu"
                      >
                        TX
                      </span>
                    )}
                    <span className="text-[10px] font-semibold uppercase opacity-80">
                      {day.dayOfWeekName}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold leading-tight ${
                        day.isToday
                          ? 'px-2 py-0.5 rounded-md bg-amber-400 text-zinc-950 shadow-md font-black'
                          : ''
                      }`}
                    >
                      {day.dayOfMonth}
                    </span>
                  </div>
                ))}

                {/* Persistent Today Vertical Indicator Line on Ruler */}
                {todayLeftPixel >= 0 && (
                  <div
                    style={{ left: `${todayLeftPixel + dayWidth / 2}px` }}
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-30 shadow-[0_0_12px_rgba(251,191,36,0.9)] pointer-events-none"
                  >
                    <div className="absolute top-1 -translate-x-1/2 bg-amber-400 text-zinc-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-lg tracking-wide">
                      TODAY
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BODY: TIMELINE ROWS (Grouped by Show & Commercial Break with Distinct Color Separation) */}
          <div style={{ width: `${440 + totalTimelineWidth}px` }} className="flex flex-col">
            {filteredShows.map((show) => {
              const showAds = filteredAds.filter((a) => a.showId === show.id);
              const breakNumbers = Array.from({ length: show.breakCount }, (_, i) => i + 1);

              return (
                <div key={show.id} className="relative flex flex-col border-b-4 border-zinc-800/80">
                  <div
                    className="absolute top-0 bottom-0 z-[1] flex pointer-events-none"
                    style={{ left: 440, width: totalTimelineWidth }}
                  >
                    <GanttShowBroadcastOverlay
                      dayList={dayList}
                      dayWidth={dayWidth}
                      show={show}
                    />
                  </div>
                  {/* Show Group Header (Distinct Bar) */}
                  <div className="sticky left-0 z-20 flex items-center justify-between bg-zinc-900/95 backdrop-blur-md px-5 py-3 border-b border-zinc-800">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`w-4 h-4 rounded-full ring-4 ${
                          show.color === 'emerald'
                            ? 'bg-emerald-400 ring-emerald-500/20'
                            : show.color === 'amber'
                            ? 'bg-amber-400 ring-amber-500/20'
                            : 'bg-indigo-400 ring-indigo-500/20'
                        }`}
                      />
                      <h3 className="text-base font-extrabold text-white tracking-wide">
                        {show.title}
                      </h3>
                      <span className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 font-mono font-medium">
                        {show.channel} &bull; {show.broadcastSchedule}
                      </span>
                    </div>

                    <span className="text-xs text-zinc-400 font-semibold pr-4">
                      {showAds.length} {showAds.length === 1 ? 'spot in schedule' : 'spots in schedule'}
                    </span>
                  </div>

                  {/* Commercial Breaks (Each Break has distinct Color Theme!) */}
                  {breakNumbers.map((breakNum) => {
                    const breakAds = showAds.filter((a) => a.breakNumber === breakNum);
                    const theme = BREAK_THEMES[breakNum] || BREAK_THEMES[1];
                    const totalDuration = breakAds.reduce((sum, a) => sum + a.durationSec, 0);

                    return (
                      <div
                        key={breakNum}
                        className={`flex flex-col border-b-2 border-zinc-850 ${theme.borderAccent} border-l-4`}
                      >
                        {/* ======================================================== */}
                        {/* BREAK HEADER BAR: Spans across BOTH Left & Timeline!      */}
                        {/* ======================================================== */}
                        <div
                          style={{ width: `${440 + totalTimelineWidth}px` }}
                          className={`flex items-center ${theme.headerBg} border-b border-zinc-800/80 py-2.5 px-4 text-xs font-bold ${theme.headerText}`}
                        >
                          {/* Sticky left break title */}
                          <div className="w-[440px] shrink-0 sticky left-0 z-10 flex items-center justify-between pr-4">
                            <div className="flex items-center space-x-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} font-mono font-black text-[11px] shadow-sm`}
                              >
                                BLOK {breakNum}
                              </span>
                              <span className="font-extrabold uppercase tracking-wide text-white">
                                {theme.label}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-300">
                              <span>
                                {breakAds.length} {breakAds.length === 1 ? 'spot' : 'spoty'}
                              </span>
                              <span>&bull;</span>
                              <span className="font-bold text-white">{totalDuration}s total</span>
                            </div>
                          </div>

                          {/* Right break separator line spanning across timeline */}
                          <div className="flex-1 flex items-center pl-4 opacity-60">
                            <div className="h-0.5 w-full bg-gradient-to-r from-zinc-700 via-zinc-800 to-transparent rounded" />
                          </div>
                        </div>

                        {/* Each Ad in this Break */}
                        {breakAds.length === 0 ? (
                          <div className="flex items-center h-14 border-b border-zinc-850/40 text-xs text-zinc-600 pl-8 italic">
                            No spots scheduled in this commercial break
                          </div>
                        ) : (
                          breakAds.map((ad) => {
                            const barPos = calculateBarPixels(ad.startDate, ad.endDate);
                            const daysInfo = formatDaysRemainingText(ad.endDate, undefined, ad);
                            const isExpired = ad.status === 'expired';
                            const isExpiring = ad.status === 'expiring_soon';
                            const isTakenOff = !!ad.takenOffAt;

                            return (
                              <div
                                key={ad.id}
                                className={`flex border-b border-zinc-850/60 hover:bg-zinc-900/60 transition-colors h-24 relative group/lane ${
                                  theme.laneTint
                                } ${isExpired ? 'bg-rose-950/25 ring-1 ring-rose-500/20' : ''}`}
                              >
                                {/* ======================================================== */}
                                {/* LEFT STICKY CARD: SPOT DETAILS                           */}
                                {/* ======================================================== */}
                                <div
                                  onClick={() => onSelectAd(ad)}
                                  className="w-[440px] shrink-0 p-3.5 border-r border-zinc-800 bg-zinc-950/95 sticky left-0 z-20 flex items-center justify-between cursor-pointer group-hover/lane:bg-zinc-900 transition-colors shadow-2xl"
                                >
                                  {/* Thumbnail & Title/Info */}
                                  <div className="flex items-center space-x-3.5 overflow-hidden min-w-0 pr-3">
                                    {/* Video Frame Grab Preview (16:9) */}
                                    <div className="relative w-24 aspect-video rounded-xl overflow-hidden bg-black shrink-0 ring-1 ring-zinc-800 shadow-md">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={ad.frameGrabUrl}
                                        alt={ad.title}
                                        className="w-full h-full object-cover transition-transform group-hover/lane:scale-105"
                                      />
                                      {/* Play Button Overlay */}
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/lane:bg-black/20 transition-colors">
                                        <div className="w-7 h-7 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow">
                                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                        </div>
                                      </div>
                                      {/* Duration Badge */}
                                      <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 font-mono text-[9px] font-bold text-white shadow">
                                        {ad.durationSec}s
                                      </span>
                                    </div>

                                    {/* Title, Advertiser, Slot */}
                                    <div className="flex flex-col truncate min-w-0">
                                      <div className="flex items-center space-x-1.5 mb-0.5">
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-850 text-indigo-300 font-bold border border-zinc-750">
                                          Slot #{ad.slotIndex}
                                        </span>
                                      </div>

                                      <h4 className="text-xs font-bold text-zinc-100 truncate group-hover/lane:text-indigo-300 transition-colors">
                                        {ad.title}
                                      </h4>

                                      <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                                        <span className="text-zinc-300 font-medium">{ad.advertiser}</span>
                                      </div>

                                      {ad.eventDate && (
                                        <span className="text-[10px] text-amber-400 truncate font-semibold">
                                          {ad.eventDate}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right side of details column: Exact Expiry Date & Countdown Badge */}
                                  <div className="shrink-0 flex flex-col items-end justify-center space-y-1">
                                    <span
                                      className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-xl border shadow-sm whitespace-nowrap ${
                                        isTakenOff
                                          ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                          : daysInfo.badgeClass
                                      }`}
                                    >
                                      {isTakenOff
                                        ? 'Pulled from schedule'
                                        : isExpired
                                        ? '🚨 ZDEJMIJ!'
                                        : daysInfo.text}
                                    </span>

                                    <span className="text-[10px] text-zinc-400 font-mono">
                                      Do: <b className={isExpired ? 'text-rose-400' : 'text-zinc-200'}>{formatDateDisplay(ad.endDate)}</b>
                                    </span>
                                  </div>
                                </div>

                                {/* ======================================================== */}
                                {/* RIGHT SIDE: FULL FLIGHT TIMELINE BAR (NO INCOMPLETE BARS) */}
                                {/* ======================================================== */}
                                <div
                                  style={{ width: `${totalTimelineWidth}px` }}
                                  className="relative h-full flex items-center p-3 shrink-0 overflow-hidden"
                                >
                                  {/* Grid Day Lines */}
                                  <div className="absolute inset-0 flex pointer-events-none">
                                    {dayList.map((day, idx) => (
                                      <div
                                        key={idx}
                                        style={{ width: `${dayWidth}px` }}
                                        className={`shrink-0 border-r border-zinc-850/40 ${
                                          isBroadcastDayOfWeek(day.dayOfWeek, show.broadcastSchedule)
                                            ? showBroadcastColumnClass(show.color, true)
                                            : day.isToday
                                            ? 'bg-amber-400/5'
                                            : day.isWeekend
                                            ? 'bg-zinc-950/40'
                                            : ''
                                        }`}
                                      />
                                    ))}
                                  </div>

                                  {/* Today vertical line spanning canvas */}
                                  {todayLeftPixel >= 0 && (
                                    <div
                                      style={{ left: `${todayLeftPixel + dayWidth / 2}px` }}
                                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400/90 z-20 pointer-events-none shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                                    />
                                  )}

                                  {/* FULL TIMELINE FLIGHT BAR */}
                                  <div
                                    onClick={() => onSelectAd(ad)}
                                    style={{
                                      left: `${barPos.visibleLeft}px`,
                                      width: `${barPos.visibleWidth}px`,
                                    }}
                                    className={`absolute h-14 rounded-2xl px-3 flex items-center justify-between cursor-pointer shadow-xl transition-all duration-200 hover:scale-[1.008] hover:z-30 border select-none ${
                                      isTakenOff
                                        ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500 line-through opacity-60'
                                        : isExpired
                                        ? 'bg-gradient-to-r from-rose-900 via-rose-800 to-rose-950 border-2 border-rose-400 text-white shadow-rose-950/80 ring-2 ring-rose-500/50 animate-pulse'
                                        : isExpiring
                                        ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 border-2 border-amber-300 text-zinc-950 font-bold shadow-amber-950/60'
                                        : 'bg-gradient-to-r from-emerald-800 via-emerald-900 to-zinc-900 border-2 border-emerald-400 hover:border-emerald-300 text-white shadow-emerald-950/50'
                                    }`}
                                  >
                                    {/* Bar Left: Poster + Title + Start notice */}
                                    <div className="flex items-center space-x-2.5 truncate min-w-0 pr-3">
                                      {barPos.startedBeforeWindow && (
                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-zinc-300 shrink-0 font-bold">
                                          ◀ Od {formatShortDate(ad.startDate)}
                                        </span>
                                      )}

                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={ad.frameGrabUrl}
                                        alt=""
                                        className="w-10 aspect-video rounded-lg object-cover ring-1 ring-white/20 shrink-0 shadow"
                                      />
                                      <div className="flex flex-col truncate leading-tight">
                                        <div className="flex items-center space-x-2 truncate">
                                          <span className="text-xs font-black truncate text-white drop-shadow">
                                            {ad.title}
                                          </span>
                                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/60 text-zinc-200 font-mono font-bold shrink-0">
                                            {ad.durationSec}s
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-zinc-200/90 truncate font-mono">
                                          Emisja: {formatShortDate(ad.startDate)} &rarr;{' '}
                                          <b className="text-white font-black underline">
                                            {formatShortDate(ad.endDate)}
                                          </b>{' '}
                                          ({barPos.durationDays} days on schedule)
                                        </span>
                                      </div>
                                    </div>

                                    {/* Bar Right: Deadline Badge */}
                                    <div className="shrink-0 ml-3">
                                      <div
                                        className={`px-3 py-1 rounded-xl font-mono text-[10px] font-black uppercase flex items-center space-x-1.5 shadow-lg ${
                                          isExpired
                                            ? 'bg-rose-600 text-white animate-bounce ring-2 ring-white/30'
                                            : isExpiring
                                            ? 'bg-zinc-950 text-amber-300 border border-amber-400'
                                            : 'bg-zinc-950 text-emerald-300 border border-emerald-400'
                                        }`}
                                      >
                                        {isExpired ? (
                                          <>
                                            <AlertTriangle className="w-3.5 h-3.5 text-white fill-current" />
                                            <span>DEADLINE PASSED!</span>
                                          </>
                                        ) : (
                                          <span>{daysInfo.text}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
