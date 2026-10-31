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
import { ClientTimelineScreen } from '@/components/ClientTimelineScreen';
import { ClientTimelineListView } from '@/components/ClientTimelineListView';
import { BreaksSlotMatrix } from '@/components/BreaksSlotMatrix';
import { UrgentExpiryRadar } from '@/components/UrgentExpiryRadar';

import { AdPreviewModal } from '@/components/AdPreviewModal';
import { NewAdModal } from '@/components/NewAdModal';
import { NewShowModal } from '@/components/NewShowModal';
import { TrafficCueSheetModal } from '@/components/TrafficCueSheetModal';

import { AlertTriangle, ArrowRight } from 'lucide-react';

const STORAGE_KEY_SHOWS = 'instant_ads_timeline_shows_v4';
const STORAGE_KEY_ADS = 'instant_ads_timeline_ads_v4';

const FAITH_WORLD_TV = 'Faith World TV';

const SHOW_BROADCAST_PATCH: Record<string, string> = {
  'show-iwmtv': 'Wednesdays 22:00 GMT — Faith World TV',
  'show-mcs': 'Wednesdays 23:00 GMT — Faith World TV',
};

function migrateShows(shows: CommercialShow[]): CommercialShow[] {
  return shows.map((s) => {
    const schedule = SHOW_BROADCAST_PATCH[s.id];
    if (!schedule) return s;
    return { ...s, channel: FAITH_WORLD_TV, broadcastSchedule: schedule };
  });
}

