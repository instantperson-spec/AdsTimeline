'use client';

import React, { useRef, useEffect } from 'react';
import { X, Printer, Download, FileSpreadsheet, Tv, CheckCircle2, AlertTriangle } from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import { formatDateDisplay } from '@/lib/date-utils';

interface TrafficCueSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  shows: CommercialShow[];
  ads: CommercialAd[];
  selectedShowId: string;
}

export function TrafficCueSheetModal({
  isOpen,
  onClose,
  shows,
  ads,
  selectedShowId,
}: TrafficCueSheetModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

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

  const activeShows = selectedShowId === 'all'
    ? shows
    : shows.filter((s) => s.id === selectedShowId);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Program',
      'Blok',
      'Slot',
      'Tytuł Reklamy',
      'Reklamodawca',
      'Długość (s)',
      'Data Od',
      'Data Do (Zdjąć)',
      'Status',
      'Dyspozycja Podmiany',
    ];

    const rows = ads.map((a) => {
      const show = shows.find((s) => s.id === a.showId);
      return [
        `"${show?.title || a.showTitle}"`,
        `"Break ${a.breakNumber}"`,
        `"Slot ${a.slotIndex}"`,
        `"${a.title.replace(/"/g, '""')}"`,
        `"${a.advertiser.replace(/"/g, '""')}"`,
        a.durationSec,
        a.startDate,
        a.endDate,
        a.takenOffAt ? 'Zdjęta' : a.status === 'expired' ? 'PRZETERMINOWANA' : a.status,
        `"${(a.replacementAction || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `traffic_cue_sheet_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="cue-sheet-title"
      className="backdrop:bg-black/85 backdrop:backdrop-blur-md bg-transparent p-0 m-auto max-w-4xl w-full focus:outline-none overscroll-contain"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-850 bg-zinc-950/80 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 id="cue-sheet-title" className="text-sm font-bold text-white">
                Oficjalna Rozpiska Emisyjna (Traffic Cue Sheet)
              </h2>
              <p className="text-[11px] text-zinc-400">
                Dokument dla reżyserki / MCR z wykazem bloków i terminami ważności spotów
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs text-zinc-200 font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Eksport CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Drukuj / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs bg-zinc-950/50">
          {/* Studio Document Letterhead */}
          <div className="pb-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h1 className="text-base font-black uppercase tracking-wider text-white">
                Instant Productions &bull; Broadcast Traffic Control
              </h1>
              <p className="text-zinc-400 text-xs">
                Rozpiska emisyjna bloków komercyjnych (Commercial Traffic Sheet)
              </p>
            </div>
            <div className="text-right font-mono text-[11px] text-zinc-400">
              <div>Wygenerowano: 31 Października 2026, 23:15 GMT</div>
              <div className="text-amber-400 font-bold">Weryfikacja: MCR Status Validated</div>
            </div>
          </div>

          {/* Show-by-show Breakdown */}
          {activeShows.map((show) => {
            const showAds = ads.filter((a) => a.showId === show.id);
            const breakNumbers = Array.from({ length: show.breakCount }, (_, i) => i + 1);

            return (
              <div key={show.id} className="space-y-3">
                <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                  <div className="flex items-center space-x-2">
                    <Tv className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-sm text-zinc-100">{show.title}</span>
                    <span className="font-mono text-zinc-400 text-xs">({show.code})</span>
                  </div>
                  <div className="text-zinc-400 font-mono text-[11px]">
                    {show.channel} &bull; {show.broadcastSchedule}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-zinc-850">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-400">
                        <th className="p-2.5">Blok / Slot</th>
                        <th className="p-2.5">Tytuł spotu</th>
                        <th className="p-2.5">Reklamodawca</th>
                        <th className="p-2.5">Czas</th>
                        <th className="p-2.5">Okres emisji</th>
                        <th className="p-2.5">Termin zdjęcia</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Dyspozycja podmiany</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/60 font-medium">
                      {showAds.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-4 text-center text-zinc-500">
                            Brak zaplanowanych spotów w tej audycji.
                          </td>
                        </tr>
                      ) : (
                        showAds.map((ad) => {
                          const isExpired = ad.status === 'expired' && !ad.takenOffAt;

                          return (
                            <tr
                              key={ad.id}
                              className={`transition-colors ${
                                isExpired ? 'bg-rose-950/30 text-rose-200' : 'hover:bg-zinc-900/40'
                              }`}
                            >
                              <td className="p-2.5 font-mono text-indigo-300 whitespace-nowrap">
                                Break {ad.breakNumber} &bull; #{ad.slotIndex}
                              </td>
                              <td className="p-2.5 font-bold text-zinc-100">{ad.title}</td>
                              <td className="p-2.5 text-zinc-400">{ad.advertiser}</td>
                              <td className="p-2.5 font-mono text-zinc-300">{ad.durationSec}s</td>
                              <td className="p-2.5 font-mono text-zinc-400 whitespace-nowrap">
                                {formatDateDisplay(ad.startDate)} &rarr; {formatDateDisplay(ad.endDate)}
                              </td>
                              <td className="p-2.5 font-mono font-bold whitespace-nowrap">
                                <span className={isExpired ? 'text-rose-400 animate-pulse' : 'text-zinc-200'}>
                                  {formatDateDisplay(ad.endDate)}
                                </span>
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                {ad.takenOffAt ? (
                                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                                    Zdjęta
                                  </span>
                                ) : isExpired ? (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">
                                    PRZETERMINOWANA!
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                                    Aktywna
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-[11px] text-zinc-400 max-w-xs">
                                {ad.replacementAction}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </dialog>
  );
}

