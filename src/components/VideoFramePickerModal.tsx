'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Film, Loader2, X, ImageIcon } from 'lucide-react';
import {
  captureFrameFromVideoElement,
  captureVideoFrameAtTime,
  formatVideoTime,
  type VideoFrameSource,
} from '@/lib/extract-video-poster';

export type VideoFramePickerSource =
  | { mode: 'file'; file: File }
  | { mode: 'url'; url: string; filenameBase?: string };

interface VideoFramePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: VideoFramePickerSource | null;
  title?: string;
  confirmLabel?: string;
  busy?: boolean;
  initialTimeSec?: number;
  onConfirm: (posterFile: File, timeSec: number) => void | Promise<void>;
}

function toFrameSource(source: VideoFramePickerSource): VideoFrameSource {
  if (source.mode === 'file') {
    return { type: 'file', file: source.file };
  }
  return { type: 'url', url: source.url };
}

export function VideoFramePickerModal({
  isOpen,
  onClose,
  source,
  title = 'Choose poster frame',
  confirmLabel = 'Use this frame',
  busy = false,
  initialTimeSec = 1,
  onConfirm,
}: VideoFramePickerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rangeId = useId();
  const [duration, setDuration] = useState(0);
  const [timeSec, setTimeSec] = useState(initialTimeSec);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const revokePreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const refreshPreview = useCallback(async (video: HTMLVideoElement) => {
    setCapturing(true);
    setLoadError(null);
    try {
      const blob = await captureFrameFromVideoElement(video);
      revokePreview();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not capture frame');
    } finally {
      setCapturing(false);
    }
  }, [revokePreview]);

  useEffect(() => {
    if (!isOpen || !source) return;

    setLoadError(null);
    setDuration(0);
    setTimeSec(initialTimeSec);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    revokePreview();

    const video = videoRef.current;
    if (!video) return;

    if (source.mode === 'file') {
      const url = URL.createObjectURL(source.file);
      objectUrlRef.current = url;
      video.removeAttribute('crossorigin');
      video.src = url;
    } else {
      video.crossOrigin = 'anonymous';
      video.src = source.url;
    }

    const onMeta = () => {
      const d = video.duration;
      setDuration(Number.isFinite(d) ? d : 0);
      const start = Number.isFinite(d) && d > 0 ? Math.min(initialTimeSec, d * 0.5) : initialTimeSec;
      setTimeSec(start);
      video.currentTime = start;
    };
    const onErr = () => {
      setLoadError(
        source.mode === 'url'
          ? 'Could not load video (check network or CORS).'
          : 'Could not load video file.'
      );
    };

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('error', onErr);

    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('error', onErr);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      video.removeAttribute('src');
      video.load();
      revokePreview();
    };
  }, [isOpen, source, initialTimeSec, revokePreview]);

  useEffect(() => {
    if (!isOpen || !source) return;
    const video = videoRef.current;
    if (!video || loadError) return;

    const onSeeked = () => {
      void refreshPreview(video);
    };

    video.addEventListener('seeked', onSeeked);
    return () => video.removeEventListener('seeked', onSeeked);
  }, [isOpen, source, loadError, refreshPreview]);

  const handleRange = (value: number) => {
    setTimeSec(value);
    const video = videoRef.current;
    if (video && !loadError) {
      video.currentTime = value;
    }
  };

  const handleConfirm = async () => {
    if (!source || busy) return;
    setCapturing(true);
    setLoadError(null);
    try {
      const video = videoRef.current;
      const blob = video
        ? await captureFrameFromVideoElement(video)
        : await captureVideoFrameAtTime(toFrameSource(source), timeSec);
      const base =
        source.mode === 'file'
          ? source.file.name.replace(/\.[^.]+$/, '') || 'poster'
          : source.filenameBase || 'poster';
      const file = new File([blob], `${base}-poster.jpg`, { type: 'image/jpeg' });
      await onConfirm(file, timeSec);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not save frame');
    } finally {
      setCapturing(false);
    }
  };

  if (!isOpen || !source) return null;

  const maxTime = duration > 0 ? duration : Math.max(timeSec, 30);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85"
      role="dialog"
      aria-modal="true"
      aria-labelledby="frame-picker-title"
    >
      <div className="w-full max-w-4xl rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Film className="w-5 h-5 text-indigo-400 shrink-0" />
            <h2 id="frame-picker-title" className="font-bold text-white truncate">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row min-h-0 flex-1 overflow-hidden">
          <div className="flex-1 min-w-0 bg-black flex flex-col">
            <video
              ref={videoRef}
              className="w-full max-h-[40vh] lg:max-h-none lg:flex-1 object-contain bg-black"
              muted
              playsInline
              preload="metadata"
            />
            <div className="px-4 py-3 border-t border-zinc-800 space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <label htmlFor={rangeId}>Scrub to frame</label>
                <span>
                  {formatVideoTime(timeSec)}
                  {duration > 0 ? ` / ${formatVideoTime(duration)}` : ''}
                </span>
              </div>
              <input
                id={rangeId}
                type="range"
                min={0}
                max={maxTime}
                step={0.05}
                value={Math.min(timeSec, maxTime)}
                onChange={(e) => handleRange(Number(e.target.value))}
                disabled={busy || !!loadError}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-zinc-800 p-4 flex flex-col gap-3 shrink-0">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              Poster preview
            </p>
            <div className="aspect-video rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center relative">
              {previewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs text-zinc-500 px-3 text-center">
                  {capturing ? 'Generating preview…' : 'Move the slider to pick a frame'}
                </span>
              )}
              {capturing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                </div>
              )}
            </div>
            {loadError && <p className="text-xs text-rose-400">{loadError}</p>}
            <p className="text-[11px] text-zinc-500 leading-snug">
              This JPG becomes the screen grab on spots linked to this media (cards, client link,
              cue sheet).
            </p>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={busy || capturing || !!loadError}
              className="mt-auto w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2"
            >
              {(busy || capturing) && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
