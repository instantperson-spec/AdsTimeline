'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Film, Loader2, X, ImageIcon } from 'lucide-react';
import {
  captureFrameFromVideoElement,
  captureVideoFrameAtTime,
  formatVideoTime,
  type VideoFrameSource,
} from '@/lib/extract-video-poster';

export type VideoFramePickerSource =
  | { mode: 'file'; file: File }
  /** Existing library asset — loads via same-origin preview stream (seek + canvas safe). */
  | { mode: 'asset'; assetId: string; filenameBase?: string };

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
  return {
    type: 'url',
    url: `/api/media/${encodeURIComponent(source.assetId)}/preview-video`,
  };
}

export function sourceKeyForPicker(source: VideoFramePickerSource | null): string | null {
  if (!source) return null;
  if (source.mode === 'file') {
    return `file:${source.file.name}:${source.file.size}:${source.file.lastModified}`;
  }
  return `asset:${source.assetId}`;
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
  const sourceRef = useRef(source);
  const userScrubbedRef = useRef(false);
  const objectUrlRef = useRef<string | null>(null);
  const captureSeqRef = useRef(0);
  const rangeId = useId();

  const sourceKey = useMemo(() => sourceKeyForPicker(source), [source]);

  const [duration, setDuration] = useState(0);
  const [timeSec, setTimeSec] = useState(initialTimeSec);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);

  sourceRef.current = source;

  const revokePreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const refreshPreview = useCallback(
    async (video: HTMLVideoElement) => {
      const seq = ++captureSeqRef.current;
      setCapturing(true);
      setLoadError(null);
      try {
        const blob = await captureFrameFromVideoElement(video);
        if (seq !== captureSeqRef.current) return;
        revokePreview();
        setPreviewUrl(URL.createObjectURL(blob));
      } catch (e) {
        if (seq !== captureSeqRef.current) return;
        setLoadError(e instanceof Error ? e.message : 'Could not capture frame');
      } finally {
        if (seq === captureSeqRef.current) setCapturing(false);
      }
    },
    [revokePreview]
  );

  useEffect(() => {
    if (!isOpen || !sourceKey) return;

    const activeSource = sourceRef.current;
    if (!activeSource) return;

    userScrubbedRef.current = false;
    captureSeqRef.current = 0;
    setLoadError(null);
    setDuration(0);
    setTimeSec(initialTimeSec);
    setVideoLoading(true);
    revokePreview();

    const video = videoRef.current;
    if (!video) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    video.pause();
    video.removeAttribute('poster');
    video.removeAttribute('crossorigin');

    if (activeSource.mode === 'file') {
      const url = URL.createObjectURL(activeSource.file);
      objectUrlRef.current = url;
      video.src = url;
    } else {
      video.src = `/api/media/${encodeURIComponent(activeSource.assetId)}/preview-video`;
    }
    video.load();

    const onLoaded = () => {
      setVideoLoading(false);
      const d = video.duration;
      setDuration(Number.isFinite(d) ? d : 0);

      if (userScrubbedRef.current) return;

      const start =
        Number.isFinite(d) && d > 0
          ? Math.min(initialTimeSec, Math.max(0, d - 0.05))
          : initialTimeSec;
      setTimeSec(start);
      video.currentTime = start;
    };

    const onSeeked = () => {
      setTimeSec(video.currentTime);
      void refreshPreview(video);
    };

    const onErr = () => {
      setVideoLoading(false);
      setLoadError('Could not load video for frame picker.');
    };

    video.addEventListener('loadeddata', onLoaded);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onErr);

    return () => {
      video.removeEventListener('loadeddata', onLoaded);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onErr);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      video.pause();
      video.removeAttribute('src');
      video.load();
      revokePreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when picker session / source changes
  }, [isOpen, sourceKey, initialTimeSec]);

  const handleRange = (value: number) => {
    userScrubbedRef.current = true;
    setTimeSec(value);
    const video = videoRef.current;
    if (video && !loadError) {
      video.currentTime = value;
    }
  };

  const handleConfirm = async () => {
    const activeSource = sourceRef.current;
    if (!activeSource || busy) return;
    setCapturing(true);
    setLoadError(null);
    try {
      const video = videoRef.current;
      const atSec = video?.currentTime ?? timeSec;
      const blob = video
        ? await captureFrameFromVideoElement(video)
        : await captureVideoFrameAtTime(toFrameSource(activeSource), atSec);
      const base =
        activeSource.mode === 'file'
          ? activeSource.file.name.replace(/\.[^.]+$/, '') || 'poster'
          : activeSource.filenameBase || 'poster';
      const file = new File([blob], `${base}-poster.jpg`, { type: 'image/jpeg' });
      await onConfirm(file, atSec);
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
          <div className="flex-1 min-w-0 bg-black flex flex-col relative">
            {videoLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
            )}
            <div className="relative w-full flex-1 min-h-[180px] max-h-[40vh] lg:max-h-none bg-black">
              <video
                key={sourceKey ?? 'none'}
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-contain"
                muted
                playsInline
                preload="auto"
              />
              {previewUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain bg-black pointer-events-none"
                />
              )}
            </div>
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
                step={0.04}
                value={Math.min(timeSec, maxTime)}
                onInput={(e) => handleRange(Number(e.currentTarget.value))}
                onChange={(e) => handleRange(Number(e.target.value))}
                disabled={busy || !!loadError || videoLoading}
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
              disabled={busy || capturing || !!loadError || videoLoading}
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
