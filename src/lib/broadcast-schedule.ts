import type { CommercialShow } from '@/types/timeline';
import { getShowBroadcastWeekdays, parseBroadcastWeekdays } from '@/lib/show-broadcast';

export { parseBroadcastWeekdays };

export function isBroadcastDayOfWeek(
  dayOfWeek: number,
  show: Pick<CommercialShow, 'broadcastWeekdays' | 'broadcastSchedule'>
): boolean {
  return getShowBroadcastWeekdays(show).includes(dayOfWeek);
}

export function unionBroadcastWeekdays(
  shows: Pick<CommercialShow, 'broadcastWeekdays' | 'broadcastSchedule'>[]
): number[] {
  const set = new Set<number>();
  for (const show of shows) {
    for (const d of getShowBroadcastWeekdays(show)) set.add(d);
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
