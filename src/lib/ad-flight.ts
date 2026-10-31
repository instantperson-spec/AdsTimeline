import type { CommercialAd } from '@/types/timeline';

/** Stored in DB when the spot has no flight window (permanent / recurrent). */
export const RECURRENT_FLIGHT_START = '1970-01-01';
export const RECURRENT_FLIGHT_END = '2099-12-31';

/** Permanent sponsor promo — fixed slot, no on-air window. */
export function isRecurrentAd(ad: Pick<CommercialAd, 'isTimeSensitive'>): boolean {
  return !ad.isTimeSensitive;
}

export function hasFlightWindow(ad: Pick<CommercialAd, 'isTimeSensitive'>): boolean {
  return ad.isTimeSensitive;
}

export function recurrentFlightStorageDates(): { startDate: string; endDate: string } {
  return { startDate: RECURRENT_FLIGHT_START, endDate: RECURRENT_FLIGHT_END };
}