export default function AdsTimelineApp() {
  const [shows, setShows] = useState<CommercialShow[]>(INITIAL_SHOWS);
  const [ads, setAds] = useState<CommercialAd[]>(INITIAL_ADS);
  const [selectedShowId, setSelectedShowId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<TimelineViewMode>('client');

  // Modals state
  const [selectedAd, setSelectedAd] = useState<CommercialAd | null>(null);
  const [isNewAdOpen, setIsNewAdOpen] = useState(false);
  const [newAdShowId, setNewAdShowId] = useState<string | undefined>(undefined);
  const [newAdBreakNumber, setNewAdBreakNumber] = useState<number | undefined>(undefined);
  const [editingAd, setEditingAd] = useState<CommercialAd | null>(null);
  const [isNewShowOpen, setIsNewShowOpen] = useState(false);
  const [isCueSheetOpen, setIsCueSheetOpen] = useState(false);

  // Restore from localStorage and recompute statuses
  useEffect(() => {
    try {
      const savedShows = localStorage.getItem(STORAGE_KEY_SHOWS);
      const savedAds = localStorage.getItem(STORAGE_KEY_ADS);

      const parsedShows: CommercialShow[] = savedShows ? JSON.parse(savedShows) : INITIAL_SHOWS;
      const baseShows = migrateShows(parsedShows);
      const baseAds: CommercialAd[] = savedAds ? JSON.parse(savedAds) : INITIAL_ADS;

      // Dynamically calculate status for each ad
      const updatedAds = baseAds.map((ad) => ({
        ...ad,
        status: computeAdStatus(ad),
      }));

      setShows(baseShows);
      setAds(updatedAds);
      localStorage.setItem(STORAGE_KEY_SHOWS, JSON.stringify(baseShows));
      localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(updatedAds));
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

  // Handlers for Ads
  const openNewAdModal = (showId?: string, breakNumber?: number) => {
    setEditingAd(null);
    setNewAdShowId(showId);
    setNewAdBreakNumber(breakNumber);
    setIsNewAdOpen(true);
  };

  const openEditAdModal = (ad: CommercialAd) => {
    setEditingAd(ad);
    setNewAdShowId(ad.showId);
    setNewAdBreakNumber(ad.breakNumber);
    setIsNewAdOpen(true);
  };

  const closeAdModal = () => {
    setIsNewAdOpen(false);
    setEditingAd(null);
    setNewAdShowId(undefined);
    setNewAdBreakNumber(undefined);
  };

  const handleCreateAd = (newAd: CommercialAd) => {
    const nextAds = [newAd, ...ads];
    saveAds(nextAds);
  };

  const handleUpdateAd = (updatedAd: CommercialAd) => {
    const nextAds = ads.map((a) => (a.id === updatedAd.id ? updatedAd : a));
    saveAds(nextAds);
    if (selectedAd?.id === updatedAd.id) {
      setSelectedAd(updatedAd);
    }
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
          replacementAdTitle: replacementNote || 'Zdjęto z anteny i zastąpiono zapowiedzią stacji.',
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

  // Handlers for Shows & Breaks
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

  const handleAddBreak = (showId: string) => {
    const nextShows = shows.map((s) => {
      if (s.id === showId) {
        return { ...s, breakCount: Math.min(6, s.breakCount + 1) };
      }
      return s;
    });
    saveShows(nextShows);
  };

  const handleRemoveBreak = (showId: string, breakNumber: number) => {
    const show = shows.find((s) => s.id === showId);
    if (!show || show.breakCount <= 1) return;

    if (!confirm(`Usunąć przerwę ${breakNumber} i wszystkie jej reklamy z programu "${show.title}"?`)) {
      return;
    }

    const nextShows = shows.map((s) => {
      if (s.id === showId) {
        return { ...s, breakCount: s.breakCount - 1 };
      }
      return s;
    });

    const nextAds = ads
      .filter((a) => !(a.showId === showId && a.breakNumber === breakNumber))
      .map((a) => {
        if (a.showId === showId && a.breakNumber > breakNumber) {
          return { ...a, breakNumber: a.breakNumber - 1 };
        }
        return a;
      });

    saveShows(nextShows);
    saveAds(nextAds);
  };

  // Urgent counts
  const expiredCount = ads.filter((a) => !a.takenOffAt && a.status === 'expired').length;
  const expiringSoonCount = ads.filter((a) => !a.takenOffAt && a.status === 'expiring_soon').length;

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Top Header: Always gives access to all views and administrative tools */}
      <Header
        shows={shows}
        selectedShowId={selectedShowId}
        onSelectShow={setSelectedShowId}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onOpenNewAd={() =>
          openNewAdModal(selectedShowId !== 'all' ? selectedShowId : undefined)
        }
        onOpenNewShow={() => setIsNewShowOpen(true)}
        onOpenCueSheet={() => setIsCueSheetOpen(true)}
        expiredCount={expiredCount}
        expiringSoonCount={expiringSoonCount}
        onDeleteShow={handleDeleteShow}
      />

      {/* Urgent Warning Notification Banner if expired ads exist */}
      {expiredCount > 0 && viewMode !== 'urgent_radar' && (
        <div className="bg-rose-950/80 border-b border-rose-800 px-4 py-2 flex items-center justify-between text-xs text-rose-200 shrink-0">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
            <span>
              <b>OSTRZEŻENIE RAMÓWKI:</b> Masz <b>{expiredCount}</b> przeterminowany(ch) spot(ów) (np. termin koncertu minął). Zdejmij z anteny przed kolejną emisją!
            </span>
          </div>
          <button
            onClick={() => setViewMode('urgent_radar')}
            className="flex items-center space-x-1 font-bold text-white bg-rose-600 hover:bg-rose-500 px-2.5 py-1 rounded-lg transition-colors shrink-0 ml-4"
          >
            <span>Centrum Zdejmowania</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main View Area: Switch between Client Timeline, Cards Studio, Breaks Matrix, and Radar */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* VIEW 1: DEDICATED CLIENT TIMELINE SCREEN (NO EDITING, RICH TIMELINE CANVAS) */}
        {viewMode === 'client' && (
          <ClientTimelineScreen
            ads={ads}
            shows={shows}
            selectedShowId={selectedShowId}
            onSelectShow={setSelectedShowId}
            onSelectAd={setSelectedAd}
            onOpenAdminPanel={() => setViewMode('matrix')}
          />
        )}

        {/* VIEW 2: CARDS & TIMELINE STUDIO (WITH EDITING & QUICK ACTIONS) */}
        {viewMode === 'timeline' && (
          <ClientTimelineListView
            ads={ads}
            shows={shows}
            selectedShowId={selectedShowId}
            onSelectAd={setSelectedAd}
            onTakeOffAd={handleTakeOffAd}
            onOpenNewAd={() =>
              openNewAdModal(selectedShowId !== 'all' ? selectedShowId : undefined)
            }
          />
        )}

        {/* VIEW 3: COMMERCIAL BREAKS & SLOTS MATRIX */}
        {viewMode === 'matrix' && (
          <BreaksSlotMatrix
            ads={ads}
            shows={shows}
            selectedShowId={selectedShowId}
            onEditAd={openEditAdModal}
            onOpenNewAdForBreak={(sId, bNum) => openNewAdModal(sId, bNum)}
            onAddBreak={handleAddBreak}
            onRemoveBreak={handleRemoveBreak}
            onDeleteAd={handleDeleteAd}
            onTakeOffAd={handleTakeOffAd}
          />
        )}

        {/* VIEW 4: URGENT RADAR & TAKE-DOWN CENTER */}
        {viewMode === 'urgent_radar' && (
          <UrgentExpiryRadar
            ads={ads}
            shows={shows}
            onSelectAd={setSelectedAd}
            onTakeOffAd={handleTakeOffAd}
            onOpenNewAd={() => openNewAdModal()}
          />
        )}
      </main>

      {/* Video Preview & Ad Details Modal (Supports both Client viewing and Admin actions) */}
      <AdPreviewModal
        ad={selectedAd}
        shows={shows}
        onClose={() => setSelectedAd(null)}
        onTakeOffAd={handleTakeOffAd}
        onDeleteAd={handleDeleteAd}
        onEditAd={openEditAdModal}
        isClientView={viewMode === 'client'}
      />

      {/* New & Edit Ad Modal */}
      <NewAdModal
        isOpen={isNewAdOpen}
        onClose={closeAdModal}
        shows={shows}
        initialShowId={newAdShowId}
        initialBreakNumber={newAdBreakNumber}
        editAd={editingAd}
        onCreateAd={handleCreateAd}
        onUpdateAd={handleUpdateAd}
      />

      {/* New Show Modal */}
      <NewShowModal
        isOpen={isNewShowOpen}
        onClose={() => setIsNewShowOpen(false)}
        onCreateShow={handleCreateShow}
      />

      {/* MCR Cue Sheet Modal */}
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
