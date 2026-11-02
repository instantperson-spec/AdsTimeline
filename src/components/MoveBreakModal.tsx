'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import type { CommercialShow } from '@/types/timeline';

export type MoveBreakRequest = {
  sourceShowId: string;
  sourceBreakNumber: number;
  spotCount: number;
  targetShowId: string;
  targetBreakNumber: number;
};

interface MoveBreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  shows: CommercialShow[];
  request: MoveBreakRequest | null;
  onConfirm: (request: MoveBreakRequest) => void | Promise<void>;
  busy?: boolean;
}

export function MoveBreakModal({
  isOpen,
  onClose,
  shows,
  request,
  onConfirm,
  busy = false,
}: MoveBreakModalProps) {
  const sourceShow = shows.find((s) => s.id === request?.sourceShowId);
  const [targetShowId, setTargetShowId] = useState('');
  const [targetBreakNumber, setTargetBreakNumber] = useState(1);

  const targetShow = shows.find((s) => s.id === targetShowId);

  useEffect(() => {
    if (!isOpen || !request) return;
    const defaultTarget = shows.find((s) => s.id !== request.sourceShowId) ?? shows[0];
    setTargetShowId(defaultTarget?.id ?? '');
    setTargetBreakNumber(1);
  }, [isOpen, request?.sourceShowId, request?.sourceBreakNumber, shows]);

  const breakOptions = useMemo(() => {
    const count = targetShow?.breakCount ?? 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [targetShow?.breakCount]);

  useEffect(() => {
    if (targetBreakNumber > breakOptions.length) {
      setTargetBreakNumber(breakOptions.length || 1);
    }
  }, [breakOptions.length, targetBreakNumber]);

  if (!isOpen || !request || !sourceShow) return null;

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
        aria-labelledby="move-break-title"
        className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-5 text-zinc-100"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <h2 id="move-break-title" className="text-base font-bold text-white">
                Move break to programme
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                All {request.spotCount} spot(s) leave{' '}
                <span className="text-zinc-200">{sourceShow.title}</span> · Break{' '}
                {request.sourceBreakNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 disabled:opacity-50"
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
            Spots keep their order and append after any existing slots in the target break. Empty
            source break can be removed with −.
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
              void onConfirm({
                ...request,
                targetShowId,
                targetBreakNumber,
              })
            }
            className="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            {busy ? 'Moving…' : `Move ${request.spotCount} spot(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
