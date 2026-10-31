import { CommercialShow } from '@/types/timeline';

export type ClientPortalViewMode = 'list' | 'timeline';

export type ClientPortalViews = ClientPortalViewMode[];

const SHOW_ALIASES: Record<string, string> = {
  iwmtv: 'show-iwmtv',
  imtv: 'show-iwmtv',
  mcs: 'show-mcs',
  tmcs: 'show-mcs',
};

/** Show segment in client URL: `all`, show id, or program code (IWMTV, MCS). */
export function encodeClientShowParam(selectedShowId: string, shows: CommercialShow[]): string {
  if (selectedShowId === 'all') return 'all';
  const show = shows.find((s) => s.id === selectedShowId);
  if (show?.code) return show.code;
  return selectedShowId;
}

export function parseClientShowParam(raw: string | null, shows: CommercialShow[]): string {
  if (!raw) return 'all';
  if (raw.trim().toLowerCase() === 'all') return 'all';

  const token = raw.trim();
  if (shows.some((s) => s.id === token)) return token;

  const byCode = shows.find((s) => s.code?.toLowerCase() === token.toLowerCase());
  if (byCode) return byCode.id;

  const aliasId = SHOW_ALIASES[token.toLowerCase()];
  if (aliasId && shows.some((s) => s.id === aliasId)) return aliasId;

  return 'all';
}

function normalizeViewToken(token: string): ClientPortalViewMode | null {
  const v = token.trim().toLowerCase();
  if (v === 'timeline' || v === 'gantt' || v === 'gantt_timeline') return 'timeline';
  if (v === 'list' || v === 'cards' || v === 'cards_timeline') return 'list';
  return null;
}

/** Comma-separated in URL, e.g. `list`, `timeline`, or `list,timeline`. */
export function parseClientViewsParam(raw: string | null): ClientPortalViews {
  if (!raw) return ['list'];

  const parts = raw.split(',').flatMap((chunk) => chunk.split('+'));
  const out: ClientPortalViews = [];

  for (const part of parts) {
    const mode = normalizeViewToken(part);
    if (mode && !out.includes(mode)) out.push(mode);
  }

  if (out.length === 0) return ['list'];

  const ordered: ClientPortalViews = [];
  if (out.includes('list')) ordered.push('list');
  if (out.includes('timeline')) ordered.push('timeline');
  return ordered;
}

export function encodeClientViewsParam(views: ClientPortalViews): string {
  const set = new Set(views.filter((v) => v === 'list' || v === 'timeline'));
  if (set.size === 0) return 'list';

  const ordered: ClientPortalViews = [];
  if (set.has('list')) ordered.push('list');
  if (set.has('timeline')) ordered.push('timeline');
  return ordered.join(',');
}

export function buildClientPortalPath(options: {
  selectedShowId: string;
  views: ClientPortalViews;
  shows: CommercialShow[];
}): string {
  const params = new URLSearchParams();
  params.set('show', encodeClientShowParam(options.selectedShowId, options.shows));
  params.set('view', encodeClientViewsParam(options.views));
  return `/client?${params.toString()}`;
}

export function buildClientPortalAbsoluteUrl(
  origin: string,
  options: Parameters<typeof buildClientPortalPath>[0]
): string {
  const path = buildClientPortalPath(options);
  return `${origin.replace(/\/$/, '')}${path}`;
}
