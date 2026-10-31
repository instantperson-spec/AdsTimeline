import { CommercialAd, AdStatus } from '@/types/timeline';
import { hasFlightWindow, isRecurrentAd } from '@/lib/ad-flight';

/** Time-sensitive flights use start/end dates and pull-by alerts. */
export function tracksPullDeadline(ad: Pick<CommercialAd, 'isTimeSensitive'>): boolean {
  return hasFlightWindow(ad);
}

/** @deprecated Use isRecurrentAd from ad-flight */
export function isOngoingSpot(ad: Pick<CommercialAd, 'isTimeSensitive'>): boolean {
  return isRecurrentAd(ad);
}

/**
 * Computes dynamic status based on the current reference date
 */
export function computeAdStatus(ad: CommercialAd, referenceDate: Date = new Date()): AdStatus {
  if (ad.takenOffAt) {
    return 'taken_off';
  }

  if (isRecurrentAd(ad)) {
    return 'active';
  }

  const refTime = referenceDate.getTime();
  const start = new Date(ad.startDate + 'T00:00:00').getTime();
  const end = new Date(ad.endDate + 'T23:59:59').getTime();

  if (refTime < start) {
    return 'scheduled';
  }

  if (refTime > end) {
    return 'expired';
  }

  const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
  if (end - refTime <= fiveDaysMs) {
    return 'expiring_soon';
  }

  return 'active';
}

export function getDaysRemaining(endDateStr: string, referenceDate: Date = new Date()): number {
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const end = new Date(endDateStr + 'T00:00:00');
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - ref.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDaysRemainingText(
  endDateStr: string,
  referenceDate: Date = new Date('2026-10-31T00:00:00'),
  ad?: Pick<CommercialAd, 'isTimeSensitive'>
): {
  text: string;
  badgeClass: string;
  isUrgent: boolean;
  isExpired: boolean;
} {
  if (ad && isRecurrentAd(ad)) {
    return {
      text: 'Permanent sponsor spot',
      badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30 font-bold',
      isUrgent: false,
      isExpired: false,
    };
  }

  const days = getDaysRemaining(endDateStr, referenceDate);

  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      text: absDays === 1 ? 'Expired (yesterday!)' : `Expired (${absDays} days ago!)`,
      badgeClass:
        'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/30 animate-pulse',
      isUrgent: true,
      isExpired: true,
    };
  }

  if (days === 0) {
    return {
      text: 'EXPIRES TODAY!',
      badgeClass:
        'bg-rose-600 text-white font-bold border-rose-400 ring-2 ring-rose-500 animate-bounce',
      isUrgent: true,
      isExpired: false,
    };
  }

  if (days === 1) {
    return {
      text: 'Expires tomorrow!',
      badgeClass:
        'bg-amber-500/25 text-amber-300 border-amber-500/40 font-bold ring-1 ring-amber-500/30',
      isUrgent: true,
      isExpired: false,
    };
  }

  if (days <= 5) {
    return {
      text: `Expires in ${days} days`,
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold',
      isUrgent: true,
      isExpired: false,
    };
  }

  return {
    text: `On air: ${days} days left`,
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold',
    isUrgent: false,
    isExpired: false,
  };
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function formatFlightRange(ad: CommercialAd): string | null {
  if (isRecurrentAd(ad)) return null;
  return `${formatShortDate(ad.startDate)} – ${formatShortDate(ad.endDate)}`;
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates calendar days difference from dateStrA to dateStrB: (dateB - dateA) in days.
 * Example: diffCalendarDays('2026-10-10', '2026-10-15') returns +5.
 */
export function diffCalendarDays(dateStrA: string, dateStrB: string): number {
  const a = new Date(dateStrA + 'T00:00:00');
  const b = new Date(dateStrB + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function toISODateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
