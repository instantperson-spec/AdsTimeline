import type { MediaAsset } from '@/types/media';
import { isPlaceholderPosterUrl } from '@/lib/media-blob';

/** Bust CDN/browser cache when a blob is overwritten at the same URL (e.g. new poster JPG). */
export function cacheBustedUrl(url: string, version?: string | number | null): string {
  if (!url || url.startsWith('/')) return url;
  if (version == null || version === '') return url;
  try {
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'https://ads-timeline.local';
    const parsed = new URL(url, base);
    parsed.searchParams.set('v', String(version));
    return parsed.toString();
  } catch {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}v=${encodeURIComponent(String(version))}`;
  }
}

export function mediaAssetPosterSrc(asset: Pick<MediaAsset, 'posterUrl' | 'updatedAt'>): string {
  const ts = asset.updatedAt ? new Date(asset.updatedAt).getTime() : undefined;
  return cacheBustedUrl(asset.posterUrl, ts);
}

export function adPosterSrc(ad: { frameGrabUrl: string; updatedAt?: string }): string {
  const ts = ad.updatedAt ? new Date(ad.updatedAt).getTime() : undefined;
  return cacheBustedUrl(ad.frameGrabUrl, ts);
}

/** Legacy MP4-only uploads may use the video URL (or placeholder) as poster — use <video> for thumbs. */
export function assetNeedsVideoThumbnail(asset: Pick<MediaAsset, 'posterUrl' | 'videoUrl'>): boolean {
  if (!asset.videoUrl) return false;
  if (asset.posterUrl === asset.videoUrl) return true;
  if (isPlaceholderPosterUrl(asset.posterUrl)) return true;
  return /\.mp4(\?|$)/i.test(asset.posterUrl);
}
