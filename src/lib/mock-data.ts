import { CommercialShow, CommercialAd } from '@/types/timeline';

/** Real Faith World TV programmes — seeded when no saved data exists. */
export const INITIAL_SHOWS: CommercialShow[] = [
  {
    id: 'show-iwmtv',
    title: 'Ireland West Music TV',
    code: 'IWMTV',
    channel: 'Faith World TV',
    broadcastSchedule: 'Wednesdays 22:00 GMT — Faith World TV',
    breakCount: 3,
    color: 'emerald',
    description:
      'Leading country and folk music programme in the west of Ireland. Three dedicated commercial breaks per episode.',
    createdAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'show-mcs',
    title: 'The Michael Commins Show',
    code: 'MCS',
    channel: 'Faith World TV',
    broadcastSchedule: 'Wednesdays 23:00 GMT — Faith World TV',
    breakCount: 2,
    color: 'amber',
    description:
      'The Michael Commins Show — commercial break and spot expiry management.',
    createdAt: '2026-09-15T12:00:00.000Z',
  },
];

/** No demo spots — add commercials in the admin edit panel. */
export const INITIAL_ADS: CommercialAd[] = [];
