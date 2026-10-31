'use client';

import React, { useState, useEffect } from 'react';
import { CommercialShow, CommercialAd } from '@/types/timeline';
import { INITIAL_SHOWS, INITIAL_ADS } from '@/lib/mock-data';
import { computeAdStatus } from '@/lib/date-utils';

import { ClientTimelineScreen } from '@/components/ClientTimelineScreen';
import { AdPreviewModal } from '@/components/AdPreviewModal';

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
  const [selectedAd, setSelectedAd] = useState<CommercialAd | null>(null);

  // Restore from localStorage and recompute statuses dynamically
  useEffect(() => {
    try {
      const savedShows = localStorage.getItem(STORAGE_KEY_SHOWS);
      const savedAds = localStorage.getItem(STORAGE_KEY_ADS);

      const parsedShows: CommercialShow[] = savedShows ? JSON.parse(savedShows) : INITIAL_SHOWS;
      const baseShows = migrateShows(parsedShows);
      const baseAds: CommercialAd[] = savedAds ? JSON.parse(savedAds) : INITIAL_ADS;

      // Calculate status based on current reference date (2026-10-31)
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

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Client Timeline Screen (Dedicated, Read-Only, Rich Timeline) */}
      <ClientTimelineScreen
        ads={ads}
        shows={shows}
        selectedShowId={selectedShowId}
        onSelectShow={setSelectedShowId}
        onSelectAd={setSelectedAd}
      />

      {/* Client Video Player & Commercial Preview Modal */}
      <AdPreviewModal
        ad={selectedAd}
        shows={shows}
        onClose={() => setSelectedAd(null)}
      />
    </div>
  );
}
