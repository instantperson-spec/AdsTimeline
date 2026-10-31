'use client';

import React, { useState, useEffect } from 'react';
import { CommercialShow, CommercialAd, AdminNavView } from '@/types/timeline';
import { INITIAL_SHOWS, INITIAL_ADS } from '@/lib/mock-data';
import { computeAdStatus } from '@/lib/date-utils';

import { Header } from '@/components/Header';
import { AdminSidebar } from '@/components/AdminSidebar';
import { ClientTimelineListView } from '@/components/ClientTimelineListView';
import { BreaksSlotMatrix } from '@/components/BreaksSlotMatrix';
import { AdPreviewModal } from '@/components/AdPreviewModal';
import { NewAdModal } from '@/components/NewAdModal';
import { NewShowModal } from '@/components/NewShowModal';
import { TrafficCueSheetModal } from '@/components/TrafficCueSheetModal';

const STORAGE_KEY_SHOWS = 'instant_ads_timeline_shows_v6';
const STORAGE_KEY_ADS = 'instant_ads_timeline_ads_v6';

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
  const [adminView, setAdminView] = useState<AdminNavView>('cards');

  const [selectedAd, setSelectedAd] = useState<CommercialAd | null>(null);
  const [isNewAdOpen, setIsNewAdOpen] = useState(false);
  const [newAdShowId, setNewAdShowId] = useState<string | undefined>(undefined);
  const [newAdBreakNumber, setNewAdBreakNumber] = useState<number | undefined>(undefined);
  const [editingAd, setEditingAd] = useState<CommercialAd | null>(null);
  const [isNewShowOpen, setIsNewShowOpen] = useState(false);
  const [isCueSheetOpen, setIsCueSheetOpen] = useState(false);

  useEffect(() => {
    try {
      const savedShows = localStorage.getItem(STORAGE_KEY_SHOWS);
      const savedAds = localStorage.getItem(STORAGE_KEY_ADS);

      const parsedShows: CommercialShow[] = savedShows ? JSON.parse(savedShows) : INITIAL_SHOWS;
      const baseShows = migrateShows(parsedShows);
      const baseAds: CommercialAd[] = savedAds ? JSON.parse(savedAds) : INITIAL_ADS;

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
    const withStatus = { ...newAd, status: computeAdStatus(newAd) };
    saveAds([withStatus, ...ads]);
  };

  const handleUpdateAd = (updatedAd: CommercialAd) => {
    const withStatus = { ...updatedAd, status: computeAdStatus(updatedAd) };
    const nextAds = ads.map((a) => (a.id === withStatus.id ? withStatus : a));
    saveAds(nextAds);
    if (selectedAd?.id === withStatus.id) {
      setSelectedAd(withStatus);
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
          replacementAdTitle: replacementNote || 'Pulled from air and replaced with station filler.',
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

  const handleRestoreAd = (adId: string) => {
    const nextAds = ads.map((a) => {
      if (a.id !== adId) return a;
      const restored = {
        ...a,
        takenOffAt: undefined,
        replacementAdTitle: undefined,
      };
      return { ...restored, status: computeAdStatus(restored) };
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

    if (!confirm(`Remove break ${breakNumber} and all its ads from "${show.title}"?`)) {
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
      })
      .map((a) => ({ ...a, status: computeAdStatus(a) }));

    saveShows(nextShows);
    saveAds(nextAds);
  };

  const expiredCount = ads.filter((a) => !a.takenOffAt && a.status === 'expired').length;

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <Header
        shows={shows}
        selectedShowId={selectedShowId}
        adminView={adminView}
        onSelectShow={setSelectedShowId}
        onOpenNewAd={() =>
          openNewAdModal(selectedShowId !== 'all' ? selectedShowId : undefined)
        }
        onOpenNewShow={() => setIsNewShowOpen(true)}
        onOpenCueSheet={() => setIsCueSheetOpen(true)}
        expiredCount={expiredCount}
        onDeleteShow={handleDeleteShow}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <AdminSidebar
          activeView={adminView}
          onChangeView={setAdminView}
          expiredCount={expiredCount}
        />

        <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
          {(adminView === 'cards' || adminView === 'gantt') && (
            <ClientTimelineListView
              ads={ads}
              shows={shows}
              selectedShowId={selectedShowId}
              onSelectAd={setSelectedAd}
              subView={adminView === 'cards' ? 'cards_timeline' : 'gantt_timeline'}
            />
          )}

          {adminView === 'edit' && (
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
              onRestoreAd={handleRestoreAd}
            />
          )}
        </main>
      </div>

      <AdPreviewModal
        ad={selectedAd}
        shows={shows}
        onClose={() => setSelectedAd(null)}
        onTakeOffAd={handleTakeOffAd}
        onRestoreAd={handleRestoreAd}
        onDeleteAd={handleDeleteAd}
        onEditAd={adminView === 'edit' ? openEditAdModal : undefined}
        isClientView={adminView !== 'edit'}
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
