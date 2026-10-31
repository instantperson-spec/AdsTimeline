'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Play,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Film,
  RefreshCw,
  Sparkles,
  Search,
  Sliders,
  Filter,
} from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import { formatDaysRemainingText, formatDateDisplay } from '@/lib/date-utils';

interface UrgentExpiryRadarProps {
  ads: CommercialAd[];
  shows: CommercialShow[];
  onSelectAd: (ad: CommercialAd) => void;
  onTakeOffAd: (adId: string, replacementNote?: string) => void;
  onOpenNewAd: () => void;
}

export function UrgentExpiryRadar({
  ads,
  shows,
  onSelectAd,
  onTakeOffAd,
  onOpenNewAd,
}: UrgentExpiryRadarProps) {
  const [filterType, setFilterType] = useState<'all_urgent' | 'expired_only' | 'expiring_soon' | 'taken_off'>('all_urgent');
  const [takingOffAdId, setTakingOffAdId] = useState<string | null>(null);
  const [replacementNote, setReplacementNote] = useState('Zastąpiono zwiastunem stacji IWMTV 30s');

  const expiredAds = ads.filter((a) => !a.takenOffAt && a.status === 'expired');
  const expiringSoonAds = ads.filter((a) => !a.takenOffAt && a.status === 'expiring_soon');
  const takenOffAds = ads.filter((a) => !!a.takenOffAt);

  const displayedAds = ads.filter((ad) => {
    if (filterType === 'expired_only') return !ad.takenOffAt && ad.status === 'expired';
    if (filterType === 'expiring_soon') return !ad.takenOffAt && ad.status === 'expiring_soon';
    if (filterType === 'taken_off') return !!ad.takenOffAt;
    // 'all_urgent': expired + expiring soon
    return !ad.takenOffAt && (ad.status === 'expired' || ad.status === 'expiring_soon');
  });

  const handleConfirmTakeOff = (adId: string) => {
    onTakeOffAd(adId, replacementNote);
    setTakingOffAdId(null);
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full select-none overflow-y-auto">
      {/* Top Banner Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Expired Critical Card */}
        <div
          onClick={() => setFilterType('expired_only')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            expiredAds.length > 0
              ? 'bg-rose-950/40 border-rose-600/60 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/30'
              : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Przeterminowane (Pilne!)
                </h3>
                <p className="text-[11px] text-zinc-400">Wymagają natychmiastowego zdjęcia</p>
              </div>
            </div>
            <span className="text-2xl font-black text-rose-400 font-mono">
              {expiredAds.length}
            </span>
          </div>
        </div>

        {/* Expiring Soon Card */}
        <div
          onClick={() => setFilterType('expiring_soon')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            expiringSoonAds.length > 0
              ? 'bg-amber-950/30 border-amber-600/50 shadow-lg shadow-amber-950/30'
              : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Wygasa w ciągu 3-5 dni
                </h3>
                <p className="text-[11px] text-zinc-400">Przygotuj podmianę spotu</p>
              </div>
            </div>
            <span className="text-2xl font-black text-amber-400 font-mono">
              {expiringSoonAds.length}
            </span>
          </div>
        </div>

        {/* Already Handled / Taken Off Card */}
        <div
          onClick={() => setFilterType('taken_off')}
          className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Zdjęte z anteny
                </h3>
                <p className="text-[11px] text-zinc-400">Zarchiwizowane i podmienione</p>
              </div>
            </div>
            <span className="text-2xl font-black text-zinc-300 font-mono">
              {takenOffAds.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3 flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterType('all_urgent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all_urgent'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Wszystkie pilne ({expiredAds.length + expiringSoonAds.length})
          </button>

          <button
            onClick={() => setFilterType('expired_only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'expired_only'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Tylko przeterminowane ({expiredAds.length})
          </button>

          <button
            onClick={() => setFilterType('expiring_soon')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'expiring_soon'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Zbliżające się do końca ({expiringSoonAds.length})
          </button>

          <button
            onClick={() => setFilterType('taken_off')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'taken_off'
                ? 'bg-zinc-700 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Zdjęte z anteny ({takenOffAds.length})
          </button>
        </div>

        <div className="text-xs text-zinc-400">
          Zadanie traffic managera: pilnować, aby żaden przeterminowany koncert nie leciał na antenie!
        </div>
      </div>

      {/* Ads List */}
      {displayedAds.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-zinc-850 bg-zinc-900/30 text-zinc-500">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500/60" />
          <h4 className="text-base font-bold text-zinc-200 mb-1">Czysta ramówka!</h4>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            W tej kategorii nie ma żadnych reklam wymagających natychmiastowej interwencji.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayedAds.map((ad) => {
            const show = shows.find((s) => s.id === ad.showId);
            const daysInfo = formatDaysRemainingText(ad.endDate);
            const isExpired = ad.status === 'expired';
            const isTakenOff = !!ad.takenOffAt;

            return (
              <div
                key={ad.id}
                className={`group relative rounded-2xl border p-4 shadow-xl transition-all duration-200 flex flex-col justify-between ${
                  isTakenOff
                    ? 'bg-zinc-900/50 border-zinc-800/80 opacity-70'
                    : isExpired
                    ? 'bg-rose-950/20 border-rose-600/70 shadow-rose-950/20 hover:border-rose-500'
                    : 'bg-zinc-900/80 border-amber-500/50 hover:border-amber-400'
                }`}
              >
                <div>
                  {/* Top Bar: Show Tag & Break Slot & Expiration Badge */}
                  <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                    <div className="flex items-center space-x-1.5 text-xs">
                      <span className="font-bold text-zinc-200">
                        {show?.title || ad.showTitle}
                      </span>
                      <span className="text-zinc-600">&bull;</span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-indigo-300 font-mono text-[11px] font-semibold border border-zinc-700">
                        Przerwa {ad.breakNumber} (Break {ad.breakNumber}) - Slot {ad.slotIndex}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${daysInfo.badgeClass}`}
                    >
                      <span>{daysInfo.text}</span>
                    </span>
                  </div>

                  {/* Body: Thumbnail & Details */}
                  <div className="flex items-start space-x-3.5">
                    {/* Video Thumbnail with Hover Play Button */}
                    <div
                      onClick={() => onSelectAd(ad)}
                      className="relative w-36 aspect-video rounded-xl overflow-hidden bg-black shrink-0 cursor-pointer group/thumb ring-1 ring-zinc-800"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ad.frameGrabUrl}
                        alt={ad.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 font-mono text-[10px] text-zinc-300">
                        {ad.durationSec}s
                      </span>
                    </div>

                    {/* Metadata & Title */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mb-0.5">
                        <span className="font-semibold text-zinc-300 truncate">
                          {ad.advertiser}
                        </span>
                        <span>&bull;</span>
                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-medium">
                          {ad.category}
                        </span>
                      </div>

                      <h4
                        onClick={() => onSelectAd(ad)}
                        className="text-sm font-bold text-zinc-100 hover:text-indigo-400 transition-colors cursor-pointer line-clamp-1"
                      >
                        {ad.title}
                      </h4>

                      {/* Flight dates */}
                      <div className="flex items-center space-x-2 text-xs text-zinc-400 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>
                          Emisja: <b className="text-zinc-200">{formatDateDisplay(ad.startDate)}</b> &rarr;{' '}
                          <b className="text-amber-300">{formatDateDisplay(ad.endDate)}</b>
                        </span>
                      </div>

                      {/* Event Date notice if time-sensitive */}
                      {ad.eventDate && (
                        <p className="text-[11px] text-zinc-400 mt-1 font-medium">
                          Wydarzenie: <span className="text-amber-400">{ad.eventDate}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Replacement Recommendation Box */}
                  <div className="mt-3 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-850 text-xs text-zinc-300 flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-snug">
                      <span className="font-semibold text-zinc-200">Dyspozycja zdjęcia: </span>
                      <span className="text-zinc-400">{ad.replacementAction}</span>
                    </div>
                  </div>

                  {/* If already taken off, show history */}
                  {isTakenOff && (
                    <div className="mt-2 text-[11px] text-emerald-400 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        Zdjęto z anteny {formatDateDisplay(ad.takenOffAt || '')}. {ad.replacementAdTitle ? `Wstawiono: ${ad.replacementAdTitle}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between">
                  <button
                    onClick={() => onSelectAd(ad)}
                    className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Podgląd Wideo & Szczegóły</span>
                  </button>

                  {!isTakenOff && (
                    <div>
                      {takingOffAdId === ad.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={replacementNote}
                            onChange={(e) => setReplacementNote(e.target.value)}
                            placeholder="Czym zastąpiono spot?"
                            className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 placeholder-zinc-500 w-48"
                          />
                          <button
                            onClick={() => handleConfirmTakeOff(ad.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                          >
                            Zatwierdź
                          </button>
                          <button
                            onClick={() => setTakingOffAdId(null)}
                            className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                          >
                            Anuluj
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setTakingOffAdId(ad.id)}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                            isExpired
                              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                              : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Zdejmij z anteny (Podmień)</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

