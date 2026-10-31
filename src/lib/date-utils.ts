import { CommercialAd, AdStatus } from '@/types/timeline';

/**
 * Computes dynamic status based on the current reference date
 */
export function computeAdStatus(ad: CommercialAd, referenceDate: Date = new Date()): AdStatus {
  if (ad.takenOffAt) {
    return 'taken_off';
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
  referenceDate: Date = new Date()
): {
  text: string;
  badgeClass: string;
  isUrgent: boolean;
  isExpired: boolean;
} {
  const days = getDaysRemaining(endDateStr, referenceDate);

  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      text:
        absDays === 1 ? 'Expired (1 day ago!)' : `Expired (${absDays} days ago!)`,
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
      text: `${days} days left`,
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      isUrgent: true,
      isExpired: false,
    };
  }

  return {
    text: `Active: ${days} days`,
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
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
  return `${d}/${m}`;
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function diffCalendarDays(dateStrA: string, dateStrB: string): number {
  const a = new Date(dateStrA + 'T00:00:00');
  const b = new Date(dateStrB + 'T00:00:00');
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export function toISODateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
