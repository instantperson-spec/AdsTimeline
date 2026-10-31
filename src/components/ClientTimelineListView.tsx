'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Layers,
  Play,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Crosshair,
  Tv,
  Film,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
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

interface ClientTimelineListViewProps {
  ads: CommercialAd[];
  shows: CommercialShow[];
  selectedShowId: string;
  onSelectAd: (ad: CommercialAd) => void;
  onTakeOffAd: (adId: string, note?: string) => void;
  onOpenNewAd: () => void;
}

export function ClientTimelineListView({
  ads,
  shows,
  selectedShowId,
  onSelectAd,
  onTakeOffAd,
  onOpenNewAd,
}: ClientTimelineListViewProps) {
  // Day column width: 48px (compact), 64px (standard), 80px (roomy)
  const [dayWidth, setDayWidth] = useState<number>(64);
  const [statusFilter, setStatusFilter] = useState<'all' | 'urgent_only' | 'active_only'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [takingOffAdId, setTakingOffAdId] = useState<string | null>(null);
  const [replacementNote, setReplacementNote] = useState('Zastąpiono zwiastunem stacji IWMTV 30s');

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Baseline reference today: 2026-10-31
  const todayStr = '2026-10-31';
  const todayDate = useMemo(() => new Date(todayStr + 'T00:00:00'), [todayStr]);

  // Timeline window: 12 days before today to 28 days after today (40 days total)
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

    for (let i = 0; i < 40; i++) {
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

      // Group by weeks
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
        currentWeekTitle = d.toLocaleDateString('pl-PL', { month: 'long' });
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

  // Center on today
  const scrollToToday = () => {
    if (!scrollContainerRef.current) return;
    const todayIndex = dayList.findIndex((d) => d.isToday);
    if (todayIndex !== -1) {
      const scrollPos = todayIndex * dayWidth - scrollContainerRef.current.clientWidth / 2 + 220;
      scrollContainerRef.current.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToToday();
  }, [dayWidth]);

  // Calculate pixel position on timeline
  const calculateBarPixels = (startDateStr: string, endDateStr: string) => {
    const startIndex = diffCalendarDays(startDateStr, timelineStartStr);
    const endIndex = diffCalendarDays(endDateStr, timelineStartStr);

    const clampedStart = Math.max(0, startIndex);
    const clampedEnd = Math.min(dayList.length - 1, endIndex);

    const left = clampedStart * dayWidth;
    const width = Math.max(dayWidth, (clampedEnd - clampedStart + 1) * dayWidth - 6);

    return { left, width };
  };

  const todayIndex = dayList.findIndex((d) => d.isToday);
  const todayLeftPixel = todayIndex !== -1 ? todayIndex * dayWidth : -1;

  // Counts for quick chips
  const expiredCount = ads.filter((a) => !a.takenOffAt && a.status === 'expired').length;
  const expiringCount = ads.filter((a) => !a.takenOffAt && a.status === 'expiring_soon').length;
  const activeCount = ads.filter((a) => !a.takenOffAt && a.status === 'active').length;

  return (
    <div className="flex-1 flex flex-col p-3 lg:p-6 space-y-4 max-w-[1850px] mx-auto w-full select-none overflow-hidden">
      {/* 1. TOP BAR: FILTRY I STATYSTYKI RAMÓWKI */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-zinc-900/90 p-3.5 rounded-2xl border border-zinc-800 text-xs shadow-xl">
        {/* Left: Quick Status Chips */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Search Box */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj spotu / artysty..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Wszystkie ({ads.length})
          </button>

          {/* Expired / Urgent Chip */}
          <button
            onClick={() => setStatusFilter('urgent_only')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              statusFilter === 'urgent_only'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : expiredCount > 0
                ? 'bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-950/70'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Do zdjęcia z ramówki ({expiredCount + expiringCount})</span>
            {expiredCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          {/* Active Chip */}
          <button
            onClick={() => setStatusFilter('active_only')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              statusFilter === 'active_only'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            Bezpieczne / Aktywne ({activeCount})
          </button>
        </div>

        {/* Right: Scroll to Today & Zoom Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={scrollToToday}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold transition-all active:scale-95 shadow-sm"
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span>Skocz do DZIŚ (31 Paź)</span>
          </button>

          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-bold px-1.5">SKALA:</span>
            {[
              { label: 'Kompaktowa', width: 48 },
              { label: 'Standardowa (64px)', width: 64 },
              { label: 'Szeroka (80px)', width: 80 },
            ].map((z) => (
              <button
                key={z.width}
                onClick={() => setDayWidth(z.width)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
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

      {/* 2. MAIN SPLIT VIEW: LISTA Z DETALAMI + TIMELINE */}
      <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[580px]">
        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative flex flex-col"
        >
          {/* HEADER RULER (Sticky top) */}
          <div
            style={{ width: `${440 + totalTimelineWidth}px` }}
            className="sticky top-0 z-30 flex bg-zinc-900 border-b border-zinc-800 shrink-0 select-none shadow-md"
          >
            {/* Left Header: Lista z detalami */}
            <div className="w-[440px] shrink-0 p-3.5 border-r border-zinc-800 bg-zinc-900 flex items-center justify-between sticky left-0 z-40 shadow-xl">
              <div className="flex items-center space-x-2">
                <Tv className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-xs uppercase tracking-wider text-zinc-200">
                  Lista z detalami (Tylko niezbędne)
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-semibold">
                Kiedy zdjąć / Status
              </span>
            </div>

            {/* Right Header: Oś czasu (Timeline) */}
            <div style={{ width: `${totalTimelineWidth}px` }} className="flex flex-col relative shrink-0">
              {/* Day Columns */}
              <div className="flex h-12 relative border-b border-zinc-800/80">
                {dayList.map((day, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${dayWidth}px` }}
                    className={`shrink-0 border-r border-zinc-850 flex flex-col items-center justify-center transition-colors relative ${
                      day.isToday
                        ? 'bg-amber-400/20 text-amber-200 font-black'
                        : day.isWeekend
                        ? 'bg-zinc-950/60 text-zinc-500'
                        : 'text-zinc-300'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase opacity-80">
                      {day.dayOfWeekName}
                    </span>
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
                ))}

                {/* Persistent Today line */}
                {todayLeftPixel >= 0 && (
                  <div
                    style={{ left: `${todayLeftPixel + dayWidth / 2}px` }}
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-30 shadow-[0_0_12px_rgba(251,191,36,0.9)] pointer-events-none"
                  >
                    <div className="absolute top-0.5 -translate-x-1/2 bg-amber-400 text-zinc-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shadow">
                      DZIŚ
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BODY: Rows grouped by Show and Break */}
          <div style={{ width: `${440 + totalTimelineWidth}px` }} className="flex flex-col divide-y divide-zinc-850">
            {filteredShows.map((show) => {
              const showAds = filteredAds.filter((a) => a.showId === show.id);
              const breakNumbers = Array.from({ length: show.breakCount }, (_, i) => i + 1);

              return (
                <div key={show.id} className="flex flex-col">
                  {/* Show Group Header */}
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
                      {showAds.length} {showAds.length === 1 ? 'spot w ramówce' : 'spoty w ramówce'}
                    </span>
                  </div>

                  {/* Commercial Breaks & Spots */}
                  {breakNumbers.map((breakNum) => {
                    const breakAds = showAds.filter((a) => a.breakNumber === breakNum);

                    return (
                      <div key={breakNum} className="flex flex-col">
                        {/* Break Label Bar */}
                        <div className="flex bg-zinc-950/90 border-b border-zinc-850/60 py-1.5 px-4 text-xs font-semibold text-zinc-400">
                          <div className="w-[440px] shrink-0 sticky left-0 z-10 flex items-center space-x-2">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="font-bold text-zinc-200">
                              Przerwa {breakNum} (Break {breakNum})
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              &bull; {breakAds.length} {breakAds.length === 1 ? 'spot' : 'spoty'}
                            </span>
                          </div>
                        </div>

                        {/* Each Ad: Row by Row (Details card on left + Timeline bar on right) */}
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
                                className={`flex border-b border-zinc-850/60 hover:bg-zinc-900/40 transition-colors h-[84px] relative group/lane ${
                                  isExpired ? 'bg-rose-950/15' : ''
                                }`}
                              >
                                {/* ======================================================== */}
                                {/* LEWA STRONA: LISTA Z DETALAMI (TYLKO NIEZBĘDNE DANE)      */}
                                {/* ======================================================== */}
                                <div
                                  onClick={() => onSelectAd(ad)}
                                  className="w-[440px] shrink-0 p-3 border-r border-zinc-800 bg-zinc-950/95 sticky left-0 z-20 flex items-center justify-between cursor-pointer group-hover/lane:bg-zinc-900 transition-colors shadow-lg"
                                >
                                  {/* Thumbnail & Title/Info */}
                                  <div className="flex items-center space-x-3.5 overflow-hidden min-w-0 pr-2">
                                    {/* Video Frame Grab Thumbnail */}
                                    <div className="relative w-20 aspect-video rounded-xl overflow-hidden bg-black shrink-0 ring-1 ring-zinc-800 shadow-md">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={ad.frameGrabUrl}
                                        alt=""
                                        className="w-full h-full object-cover transition-transform group-hover/lane:scale-105"
                                      />
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/lane:bg-black/20 transition-colors">
                                        <div className="w-6 h-6 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow">
                                          <Play className="w-3 h-3 fill-current ml-0.5" />
                                        </div>
                                      </div>
                                      <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 font-mono text-[9px] text-zinc-300">
                                        {ad.durationSec}s
                                      </span>
                                    </div>

                                    {/* Title, Advertiser, Slot */}
                                    <div className="flex flex-col truncate min-w-0">
                                      <div className="flex items-center space-x-1.5 mb-0.5">
                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-850 text-indigo-300 font-semibold border border-zinc-750">
                                          Przerwa {ad.breakNumber} &bull; Slot #{ad.slotIndex}
                                        </span>
                                      </div>

                                      <h4 className="text-xs font-bold text-zinc-100 truncate group-hover/lane:text-indigo-400 transition-colors">
                                        {ad.title}
                                      </h4>

                                      <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                                        <span className="text-zinc-300 font-medium">{ad.advertiser}</span>
                                      </div>

                                      {/* Event Date tag if present */}
                                      {ad.eventDate && (
                                        <span className="text-[10px] text-amber-400 truncate font-medium">
                                          {ad.eventDate}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right side of details column: Exact Expiry Date & Countdown Badge */}
                                  <div className="shrink-0 flex flex-col items-end justify-center space-y-1">
                                    <span
                                      className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-lg border shadow-sm whitespace-nowrap ${
                                        isTakenOff
                                          ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                          : daysInfo.badgeClass
                                      }`}
                                    >
                                      {isTakenOff
                                        ? 'Zdjęta z anteny'
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
                                {/* PRAWA STRONA: ZSYNCHRONIZOWANA OŚ CZASU (TIMELINE BAR)    */}
                                {/* ======================================================== */}
                                <div
                                  style={{ width: `${totalTimelineWidth}px` }}
                                  className="relative h-full flex items-center p-2 shrink-0 overflow-hidden"
                                >
                                  {/* Grid Day Lines */}
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
                                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400/70 z-10 pointer-events-none"
                                    />
                                  )}

                                  {/* TIMELINE FLIGHT BAR */}
                                  <div
                                    onClick={() => onSelectAd(ad)}
                                    style={{ left: `${barPos.left}px`, width: `${barPos.width}px` }}
                                    className={`absolute h-14 rounded-2xl px-3 flex items-center justify-between cursor-pointer shadow-xl transition-all duration-200 hover:scale-[1.01] hover:z-20 border select-none ${
                                      isTakenOff
                                        ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500 line-through opacity-60'
                                        : isExpired
                                        ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-rose-500 text-rose-100 ring-2 ring-rose-500/50 shadow-rose-950/60 animate-pulse'
                                        : isExpiring
                                        ? 'bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 border-amber-500 text-amber-100 shadow-amber-950/40 ring-1 ring-amber-500/30'
                                        : 'bg-gradient-to-r from-zinc-900 via-indigo-950/80 to-zinc-900 border-zinc-700 hover:border-indigo-400 text-zinc-100 shadow-lg'
                                    }`}
                                  >
                                    {/* Bar Left: Mini Poster + Title */}
                                    <div className="flex items-center space-x-2.5 truncate min-w-0">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={ad.frameGrabUrl}
                                        alt=""
                                        className="w-10 aspect-video rounded-lg object-cover ring-1 ring-white/10 shrink-0"
                                      />
                                      <div className="flex flex-col truncate leading-tight">
                                        <div className="flex items-center space-x-1.5 truncate">
                                          <span className="text-xs font-bold truncate text-white">
                                            {ad.title}
                                          </span>
                                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/60 text-zinc-300 font-mono font-semibold">
                                            {ad.durationSec}s
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-zinc-400 truncate">
                                          Emisja: {formatShortDate(ad.startDate)} &rarr;{' '}
                                          <b className={isExpired ? 'text-rose-300' : 'text-amber-300'}>
                                            {formatShortDate(ad.endDate)}
                                          </b>
                                        </span>
                                      </div>
                                    </div>

                                    {/* Bar Right: Deadline Badge */}
                                    <div className="shrink-0 ml-3">
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
                                            <span>ZDEJMIJ Z ANTENY!</span>
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
