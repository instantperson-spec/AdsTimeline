'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Calendar,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Film,
  Tv,
  Trash2,
  Pencil,
} from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import { formatDaysRemainingText, formatDateDisplay, tracksPullDeadline } from '@/lib/date-utils';

interface AdPreviewModalProps {
  ad: CommercialAd | null;
  shows: CommercialShow[];
  onClose: () => void;
  onTakeOffAd?: (adId: string, note?: string) => void;
  onRestoreAd?: (adId: string) => void;
  onDeleteAd?: (adId: string) => void;
  onEditAd?: (ad: CommercialAd) => void;
  isClientView?: boolean;
}

export function AdPreviewModal({
  ad,
  shows,
  onClose,
  onTakeOffAd,
  onRestoreAd,
  onDeleteAd,
  onEditAd,
  isClientView = false,
}: AdPreviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeMediaTab, setActiveMediaTab] = useState<'video' | 'frame'>('video');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (ad) {
      if (!dialog.open) {
        dialog.showModal();
      }
      setIsPlaying(false);
      setCurrentTime(0);
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [ad]);

  if (!ad) return null;

  const show = shows.find((s) => s.id === ad.showId);
  const daysInfo = formatDaysRemainingText(ad.endDate, undefined, ad);
  const isExpired = ad.status === 'expired' && tracksPullDeadline(ad);
  const isTakenOff = !!ad.takenOffAt;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!videoRef.current) return;
    videoRef.current.currentTime = val;
    setCurrentTime(val);
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="ad-preview-title"
      className="backdrop:bg-black/85 backdrop:backdrop-blur-md bg-transparent p-0 m-auto max-w-3xl w-full focus:outline-none overscroll-contain"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80 gap-3">
          <div className="min-w-0">
            {isClientView ? (
              <>
                <h2 id="ad-preview-title" className="text-base font-bold text-white line-clamp-2">
                  {ad.title}
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  On air until {formatDateDisplay(ad.endDate)}
                </p>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2 text-[11px] text-zinc-400 flex-wrap">
                    <span className="font-bold text-zinc-200">{show?.title || ad.showTitle}</span>
                    <span>&bull;</span>
                    <span className="text-indigo-400 font-mono font-semibold">
                      Break {ad.breakNumber} &bull; Slot #{ad.slotIndex}
                    </span>
                    <span>&bull;</span>
                    <span className="font-mono text-zinc-400">{ad.durationSec}s spot</span>
                  </div>
                  <h2 id="ad-preview-title" className="text-sm font-bold text-white truncate max-w-md">
                    {ad.title}
                  </h2>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {!isClientView && (
              <span
                className={`px-3 py-1 rounded-xl text-xs font-mono font-black border ${daysInfo.badgeClass}`}
              >
                {isExpired ? '🚨 DEADLINE PASSED!' : daysInfo.text}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Preview Container (Video or Frame grab) */}
        <div className="relative bg-black aspect-video w-full flex items-center justify-center overflow-hidden">
          {(isClientView || activeMediaTab === 'video') && ad.videoUrl ? (
            <div className="relative w-full h-full flex items-center justify-center group/player">
              <video
                ref={videoRef}
                src={ad.videoUrl}
                poster={ad.frameGrabUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                muted={isMuted}
                playsInline
                className="w-full h-full object-contain"
                onClick={togglePlay}
              />

              {/* Center Play/Pause button on hover */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer"
                >
                  <Play className="w-8 h-8 fill-current ml-1" />
                </button>
              )}

              {/* Bottom Video Controls Bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex items-center space-x-3 transition-opacity">
                <button
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                </button>

                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      setCurrentTime(0);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="From start"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Scrubber */}
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 accent-indigo-500 h-1.5 rounded-lg cursor-pointer bg-white/30"
                />

                <span className="font-mono text-xs text-zinc-300">
                  {formatSec(currentTime)} / {formatSec(duration || ad.durationSec)}
                </span>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ad.frameGrabUrl}
                alt={ad.title}
                className="w-full h-full object-contain"
              />
              <span className="absolute top-3 left-3 bg-black/80 font-mono text-[11px] text-zinc-300 px-2 py-1 rounded-md border border-white/10">
                On-air frame grab
              </span>
            </div>
          )}
        </div>

        {!isClientView && (
          <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveMediaTab('video')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activeMediaTab === 'video'
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-indigo-400" />
                <span>Video preview (HD H.264)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMediaTab('frame')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activeMediaTab === 'frame'
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Tv className="w-3.5 h-3.5 text-amber-400" />
                <span>Frame grab</span>
              </button>
            </div>

            <span className="text-[11px] text-zinc-500 font-mono">
              Format: 1080p 25fps Stereo
            </span>
          </div>
        )}

        {/* Commercial Metadata & Flight Status */}
        <div className={`p-5 overflow-y-auto space-y-4 ${isClientView ? 'pt-3 pb-4' : ''}`}>
          {isClientView ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold"
              >
                Close
              </button>
            </div>
          ) : null}

          {/* Status Box */}
          {!isClientView && isExpired && (
            <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500 flex items-start space-x-3 text-rose-200 text-xs shadow-lg shadow-rose-950/40">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="font-extrabold text-white text-sm">
                  Spot must be pulled: event deadline has passed!
                </h4>
                <p className="mt-0.5 text-rose-200/90 leading-relaxed">
                  End date was {formatDateDisplay(ad.endDate)}. This spot will be removed from the schedule before the next broadcast.
                </p>
              </div>
            </div>
          )}

          {!isClientView && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                Advertiser
              </span>
              <span className="font-bold text-zinc-200">{ad.advertiser}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                Flight start
              </span>
              <span className="font-bold text-zinc-200">{formatDateDisplay(ad.startDate)}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-amber-400 uppercase font-bold block mb-1">
                Pull by (end)
              </span>
              <span className="font-extrabold text-amber-300">{formatDateDisplay(ad.endDate)}</span>
            </div>
          </div>
          )}

          {!isClientView && (
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
              <ShieldAlert className="w-4 h-4" />
              <span>Replacement instruction after expiry:</span>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed font-medium">
              {ad.replacementAction}
            </p>
            {ad.eventDate && (
              <p className="text-xs text-zinc-400">
                Event details: <b className="text-zinc-200">{ad.eventDate}</b>
              </p>
            )}
          </div>
          )}

          {/* Modal Footer */}
          {!isClientView && (
          <div className="pt-3 flex items-center justify-between border-t border-zinc-800">
            {!isClientView && onDeleteAd ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete ad "${ad.title}" from the database?`)) {
                    onDeleteAd(ad.id);
                    onClose();
                  }
                }}
                className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete from database</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2.5">
              {!isClientView && onEditAd && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditAd(ad);
                  }}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Edit spot</span>
                </button>
              )}

              {!isClientView && onRestoreAd && isTakenOff && (
                <button
                  type="button"
                  onClick={() => {
                    onRestoreAd(ad.id);
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore on air</span>
                </button>
              )}

              {!isClientView && onTakeOffAd && !isTakenOff && (
                <button
                  type="button"
                  onClick={() => {
                    onTakeOffAd(ad.id);
                    onClose();
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pull from air</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors shadow"
              >
                Close preview
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
