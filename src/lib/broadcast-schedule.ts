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

export function isBroadcastDayOfWeek(dayOfWeek: number, broadcastSchedule: string): boolean {
  return parseBroadcastWeekdays(broadcastSchedule).includes(dayOfWeek);
}

export function unionBroadcastWeekdays(shows: Pick<CommercialShow, 'broadcastSchedule'>[]): number[] {
  const set = new Set<number>();
  for (const show of shows) {
    for (const d of parseBroadcastWeekdays(show.broadcastSchedule)) set.add(d);
  }
  return [...set].sort((a, b) => a - b);
}

/** Tailwind classes for programme TX column tint on the Gantt grid. */
export function showBroadcastColumnClass(
  color: CommercialShow['color'],
  isBroadcastDay: boolean
): string {
  if (!isBroadcastDay) return '';
  switch (color) {
    case 'emerald':
      return 'bg-emerald-400/[0.14] border-emerald-500/30';
    case 'amber':
      return 'bg-amber-400/[0.14] border-amber-500/30';
    case 'cyan':
      return 'bg-cyan-400/[0.14] border-cyan-500/30';
    case 'purple':
      return 'bg-purple-400/[0.14] border-purple-500/30';
    case 'rose':
      return 'bg-rose-400/[0.14] border-rose-500/30';
    case 'indigo':
    default:
      return 'bg-indigo-400/[0.14] border-indigo-500/30';
  }
}

export function headerBroadcastColumnClass(isBroadcastDay: boolean): string {
  if (!isBroadcastDay) return '';
  return 'ring-1 ring-inset ring-violet-400/35 bg-violet-500/[0.08]';
}
