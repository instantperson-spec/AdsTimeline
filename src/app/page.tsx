'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CommercialShow, CommercialAd, AdminNavView } from '@/types/timeline';
import { computeAdStatus } from '@/lib/date-utils';
import {
  fetchTimelineData,
  apiCreateShow,
  apiDeleteShow,
  apiUpdateShow,
  apiUpdateShowBreakCount,
  apiRemoveBreak,
  apiCreateAd,
  apiUpdateAd,
  apiDeleteAd,
} from '@/lib/timeline-api';

import { Header } from '@/components/Header';
import { AdminSidebar } from '@/components/AdminSidebar';
import { ClientTimelineListView } from '@/components/ClientTimelineListView';
import { BreaksSlotMatrix } from '@/components/BreaksSlotMatrix';
import { ShowProgrammesPanel } from '@/components/ShowProgrammesPanel';
import { AdPreviewModal } from '@/components/AdPreviewModal';
import { NewAdModal } from '@/components/NewAdModal';
import { NewShowModal } from '@/components/NewShowModal';
import { TrafficCueSheetModal } from '@/components/TrafficCueSheetModal';
import { MediaLibraryPanel } from '@/components/MediaLibraryPanel';

export default function AdsTimelineApp() {
  const [shows, setShows] = useState<CommercialShow[]>([]);
  const [ads, setAds] = useState<CommercialAd[]>([]);
  const [selectedShowId, setSelectedShowId] = useState<string>('all');
  const [adminView, setAdminView] = useState<AdminNavView>('cards');

  const [selectedAd, setSelectedAd] = useState<CommercialAd | null>(null);
  const [isNewAdOpen, setIsNewAdOpen] = useState(false);
  const [newAdShowId, setNewAdShowId] = useState<string | undefined>(undefined);
  const [newAdBreakNumber, setNewAdBreakNumber] = useState<number | undefined>(undefined);
  const [editingAd, setEditingAd] = useState<CommercialAd | null>(null);
  const [isNewShowOpen, setIsNewShowOpen] = useState(false);
  const [isCueSheetOpen, setIsCueSheetOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reloadTimeline = useCallback(async () => {
    const data = await fetchTimelineData();
    setShows(data.shows);
    setAds(data.ads.map((ad) => ({ ...ad, status: computeAdStatus(ad) })));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        await reloadTimeline();
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Failed to load timeline');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadTimeline]);

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

  const handleCreateAd = async (newAd: CommercialAd) => {
    const created = await apiCreateAd(newAd);
    setAds((prev) => [{ ...created, status: computeAdStatus(created) }, ...prev]);
  };

  const handleUpdateAd = async (updatedAd: CommercialAd) => {
    const saved = await apiUpdateAd(updatedAd);
    const withStatus = { ...saved, status: computeAdStatus(saved) };
    setAds((prev) => prev.map((a) => (a.id === withStatus.id ? withStatus : a)));
    if (selectedAd?.id === withStatus.id) {
      setSelectedAd(withStatus);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    await apiDeleteAd(adId);
    setAds((prev) => prev.filter((a) => a.id !== adId));
    if (selectedAd?.id === adId) {
      setSelectedAd(null);
    }
  };

  const handleTakeOffAd = async (adId: string, replacementNote?: string) => {
    const ad = ads.find((a) => a.id === adId);
    if (!ad) return;
    const updated: CommercialAd = {
      ...ad,
      takenOffAt: new Date().toISOString().split('T')[0],
      replacementAdTitle: replacementNote || 'Pulled from air and replaced with station filler.',
    };
    await handleUpdateAd(updated);
  };

  const handleRestoreAd = async (adId: string) => {
    const ad = ads.find((a) => a.id === adId);
    if (!ad) return;
    const updated: CommercialAd = {
      ...ad,
      takenOffAt: undefined,
      replacementAdTitle: undefined,
    };
    await handleUpdateAd(updated);
  };

  const handleCreateShow = async (newShow: CommercialShow) => {
    const created = await apiCreateShow(newShow);
    setShows((prev) => [...prev, created]);
    setSelectedShowId(created.id);
  };

  const handleDeleteShow = async (showId: string) => {
    await apiDeleteShow(showId);
    setShows((prev) => prev.filter((s) => s.id !== showId));
    setAds((prev) => prev.filter((a) => a.showId !== showId));
    setSelectedShowId('all');
  };

  const handleUpdateShow = async (showId: string, patch: Partial<CommercialShow>) => {
    const saved = await apiUpdateShow(showId, patch);
    setShows((prev) => prev.map((s) => (s.id === showId ? saved : s)));
  };

  const handleAddBreak = async (showId: string) => {
    const show = shows.find((s) => s.id === showId);
    if (!show) return;
    const nextCount = Math.min(6, show.breakCount + 1);
    await apiUpdateShowBreakCount(showId, nextCount);
    setShows((prev) =>
      prev.map((s) => (s.id === showId ? { ...s, breakCount: nextCount } : s))
    );
  };

  const handleRemoveBreak = async (showId: string, breakNumber: number) => {
    const show = shows.find((s) => s.id === showId);
    if (!show || show.breakCount <= 1) return;

    if (!confirm(`Remove break ${breakNumber} and all its ads from "${show.title}"?`)) {
      return;
    }

    const data = await apiRemoveBreak(showId, breakNumber);
    setShows(data.shows);
    setAds(data.ads.map((ad) => ({ ...ad, status: computeAdStatus(ad) })));
  };

  const expiredCount = ads.filter((a) => !a.takenOffAt && a.status === 'expired').length;

  if (loading) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Loading schedule…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-rose-500/40 bg-rose-950/30 p-6 text-center">
          <p className="text-rose-200 font-semibold">Cannot load timeline</p>
          <p className="text-sm text-zinc-400 mt-2">{loadError}</p>
          <p className="text-xs text-zinc-500 mt-4">
            Set <code className="text-zinc-300">DATABASE_URL</code> (Neon) and{' '}
            <code className="text-zinc-300">BLOB_READ_WRITE_TOKEN</code> (Vercel Blob) on Vercel.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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

          {adminView === 'programmes' && (
            <ShowProgrammesPanel
              shows={shows}
              selectedShowId={selectedShowId}
              onSaveShow={handleUpdateShow}
              onDeleteShow={handleDeleteShow}
              onOpenNewShow={() => setIsNewShowOpen(true)}
            />
          )}

          {adminView === 'media' && <MediaLibraryPanel />}

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
