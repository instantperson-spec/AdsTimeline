import type { MediaAsset } from '@/types/media';
import { isPlaceholderPosterUrl } from '@/lib/media-blob';

/** Legacy MP4-only uploads may use the video URL (or placeholder) as poster — use <video> for thumbs. */
export function assetNeedsVideoThumbnail(asset: Pick<MediaAsset, 'posterUrl' | 'videoUrl'>): boolean {
  if (!asset.videoUrl) return false;
  if (asset.posterUrl === asset.videoUrl) return true;
  if (isPlaceholderPosterUrl(asset.posterUrl)) return true;
  return /\.mp4(\?|$)/i.test(asset.posterUrl);
}
