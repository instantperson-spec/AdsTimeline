'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LayoutList, GanttChart } from 'lucide-react';
import { CommercialAd, CommercialShow } from '@/types/timeline';
import { computeAdStatus } from '@/lib/date-utils';
import { parseClientShowParam, parseClientViewsParam } from '@/lib/client-portal-url';
import type { ClientPortalViewMode } from '@/lib/client-portal-url';
import { fetchTimelineData } from '@/lib/timeline-api';
import { ClientPortalView } from '@/components/ClientPortalView';
import { ClientTimelineListView } from '@/components/ClientTimelineListView';
import { AdPreviewModal } from '@/components/AdPreviewModal';

function ClientPortalInner() {
  const searchParams = useSearchParams();
  const showFromUrl = searchParams.get('show');
  const clientViews = parseClientViewsParam(searchParams.get('view'));
  const showList = clientViews.includes('list');
  const showTimeline = clientViews.includes('timeline');
  const useTabs = showList && showTimeline;

  const [shows, setShows] = useState<CommercialShow[]>([]);
  const [ads, setAds] = useState<CommercialAd[]>([]);
  const [selectedShowId, setSelectedShowId] = useState<string>('all');
  const [selectedAd, setSelectedAd] = useState<CommercialAd | null>(null);
  const [activeTab, setActiveTab] = useState<ClientPortalViewMode>(() =>
    showList ? 'list' : 'timeline'
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (showList && !showTimeline) setActiveTab('list');
    else if (!showList && showTimeline) setActiveTab('timeline');
  }, [showList, showTimeline]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await fetchTimelineData();
        if (cancelled) return;
        setShows(data.shows);
        setAds(
          data.ads
            .filter((a) => !a.takenOffAt)
            .map((a) => ({ ...a, status: computeAdStatus(a) }))
        );
        setSelectedShowId(parseClientShowParam(showFromUrl, data.shows));
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Failed to load');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showFromUrl]);

  const clientAds = ads;

  const currentShow =
    selectedShowId === 'all' ? null : shows.find((s) => s.id === selectedShowId);

  const showListPanel = !useTabs ? showList : activeTab === 'list';
  const showTimelinePanel = !useTabs ? showTimeline : activeTab === 'timeline';

  if (loading) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Loading…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center p-6 text-center text-zinc-400">
        <p>{loadError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <header className="border-b border-zinc-800 bg-zinc-900 shrink-0 px-4 py-4 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Instant Productions · Faith World TV
        </p>
        <h1 className="text-xl font-bold text-white mt-0.5">Your commercials on air</h1>
        {selectedShowId === 'all' ? (
          <p className="text-sm text-zinc-400 mt-1">All programmes</p>
        ) : (
          currentShow && (
            <>
              <p className="text-sm font-medium text-white mt-1">{currentShow.title}</p>
              <p className="text-sm text-zinc-400">{currentShow.broadcastSchedule}</p>
            </>
          )
        )}
      </header>

      {useTabs && (
        <div
          className="shrink-0 px-4 lg:px-8 py-2 border-b border-zinc-800 bg-zinc-900/95"
          role="tablist"
          aria-label="Ad views"
        >
          <div className="inline-flex w-full sm:w-auto rounded-xl border border-zinc-700 bg-zinc-950 p-1 gap-1">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'list'}
              onClick={() => setActiveTab('list')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80'
              }`}
            >
              <LayoutList className="w-4 h-4 shrink-0" />
              Spot list
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'timeline'}
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80'
              }`}
            >
              <GanttChart className="w-4 h-4 shrink-0" />
              Timeline
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {showListPanel && (
          <section role="tabpanel" className="flex-1 min-h-0 flex flex-col overflow-y-auto">
            <ClientPortalView
              ads={clientAds}
              shows={shows}
              selectedShowId={selectedShowId}
              onSelectShow={() => {}}
              onSelectAd={setSelectedAd}
              hideShowPicker
              hideIntroCard
            />
          </section>
        )}

        {showTimelinePanel && (
          <section role="tabpanel" className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <ClientTimelineListView
              ads={clientAds}
              shows={shows}
              selectedShowId={selectedShowId}
              onSelectAd={setSelectedAd}
              subView="gantt_timeline"
              isClientView
            />
          </section>
        )}
      </main>

      <AdPreviewModal
        ad={selectedAd}
        shows={shows}
        onClose={() => setSelectedAd(null)}
        isClientView
      />
    </div>
  );
}

export default function ClientPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
          Loading…
        </div>
      }
    >
      <ClientPortalInner />
    </Suspense>
  );
}
