import { diffCalendarDays, formatShortDate, toISODateString } from '@/lib/date-utils';

export type GanttRangePreset = '30d' | '90d' | '180d' | 'full_flight';

export const GANTT_RANGE_PRESETS: { id: GanttRangePreset; label: string; shortLabel: string }[] = [
  { id: '30d', label: '30 days (around today)', shortLabel: '30 days' },
  { id: '90d', label: '3 months (around today)', shortLabel: '3 months' },
  { id: '180d', label: '6 months (around today)', shortLabel: '6 months' },
  { id: 'full_flight', label: 'Full flight (active spots)', shortLabel: 'Full flight' },
];

/** Auto-fit day column width when the timeline uses a time-range preset. */
export const GANTT_DAY_MIN_PX = 5;
export const GANTT_DAY_MAX_PX = 88;

const FLIGHT_EDGE_PADDING_DAYS = 3;

export type GanttWindowInput = {
  preset: GanttRangePreset;
  today: Date;
  panDays: number;
  /** Active time-sensitive spots (show/search scoped) for full-flight bounds. */
  flightAds: { startDate: string; endDate: string }[];
};

export type GanttWindow = {
  start: Date;
  dayCount: number;
  presetLabel: string;
  rangeSummary: string;
};

function addCalendarDays(base: Date, delta: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + delta);
  return next;
}

function windowAroundToday(today: Date, totalDays: number, panDays: number): GanttWindow {
  const before = Math.floor((totalDays - 1) / 2);
  const start = addCalendarDays(today, -before + panDays);
  const end = addCalendarDays(start, totalDays - 1);
  return {
    start,
    dayCount: totalDays,
    presetLabel: `${totalDays} days`,
    rangeSummary: `${formatShortDate(toISODateString(start))} – ${formatShortDate(toISODateString(end))}`,
  };
}

export function computeGanttWindow(input: GanttWindowInput): GanttWindow {
  const { preset, today, panDays, flightAds } = input;

  if (preset === '30d') {
    const w = windowAroundToday(today, 30, panDays);
    return { ...w, presetLabel: '30 days' };
  }
  if (preset === '90d') {
    const w = windowAroundToday(today, 90, panDays);
    return { ...w, presetLabel: '3 months' };
  }
  if (preset === '180d') {
    const w = windowAroundToday(today, 180, panDays);
    return { ...w, presetLabel: '6 months' };
  }

  const dated = flightAds.filter((a) => a.startDate && a.endDate);
  if (dated.length === 0) {
    const fallback = windowAroundToday(today, 30, panDays);
    return {
      ...fallback,
      presetLabel: 'Full flight',
      rangeSummary: `${fallback.rangeSummary} (no active flights — showing 30 days)`,
    };
  }

  let minStart = dated[0].startDate;
  let maxEnd = dated[0].endDate;
  for (const ad of dated) {
    if (ad.startDate < minStart) minStart = ad.startDate;
    if (ad.endDate > maxEnd) maxEnd = ad.endDate;
  }

  const start = addCalendarDays(new Date(minStart + 'T00:00:00'), -FLIGHT_EDGE_PADDING_DAYS + panDays);
  const endInclusive = addCalendarDays(new Date(maxEnd + 'T00:00:00'), FLIGHT_EDGE_PADDING_DAYS);
  const dayCount = Math.max(1, diffCalendarDays(toISODateString(start), toISODateString(endInclusive)) + 1);

  return {
    start,
    dayCount,
    presetLabel: 'Full flight (active)',
    rangeSummary: `${formatShortDate(minStart)} – ${formatShortDate(maxEnd)}`,
  };
}

export function fitDayWidth(trackWidthPx: number, dayCount: number): number {
  if (dayCount <= 0) return GANTT_DAY_MIN_PX;
  const raw = trackWidthPx / dayCount;
  return Math.min(GANTT_DAY_MAX_PX, Math.max(GANTT_DAY_MIN_PX, Math.floor(raw)));
}
