'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAppDialog } from '@/components/app-dialog/AppDialogProvider';
import { Radio, Save, Loader2, Plus, Trash2, Tv } from 'lucide-react';
import type { CommercialShow } from '@/types/timeline';
import { BroadcastWeekdayPicker } from '@/components/BroadcastWeekdayPicker';
import { formatBroadcastWeekdays, getShowBroadcastWeekdays } from '@/lib/show-broadcast';

const SHOW_COLORS: CommercialShow['color'][] = [
  'emerald',
  'amber',
  'cyan',
  'purple',
  'rose',
  'indigo',
];

type Draft = {
  title: string;
  code: string;
  channel: string;
  broadcastSchedule: string;
  broadcastWeekdays: number[];
  breakCount: number;
  color: CommercialShow['color'];
  description: string;
};

function draftFromShow(show: CommercialShow): Draft {
  return {
    title: show.title,
    code: show.code,
    channel: show.channel,
    broadcastSchedule: show.broadcastSchedule,
    broadcastWeekdays: getShowBroadcastWeekdays(show),
    breakCount: show.breakCount,
    color: show.color,
    description: show.description ?? '',
  };
}

function draftsEqual(show: CommercialShow, d: Draft): boolean {
  const savedDays = getShowBroadcastWeekdays(show);
  const daysEqual =
    savedDays.length === d.broadcastWeekdays.length &&
    savedDays.every((v, i) => v === d.broadcastWeekdays[i]);
  return (
    daysEqual &&
    show.title === d.title.trim() &&
    show.code === d.code.trim().toUpperCase() &&
    show.channel === d.channel.trim() &&
    show.broadcastSchedule === d.broadcastSchedule.trim() &&
    show.breakCount === d.breakCount &&
    show.color === d.color &&
    (show.description ?? '') === d.description.trim()
  );
}

interface ShowProgrammesPanelProps {
  shows: CommercialShow[];
  selectedShowId: string;
  onSaveShow: (showId: string, patch: Partial<CommercialShow>) => Promise<void>;
  onDeleteShow: (showId: string) => Promise<void>;
  onOpenNewShow: () => void;
}

