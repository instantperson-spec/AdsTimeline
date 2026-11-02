'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, Copy } from 'lucide-react';
import type { CommercialAd, CommercialShow } from '@/types/timeline';

export type CopySpotTarget = {
  targetShowId: string;
  targetBreakNumber: number;
};

interface CopySpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  shows: CommercialShow[];
  spot: CommercialAd | null;
  onConfirm: (target: CopySpotTarget) => void | Promise<void>;
  busy?: boolean;
}

export function CopySpotModal({
  isOpen,
  onClose,
  shows,
  spot,
  onConfirm,
  busy = false,
}: CopySpotModalProps) {
  const sourceShow = shows.find((s) => s.id === spot?.showId);
  const [targetShowId, setTargetShowId] = useState('');
  const [targetBreakNumber, setTargetBreakNumber] = useState(1);

  const targetShow = shows.find((s) => s.id === targetShowId);

  useEffect(() => {
    if (!isOpen || !spot) return;
    setTargetShowId(spot.showId);
    setTargetBreakNumber(spot.breakNumber);
  }, [isOpen, spot?.id, spot?.showId, spot?.breakNumber]);

  const breakOptions = useMemo(() => {
    const count = targetShow?.breakCount ?? 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [targetShow?.breakCount]);

  useEffect(() => {
    if (targetBreakNumber > breakOptions.length) {
      setTargetBreakNumber(breakOptions.length || 1);
    }
  }, [breakOptions.length, targetBreakNumber]);

  if (!isOpen || !spot || !sourceShow) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="copy-spot-title"
        className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-5 text-zinc-100"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <Copy className="w-5 h-5 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <h2 id="copy-spot-title" className="text-base font-bold text-white">
                Duplicate spot
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                Copy &quot;{spot.title}&quot; — original stays in {sourceShow.title} · Break{' '}
                {spot.breakNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 shrink-0 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-1">
              Target programme
            </label>
            <select
              value={targetShowId}
              onChange={(e) => setTargetShowId(e.target.value)}
              disabled={busy}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
            >
              {shows.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-1">
              Target commercial break
            </label>
            <select
              value={targetBreakNumber}
              onChange={(e) => setTargetBreakNumber(parseInt(e.target.value, 10))}
              disabled={busy}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 font-mono text-zinc-100 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
            >
              {breakOptions.map((n) => (
                <option key={n} value={n}>
                  Break {n}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-zinc-500 leading-snug">
            Creates a new slot with the same media and flight settings. The copy appends after
            existing slots in the target break.
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !targetShowId}
            onClick={() =>
              void onConfirm({ targetShowId, targetBreakNumber })
            }
            className="px-4 py-2 rounded-xl text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/25 disabled:opacity-50"
          >
            {busy ? 'Copying…' : 'Duplicate spot'}
          </button>
        </div>
      </div>
    </div>
  );
}
