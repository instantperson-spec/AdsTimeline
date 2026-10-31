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

  // Check if expiring in the next 5 days
  const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
  if (end - refTime <= fiveDaysMs) {
    return 'expiring_soon';
  }

  return 'active';
}

/**
 * Returns days difference relative to today
 */
export function getDaysRemaining(endDateStr: string, referenceDate: Date = new Date()): number {
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const end = new Date(endDateStr + 'T00:00:00');
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - ref.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format human-readable countdown in Polish
 */
export function formatDaysRemainingText(endDateStr: string, referenceDate: Date = new Date()): {
  text: string;
  badgeClass: string;
  isUrgent: boolean;
  isExpired: boolean;
} {
  const days = getDaysRemaining(endDateStr, referenceDate);

  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      text: absDays === 1 ? 'Przeterminowana (1 dzień temu!)' : `Przeterminowana (${absDays} dni temu!)`,
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/30 animate-pulse',
      isUrgent: true,
      isExpired: true,
    };
  }

  if (days === 0) {
    return {
      text: 'WYGASA DZISIAJ!',
      badgeClass: 'bg-rose-600 text-white font-bold border-rose-400 ring-2 ring-rose-500 animate-bounce',
      isUrgent: true,
      isExpired: false,
    };
  }

  if (days === 1) {
    return {
      text: 'Wygasa jutro!',
      badgeClass: 'bg-amber-500/25 text-amber-300 border-amber-500/40 font-bold ring-1 ring-amber-500/30',
      isUrgent: true,
      isExpired: false,
    };
  }

  if (days <= 5) {
    return {
      text: `Zostało: ${days} dni`,
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      isUrgent: true,
      isExpired: false,
    };
  }

  return {
    text: `Aktywna: ${days} dni`,
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    isUrgent: false,
    isExpired: false,
  };
}

/**
 * Format date for display: e.g. "15 Lis 2026"
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format short date: e.g. "15/11"
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}`;
}

/**
 * Today as YYYY-MM-DD
 */
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
