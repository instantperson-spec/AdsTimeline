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
} from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import { formatDaysRemainingText, formatDateDisplay } from '@/lib/date-utils';

interface AdPreviewModalProps {
  ad: CommercialAd | null;
  shows: CommercialShow[];
  onClose: () => void;
}

export function AdPreviewModal({
  ad,
  shows,
  onClose,
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
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 text-[11px] text-zinc-400">
                <span className="font-bold text-zinc-200">{show?.title || ad.showTitle}</span>
                <span>&bull;</span>
                <span className="text-indigo-400 font-mono font-semibold">
                  Przerwa {ad.breakNumber} &bull; Slot #{ad.slotIndex}
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
              className={`px-3 py-1 rounded-xl text-xs font-mono font-black border ${daysInfo.badgeClass}`}
            >
              {isExpired ? '🚨 TERMIN MINĄŁ!' : daysInfo.text}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Preview Container (Video or Frame grab) */}
        <div className="relative bg-black aspect-video w-full flex items-center justify-center overflow-hidden">
          {activeMediaTab === 'video' && ad.videoUrl ? (
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
                  title="Od początku"
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
                Klatka kluczowa z emisji
              </span>
            </div>
          )}
        </div>

        {/* Media Switcher Tab */}
        <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveMediaTab('video')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                activeMediaTab === 'video'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              <span>Podgląd Wideo (HD H.264)</span>
            </button>

            <button
              onClick={() => setActiveMediaTab('frame')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                activeMediaTab === 'frame'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span>Klatka Wideo (Frame Grab)</span>
            </button>
          </div>

          <span className="text-[11px] text-zinc-500 font-mono">
            Format: 1080p 25fps Stereo
          </span>
        </div>

        {/* Commercial Metadata & Flight Status */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Box */}
          {isExpired && (
            <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500 flex items-start space-x-3 text-rose-200 text-xs shadow-lg shadow-rose-950/40">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="font-extrabold text-white text-sm">
                  Spot wymaga zdjęcia z anteny: Termin wydarzenia minął!
                </h4>
                <p className="mt-0.5 text-rose-200/90 leading-relaxed">
                  Data końcowa minęła {formatDateDisplay(ad.endDate)}. Spot zostanie wycofany z ramówki przed kolejną emisją programu.
                </p>
              </div>
            </div>
          )}

          {/* Grid Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                Reklamodawca
              </span>
              <span className="font-bold text-zinc-200">{ad.advertiser}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                Kategoria
              </span>
              <span className="font-bold text-zinc-200">{ad.category}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                Start emisji
              </span>
              <span className="font-bold text-zinc-200">{formatDateDisplay(ad.startDate)}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-amber-400 uppercase font-bold block mb-1">
                Zdjąć do (Koniec)
              </span>
              <span className="font-extrabold text-amber-300">{formatDateDisplay(ad.endDate)}</span>
            </div>
          </div>

          {/* Replacement Action box */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
              <ShieldAlert className="w-4 h-4" />
              <span>Instrukcja zastąpienia materiału po wygaśnięciu:</span>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed font-medium">
              {ad.replacementAction}
            </p>
            {ad.eventDate && (
              <p className="text-xs text-zinc-400">
                Szczegóły wydarzenia: <b className="text-zinc-200">{ad.eventDate}</b>
              </p>
            )}
          </div>

          {/* Modal Footer (Read-Only: Just Close) */}
          <div className="pt-3 flex items-center justify-end border-t border-zinc-800">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors shadow"
            >
              Zamknij podgląd
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
