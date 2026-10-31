'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Search,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Tv,
  Film,
  Sparkles,
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
  showBroadcastColumnClass,
  unionBroadcastWeekdays,
} from '@/lib/broadcast-schedule';
import {
  GanttShowBroadcastOverlay,
  type GanttDayColumn,
} from '@/components/GanttBroadcastDayGrid';

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
  // Day column width zoom: compact (44px), standard (64px), expanded (84px)
  const [dayWidth, setDayWidth] = useState<number>(64);
  const [statusFilter, setStatusFilter] = useState<'all' | 'urgent_only' | 'active_only'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const todayColumnRef = useRef<HTMLDivElement | null>(null);

  // Baseline reference today: 2026-10-31
  const todayStr = '2026-10-31';
  const todayDate = useMemo(() => new Date(todayStr + 'T00:00:00'), [todayStr]);

  // Timeline span: 14 days before today to 28 days after today (Total: 42 days window)
  const { timelineStartDate, dayList, weekGroups } = useMemo(() => {
    const start = new Date(todayDate);
    start.setDate(start.getDate() - 12); // start on Monday 19 Oct 2026

    const days: (GanttDayColumn & {
      date: Date;
      dateStr: string;
      dayOfMonth: number;
      dayOfWeekName: string;
    })[] = [];
    const weeks: { weekLabel: string; spanDays: number }[] = [];

    let currentWeekNumber = -1;
    let currentWeekCount = 0;
    let currentWeekMonth = '';

    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);

      const dStr = toISODateString(d);
      const dayOfWeek = d.getDay(); // 0 Sunday, 1 Monday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = dStr === todayStr;

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      days.push({
        date: d,
        dateStr: dStr,
        dayOfMonth: d.getDate(),
        dayOfWeekName: dayNames[dayOfWeek],
        dayOfWeek,
        isWeekend,
        isToday,
      });

      // Calculate week groupings
      const monthName = d.toLocaleDateString('en-GB', { month: 'short' });
      if (dayOfWeek === 1 || i === 0) {
        if (currentWeekCount > 0) {
          weeks.push({
            weekLabel: `${currentWeekMonth} • Week`,
            spanDays: currentWeekCount,
          });
        }
        currentWeekCount = 1;
        currentWeekMonth = d.toLocaleDateString('en-GB', { month: 'long' });
      } else {
        currentWeekCount++;
      }
    }

    if (currentWeekCount > 0) {
      weeks.push({
        weekLabel: `${currentWeekMonth} • Week`,
        spanDays: currentWeekCount,
      });
    }

    return {
      timelineStartDate: start,
      dayList: days,
      weekGroups: weeks,
    };
  }, [todayDate, todayStr]);

  const timelineStartStr = toISODateString(timelineStartDate);
  const totalTimelineWidth = dayList.length * dayWidth;

  // Filter shows and ads
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

      // Search query
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

  // Center on today on mount or when requested
  const scrollToToday = () => {
    if (!scrollContainerRef.current) return;
    const todayIndex = dayList.findIndex((d) => d.isToday);
    if (todayIndex !== -1) {
      const scrollPos = todayIndex * dayWidth - scrollContainerRef.current.clientWidth / 2 + 150;
      scrollContainerRef.current.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToToday();
  }, [dayWidth]);

  // Pixel calculation for an ad's flight bar
  const calculateBarPixels = (startDateStr: string, endDateStr: string) => {
    const startIndex = diffCalendarDays(startDateStr, timelineStartStr);
    const endIndex = diffCalendarDays(endDateStr, timelineStartStr);

    const clampedStart = Math.max(0, startIndex);
    const clampedEnd = Math.min(dayList.length - 1, endIndex);

    const left = clampedStart * dayWidth;
    const width = Math.max(dayWidth, (clampedEnd - clampedStart + 1) * dayWidth - 4);

    return { left, width, isCutoffLeft: startIndex < 0, isCutoffRight: endIndex >= dayList.length };
  };

  const todayIndex = dayList.findIndex((d) => d.isToday);
  const todayLeftPixel = todayIndex !== -1 ? todayIndex * dayWidth : -1;

  // Counts
  const expiredCount = ads.filter((a) => !a.takenOffAt && a.status === 'expired').length;
  const expiringCount = ads.filter((a) => !a.takenOffAt && a.status === 'expiring_soon').length;

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-3 max-w-[1800px] mx-auto w-full select-none overflow-hidden">
      {/* Top Controls Bar: Search, Filters, Today Anchor & Zoom */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800 text-xs">
        {/* Left: Search & Quick Status Filters */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-2">
          {/* Search Box */}
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter ads / advertiser..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({ads.length})
            </button>

            <button
              onClick={() => setStatusFilter('urgent_only')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                statusFilter === 'urgent_only'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : expiredCount > 0
                  ? 'text-rose-400 hover:bg-rose-950/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Urgent pull ({expiredCount + expiringCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('active_only')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                statusFilter === 'active_only'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              Active
            </button>
          </div>
        </div>

        {/* Right: Scroll to Today & Zoom Level Controls */}
        <div className="flex items-center space-x-3">
          {/* Center on Today Button */}
          <button
            onClick={scrollToToday}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold transition-all active:scale-95 shadow-sm"
            title="Scroll timeline to today (31 October)"
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span>Jump to TODAY (31 Oct)</span>
          </button>

          {/* Zoom Level Switcher */}
          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-bold px-1.5">ZOOM:</span>
            {[
              { label: 'Compact', width: 44 },
              { label: 'Standard (64px)', width: 64 },
              { label: 'Expanded', width: 84 },
            ].map((z) => (
              <button
                key={z.width}
                onClick={() => setDayWidth(z.width)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
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

      {/* Main Gantt Timeline Matrix */}
      <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[550px]">
        {/* Scrollable Container with synchronized Left Column & Timeline */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative flex flex-col"
        >
          {/* TIMELINE HEADER: Dual-tier ruler (Sticky to top) */}
          <div
            style={{ width: `${340 + totalTimelineWidth}px` }}
            className="sticky top-0 z-30 flex bg-zinc-900 border-b border-zinc-800 shrink-0 select-none shadow-md"
          >
            {/* Fixed Left Header Corner */}
            <div className="w-[340px] shrink-0 p-3.5 border-r border-zinc-800 bg-zinc-900 flex items-center justify-between sticky left-0 z-40 shadow-xl">
              <div className="flex items-center space-x-2">
                <Tv className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-xs uppercase tracking-wider text-zinc-200">
                  Show & Commercial Spot
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 font-semibold uppercase">
                Slot / Duration
              </span>
            </div>

            {/* Right Date Ruler (Days & Weeks) */}
            <div style={{ width: `${totalTimelineWidth}px` }} className="flex flex-col relative shrink-0">
              {/* Day Columns Ruler */}
              <div className="flex h-12 relative border-b border-zinc-800/80">
                {dayList.map((day, idx) => {
                  return (
                    <div
                      key={idx}
                      ref={day.isToday ? todayColumnRef : null}
                      style={{ width: `${dayWidth}px` }}
                      className={`shrink-0 border-r border-zinc-850 flex flex-col items-center justify-center transition-colors relative ${
                        day.isToday
                          ? 'bg-amber-400/20 text-amber-200 font-black'
                          : day.isWeekend
                          ? 'bg-zinc-950/60 text-zinc-500'
                          : 'text-zinc-300'
                      } ${headerBroadcastColumnClass(headerBroadcastDays.has(day.dayOfWeek))}`}
                    >
                      {headerBroadcastDays.has(day.dayOfWeek) && (
                        <span className="absolute top-0.5 right-0.5 text-[7px] font-black text-violet-300 uppercase">
                          TX
                        </span>
                      )}
                      {/* Day of week */}
                      <span className="text-[10px] font-semibold uppercase opacity-80">
                        {day.dayOfWeekName}
                      </span>
                      {/* Day number */}
                      <span
                        className={`text-xs font-mono font-bold leading-tight ${
                          day.isToday
                            ? 'px-1.5 py-0.2 rounded-md bg-amber-400 text-zinc-950 shadow'
                            : ''
                        }`}
                      >
                        {day.dayOfMonth}
                      </span>
                    </div>
                  );
                })}

                {/* Persistent TODAY vertical glow line indicator */}
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
          </div>

          {/* TIMELINE BODY: Rows grouped by Show and Break */}
          <div style={{ width: `${340 + totalTimelineWidth}px` }} className="flex flex-col divide-y divide-zinc-855">
            {filteredShows.map((show) => {
              const showAds = filteredAds.filter((a) => a.showId === show.id);
              const breakNumbers = Array.from({ length: show.breakCount }, (_, i) => i + 1);

              return (
                <div key={show.id} className="relative flex flex-col">
                  <div
                    className="absolute top-0 bottom-0 z-[1] flex pointer-events-none"
                    style={{ left: 340, width: totalTimelineWidth }}
                  >
                    <GanttShowBroadcastOverlay
                      dayList={dayList}
                      dayWidth={dayWidth}
                      show={show}
                    />
                  </div>
                  {/* Show Header Banner */}
                  <div className="sticky left-0 z-20 flex items-center justify-between bg-zinc-900/95 backdrop-blur-md px-4 py-2.5 border-b border-zinc-800">
                    <div className="flex items-center space-x-2.5">
                      <span
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
                      <h3 className="text-sm font-bold text-white tracking-wide">
                        {show.title}
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                        {show.channel} &bull; {show.broadcastSchedule}
                      </span>
                    </div>

                    <span className="text-xs text-zinc-400 font-semibold pr-4">
                      {showAds.length} {showAds.length === 1 ? 'active ad' : 'active ads'}
                    </span>
                  </div>

                  {/* Rows per Break & Spot */}
                  {breakNumbers.map((breakNum) => {
                    const breakAds = showAds.filter((a) => a.breakNumber === breakNum);

                    return (
                      <div key={breakNum} className="flex flex-col">
                        {/* Break Subheader bar */}
                        <div className="flex bg-zinc-950/90 border-b border-zinc-850/60 py-1.5 px-4 text-xs font-semibold text-zinc-400">
                          <div className="w-[340px] shrink-0 sticky left-0 z-10 flex items-center space-x-2">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="font-bold text-zinc-200">
                              Break {breakNum}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ({breakAds.length} {breakAds.length === 1 ? 'spot' : 'spots'})
                            </span>
                          </div>
                        </div>

                        {/* Each Ad in this break gets its own clear, comfortable horizontal lane! */}
                        {breakAds.length === 0 ? (
                          <div className="flex items-center h-12 border-b border-zinc-850/40 text-xs text-zinc-600 pl-6 italic">
                            No spots scheduled in Break {breakNum}
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
                                className={`flex border-b border-zinc-850/60 hover:bg-zinc-900/40 transition-colors h-[68px] relative group/lane ${
                                  isExpired ? 'bg-rose-950/15' : ''
                                }`}
                              >
                                {/* Left Sticky Column: Spot info card */}
                                <div
                                  onClick={() => onSelectAd(ad)}
                                  className="w-[340px] shrink-0 p-2.5 border-r border-zinc-800 bg-zinc-950/95 sticky left-0 z-20 flex items-center justify-between cursor-pointer group-hover/lane:bg-zinc-900 transition-colors shadow-lg"
                                >
                                  <div className="flex items-center space-x-3 overflow-hidden">
                                    {/* Thumbnail with hover play icon */}
                                    <div className="relative w-14 aspect-video rounded-lg overflow-hidden bg-black shrink-0 ring-1 ring-zinc-800">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={ad.frameGrabUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/lane:opacity-100 transition-opacity">
                                        <Play className="w-3.5 h-3.5 text-white fill-current" />
                                      </div>
                                    </div>

                                    {/* Title & Advertiser */}
                                    <div className="flex flex-col truncate">
                                      <div className="flex items-center space-x-1.5">
                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-indigo-300 font-semibold">
                                          Slot #{ad.slotIndex}
                                        </span>
                                        <span className="text-[10px] font-mono text-zinc-500">
                                          {ad.durationSec}s
                                        </span>
                                      </div>
                                      <h4 className="text-xs font-bold text-zinc-100 truncate group-hover/lane:text-indigo-300 transition-colors">
                                        {ad.title}
                                      </h4>
                                      <span className="text-[10px] text-zinc-400 truncate">
                                        {ad.advertiser}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right side of left column: Status pill */}
                                  <div className="shrink-0 pl-2">
                                    <span
                                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                        isTakenOff
                                          ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                          : daysInfo.badgeClass
                                      }`}
                                    >
                                      {isTakenOff ? 'Taken off' : isExpired ? 'PULL!' : daysInfo.text}
                                    </span>
                                  </div>
                                </div>

                                {/* Right Timeline Area: Dedicated Flight Bar */}
                                <div
                                  style={{ width: `${totalTimelineWidth}px` }}
                                  className="relative h-full flex items-center p-2 shrink-0 overflow-hidden"
                                >
                                  {/* Background grid day lines */}
                                  <div className="absolute inset-0 flex pointer-events-none">
                                    {dayList.map((day, idx) => (
                                      <div
                                        key={idx}
                                        style={{ width: `${dayWidth}px` }}
                                        className={`shrink-0 border-r border-zinc-850/30 ${
                                          isBroadcastDayOfWeek(day.dayOfWeek, show.broadcastSchedule)
                                            ? showBroadcastColumnClass(show.color, true)
                                            : day.isToday
                                            ? 'bg-amber-400/5'
                                            : day.isWeekend
                                            ? 'bg-zinc-950/30'
                                            : ''
                                        }`}
                                      />
                                    ))}
                                  </div>

                                  {/* Today vertical line continuing down through the row */}
                                  {todayLeftPixel >= 0 && (
                                    <div
                                      style={{ left: `${todayLeftPixel + dayWidth / 2}px` }}
                                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400/70 z-10 pointer-events-none"
                                    />
                                  )}

                                  {/* THE AD FLIGHT BAR */}
                                  <div
                                    onClick={() => onSelectAd(ad)}
                                    style={{ left: `${barPos.left}px`, width: `${barPos.width}px` }}
                                    className={`absolute h-12 rounded-xl px-3 flex items-center justify-between cursor-pointer shadow-xl transition-all duration-200 hover:scale-[1.01] hover:z-20 border select-none ${
                                      isTakenOff
                                        ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500 line-through opacity-60'
                                        : isExpired
                                        ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-rose-500 text-rose-100 ring-2 ring-rose-500/50 shadow-rose-950/60 animate-pulse'
                                        : isExpiring
                                        ? 'bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 border-amber-500 text-amber-100 shadow-amber-950/40 ring-1 ring-amber-500/30'
                                        : 'bg-gradient-to-r from-zinc-900 via-indigo-950/80 to-zinc-900 border-zinc-700 hover:border-indigo-400 text-zinc-100 shadow-lg'
                                    }`}
                                  >
                                    {/* Left: Thumbnail & Title inside the bar */}
                                    <div className="flex items-center space-x-2.5 truncate min-w-0">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={ad.frameGrabUrl}
                                        alt=""
                                        className="w-8 aspect-video rounded-md object-cover ring-1 ring-white/10 shrink-0"
                                      />
                                      <div className="flex flex-col truncate leading-tight">
                                        <div className="flex items-center space-x-1.5 truncate">
                                          <span className="text-xs font-bold truncate text-white">
                                            {ad.title}
                                          </span>
                                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/50 text-zinc-300 font-mono font-semibold">
                                            {ad.durationSec}s
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-zinc-400 truncate">
                                          {ad.advertiser} &bull; Flight: {formatShortDate(ad.startDate)} &rarr;{' '}
                                          <b className={isExpired ? 'text-rose-300' : 'text-amber-300'}>
                                            {formatShortDate(ad.endDate)}
                                          </b>
                                        </span>
                                      </div>
                                    </div>

                                    {/* Right: Expiration Deadline & Countdown Tag */}
                                    <div className="flex items-center space-x-2 shrink-0 ml-2">
                                      {ad.eventDate && (
                                        <span className="hidden xl:inline text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-amber-300 font-medium border border-amber-500/20">
                                          📅 {ad.eventDate}
                                        </span>
                                      )}

                                      <div
                                        className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-black uppercase flex items-center space-x-1 shadow ${
                                          isExpired
                                            ? 'bg-rose-600 text-white animate-bounce'
                                            : isExpiring
                                            ? 'bg-amber-500 text-zinc-950'
                                            : 'bg-zinc-800 text-emerald-300 border border-emerald-500/30'
                                        }`}
                                      >
                                        {isExpired ? (
                                          <>
                                            <AlertTriangle className="w-3 h-3 text-white fill-current" />
                                            <span>TAKE OFF AIR!</span>
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
      </div>
    </div>
  );
}
