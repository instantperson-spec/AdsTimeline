'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink, X, Check, LayoutList, GanttChart } from 'lucide-react';
import { CommercialShow } from '@/types/timeline';
import {
  buildClientPortalAbsoluteUrl,
  buildClientPortalPath,
  type ClientPortalViews,
} from '@/lib/client-portal-url';

interface ClientLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  shows: CommercialShow[];
  initialShowId: string;
  initialViews: ClientPortalViews;
}

export function ClientLinkModal({
  isOpen,
  onClose,
  shows,
  initialShowId,
  initialViews,
}: ClientLinkModalProps) {
  const [showId, setShowId] = useState(initialShowId);
  const [listOn, setListOn] = useState(initialViews.includes('list'));
  const [timelineOn, setTimelineOn] = useState(initialViews.includes('timeline'));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowId(initialShowId);
      setListOn(initialViews.includes('list'));
      setTimelineOn(initialViews.includes('timeline'));
      setCopied(false);
    }
  }, [isOpen, initialShowId, initialViews]);

  const views = useMemo((): ClientPortalViews => {
    const v: ClientPortalViews = [];
    if (listOn) v.push('list');
    if (timelineOn) v.push('timeline');
    return v;
  }, [listOn, timelineOn]);

  const viewsValid = views.length > 0;

  const path = useMemo(
    () =>
      viewsValid
        ? buildClientPortalPath({ selectedShowId: showId, views, shows })
        : '/client',
    [showId, views, shows, viewsValid]
  );

  const absoluteUrl = useMemo(() => {
    if (typeof window === 'undefined') return path;
    if (!viewsValid) return path;
    return buildClientPortalAbsoluteUrl(window.location.origin, {
      selectedShowId: showId,
      views,
      shows,
    });
  }, [path, showId, views, shows, viewsValid]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!viewsValid) return;
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy link:', absoluteUrl);
    }
  };

  const toggleList = () => {
    setListOn((prev) => {
      if (prev && !timelineOn) return true;
      return !prev;
    });
  };

  const toggleTimeline = () => {
    setTimelineOn((prev) => {
      if (prev && !listOn) return true;
      return !prev;
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-link-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 id="client-link-title" className="text-lg font-bold text-white">
              Client link
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Choose programme and one or both views — the client only sees what you select.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label htmlFor="client-link-show" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Programme on link
            </label>
            <select
              id="client-link-show"
              value={showId}
              onChange={(e) => setShowId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-white"
            >
              <option value="all">All programmes</option>
              {shows.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                  {s.code ? ` (${s.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-sm font-medium text-zinc-300 mb-1.5">
              Client sections <span className="text-zinc-500 font-normal">(at least one)</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={toggleList}
                aria-pressed={listOn}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                  listOn
                    ? 'bg-indigo-600 border-indigo-500 text-white ring-2 ring-indigo-400/40'
                    : 'bg-zinc-950 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                Spot list
              </button>
              <button
                type="button"
                onClick={toggleTimeline}
                aria-pressed={timelineOn}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                  timelineOn
                    ? 'bg-indigo-600 border-indigo-500 text-white ring-2 ring-indigo-400/40'
                    : 'bg-zinc-950 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                <GanttChart className="w-4 h-4" />
                Timeline (Gantt)
              </button>
            </div>
            {listOn && timelineOn && (
              <p className="text-xs text-zinc-500 mt-2">
                The client switches between list and timeline using tabs (each full screen).
              </p>
            )}
          </div>

          <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
              URL to share
            </p>
            <p className="text-xs text-zinc-300 font-mono break-all leading-relaxed">{absoluteUrl}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-5 py-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!viewsValid}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-sm font-bold text-white"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <a
            href={viewsValid ? path : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!viewsValid}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-zinc-100 ${
              !viewsValid ? 'pointer-events-none opacity-40' : ''
            }`}
          >
            <ExternalLink className="w-4 h-4 text-cyan-400" />
            Preview
          </a>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