export function ShowProgrammesPanel({
  shows,
  selectedShowId,
  onSaveShow,
  onDeleteShow,
  onOpenNewShow,
}: ShowProgrammesPanelProps) {
  const activeShows = useMemo(
    () => (selectedShowId === 'all' ? shows : shows.filter((s) => s.id === selectedShowId)),
    [shows, selectedShowId]
  );

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dialog = useAppDialog();

  useEffect(() => {
    const next: Record<string, Draft> = {};
    for (const show of activeShows) {
      next[show.id] = draftFromShow(show);
    }
    setDrafts(next);
  }, [shows, selectedShowId]);

  const updateDraft = (showId: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({
      ...prev,
      [showId]: { ...prev[showId], ...patch },
    }));
  };

  const handleSave = async (show: CommercialShow) => {
    const d = drafts[show.id];
    if (!d) return;
    if (!d.title.trim()) {
      setError('Programme title is required.');
      return;
    }
    if (d.broadcastWeekdays.length === 0) {
      setError('Select at least one broadcast day (TX on the timeline).');
      return;
    }
    setError(null);
    setSavingId(show.id);
    try {
      await onSaveShow(show.id, {
        title: d.title.trim(),
        code: d.code.trim().toUpperCase() || d.title.trim().substring(0, 4).toUpperCase(),
        channel: d.channel.trim(),
        broadcastSchedule: d.broadcastSchedule.trim(),
        broadcastWeekdays: d.broadcastWeekdays,
        breakCount: d.breakCount,
        color: d.color,
        description: d.description.trim() || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save programme.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (show: CommercialShow) => {
    const d = drafts[show.id];
    const label = d?.title.trim() || show.title;
    const ok = await dialog.confirm({
      title: 'Delete programme',
      message: `Delete programme "${label}" and all of its commercial spots?\n\nThis cannot be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    setError(null);
    setDeletingId(show.id);
    try {
      await onDeleteShow(show.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete programme.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 max-w-4xl mx-auto w-full overflow-y-auto min-h-0">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-300">
            <Radio className="w-5 h-5" />
            <h2 className="text-lg font-bold text-white">Programmes</h2>
          </div>
          <p className="text-sm text-zinc-400 mt-1 leading-relaxed max-w-xl">
            Manage TV programmes stored in the database: name, channel, air days, slot description,
            breaks, and colour. Broadcast days drive <span className="font-bold text-violet-300">TX</span>{' '}
            markers on the Gantt timeline.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewShow}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/25 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add programme
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-6">
        {activeShows.map((show) => {
          const draft = drafts[show.id];
          const dirty = draft ? !draftsEqual(show, draft) : false;
          const busy = savingId === show.id || deletingId === show.id;

          return (
            <section
              key={show.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg space-y-4"
            >
              <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      show.color === 'emerald'
                        ? 'bg-emerald-400'
                        : show.color === 'amber'
                          ? 'bg-amber-400'
                          : show.color === 'cyan'
                            ? 'bg-cyan-400'
                            : show.color === 'purple'
                              ? 'bg-purple-400'
                              : show.color === 'rose'
                                ? 'bg-rose-400'
                                : 'bg-indigo-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500 font-bold">
                      Programme ID
                    </p>
                    <p className="text-xs text-zinc-500 font-mono truncate">{show.id}</p>
                  </div>
                </div>
                <span className="text-[11px] text-zinc-400 text-right shrink-0">
                  TX days:{' '}
                  <span className="text-violet-200 font-semibold">
                    {formatBroadcastWeekdays(
                      draft?.broadcastWeekdays ?? getShowBroadcastWeekdays(show)
                    )}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Programme title *
                  </label>
                  <input
                    type="text"
                    value={draft?.title ?? show.title}
                    onChange={(e) => updateDraft(show.id, { title: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                    disabled={busy}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Show code</label>
                  <input
                    type="text"
                    value={draft?.code ?? show.code}
                    onChange={(e) => updateDraft(show.id, { code: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-violet-500 uppercase"
                    disabled={busy}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Commercial breaks
                  </label>
                  <select
                    value={draft?.breakCount ?? show.breakCount}
                    onChange={(e) =>
                      updateDraft(show.id, { breakCount: parseInt(e.target.value, 10) })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                    disabled={busy}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'break' : 'breaks'}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    To remove a break and shift spots, use Edit panel.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Channel</label>
                  <input
                    type="text"
                    value={draft?.channel ?? show.channel}
                    onChange={(e) => updateDraft(show.id, { channel: e.target.value })}
                    placeholder="e.g. Faith World TV"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                    disabled={busy}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    Broadcast days (TX on Gantt) *
                  </label>
                  {draft && (
                    <BroadcastWeekdayPicker
                      value={draft.broadcastWeekdays}
                      onChange={(days) => updateDraft(show.id, { broadcastWeekdays: days })}
                      disabled={busy}
                    />
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Air time / slot (display text)
                  </label>
                  <input
                    type="text"
                    value={draft?.broadcastSchedule ?? show.broadcastSchedule}
                    onChange={(e) => updateDraft(show.id, { broadcastSchedule: e.target.value })}
                    placeholder="e.g. Wednesdays 22:00 GMT — Faith World TV"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                    disabled={busy}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Programme notes
                  </label>
                  <textarea
                    value={draft?.description ?? show.description ?? ''}
                    onChange={(e) => updateDraft(show.id, { description: e.target.value })}
                    placeholder="Optional internal description for traffic team…"
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500 resize-none"
                    disabled={busy}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    Timeline colour
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SHOW_COLORS.map((c) => {
                      const selected = (draft?.color ?? show.color) === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          disabled={busy}
                          onClick={() => updateDraft(show.id, { color: c })}
                          className={`w-8 h-8 rounded-full transition-transform capitalize text-[9px] font-bold ${
                            selected ? 'scale-110 ring-2 ring-white shadow-lg' : 'opacity-60 hover:opacity-100'
                          } ${
                            c === 'emerald'
                              ? 'bg-emerald-500'
                              : c === 'amber'
                                ? 'bg-amber-500'
                                : c === 'cyan'
                                  ? 'bg-cyan-500'
                                  : c === 'purple'
                                    ? 'bg-purple-500'
                                    : c === 'rose'
                                      ? 'bg-rose-500'
                                      : 'bg-indigo-500'
                          }`}
                          title={c}
                          aria-label={`Colour ${c}`}
                          aria-pressed={selected}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDelete(show)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-rose-300 hover:bg-rose-950/50 border border-transparent hover:border-rose-500/40 transition-colors disabled:opacity-50"
                >
                  {deletingId === show.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete programme
                </button>

                <button
                  type="button"
                  disabled={!dirty || busy}
                  onClick={() => handleSave(show)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    dirty
                      ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {savingId === show.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save changes
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {activeShows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800 rounded-2xl">
          <Tv className="w-10 h-10 text-zinc-600 mb-3" />
          <p className="text-sm text-zinc-400">No programmes yet.</p>
          <button
            type="button"
            onClick={onOpenNewShow}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            Add your first programme
          </button>
        </div>
      )}
    </div>
  );
}
