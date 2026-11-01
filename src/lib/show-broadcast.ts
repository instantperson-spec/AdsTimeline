import type { CommercialShow } from '@/types/timeline';

/** JS Date.getDay(): 0 = Sun … 6 = Sat */
const WEEKDAY_ALIASES: { pattern: RegExp; day: number }[] = [
  { pattern: /\bsundays?\b/i, day: 0 },
  { pattern: /\bmondays?\b/i, day: 1 },
  { pattern: /\btuesdays?\b/i, day: 2 },
  { pattern: /\bwednesdays?\b/i, day: 3 },
  { pattern: /\bthursdays?\b/i, day: 4 },
  { pattern: /\bfridays?\b/i, day: 5 },
  { pattern: /\bsaturdays?\b/i, day: 6 },
  { pattern: /\bniedziel\w*\b/i, day: 0 },
  { pattern: /\bponiedział\w*|\bponiedziale\w*\b/i, day: 1 },
  { pattern: /\bwtork\w*\b/i, day: 2 },
  { pattern: /\bśrod\w*|\bsrod\w*\b/i, day: 3 },
  { pattern: /\bczwart\w*\b/i, day: 4 },
  { pattern: /\bpiątk\w*|\bpiatek\w*\b/i, day: 5 },
  { pattern: /\bsobot\w*\b/i, day: 6 },
];

export function parseBroadcastWeekdays(broadcastSchedule: string): number[] {
  if (!broadcastSchedule.trim()) return [];
  const found = new Set<number>();
  for (const { pattern, day } of WEEKDAY_ALIASES) {
    if (pattern.test(broadcastSchedule)) found.add(day);
  }
  return [...found].sort((a, b) => a - b);
}

/** Weekdays stored in DB; fall back to legacy schedule text only when empty. */
export function getShowBroadcastWeekdays(
  show: Pick<CommercialShow, 'broadcastWeekdays' | 'broadcastSchedule'>
): number[] {
  if (show.broadcastWeekdays?.length) {
    return [...show.broadcastWeekdays].sort((a, b) => a - b);
  }
  return parseBroadcastWeekdays(show.broadcastSchedule);
}

export function isBroadcastDayForShow(
  dayOfWeek: number,
  show: Pick<CommercialShow, 'broadcastWeekdays' | 'broadcastSchedule'>
): boolean {
  return getShowBroadcastWeekdays(show).includes(dayOfWeek);
}

export const BROADCAST_WEEKDAY_OPTIONS: { day: number; short: string }[] = [
  { day: 1, short: 'Mon' },
  { day: 2, short: 'Tue' },
  { day: 3, short: 'Wed' },
  { day: 4, short: 'Thu' },
  { day: 5, short: 'Fri' },
  { day: 6, short: 'Sat' },
  { day: 0, short: 'Sun' },
];

export function formatBroadcastWeekdays(
  weekdays: number[],
  fallbackSchedule?: string
): string {
  if (!weekdays.length) {
    return fallbackSchedule?.trim() || '—';
  }
  const byDay = new Map(BROADCAST_WEEKDAY_OPTIONS.map((o) => [o.day, o.short]));
  return weekdays.map((d) => byDay.get(d) ?? '?').join(', ');
}

export function parseBroadcastWeekdaysFromDb(value: unknown): number[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === 'number' ? v : parseInt(String(v), 10)))
      .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
      .sort((a, b) => a - b);
  }
  if (typeof value === 'string') {
    try {
      return parseBroadcastWeekdaysFromDb(JSON.parse(value));
    } catch {
      return value
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
        .sort((a, b) => a - b);
    }
  }
  return [];
}
