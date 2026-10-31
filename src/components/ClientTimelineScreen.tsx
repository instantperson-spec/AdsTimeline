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

interface ClientTimelineScreenProps {
  ads: CommercialAd[];
  shows: CommercialShow[];
  selectedShowId: string;
  onSelectShow: (showId: string) => void;
  onSelectAd: (ad: CommercialAd) => void;
  onOpenAdminPanel?: () => void;
}

// Clean, elegant break pill styles (subtle and refined, NEVER garish neon)
const BREAK_PILL_STYLES: Record<number, { dot: string; text: string; bg: string }> = {
  1: { dot: 'bg-indigo-400', text: 'text-indigo-300', bg: 'bg-indigo-950/40 border-indigo-800/50' },
  2: { dot: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-950/40 border-emerald-800/50' },
  3: { dot: 'bg-amber-400', text: 'text-amber-300', bg: 'bg-amber-950/40 border-amber-800/50' },
  4: { dot: 'bg-purple-400', text: 'text-purple-300', bg: 'bg-purple-950/40 border-purple-800/50' },
  5: { dot: 'bg-cyan-400', text: 'text-cyan-300', bg: 'bg-cyan-950/40 border-cyan-800/50' },
};

export function ClientTimelineScreen({
  ads,
  shows,
  selectedShowId,
  onSelectShow,
  onSelectAd,
  onOpenAdminPanel,
}: ClientTimelineScreenProps) {
  // Day column width: 68px (compact), 84px (standard), 104px (roomy)
  const [dayWidth, setDayWidth] = useState<number>(84);
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
      isWeekend: boolean;
      isToday: boolean;
    }[] = [];

    const weeks: { weekLabel: string; spanDays: number; startIdx: number }[] = [];

    const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];
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
        currentWeekTitle = d.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
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

  // Position calculation for sleek timeline capsule
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
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans select-none">
      {/* ========================================================================= */}
      {/* 1. SUB-BAR: PROGRAMME SCHEDULE & TIMELINE CONTROLS                         */}
      {/* ========================================================================= */}
      <div className="px-4 lg:px-6 h-12 border-b border-zinc-850 bg-zinc-900/60 flex items-center justify-between text-xs overflow-x-auto gap-4 shrink-0">
        {/* Left: Programme Broadcast Details */}
        <div className="flex items-center space-x-2 text-zinc-400 shrink-0">
          {currentShow ? (
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-white text-xs">{currentShow.title}</span>
              <span>&bull;</span>
              <span className="font-mono text-zinc-300">{currentShow.channel}</span>
              <span>&bull;</span>
              <span className="text-amber-400 font-bold font-mono">
                {currentShow.broadcastSchedule}
              </span>
              <span>&bull;</span>
              <span className="text-zinc-400">
                {currentShow.breakCount} przerwy w odcinku
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-zinc-200 font-bold">Wszystkie programy</span>
              <span>&bull;</span>
              <span className="text-zinc-400 font-mono">
                {filteredAds.length} spotów zaplanowanych w ramówkach
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Jump & Day Width Zoom */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                statusFilter === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Wszystkie ({ads.length})
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
              <span>Do zdjęcia ({expiredCount + expiringSoonCount})</span>
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
            className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold transition-all active:scale-95 shadow-sm"
            title="Przewiń oś do dzisiejszego dnia"
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span>Skocz do DZIŚ (31 Paź)</span>
          </button>

          {/* Scale Switcher */}
          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-bold px-1.5">SKALA:</span>
            {[
              { label: 'Kompaktowa', width: 68 },
              { label: 'Standard', width: 84 },
              { label: 'Szeroka', width: 104 },
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

      {/* ========================================================================= */}
      {/* 2. THE TIMELINE CANVAS: SLEEK, REFINED, SUBTLE (NO AGGRESSIVE NEON WALLS)  */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-hidden flex flex-col bg-zinc-950 relative">
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative flex flex-col scroll-smooth"
        >
          {/* HEADER RULER (Sticky Top) */}
          <div
            style={{ width: `${380 + totalTimelineWidth}px` }}
            className="sticky top-0 z-30 flex bg-zinc-900 border-b border-zinc-800 shrink-0 select-none shadow-md"
          >
            {/* Left Header: Commercial Spot Column */}
            <div className="w-[380px] shrink-0 p-3 border-r border-zinc-800 bg-zinc-900 flex items-center justify-between sticky left-0 z-40 shadow-lg">
              <div className="flex items-center space-x-2">
                <Tv className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-bold text-xs uppercase tracking-wider text-zinc-200">
                  Spot & Przypisanie do pasma
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-semibold">
                Status / Termin
              </span>
            </div>

            {/* Right Header: Calendar Ruler with Months & Days */}
            <div style={{ width: `${totalTimelineWidth}px` }} className="flex flex-col relative shrink-0">
              {/* Month / Week Labels */}
              <div className="flex h-5 border-b border-zinc-800/60 bg-zinc-950/60 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {weekHeaders.map((w, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${w.spanDays * dayWidth}px` }}
                    className="shrink-0 px-2.5 border-r border-zinc-800/40 flex items-center justify-between text-indigo-300 font-mono text-[9px]"
                  >
                    <span>{w.weekLabel}</span>
                    <span className="text-zinc-600">{w.spanDays}d</span>
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              <div className="flex h-11 relative">
                {dayList.map((day, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${dayWidth}px` }}
                    className={`shrink-0 border-r border-zinc-850/40 flex flex-col items-center justify-center transition-colors relative ${
                      day.isToday
                        ? 'bg-amber-400/15 text-amber-200 font-black'
                        : day.isWeekend
                        ? 'bg-zinc-950/40 text-zinc-500'
                        : 'text-zinc-400'
                    }`}
                  >
                    <span className="text-[9px] font-medium uppercase opacity-80">
                      {day.dayOfWeekName}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold leading-tight ${
                        day.isToday
                          ? 'px-1.5 py-0.2 rounded bg-amber-400 text-zinc-950 shadow font-black'
                          : ''
                      }`}
                    >
                      {day.dayOfMonth}
                    </span>
                  </div>
                ))}

                {/* Persistent Today Vertical Indicator Needle */}
                {todayLeftPixel >= 0 && (
                  <div
                    style={{ left: `${todayLeftPixel + dayWidth / 2}px` }}
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-30 shadow-[0_0_8px_rgba(251,191,36,0.8)] pointer-events-none"
                  >
                    <div className="absolute top-0.5 -translate-x-1/2 bg-amber-400 text-zinc-950 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase shadow">
                      DZIŚ
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BODY: TIMELINE ROWS (Grouped by Show & Commercial Break) */}
          <div style={{ width: `${380 + totalTimelineWidth}px` }} className="flex flex-col">
            {filteredShows.map((show) => {
              const showAds = filteredAds.filter((a) => a.showId === show.id);
              const breakNumbers = Array.from({ length: show.breakCount }, (_, i) => i + 1);

              return (
                <div key={show.id} className="flex flex-col border-b-2 border-zinc-800">
                  {/* Show Group Header (Clean section banner) */}
                  <div className="sticky left-0 z-20 flex items-center justify-between bg-zinc-900/90 backdrop-blur-sm px-4 py-2 border-b border-zinc-800">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          show.color === 'emerald'
                            ? 'bg-emerald-400'
                            : show.color === 'amber'
                            ? 'bg-amber-400'
                            : 'bg-indigo-400'
                        }`}
                      />
                      <h3 className="text-xs font-extrabold text-white tracking-wide uppercase">
                        {show.title}
                      </h3>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        ({show.channel} &bull; {show.broadcastSchedule})
                      </span>
                    </div>

                    <span className="text-[11px] text-zinc-400 font-mono pr-4">
                      {showAds.length} {showAds.length === 1 ? 'spot' : 'spoty'} w ramówce
                    </span>
                  </div>

                  {/* Commercial Breaks */}
                  {breakNumbers.map((breakNum) => {
                    const breakAds = showAds.filter((a) => a.breakNumber === breakNum);
                    const pillStyle = BREAK_PILL_STYLES[breakNum] || BREAK_PILL_STYLES[1];
                    const totalDuration = breakAds.reduce((sum, a) => sum + a.durationSec, 0);

                    return (
                      <div key={breakNum} className="flex flex-col">
                        {/* Clean Break Sub-header (Distinct without being garish) */}
                        <div
                          style={{ width: `${380 + totalTimelineWidth}px` }}
                          className="flex items-center bg-zinc-900/40 border-b border-zinc-800/60 py-1.5 px-4 text-xs"
                        >
                          {/* Sticky left break title */}
                          <div className="w-[380px] shrink-0 sticky left-0 z-10 flex items-center justify-between pr-4">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${pillStyle.bg} ${pillStyle.text}`}
                              >
                                Przerwa {breakNum}
                              </span>
                              <span className="text-[11px] text-zinc-400 font-mono">
                                {breakAds.length} {breakAds.length === 1 ? 'spot' : 'spoty'} &bull; {totalDuration}s
                              </span>
                            </div>
                          </div>

                          {/* Subtle ruler separator line */}
                          <div className="flex-1 flex items-center pl-4 opacity-40">
                            <div className="h-px w-full bg-zinc-800" />
                          </div>
                        </div>

                        {/* Spot Rows */}
                        {breakAds.length === 0 ? (
                          <div className="flex items-center h-12 border-b border-zinc-850/40 text-xs text-zinc-600 pl-6 italic">
                            Brak zaplanowanych spotów w tym bloku
                          </div>
                        ) : (
                          breakAds.map((ad) => {
                            const barPos = calculateBarPixels(ad.startDate, ad.endDate);
                            const daysInfo = formatDaysRemainingText(ad.endDate);
                            const isExpired = ad.status === 'expired';
                            const isExpiring = ad.status === 'expiring_soon';
                            const isTakenOff = !!ad.takenOffAt;

                            return (
                              <div
                                key={ad.id}
                                className={`flex border-b border-zinc-850/50 hover:bg-zinc-900/40 transition-colors h-16 relative group/lane ${
                                  isExpired ? 'bg-rose-950/10' : ''
                                }`}
                              >
                                {/* ======================================================== */}
                                {/* LEFT STICKY CARD: CLEAN, ELEGANT METADATA                */}
                                {/* ======================================================== */}
                                <div
                                  onClick={() => onSelectAd(ad)}
                                  className="w-[380px] shrink-0 p-2.5 border-r border-zinc-800 bg-zinc-950/95 sticky left-0 z-20 flex items-center justify-between cursor-pointer group-hover/lane:bg-zinc-900 transition-colors shadow-md"
                                >
                                  <div className="flex items-center space-x-2.5 overflow-hidden min-w-0 pr-2">
                                    {/* Thumbnail (clean 16:9) */}
                                    <div className="relative w-16 aspect-video rounded-lg overflow-hidden bg-black shrink-0 ring-1 ring-zinc-800 shadow-sm">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={ad.frameGrabUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/30 group-hover/lane:bg-black/10 flex items-center justify-center transition-colors">
                                        <Play className="w-3 h-3 text-white fill-current opacity-80" />
                                      </div>
                                      <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 font-mono text-[8px] text-zinc-300">
                                        {ad.durationSec}s
                                      </span>
                                    </div>

                                    {/* Text Info */}
                                    <div className="flex flex-col truncate min-w-0 leading-tight">
                                      <div className="flex items-center space-x-1.5 mb-0.5">
                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-850 text-indigo-300 font-bold border border-zinc-750">
                                          Slot #{ad.slotIndex}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 truncate">
                                          {ad.advertiser}
                                        </span>
                                      </div>

                                      <h4 className="text-xs font-bold text-zinc-100 truncate group-hover/lane:text-indigo-300 transition-colors">
                                        {ad.title}
                                      </h4>
                                    </div>
                                  </div>

                                  {/* Right side of details column: Expiry Badge */}
                                  <div className="shrink-0 flex flex-col items-end justify-center space-y-0.5 pl-1">
                                    <span
                                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg border whitespace-nowrap shadow-sm ${
                                        isTakenOff
                                          ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                          : daysInfo.badgeClass
                                      }`}
                                    >
                                      {isTakenOff
                                        ? 'Zdjęta'
                                        : isExpired
                                        ? '🚨 ZDEJMIJ!'
                                        : daysInfo.text}
                                    </span>
                                    <span className="text-[9px] font-mono text-zinc-500">
                                      Do: {formatShortDate(ad.endDate)}
                                    </span>
                                  </div>
                                </div>

                                {/* ======================================================== */}
                                {/* RIGHT SIDE: SLEEK TIMELINE CAPSULE (REFINED & CALM)       */}
                                {/* ======================================================== */}
                                <div
                                  style={{ width: `${totalTimelineWidth}px` }}
                                  className="relative h-full flex items-center p-2 shrink-0 overflow-hidden"
                                >
                                  {/* Grid Day Lines (Subtle) */}
                                  <div className="absolute inset-0 flex pointer-events-none">
                                    {dayList.map((day, idx) => (
                                      <div
                                        key={idx}
                                        style={{ width: `${dayWidth}px` }}
                                        className={`shrink-0 border-r border-zinc-850/30 ${
                                          day.isToday
                                            ? 'bg-amber-400/5'
                                            : day.isWeekend
                                            ? 'bg-zinc-950/30'
                                            : ''
                                        }`}
                                      />
                                    ))}
                                  </div>

                                  {/* Today vertical line */}
                                  {todayLeftPixel >= 0 && (
                                    <div
                                      style={{ left: `${todayLeftPixel + dayWidth / 2}px` }}
                                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-20 pointer-events-none"
                                    />
                                  )}

                                  {/* SLEEK TIMELINE CAPSULE (Height 36px, refined rounded-xl, never neon-solid) */}
                                  <div
                                    onClick={() => onSelectAd(ad)}
                                    style={{
                                      left: `${barPos.visibleLeft}px`,
                                      width: `${barPos.visibleWidth}px`,
                                    }}
                                    className={`absolute h-9 rounded-xl px-2.5 flex items-center justify-between cursor-pointer transition-all duration-150 hover:scale-[1.005] hover:z-30 border select-none ${
                                      isTakenOff
                                        ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500 line-through opacity-60'
                                        : isExpired
                                        ? 'bg-rose-950/70 border-rose-500 text-rose-100 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/40'
                                        : isExpiring
                                        ? 'bg-amber-950/60 border-amber-500/80 text-amber-100 shadow-sm'
                                        : 'bg-zinc-900/90 border-zinc-700/80 hover:border-indigo-400 text-zinc-200 shadow-sm'
                                    }`}
                                  >
                                    {/* Left within capsule: indicator + mini thumbnail + title */}
                                    <div className="flex items-center space-x-2 truncate min-w-0 pr-2">
                                      {barPos.startedBeforeWindow && (
                                        <span className="text-[9px] font-mono text-zinc-400 shrink-0 font-medium">
                                          &laquo; {formatShortDate(ad.startDate)}
                                        </span>
                                      )}

                                      <span className="text-xs font-semibold truncate text-white">
                                        {ad.title}
                                      </span>

                                      <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                                        ({ad.durationSec}s)
                                      </span>
                                    </div>

                                    {/* Right within capsule: End date pill */}
                                    <div className="shrink-0 ml-2 flex items-center space-x-1.5">
                                      <span
                                        className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold ${
                                          isExpired
                                            ? 'bg-rose-600 text-white'
                                            : isExpiring
                                            ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                                            : 'bg-zinc-800 text-zinc-300'
                                        }`}
                                      >
                                        Do: {formatShortDate(ad.endDate)}
                                      </span>
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
      </div>
    </div>
  );
}
