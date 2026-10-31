export type AdCategory =
  | 'Concert Tour'
  | 'Festival'
  | 'Album Launch'
  | 'Local Business'
  | 'Station Promo'
  | 'Special Event';

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
  category: AdCategory;
  durationSec: number; // e.g. 20s, 30s
  startDate: string;   // 'YYYY-MM-DD'
  endDate: string;     // 'YYYY-MM-DD' — pull-by date
  frameGrabUrl: string;
  videoUrl?: string;   // optional 20–30s H.264 preview
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
  broadcastSchedule: string;  // e.g. "Wednesdays 22:00 GMT — Faith World TV"
  breakCount: number;         // np. 3 przerwy reklamowe
  color: 'emerald' | 'amber' | 'cyan' | 'purple' | 'rose' | 'indigo';
  description?: string;
  createdAt: string;
}

/** Main admin navigation (left sidebar). */
export type AdminNavView = 'cards' | 'gantt' | 'edit';

