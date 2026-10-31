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
  breakNumber: number; // 1, 2, 3... (np. Break 1 w Ireland West Music TV)
  slotIndex: number;   // 1, 2, 3... (pozycja w bloku)
  title: string;       // np. "Live Concert Tour: Daniel O'Donnell 2026"
  advertiser: string;  // np. "Mayo Arts Centre & Promoters"
  category: AdCategory;
  durationSec: number; // np. 20s, 30s
  startDate: string;   // 'YYYY-MM-DD'
  endDate: string;     // 'YYYY-MM-DD' — kluczowa data zdjęcia z anteny!
  frameGrabUrl: string;// Klatka z wideo / plakat
  videoUrl?: string;   // Opcjonalne wideo 20-30s H.264 do podglądu
  isTimeSensitive: boolean; // czy ma sztywną datę koncertu/tournee
  eventDate?: string;  // np. "15 Listopada 2026 - Glencarn Hotel"
  replacementAction: string; // np. "Zastąpić zwiastunem stacji IWMTV 30s"
  notes?: string;
  status: AdStatus;
  takenOffAt?: string; // data kiedy faktycznie zdjęto z anteny
  replacementAdTitle?: string; // czym zastąpiono
  createdAt: string;
  updatedAt: string;
}

export interface CommercialShow {
  id: string;
  title: string;              // np. "Show 1: Ireland West Music TV"
  code: string;               // np. "IWMTV"
  channel: string;            // np. "Sky 181 / Freesat 400"
  broadcastSchedule: string;  // np. "Czwartki 21:00 GMT"
  breakCount: number;         // np. 3 przerwy reklamowe
  color: 'emerald' | 'amber' | 'cyan' | 'purple' | 'rose' | 'indigo';
  description?: string;
  createdAt: string;
}

export type TimelineViewMode = 'timeline' | 'calendar' | 'matrix' | 'urgent_radar';
