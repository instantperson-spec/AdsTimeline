import type { AdminNavView } from '@/types/timeline';

export type AdminNavLayer = 'presentation' | 'editing';

export function adminNavLayer(view: AdminNavView): AdminNavLayer {
  return view === 'cards' || view === 'gantt' ? 'presentation' : 'editing';
}

export function isPresentationView(view: AdminNavView): boolean {
  return adminNavLayer(view) === 'presentation';
}

export function isEditingView(view: AdminNavView): boolean {
  return adminNavLayer(view) === 'editing';
}

export const ADMIN_VIEW_META: Record<
  AdminNavView,
  { title: string; subtitle: string; layer: AdminNavLayer }
> = {
  cards: {
    layer: 'presentation',
    title: 'Cards & schedule',
    subtitle: 'Read-only overview by programme and break — open a spot to preview.',
  },
  gantt: {
    layer: 'presentation',
    title: 'Full timeline',
    subtitle: 'Gantt view of flight dates — for review and client-style planning.',
  },
  programmes: {
    layer: 'editing',
    title: 'Programmes',
    subtitle: 'Names, TX days, slot text, break count — programme structure.',
  },
  edit: {
    layer: 'editing',
    title: 'Spots & breaks',
    subtitle: 'Assign spots, reorder, pull/restore, copy or move breaks.',
  },
  media: {
    layer: 'editing',
    title: 'Media library',
    subtitle: 'Cloud JPG / MP4 assets linked when creating or editing spots.',
  },
};

export const PRESENTATION_VIEWS: AdminNavView[] = ['cards', 'gantt'];
export const EDITING_VIEWS: AdminNavView[] = ['programmes', 'edit', 'media'];
