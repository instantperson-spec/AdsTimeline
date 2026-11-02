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
  const dialogRef = React.useRef<HTMLDialogElement | null>(null);
  const sourceShow = shows.find((s) => s.id === request?.sourceShowId);
  const [targetShowId, setTargetShowId] = useState('');
  const [targetBreakNumber, setTargetBreakNumber] = useState(1);

  const targetShow = shows.find((s) => s.id === targetShowId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && request) {
      if (!dialog.open) dialog.showModal();
      const defaultTarget = shows.find((s) => s.id !== request.sourceShowId) ?? shows[0];
      setTargetShowId(defaultTarget?.id ?? '');
      setTargetBreakNumber(1);
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen, request, shows]);

  const breakOptions = useMemo(() => {
    const count = targetShow?.breakCount ?? 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [targetShow?.breakCount]);

  useEffect(() => {
    if (targetBreakNumber > breakOptions.length) {
      setTargetBreakNumber(breakOptions.length || 1);
    }
  }, [breakOptions.length, targetBreakNumber]);

  if (!request || !sourceShow) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="backdrop:bg-black/80 backdrop:backdrop-blur-sm bg-transparent p-0 m-auto max-w-md w-full focus:outline-none"
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-5 text-zinc-100">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-white">Move break to programme</h2>
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
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400"
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
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
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
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 font-mono text-zinc-100 focus:outline-none focus:border-indigo-500"
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
            className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-300 hover:bg-zinc-800"
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
    </dialog>
  );
}
