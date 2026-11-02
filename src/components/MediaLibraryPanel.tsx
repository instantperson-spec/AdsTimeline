'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Film,
  ImageIcon,
  Trash2,
  Upload,
  RefreshCw,
  Search,
  Play,
  X,
  Scan,
} from 'lucide-react';
import type { MediaAsset } from '@/types/media';
import { apiDeleteMediaAsset, fetchMediaAssets } from '@/lib/timeline-api';
import {
  createMediaAssetFromFiles,
  replaceMediaAssetPoster,
} from '@/lib/media-client-upload';
import { assetNeedsVideoThumbnail } from '@/lib/media-display';
import { isVideoFile } from '@/lib/video-meta';
import { useAppDialog } from '@/components/app-dialog/AppDialogProvider';
import {
  VideoFramePickerModal,
  sourceKeyForPicker,
  type VideoFramePickerSource,
} from '@/components/VideoFramePickerModal';

type KindFilter = 'all' | 'image_only' | 'video_and_poster';

type FramePickerContext =
  | { mode: 'upload'; file: File; label: string }
  | { mode: 'replace'; asset: MediaAsset };

export function MediaLibraryPanel() {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [uploading, setUploading] = useState(false);
  const [compressProgress, setCompressProgress] = useState<number | null>(null);
  const [uploadLabel, setUploadLabel] = useState('');
  const [compressWebVideo, setCompressWebVideo] = useState(true);
  const [preview, setPreview] = useState<MediaAsset | null>(null);
  const [framePicker, setFramePicker] = useState<FramePickerContext | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const dialog = useAppDialog();

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchMediaAssets();
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((m) => {
      if (kindFilter !== 'all' && m.kind !== kindFilter) return false;
      if (!q) return true;
      return m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
    });
  }, [items, search, kindFilter]);

  const runVideoUpload = async (file: File, label: string, posterFile: File) => {
    setActionError(null);
    setUploading(true);
    setCompressProgress(null);
    try {
      const created = await createMediaAssetFromFiles(file, {
        label,
        compressWebVideo,
        posterFile,
        onCompressProgress: setCompressProgress,
      });
      setItems((prev) => [created, ...prev]);
      setUploadLabel('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setCompressProgress(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (isVideoFile(file)) {
      setFramePicker({ mode: 'upload', file, label: uploadLabel });
      return;
    }

    setActionError(null);
    setUploading(true);
    try {
      const created = await createMediaAssetFromFiles(file, { label: uploadLabel });
      setItems((prev) => [created, ...prev]);
      setUploadLabel('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (asset: MediaAsset) => {
    const ok = await dialog.confirm({
      title: 'Delete media',
      message: `Delete "${asset.label}" from cloud storage?\n\nThis cannot be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    setActionError(null);
    try {
      await apiDeleteMediaAsset(asset.id);
      setItems((prev) => prev.filter((m) => m.id !== asset.id));
      if (preview?.id === asset.id) setPreview(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const framePickerSource: VideoFramePickerSource | null = useMemo(() => {
    if (!framePicker) return null;
    if (framePicker.mode === 'upload') {
      return { mode: 'file', file: framePicker.file };
    }
    return {
      mode: 'url',
      url: framePicker.asset.videoUrl!,
      filenameBase: framePicker.asset.label,
    };
  }, [framePicker]);

  const framePickerModalKey = useMemo(() => {
    if (!framePicker) return 'closed';
    if (framePicker.mode === 'upload') {
      return sourceKeyForPicker({ mode: 'file', file: framePicker.file }) ?? 'upload';
    }
    return framePicker.asset.id;
  }, [framePicker]);

  const patchAssetInList = (updated: MediaAsset) => {
    setItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setPreview((p) => (p?.id === updated.id ? updated : p));
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-zinc-950">
      <div className="shrink-0 border-b border-zinc-800 px-4 lg:px-6 py-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-indigo-400" />
              Media library
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Cloud assets (JPG screen grab or MP4 + poster). For video, pick the poster frame before
              upload or anytime from the card / preview.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search label…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-100"
            />
          </div>
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as KindFilter)}
            className="py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200"
          >
            <option value="all">All types</option>
            <option value="image_only">Image only (JPG)</option>
            <option value="video_and_poster">Video + poster</option>
          </select>
          <input
            type="text"
            value={uploadLabel}
            onChange={(e) => setUploadLabel(e.target.value)}
            placeholder="Label (optional)"
            className="py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 min-w-[160px]"
          />
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold">
            <Upload className="w-4 h-4" />
            {uploading
              ? compressProgress != null
                ? `Converting… ${Math.round(compressProgress * 100)}%`
                : 'Uploading…'
              : 'Upload JPG or MP4'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
              className="hidden"
              disabled={uploading || framePicker !== null}
              onChange={handleUpload}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input
            type="checkbox"
            checked={compressWebVideo}
            onChange={(e) => setCompressWebVideo(e.target.checked)}
            disabled={uploading}
            className="rounded border-zinc-700"
          />
          Compress large MP4 to ~480p before upload
        </label>

        {(error || actionError) && (
          <p className="text-sm text-rose-400">{error || actionError}</p>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6">
        {loading && items.length === 0 ? (
          <p className="text-zinc-500 text-sm">Loading media…</p>
        ) : filtered.length === 0 ? (
          <p className="text-zinc-500 text-sm">No media yet. Upload a screen grab or preview MP4.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((asset) => (
              <article
                key={asset.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => setPreview(asset)}
                  className="relative aspect-video bg-black group"
                >
                  {assetNeedsVideoThumbnail(asset) && asset.videoUrl ? (
                    <video
                      src={asset.videoUrl}
                      poster={asset.posterUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={asset.posterUrl}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  )}
                  {asset.videoUrl && (
                    <span className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/70 text-white">
                      <Play className="w-4 h-4" />
                    </span>
                  )}
                </button>
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-zinc-100 line-clamp-2">{asset.label}</p>
                    <span
                      className={`shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        asset.kind === 'image_only'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {asset.kind === 'image_only' ? 'JPG' : 'Video'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono truncate">{asset.id}</p>
                  <p className="text-xs text-zinc-400">
                    Used by{' '}
                    <span className="text-zinc-200 font-semibold">{asset.referenceCount}</span>{' '}
                    spot{asset.referenceCount === 1 ? '' : 's'}
                  </p>
                  {asset.videoUrl && (
                    <button
                      type="button"
                      onClick={() => setFramePicker({ mode: 'replace', asset })}
                      className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border border-indigo-500/40 text-indigo-200 hover:bg-indigo-950/50"
                    >
                      <Scan className="w-3.5 h-3.5" />
                      Pick poster frame
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={asset.referenceCount > 0}
                    title={
                      asset.referenceCount > 0
                        ? 'Unlink from all spots before delete'
                        : 'Delete from cloud'
                    }
                    onClick={() => void handleDelete(asset)}
                    className="mt-auto inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border border-rose-500/40 text-rose-300 hover:bg-rose-950/50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-3xl rounded-2xl bg-zinc-900 border border-zinc-700 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div>
                <p className="font-bold text-white">{preview.label}</p>
                <p className="text-xs text-zinc-500 font-mono">{preview.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              {preview.videoUrl ? (
                <video
                  src={preview.videoUrl}
                  poster={preview.posterUrl}
                  controls
                  playsInline
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={preview.posterUrl} alt="" className="w-full h-full object-contain" />
              )}
            </div>
            <div className="px-4 py-3 flex flex-wrap items-center gap-2 text-sm text-zinc-400 border-t border-zinc-800">
              {preview.kind === 'image_only' ? (
                <ImageIcon className="w-4 h-4 text-amber-400" />
              ) : (
                <Film className="w-4 h-4 text-indigo-400" />
              )}
              <span className="flex-1 min-w-[140px]">
                {preview.kind === 'image_only' ? 'Screen grab only' : 'Preview video + poster'}
              </span>
              {preview.videoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setFramePicker({ mode: 'replace', asset: preview });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-200 text-xs font-semibold hover:bg-indigo-600/30"
                >
                  <Scan className="w-3.5 h-3.5" />
                  Pick poster frame
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <VideoFramePickerModal
        key={framePickerModalKey}
        isOpen={framePicker !== null}
        onClose={() => !uploading && setFramePicker(null)}
        source={framePickerSource}
        busy={uploading}
        title={
          framePicker?.mode === 'upload'
            ? 'Choose poster frame — then upload'
            : 'Update poster frame'
        }
        confirmLabel={
          framePicker?.mode === 'upload' ? 'Upload with this frame' : 'Save poster frame'
        }
        onConfirm={async (posterFile) => {
          if (!framePicker) return;
          if (framePicker.mode === 'upload') {
            setFramePicker(null);
            await runVideoUpload(framePicker.file, framePicker.label, posterFile);
            return;
          }
          setUploading(true);
          setActionError(null);
          try {
            const updated = await replaceMediaAssetPoster(framePicker.asset, posterFile);
            patchAssetInList(updated);
            setFramePicker(null);
          } catch (err) {
            setActionError(err instanceof Error ? err.message : 'Could not update poster');
          } finally {
            setUploading(false);
          }
        }}
      />
    </div>
  );
}
