'use client';

import React, { useState, useEffect } from 'react';
import {
  CommercialShow,
  CommercialAd,
  TimelineViewMode,
} from '@/types/timeline';
import { INITIAL_SHOWS, INITIAL_ADS } from '@/lib/mock-data';
import { computeAdStatus } from '@/lib/date-utils';

import { Header } from '@/components/Header';
import { TimelineGanttView } from '@/components/TimelineGanttView';
import { BreaksSlotMatrix } from '@/components/BreaksSlotMatrix';
import { CalendarMonthView } from '@/components/CalendarMonthView';
import { UrgentExpiryRadar } from '@/components/UrgentExpiryRadar';

import { AdPreviewModal } from '@/components/AdPreviewModal';
import { NewAdModal } from '@/components/NewAdModal';
import { NewShowModal } from '@/components/NewShowModal';
import { TrafficCueSheetModal } from '@/components/TrafficCueSheetModal';

import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

const STORAGE_KEY_SHOWS = 'instant_ads_timeline_shows_v1';
const STORAGE_KEY_ADS = 'instant_ads_timeline_ads_v1';

export default function AdsTimelineApp() {
  const [shows, setShows] = useState<CommercialShow[]>(INITIAL_SHOWS);
  const [ads, setAds] = useState<CommercialAd[]>(INITIAL_ADS);
  const [selectedShowId, setSelectedShowId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<TimelineViewMode>('timeline');

  // Modals state
  const [selectedAd, setSelectedAd] = useState<CommercialAd | null>(null);
  const [isNewAdOpen, setIsNewAdOpen] = useState(false);
  const [newAdShowId, setNewAdShowId] = useState<string | undefined>(undefined);
  const [newAdBreakNumber, setNewAdBreakNumber] = useState<number | undefined>(undefined);
  const [isNewShowOpen, setIsNewShowOpen] = useState(false);
  const [isCueSheetOpen, setIsCueSheetOpen] = useState(false);

  // Restore from localStorage and recompute statuses
  useEffect(() => {
    try {
      const savedShows = localStorage.getItem(STORAGE_KEY_SHOWS);
      const savedAds = localStorage.getItem(STORAGE_KEY_ADS);

      const baseShows = savedShows ? JSON.parse(savedShows) : INITIAL_SHOWS;
      const baseAds: CommercialAd[] = savedAds ? JSON.parse(savedAds) : INITIAL_ADS;

      // Dynamically calculate status for each ad
      const updatedAds = baseAds.map((ad) => ({
        ...ad,
        status: computeAdStatus(ad),
      }));

      setShows(baseShows);
      setAds(updatedAds);
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
  }, []);

  // Save helpers
  const saveShows = (updated: CommercialShow[]) => {
    setShows(updated);
    try {
      localStorage.setItem(STORAGE_KEY_SHOWS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const saveAds = (updated: CommercialAd[]) => {
    setAds(updated);
    try {
      localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers
  const handleCreateAd = (newAd: CommercialAd) => {
    const nextAds = [newAd, ...ads];
    saveAds(nextAds);
  };

  const handleDeleteAd = (adId: string) => {
    const nextAds = ads.filter((a) => a.id !== adId);
    saveAds(nextAds);
    if (selectedAd?.id === adId) {
      setSelectedAd(null);
    }
  };

  const handleTakeOffAd = (adId: string, replacementNote?: string) => {
    const nextAds = ads.map((a) => {
      if (a.id === adId) {
        return {
          ...a,
          takenOffAt: new Date().toISOString().split('T')[0],
          replacementAdTitle: replacementNote || 'Zdjęto z ramówki i zastąpiono fillerem stacji.',
          status: 'taken_off' as const,
        };
      }
      return a;
    });
    saveAds(nextAds);
    if (selectedAd?.id === adId) {
      setSelectedAd(nextAds.find((a) => a.id === adId) || null);
    }
  };

  const handleCreateShow = (newShow: CommercialShow) => {
    const nextShows = [...shows, newShow];
    saveShows(nextShows);
    setSelectedShowId(newShow.id);
  };

  const handleDeleteShow = (showId: string) => {
    const nextShows = shows.filter((s) => s.id !== showId);
    const nextAds = ads.filter((a) => a.showId !== showId);
    saveShows(nextShows);
    saveAds(nextAds);
    setSelectedShowId('all');
  };

  // Urgent counts
  const expiredCount = ads.filter((a) => !a.takenOffAt && a.status === 'expired').length;
  const expiringSoonCount = ads.filter((a) => !a.takenOffAt && a.status === 'expiring_soon').length;

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        shows={shows}
        selectedShowId={selectedShowId}
        onSelectShow={setSelectedShowId}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onOpenNewAd={() => {
          setNewAdShowId(selectedShowId !== 'all' ? selectedShowId : undefined);
          setNewAdBreakNumber(undefined);
          setIsNewAdOpen(true);
        }}
        onOpenNewShow={() => setIsNewShowOpen(true)}
        onOpenCueSheet={() => setIsCueSheetOpen(true)}
        expiredCount={expiredCount}
        expiringSoonCount={expiringSoonCount}
        onDeleteShow={handleDeleteShow}
      />

      {/* Urgent Warning Notification Banner if expired ads exist */}
      {expiredCount > 0 && viewMode !== 'urgent_radar' && (
        <div className="bg-rose-950/80 border-b border-rose-800 px-4 py-2 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
            <span>
              <b>ALARM RAMÓWKI:</b> Masz <b>{expiredCount}</b> przeterminowaną reklamę (np. koncert, który już się odbył). Wymagane natychmiastowe zdjęcie z anteny przed najbliższą emisją!
            </span>
          </div>
          <button
            onClick={() => setViewMode('urgent_radar')}
            className="flex items-center space-x-1 font-bold text-white bg-rose-600 hover:bg-rose-500 px-2.5 py-1 rounded-lg transition-colors shrink-0 ml-4"
          >
            <span>Przejdź do Centrum Zdejmowania</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {viewMode === 'timeline' && (
          <TimelineGanttView
            ads={ads}
            shows={shows}
            selectedShowId={selectedShowId}
            onSelectAd={setSelectedAd}
            onOpenNewAd={() => setIsNewAdOpen(true)}
          />
        )}

        {viewMode === 'matrix' && (
          <BreaksSlotMatrix
            ads={ads}
            shows={shows}
            selectedShowId={selectedShowId}
            onSelectAd={setSelectedAd}
            onOpenNewAdForBreak={(sId, bNum) => {
              setNewAdShowId(sId);
              setNewAdBreakNumber(bNum);
              setIsNewAdOpen(true);
            }}
            onDeleteAd={handleDeleteAd}
            onTakeOffAd={handleTakeOffAd}
          />
        )}

        {viewMode === 'calendar' && (
          <CalendarMonthView
            ads={ads}
            shows={shows}
            selectedShowId={selectedShowId}
            onSelectAd={setSelectedAd}
          />
        )}

        {viewMode === 'urgent_radar' && (
          <UrgentExpiryRadar
            ads={ads}
            shows={shows}
            onSelectAd={setSelectedAd}
            onTakeOffAd={handleTakeOffAd}
            onOpenNewAd={() => setIsNewAdOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <AdPreviewModal
        ad={selectedAd}
        shows={shows}
        onClose={() => setSelectedAd(null)}
        onTakeOffAd={handleTakeOffAd}
        onDeleteAd={handleDeleteAd}
      />

      <NewAdModal
        isOpen={isNewAdOpen}
        onClose={() => setIsNewAdOpen(false)}
        shows={shows}
        initialShowId={newAdShowId}
        initialBreakNumber={newAdBreakNumber}
        onCreateAd={handleCreateAd}
      />

      <NewShowModal
        isOpen={isNewShowOpen}
        onClose={() => setIsNewShowOpen(false)}
        onCreateShow={handleCreateShow}
      />

      <TrafficCueSheetModal
        isOpen={isCueSheetOpen}
        onClose={() => setIsCueSheetOpen(false)}
        shows={shows}
        ads={ads}
        selectedShowId={selectedShowId}
      />
    </div>
  );
}

