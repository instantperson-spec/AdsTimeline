'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import { formatDateDisplay } from '@/lib/date-utils';

interface CalendarMonthViewProps {
  ads: CommercialAd[];
  shows: CommercialShow[];
  selectedShowId: string;
  onSelectAd: (ad: CommercialAd) => void;
}

export function CalendarMonthView({
  ads,
  shows,
  selectedShowId,
  onSelectAd,
}: CalendarMonthViewProps) {
  // Current month state (default to November 2026 based on flight dates)
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-11-01T00:00:00'));
  const [selectedDayString, setSelectedDayString] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });

  // Generate days in month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Adjust to Monday = 0
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevDaysCount = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevDaysCount - i);
      const str = d.toISOString().split('T')[0];
      days.push({ date: d, dateStr: str, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const str = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ date: d, dateStr: str, isCurrentMonth: true });
    }

    // Next month padding to fill 35 or 42 cells
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const str = d.toISOString().split('T')[0];
      days.push({ date: d, dateStr: str, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // Filter ads by show
  const filteredAds = useMemo(() => {
    if (selectedShowId === 'all') return ads;
    return ads.filter((a) => a.showId === selectedShowId);
  }, [ads, selectedShowId]);

  // Helper to find ads for a date:
  // 1. Ads expiring on this date (Deadlines)
  // 2. Ads actively running on this date
  const getAdsForDate = (dateStr: string) => {
    const expiring = filteredAds.filter((a) => a.endDate === dateStr);
    const active = filteredAds.filter((a) => a.startDate <= dateStr && a.endDate >= dateStr);
    return { expiring, active };
  };

  const selectedDayData = selectedDayString ? getAdsForDate(selectedDayString) : null;

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-4 max-w-7xl mx-auto w-full select-none overflow-y-auto">
      {/* Month Navigation & Legend */}
      <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-2xl border border-zinc-850 flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-base font-bold text-zinc-100 capitalize">{monthName}</h2>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-rose-600 animate-pulse" />
            <span className="text-rose-300 font-semibold">Termin zdjęcia spotu (Expiry)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-indigo-600/80" />
            <span className="text-zinc-400">Aktywna emisja w ramówce</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-zinc-850 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/80 text-xs font-bold text-zinc-400 text-center py-2.5">
          <span>Poniedziałek</span>
          <span>Wtorek</span>
          <span>Środa</span>
          <span>Czwartek</span>
          <span>Piątek</span>
          <span>Sobota</span>
          <span>Niedziela</span>
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-zinc-850/80">
          {calendarDays.map((cell, idx) => {
            const { expiring, active } = getAdsForDate(cell.dateStr);
            const isToday = cell.dateStr === '2026-10-31';
            const isSelected = selectedDayString === cell.dateStr;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDayString(cell.dateStr)}
                className={`min-h-[110px] p-2 flex flex-col justify-between cursor-pointer transition-colors ${
                  !cell.isCurrentMonth
                    ? 'bg-zinc-950/40 opacity-40'
                    : isSelected
                    ? 'bg-zinc-850/80 ring-2 ring-indigo-500 z-10'
                    : 'bg-zinc-950/80 hover:bg-zinc-900/50'
                }`}
              >
                {/* Cell Header: Day Number & Today indicator */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isToday
                        ? 'px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950 font-black'
                        : cell.isCurrentMonth
                        ? 'text-zinc-200'
                        : 'text-zinc-600'
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>

                  {expiring.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono text-[9px] font-black animate-pulse">
                      🚩 {expiring.length} zdejmij!
                    </span>
                  )}
                </div>

                {/* Badges for ads expiring or running */}
                <div className="space-y-1 overflow-hidden">
                  {/* Expiring Ads on this day */}
                  {expiring.slice(0, 2).map((ad) => (
                    <div
                      key={ad.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAd(ad);
                      }}
                      className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-200 border border-rose-500/80 text-[10px] font-bold truncate flex items-center space-x-1"
                      title={`KONIEC EMISJI: ${ad.title}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      <span className="truncate">ZDJĄĆ: {ad.title}</span>
                    </div>
                  ))}

                  {/* Other active ads */}
                  {active
                    .filter((a) => !expiring.includes(a))
                    .slice(0, expiring.length > 0 ? 1 : 2)
                    .map((ad) => (
                      <div
                        key={ad.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAd(ad);
                        }}
                        className="px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-200 border border-indigo-800 text-[10px] truncate"
                        title={ad.title}
                      >
                        {ad.title}
                      </div>
                    ))}

                  {active.length > 2 && (
                    <span className="text-[9px] text-zinc-500 font-mono pl-1 block">
                      +{active.length - 2} więcej
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Drawer */}
      {selectedDayString && selectedDayData && (
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-zinc-100">
                Szczegóły dla daty: {formatDateDisplay(selectedDayString)}
              </h3>
            </div>
            <button
              onClick={() => setSelectedDayString(null)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Zamknij
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedDayData.active.length === 0 ? (
              <p className="text-xs text-zinc-500 py-2">Brak zaplanowanych reklam w tym dniu.</p>
            ) : (
              selectedDayData.active.map((ad) => {
                const isExpiryDay = ad.endDate === selectedDayString;

                return (
                  <div
                    key={ad.id}
                    onClick={() => onSelectAd(ad)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isExpiryDay
                        ? 'bg-rose-950/30 border-rose-600 text-rose-200'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ad.frameGrabUrl}
                        alt=""
                        className="w-12 aspect-video rounded object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-zinc-100 line-clamp-1">
                          {ad.title}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {ad.showTitle} &bull; Przerwa {ad.breakNumber}
                        </div>
                      </div>
                    </div>

                    {isExpiryDay ? (
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-bold">
                        DATA ZDJĘCIA
                      </span>
                    ) : (
                      <span className="text-xs text-indigo-400 font-semibold">Podgląd &rarr;</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
