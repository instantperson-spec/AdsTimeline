'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Plus, Pencil, Calendar, Film, Upload, Check } from 'lucide-react';
import { CommercialAd, CommercialShow, AdCategory } from '@/types/timeline';
import { computeAdStatus } from '@/lib/date-utils';

interface NewAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  shows: CommercialShow[];
  initialShowId?: string;
  initialBreakNumber?: number;
  editAd?: CommercialAd | null;
  onCreateAd: (ad: CommercialAd) => void;
  onUpdateAd?: (ad: CommercialAd) => void;
}

const CATEGORIES: AdCategory[] = [
  'Concert Tour',
  'Festival',
  'Album Launch',
  'Local Business',
  'Station Promo',
  'Special Event',
];

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
  const [category, setCategory] = useState<AdCategory>('Concert Tour');
  const [durationSec, setDurationSec] = useState(30);
  const [startDate, setStartDate] = useState('2026-10-25');
  const [endDate, setEndDate] = useState('2026-11-10');
  const [isTimeSensitive, setIsTimeSensitive] = useState(true);
  const [eventDate, setEventDate] = useState('');
  const [replacementAction, setReplacementAction] = useState('Replace with universal station filler after expiry.');
  const [frameGrabUrl, setFrameGrabUrl] = useState('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80');
  const [videoUrl, setVideoUrl] = useState('/samples/nature-clip.mp4');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (editAd) {
      setShowId(editAd.showId);
      setBreakNumber(editAd.breakNumber);
      setSlotIndex(editAd.slotIndex);
      setTitle(editAd.title);
      setAdvertiser(editAd.advertiser);
      setCategory(editAd.category);
      setDurationSec(editAd.durationSec);
      setStartDate(editAd.startDate);
      setEndDate(editAd.endDate);
      setIsTimeSensitive(editAd.isTimeSensitive);
      setEventDate(editAd.eventDate || '');
      setReplacementAction(editAd.replacementAction);
      setFrameGrabUrl(editAd.frameGrabUrl);
      setVideoUrl(editAd.videoUrl || '/samples/nature-clip.mp4');
      setNotes(editAd.notes || '');
      return;
    }

    if (initialShowId) setShowId(initialShowId);
    if (initialBreakNumber) setBreakNumber(initialBreakNumber);
  }, [isOpen, editAd, initialShowId, initialBreakNumber]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    if (file.type.startsWith('video/')) {
      setVideoUrl(objectUrl);
      // Generate fallback poster if needed
    } else if (file.type.startsWith('image/')) {
      setFrameGrabUrl(objectUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !advertiser.trim()) return;

    const payload: CommercialAd = {
      id: editAd?.id || `ad-${Date.now()}`,
      showId,
      showTitle: selectedShow?.title || '',
      breakNumber,
      slotIndex,
      title: title.trim(),
      advertiser: advertiser.trim(),
      category,
      durationSec,
      startDate,
      endDate,
      frameGrabUrl:
        frameGrabUrl.trim() ||
        'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
      videoUrl: videoUrl.trim() || '/samples/nature-clip.mp4',
      isTimeSensitive,
      eventDate: eventDate.trim() || undefined,
      replacementAction: replacementAction.trim() || 'Replace with station promo.',
      notes: notes.trim() || undefined,
      status: editAd?.status || 'active',
      takenOffAt: editAd?.takenOffAt,
      replacementAdTitle: editAd?.replacementAdTitle,
      createdAt: editAd?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    payload.status = computeAdStatus(payload);

    if (isEditMode && onUpdateAd) {
      onUpdateAd(payload);
    } else {
      onCreateAd(payload);
    }
    onClose();

    if (!isEditMode) {
      setTitle('');
      setAdvertiser('');
      setEventDate('');
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
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              {isEditMode ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 id="new-ad-modal-title" className="text-sm font-bold text-zinc-100">
                {isEditMode ? 'Edit commercial spot' : 'Add new ad / time-sensitive spot'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {isEditMode
                  ? 'Update break slot, flight dates, and pull instructions'
                  : 'Set break slot and flight dates to control when the spot must be pulled'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Show & Break selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                TV show *
              </label>
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
              <label className="block text-zinc-300 font-semibold mb-1">
                Commercial break *
              </label>
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
              <label className="block text-zinc-300 font-semibold mb-1">
                Slot position
              </label>
              <select
                value={slotIndex}
                onChange={(e) => setSlotIndex(parseInt(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value={1}>Slot 1 (Opens break)</option>
                <option value={2}>Slot 2</option>
                <option value={3}>Slot 3</option>
                <option value={4}>Slot 4</option>
              </select>
            </div>
          </div>

          {/* Title & Advertiser */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Ad name / spot title *
              </label>
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

          {/* Category & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Ad category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AdCategory)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Spot duration
              </label>
              <select
                value={durationSec}
                onChange={(e) => setDurationSec(parseInt(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value={15}>15 seconds</option>
                <option value={20}>20 seconds</option>
                <option value={30}>30 seconds (standard)</option>
                <option value={45}>45 seconds</option>
                <option value={60}>60 seconds</option>
              </select>
            </div>
          </div>

          {/* Critical Flight Dates: Start -> End Date (When to take off!) */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <Calendar className="w-4 h-4" />
              <span>On-air flight dates</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 text-[11px] mb-1">
                  Start date (on air from)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-rose-300 font-bold text-[11px] mb-1">
                  PULL DATE (take off air by!) *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-rose-500/70 rounded-lg px-3 py-1.5 text-rose-200 focus:outline-none focus:border-rose-400 font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isTimeSensitive"
                checked={isTimeSensitive}
                onChange={(e) => setIsTimeSensitive(e.target.checked)}
                className="rounded border-zinc-700 text-indigo-600 focus:ring-0 w-4 h-4"
              />
              <label htmlFor="isTimeSensitive" className="text-zinc-300 font-medium">
                Time-sensitive ad (e.g. fixed concert or festival date)
              </label>
            </div>

            {isTimeSensitive && (
              <div>
                <label className="block text-zinc-400 text-[11px] mb-1">
                  Event date & venue (visible to traffic manager)
                </label>
                <input
                  type="text"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  placeholder="e.g. 15 November 2026 — TF Royal Hotel Castlebar"
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-1.5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Replacement Action Instruction */}
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Replacement after expiry (what to run after pull date?)
            </label>
            <input
              type="text"
              value={replacementAction}
              onChange={(e) => setReplacementAction(e.target.value)}
              placeholder="e.g. Swap to IWMTV station promo 30s immediately after 5 November"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Video Proxy & Frame Grab Upload */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-300 flex items-center space-x-1.5">
                <Film className="w-4 h-4 text-indigo-400" />
                <span>Frame grab & preview video (20–30s H.264)</span>
              </span>
              <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-indigo-300 font-semibold text-[11px] flex items-center space-x-1">
                <Upload className="w-3 h-3" />
                <span>Upload file (MP4 / JPG)</span>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div>
                <label className="text-zinc-400 block mb-1">Frame grab URL (poster)</label>
                <input
                  type="text"
                  value={frameGrabUrl}
                  onChange={(e) => setFrameGrabUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Preview video path</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
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

