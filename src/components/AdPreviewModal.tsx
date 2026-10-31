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
  Trash2,
  Film,
  ExternalLink,
} from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import { formatDaysRemainingText, formatDateDisplay } from '@/lib/date-utils';

interface AdPreviewModalProps {
  ad: CommercialAd | null;
  shows: CommercialShow[];
  onClose: () => void;
  onTakeOffAd: (adId: string, note?: string) => void;
  onDeleteAd: (adId: string) => void;
}

export function AdPreviewModal({
  ad,
  shows,
  onClose,
  onTakeOffAd,
  onDeleteAd,
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
  const daysInfo = formatDaysRemainingText(ad.endDate);
  const isExpired = ad.status === 'expired';
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
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2 text-[11px] text-zinc-400">
                <span className="font-bold text-zinc-300">{show?.title || ad.showTitle}</span>
                <span>&bull;</span>
                <span className="text-indigo-400 font-mono">
                  Przerwa {ad.breakNumber} &bull; Slot {ad.slotIndex}
                </span>
                <span>&bull;</span>
                <span className="font-mono text-zinc-400">{ad.durationSec}s spot</span>
              </div>
              <h2 id="ad-preview-title" className="text-sm font-bold text-white truncate max-w-md">
                {ad.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${daysInfo.badgeClass}`}
            >
              {daysInfo.text}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Media Preview Container (Video or Frame grab) */}
        <div className="relative bg-black aspect-video w-full flex items-center justify-center overflow-hidden">
          {activeMediaTab === 'video' && ad.videoUrl ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <video
                ref={videoRef}
                src={ad.videoUrl}
                poster={ad.frameGrabUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                muted={isMuted}
                playsInline
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
              />

              {/* Centered play overlay when paused */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
                >
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </button>
              )}

              {/* Video Bottom Player Controls Bar */}
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/70 to-transparent flex flex-col space-y-1.5">
                {/* Progress scrubber */}
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-zinc-700 accent-indigo-500 rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <div className="flex items-center space-x-3">
                    <button onClick={togglePlay} className="hover:text-white">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                          setCurrentTime(0);
                        }
                      }}
                      className="hover:text-white"
                      title="Od początku"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white">
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span className="font-mono text-[11px] text-zinc-400">
                      {formatSec(currentTime)} / {formatSec(duration || ad.durationSec)}
                    </span>
                  </div>

                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 font-mono text-zinc-400">
                    H.264 HD 20-30s Proxy
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ad.frameGrabUrl}
                alt={ad.title}
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-3 left-3 bg-black/80 px-2.5 py-1 rounded-lg text-xs font-mono text-zinc-300">
                Klatka z wideo (Frame Grab)
              </div>
            </div>
          )}

          {/* Toggle between Video Player & Frame Grab */}
          <div className="absolute top-3 left-3 flex items-center space-x-1 p-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-zinc-800 text-[11px]">
            {ad.videoUrl && (
              <button
                onClick={() => setActiveMediaTab('video')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  activeMediaTab === 'video'
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Odtwórz wideo ({ad.durationSec}s)
              </button>
            )}
            <button
              onClick={() => setActiveMediaTab('frame')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                activeMediaTab === 'frame'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Klatka z wideo
            </button>
          </div>
        </div>

        {/* Details & Traffic Actions */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Status Alert Banner */}
          {isExpired && !isTakenOff && (
            <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-600 flex items-start space-x-3 text-rose-200 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="font-bold text-rose-300 text-sm">
                  PILNE: Reklama przeterminowana!
                </h4>
                <p className="mt-0.5 text-zinc-300">
                  Data końcowa minęła {formatDateDisplay(ad.endDate)}. Należy niezwłocznie wyciąć
                  spot z bloku emisyjnego przed kolejną emisją programu.
                </p>
              </div>
            </div>
          )}

          {isTakenOff && (
            <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-600 flex items-center space-x-3 text-emerald-200 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-300 text-sm">
                  Spot został już zdjęty z ramówki
                </h4>
                <p className="text-zinc-300">
                  Zdjęto {formatDateDisplay(ad.takenOffAt || '')}. {ad.replacementAdTitle || ''}
                </p>
              </div>
            </div>
          )}

          {/* Grid Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                Reklamodawca
              </span>
              <span className="font-bold text-zinc-200">{ad.advertiser}</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                Kategoria
              </span>
              <span className="font-bold text-zinc-200">{ad.category}</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                Start emisji
              </span>
              <span className="font-bold text-zinc-200">{formatDateDisplay(ad.startDate)}</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-rose-400 uppercase font-bold block mb-1">
                Koniec (Zdjąć do)
              </span>
              <span className="font-black text-rose-300">{formatDateDisplay(ad.endDate)}</span>
            </div>
          </div>

          {/* Replacement Action box */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
              <ShieldAlert className="w-4 h-4" />
              <span>Dyspozycja zdjęcia i podmiany spotu:</span>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed font-medium">
              {ad.replacementAction}
            </p>
            {ad.eventDate && (
              <p className="text-[11px] text-zinc-400">
                Szczegóły wydarzenia / trasy koncertowej: <b className="text-zinc-200">{ad.eventDate}</b>
              </p>
            )}
            {ad.notes && (
              <p className="text-[11px] text-zinc-500 italic mt-1">
                Uwagi montażowe: {ad.notes}
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
            <button
              onClick={() => {
                if (confirm(`Czy na pewno usunąć reklamę "${ad.title}"?`)) {
                  onDeleteAd(ad.id);
                  onClose();
                }
              }}
              className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 p-2 rounded-xl hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Usuń z bazy</span>
            </button>

            <div className="flex items-center space-x-3">
              {!isTakenOff && (
                <button
                  onClick={() => {
                    onTakeOffAd(ad.id);
                    onClose();
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Oznacz jako zdjętą z anteny</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

