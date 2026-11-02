'use client';

import React from 'react';
import { Eye, PencilLine } from 'lucide-react';
import type { AdminNavView } from '@/types/timeline';
import { ADMIN_VIEW_META, adminNavLayer } from '@/lib/admin-nav';

interface AdminLayerChromeProps {
  view: AdminNavView;
}

export function AdminLayerChrome({ view }: AdminLayerChromeProps) {
  const meta = ADMIN_VIEW_META[view];
  const layer = adminNavLayer(view);
  const isPresentation = layer === 'presentation';

  return (
    <div
      className={`shrink-0 border-b px-4 lg:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${
        isPresentation
          ? 'bg-cyan-950/25 border-cyan-900/50'
          : 'bg-amber-950/20 border-amber-900/40'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 ${
            isPresentation
              ? 'bg-cyan-600/25 text-cyan-200 border border-cyan-500/30'
              : 'bg-amber-600/25 text-amber-100 border border-amber-500/35'
          }`}
        >
          {isPresentation ? (
            <Eye className="w-3.5 h-3.5" aria-hidden />
          ) : (
            <PencilLine className="w-3.5 h-3.5" aria-hidden />
          )}
          {isPresentation ? 'Presentation' : 'Editing'}
        </span>
        <h2 className="text-sm font-bold text-white truncate">{meta.title}</h2>
      </div>
      <p className="text-xs text-zinc-400 sm:ml-auto leading-snug max-w-2xl">{meta.subtitle}</p>
    </div>
  );
}
