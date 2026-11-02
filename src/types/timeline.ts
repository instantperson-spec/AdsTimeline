import type { MediaAssetKind } from '@/types/media';

export type AdStatus =
  | 'active'        // Currently running on air and safe
  | 'expiring_soon' // Within 3-7 days of expiry deadline (Amber alert)
  | 'expired'       // Passed deadline - TAKE OFF IMMEDIATELY! (Red critical)
  | 'scheduled'     // Future flight date
  | 'taken_off';    // Pulled from broadcast / replaced

export interface CommercialAd {
  id: string;
  showId: string;
  showTitle?: string;
  breakNumber: number; // 1, 2, 3… (commercial break index)
  slotIndex: number;   // 1, 2, 3… (position within the break)
  title: string;
  advertiser: string;
  durationSec: number; // e.g. 20s, 30s
  /** On-air from (time-sensitive flights only). Recurrent spots use storage placeholders. */
  startDate: string;
  /** On-air until / pull-by (time-sensitive flights only). */
  endDate: string;
  /** Resolved poster URL (from media asset or legacy column). */
  frameGrabUrl: string;
  /** Resolved preview video URL when asset has MP4. */
  videoUrl?: string;
  /** Shared cloud media; slot may reuse the same asset across breaks. */
  mediaAssetId?: string;
  mediaKind?: MediaAssetKind;
  /** true = dated flight (e.g. tour 4 Jan–7 Mar). false = permanent / recurrent sponsor spot. */
  isTimeSensitive: boolean;
  eventDate?: string;
  replacementAction: string;
  notes?: string;
  status: AdStatus;
  takenOffAt?: string;
  replacementAdTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommercialShow {
  id: string;
  title: string;
  code: string;
  channel: string;            // e.g. "Faith World TV"
  broadcastSchedule: string;  // Human-readable slot, e.g. "Wednesdays 22:00 GMT"
  /** 0=Sun … 6=Sat — source of truth for TX columns on the Gantt. */
  broadcastWeekdays: number[];
  breakCount: number;         // np. 3 przerwy reklamowe
  color: 'emerald' | 'amber' | 'cyan' | 'purple' | 'rose' | 'indigo';
  description?: string;
  createdAt: string;
}

/** Main admin navigation (left sidebar). */
export type AdminNavView = 'cards' | 'gantt' | 'programmes' | 'edit' | 'media';

