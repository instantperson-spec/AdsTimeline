'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Plus, Pencil, Calendar, Film, Upload, Check } from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import { computeAdStatus, getTodayString } from '@/lib/date-utils';
import { hasFlightWindow, recurrentFlightStorageDates } from '@/lib/ad-flight';
import { isVideoFile, readVideoMetadata } from '@/lib/video-meta';
import { fetchMediaAssets } from '@/lib/timeline-api';
import { createMediaAssetFromFiles } from '@/lib/media-client-upload';
import type { MediaAsset } from '@/types/media';

interface NewAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  shows: CommercialShow[];
  initialShowId?: string;
  initialBreakNumber?: number;
  editAd?: CommercialAd | null;
  onCreateAd: (ad: CommercialAd) => void | Promise<void>;
  onUpdateAd?: (ad: CommercialAd) => void | Promise<void>;
}

export function NewAdModal({
  isOpen,
  onClose,
  shows,
  initialShowId,
  initialBreakNumber,
  editAd,
  onCreateAd,
  onUpdateAd,
}: NewAdModalProps) {
  const isEditMode = Boolean(editAd);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const [showId, setShowId] = useState(initialShowId || shows[0]?.id || '');
  const [breakNumber, setBreakNumber] = useState(initialBreakNumber || 1);
  const [slotIndex, setSlotIndex] = useState(1);
  const [title, setTitle] = useState('');
  const [advertiser, setAdvertiser] = useState('');
  const [durationSec, setDurationSec] = useState(30);
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState('2026-11-10');
  const [isTimeSensitive, setIsTimeSensitive] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [mediaAssetId, setMediaAssetId] = useState<string>('');
  const [mediaLibrary, setMediaLibrary] = useState<MediaAsset[]>([]);
  const [frameGrabUrl, setFrameGrabUrl] = useState('/placeholder-poster.svg');
  const [videoUrl, setVideoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [compressProgress, setCompressProgress] = useState<number | null>(null);
  const [compressWebVideo, setCompressWebVideo] = useState(true);
  const [durationFromFile, setDurationFromFile] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (editAd) {
      setShowId(editAd.showId);
      setBreakNumber(editAd.breakNumber);
      setSlotIndex(editAd.slotIndex);
      setTitle(editAd.title);
      setAdvertiser(editAd.advertiser);
      setDurationSec(editAd.durationSec);
      setIsTimeSensitive(editAd.isTimeSensitive);
      if (hasFlightWindow(editAd)) {
        setStartDate(editAd.startDate);
        setEndDate(editAd.endDate);
      } else {
        setStartDate(getTodayString());
        setEndDate('');
      }
      setEventDate(editAd.eventDate || '');
      setMediaAssetId(editAd.mediaAssetId || '');
      setFrameGrabUrl(editAd.frameGrabUrl);
      setVideoUrl(editAd.videoUrl || '');
      setNotes(editAd.notes || '');
      setDurationFromFile(false);
      return;
    }

    if (initialShowId) setShowId(initialShowId);
    if (initialBreakNumber) setBreakNumber(initialBreakNumber);
  }, [isOpen, editAd, initialShowId, initialBreakNumber]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchMediaAssets();
        if (!cancelled) setMediaLibrary(items);
      } catch {
        if (!cancelled) setMediaLibrary([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const selectedMedia = mediaLibrary.find((m) => m.id === mediaAssetId);

  useEffect(() => {
    if (selectedMedia) {
      setFrameGrabUrl(selectedMedia.posterUrl);
      setVideoUrl(selectedMedia.videoUrl || '');
    }
  }, [selectedMedia]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const selectedShow = shows.find((s) => s.id === showId) || shows[0];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    setCompressProgress(null);
    try {
      if (isVideoFile(file)) {
        const meta = await readVideoMetadata(file);
        if (meta.durationSec != null) {
          setDurationSec(meta.durationSec);
          setDurationFromFile(true);
        }
      }

      const created = await createMediaAssetFromFiles(file, {
        label: title.trim() || advertiser.trim() || undefined,
        compressWebVideo,
        onCompressProgress: setCompressProgress,
      });
      setMediaLibrary((prev) => [created, ...prev.filter((m) => m.id !== created.id)]);
      setMediaAssetId(created.id);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setCompressProgress(null);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !advertiser.trim()) return;
    const duration = Math.min(600, Math.max(1, Math.round(durationSec) || 30));

    const flight = isTimeSensitive
      ? { startDate: startDate.trim(), endDate: endDate.trim() }
      : recurrentFlightStorageDates();
    if (isTimeSensitive && (!flight.startDate || !flight.endDate)) return;

    const payload: CommercialAd = {
      id: editAd?.id || `ad-${Date.now()}`,
      showId,
      showTitle: selectedShow?.title || '',
      breakNumber,
      slotIndex,
      title: title.trim(),
      advertiser: advertiser.trim(),
      durationSec: duration,
      startDate: flight.startDate,
      endDate: flight.endDate,
      frameGrabUrl: frameGrabUrl.trim() || '/placeholder-poster.svg',
      videoUrl: videoUrl.trim() || undefined,
      mediaAssetId: mediaAssetId || undefined,
      isTimeSensitive,
      eventDate: eventDate.trim() || undefined,
      replacementAction: editAd?.replacementAction ?? '',
      notes: notes.trim() || undefined,
      status: editAd?.status || 'active',
      takenOffAt: editAd?.takenOffAt,
      replacementAdTitle: editAd?.replacementAdTitle,
      createdAt: editAd?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    payload.status = computeAdStatus(payload);

    try {
      if (isEditMode && onUpdateAd) {
        await onUpdateAd(payload);
      } else {
        await onCreateAd(payload);
      }
      onClose();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Save failed');
    }

    if (!isEditMode) {
      setTitle('');
      setAdvertiser('');
      setEventDate('');
      setDurationFromFile(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="new-ad-modal-title"
      className="backdrop:bg-black/80 backdrop:backdrop-blur-sm bg-transparent p-0 m-auto max-w-2xl w-full focus:outline-none overscroll-contain"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 text-zinc-100 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              {isEditMode ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 id="new-ad-modal-title" className="text-sm font-bold text-zinc-100">
                {isEditMode ? 'Edit commercial spot' : 'Add new ad'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                Break slot, flight dates, and media preview
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">TV show *</label>
              <select
                value={showId}
                onChange={(e) => setShowId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                {shows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Commercial break *</label>
              <select
                value={breakNumber}
                onChange={(e) => setBreakNumber(parseInt(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
              >
                {Array.from({ length: selectedShow?.breakCount || 3 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Break {num}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Slot position</label>
              <select
                value={slotIndex}
                onChange={(e) => setSlotIndex(parseInt(e.target.value))}
                className="w-full bg-z-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value={1}>Slot 1 (Opens break)</option>
                <option value={2}>Slot 2</option>
                <option value={3}>Slot 3</option>
                <option value={4}>Slot 4</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Ad name / spot title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Live Concert Tour: Daniel O'Donnell"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Advertiser / promoter / client *
              </label>
              <input
                type="text"
                value={advertiser}
                onChange={(e) => setAdvertiser(e.target.value)}
                placeholder="e.g. Mayo Arts Centre / Sony Music"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Spot duration (seconds)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={600}
                step={1}
                value={durationSec}
                onChange={(e) => {
                  setDurationFromFile(false);
                  setDurationSec(parseInt(e.target.value, 10) || 0);
                }}
                className="w-28 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                required
              />
              <span className="text-zinc-500">s</span>
              {durationFromFile && (
                <span className="text-[11px] text-emerald-400/90">From uploaded video</span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Type manually or upload an MP4 — duration is read from the file when possible.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <Calendar className="w-4 h-4" />
              <span>Spot type</span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isTimeSensitive"
                checked={isTimeSensitive}
                onChange={(e) => setIsTimeSensitive(e.target.checked)}
                className="rounded border-zinc-700 text-indigo-600 focus:ring-0 w-4 h-4"
              />
              <label htmlFor="isTimeSensitive" className="text-zinc-300 font-medium">
                Time-sensitive flight (e.g. concert tour — start and end on air)
              </label>
            </div>

            {!isTimeSensitive ? (
              <p className="text-xs text-sky-300/90 leading-snug">
                Permanent / recurrent sponsor spot — fixed break slot, no start or pull date (e.g.
                station promo).
              </p>
            ) : (
              <>
                <p className="text-xs text-zinc-400 leading-snug">
                  Set the on-air window, e.g. 4 January through 7 March. Pull alerts use the end
                  date.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 text-[11px] mb-1">
                      Start date (on air from) *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                      required={isTimeSensitive}
                    />
                  </div>
                  <div>
                    <label className="block text-rose-300 font-bold text-[11px] mb-1">
                      End date (pull from air by) *
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-rose-500/70 rounded-lg px-3 py-1.5 text-rose-200 focus:outline-none focus:border-rose-400 font-mono font-bold"
                      required={isTimeSensitive}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1">
                    Event note (optional)
                  </label>
                  <input
                    type="text"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder="e.g. Castlebar dates — TF Royal 15 Nov"
                    className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-1.5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-semibold text-zinc-300 flex items-center space-x-1.5">
                <Film className="w-4 h-4 text-indigo-400" />
                <span>Cloud media (JPG or MP4 + snap)</span>
              </span>
              <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-indigo-300 font-semibold text-[11px] flex items-center space-x-1">
                <Upload className="w-3 h-3" />
                <span>
                  {uploading
                    ? compressProgress != null
                      ? `Converting… ${Math.round(compressProgress * 100)}%`
                      : 'Uploading…'
                    : 'New upload'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            <p className="text-[11px] text-zinc-500 leading-snug">
              Screen grab only is enough for many spots. MP4 uploads get an auto poster frame. Pick
              existing media to reuse across breaks.
            </p>

            {uploadError && <p className="text-xs text-rose-400">{uploadError}</p>}

            <label className="flex items-center gap-2 text-[11px] text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={compressWebVideo}
                onChange={(e) => setCompressWebVideo(e.target.checked)}
                disabled={uploading}
                className="rounded border-zinc-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
              />
              Compress large MP4 to ~480p before upload
            </label>

            <div>
              <label className="text-zinc-400 block mb-1 text-[11px]">From media library</label>
              <select
                value={mediaAssetId}
                onChange={(e) => {
                  const id = e.target.value;
                  setMediaAssetId(id);
                  if (!id) {
                    setFrameGrabUrl('/placeholder-poster.svg');
                    setVideoUrl('');
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-2.5 py-2 text-sm text-zinc-200"
              >
                <option value="">— No linked media —</option>
                {mediaLibrary.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.kind === 'image_only' ? '[JPG] ' : '[Video] '}
                    {m.label} ({m.referenceCount} spots)
                  </option>
                ))}
              </select>
            </div>

            {selectedMedia && (
              <div className="flex gap-3 items-start">
                <div className="w-28 aspect-video rounded-lg overflow-hidden bg-black ring-1 ring-zinc-800 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedMedia.posterUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="text-[11px] text-zinc-400 space-y-1 min-w-0">
                  <p className="text-zinc-200 font-semibold truncate">{selectedMedia.label}</p>
                  <p>
                    Type:{' '}
                    {selectedMedia.kind === 'image_only' ? 'Screen grab only' : 'Preview + poster'}
                  </p>
                  <p className="font-mono truncate">{selectedMedia.id}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isEditMode ? 'Save changes' : 'Add to log'}</span>
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
