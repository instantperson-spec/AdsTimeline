'use client';

import React from 'react';
import { BROADCAST_WEEKDAY_OPTIONS } from '@/lib/show-broadcast';

interface BroadcastWeekdayPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
  disabled?: boolean;
}

export function BroadcastWeekdayPicker({ value, onChange, disabled }: BroadcastWeekdayPickerProps) {
  const selected = new Set(value);

  const toggle = (day: number) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    onChange([...next].sort((a, b) => a - b));
  };

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Broadcast weekdays">
      {BROADCAST_WEEKDAY_OPTIONS.map(({ day, short }) => {
        const on = selected.has(day);
        return (
          <button
            key={day}
            type="button"
            disabled={disabled}
            onClick={() => toggle(day)}
            className={`min-w-[2.75rem] px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
              on
                ? 'bg-violet-600/90 border-violet-400 text-white shadow-sm'
                : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-pressed={on}
          >
            {short}
          </button>
        );
      })}
    </div>
  );
}
