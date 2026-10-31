'use client';

import React, { useState, useEffect } from 'react';
import { CommercialShow, CommercialAd } from '@/types/timeline';
import { INITIAL_SHOWS, INITIAL_ADS } from '@/lib/mock-data';
import { computeAdStatus } from '@/lib/date-utils';

import { Header } from '@/components/Header';
import { CleanScheduleView } from '@/components/CleanScheduleView';

import { AdPreviewModal } from '@/components/AdPreviewModal';
import { NewAdModal } from '@/components/NewAdModal';
import { NewShowModal } from '@/components/NewShowModal';
import { TrafficCueSheetModal } from '@/components/TrafficCueSheetModal';

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

  // Handlers for Shows
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
      {/* 1. Sleek Single-Row Header */}
      <Header
        shows={shows}
        selectedShowId={selectedShowId}
        onSelectShow={setSelectedShowId}
        onOpenNewAd={() =>
          openNewAdModal(selectedShowId !== 'all' ? selectedShowId : undefined)
        }
        onOpenNewShow={() => setIsNewShowOpen(true)}
        onOpenCueSheet={() => setIsCueSheetOpen(true)}
        expiredCount={expiredCount}
        expiringSoonCount={expiringSoonCount}
        onDeleteShow={handleDeleteShow}
      />

      {/* 2. Main Ultra-Clean Schedule View (Simple as a paper cue sheet) */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <CleanScheduleView
          ads={ads}
          shows={shows}
          selectedShowId={selectedShowId}
          onSelectAd={setSelectedAd}
          onEditAd={openEditAdModal}
          onDeleteAd={handleDeleteAd}
          onTakeOffAd={handleTakeOffAd}
          onOpenNewAdForBreak={(sId, bNum) => openNewAdModal(sId, bNum)}
        />
      </main>

      {/* 3. Modals */}
      <AdPreviewModal
        ad={selectedAd}
        shows={shows}
        onClose={() => setSelectedAd(null)}
        onTakeOffAd={handleTakeOffAd}
        onDeleteAd={handleDeleteAd}
        onEditAd={openEditAdModal}
      />

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
