'use client';

import React from 'react';
import { parseBroadcastWeekdays, showBroadcastColumnClass } from '@/lib/broadcast-schedule';
import type { CommercialShow } from '@/types/timeline';

export type GanttDayColumn = {
  dayOfWeek: number;
  isToday: boolean;
  isWeekend: boolean;
};

const DAY_COLUMN_BORDER = 'box-border border-r border-zinc-700/80 shrink-0';

export function dayColumnStyle(dayWidth: number): React.CSSProperties {
  return {
    width: dayWidth,
    minWidth: dayWidth,
    maxWidth: dayWidth,
    flex: `0 0 ${dayWidth}px`,
  };
}

/** Column background grid — weekend / today plus optional programme TX days. */
export function GanttDayGridBase({
  dayList,
  dayWidth,
  broadcastWeekdays,
  broadcastColor,
}: {
  dayList: GanttDayColumn[];
  dayWidth: number;
  broadcastWeekdays?: number[];
  broadcastColor?: CommercialShow['color'];
}) {
  const txSet = new Set(broadcastWeekdays ?? []);

  return (
    <div className="flex h-full w-full pointer-events-none" aria-hidden>
      {dayList.map((day, idx) => {
        const isTx = txSet.has(day.dayOfWeek);
        const txClass =
          isTx && broadcastColor
            ? showBroadcastColumnClass(broadcastColor, true)
            : isTx
              ? 'bg-violet-500/[0.1] border-violet-500/25'
              : '';

        return (
          <div
            key={idx}
            style={dayColumnStyle(dayWidth)}
            className={`${DAY_COLUMN_BORDER} h-full ${
              day.isToday
                ? 'border-amber-500/35 bg-amber-400/[0.07]'
                : isTx
                  ? txClass
                  : day.isWeekend
                    ? 'border-zinc-700/60 bg-zinc-950/35'
                    : 'bg-transparent'
            }`}
          />
        );
      })}
    </div>
  );
}

/** Per-programme TX column tint over a show block on the Gantt. */
export function GanttShowBroadcastOverlay({
  dayList,
  dayWidth,
  show,
}: {
  dayList: GanttDayColumn[];
  dayWidth: number;
  show: CommercialShow;
}) {
  const txSet = new Set(parseBroadcastWeekdays(show.broadcastSchedule));
  if (txSet.size === 0) return null;

  return (
    <div
      className="absolute inset-0 z-[1] flex pointer-events-none"
      aria-label={`${show.title} broadcast days`}
    >
      {dayList.map((day, idx) => {
        const isTx = txSet.has(day.dayOfWeek);
        return (
          <div
            key={idx}
            style={dayColumnStyle(dayWidth)}
            className={`${DAY_COLUMN_BORDER} h-full ${
              isTx ? showBroadcastColumnClass(show.color, true) : 'bg-transparent border-transparent'
            }`}
          />
        );
      })}
    </div>
  );
}
