import { CommercialAd, CommercialShow, AdStatus } from '@/types/timeline';
import { computeAdStatus } from '@/lib/date-utils';
import { parseBroadcastWeekdaysFromDb, parseBroadcastWeekdays } from '@/lib/show-broadcast';

export type ShowRow = {
  id: string;
  title: string;
  code: string;
  channel: string;
  broadcast_schedule: string;
  break_count: number;
  color: string;
  description: string | null;
  broadcast_weekdays?: unknown;
  created_at: string | Date;
};

export type AdRow = {
  id: string;
  show_id: string;
  show_title?: string;
  break_number: number;
  slot_index: number;
  title: string;
  advertiser: string;
  category: string;
  duration_sec: number;
  start_date: string | Date;
  end_date: string | Date;
  frame_grab_url: string;
  video_url: string | null;
  is_time_sensitive: boolean;
  event_date: string | null;
  replacement_action: string;
  notes: string | null;
  taken_off_at: string | Date | null;
  replacement_ad_title: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function toIsoDate(value: string | Date): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function toIsoDateTime(value: string | Date): string {
  if (typeof value === 'string') return value;
  return value.toISOString();
}

export function mapShowRow(row: ShowRow): CommercialShow {
  let broadcastWeekdays = parseBroadcastWeekdaysFromDb(row.broadcast_weekdays);
  if (broadcastWeekdays.length === 0) {
    broadcastWeekdays = parseBroadcastWeekdays(row.broadcast_schedule);
  }
  return {
    id: row.id,
    title: row.title,
    code: row.code,
    channel: row.channel,
    broadcastSchedule: row.broadcast_schedule,
    broadcastWeekdays,
    breakCount: row.break_count,
    color: row.color as CommercialShow['color'],
    description: row.description ?? undefined,
    createdAt: toIsoDateTime(row.created_at),
  };
}

export function mapAdRow(row: AdRow): CommercialAd {
  const takenOffAt = row.taken_off_at ? toIsoDate(row.taken_off_at) : undefined;
  const base: CommercialAd = {
    id: row.id,
    showId: row.show_id,
    showTitle: row.show_title,
    breakNumber: row.break_number,
    slotIndex: row.slot_index,
    title: row.title,
    advertiser: row.advertiser,
    durationSec: row.duration_sec,
    startDate: toIsoDate(row.start_date),
    endDate: toIsoDate(row.end_date),
    frameGrabUrl: row.frame_grab_url,
    videoUrl: row.video_url ?? undefined,
    isTimeSensitive: row.is_time_sensitive,
    eventDate: row.event_date ?? undefined,
    replacementAction: row.replacement_action,
    notes: row.notes ?? undefined,
    status: 'active' as AdStatus,
    takenOffAt,
    replacementAdTitle: row.replacement_ad_title ?? undefined,
    createdAt: toIsoDateTime(row.created_at),
    updatedAt: toIsoDateTime(row.updated_at),
  };
  return { ...base, status: computeAdStatus(base) };
}
