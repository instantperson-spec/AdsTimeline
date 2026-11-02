import { upload } from '@vercel/blob/client';
import type { MediaAsset } from '@/types/media';
import { compressVideoForWebPreview, shouldCompressVideo } from '@/lib/compress-video';
import { extractVideoPosterFile } from '@/lib/extract-video-poster';
import { MEDIA_MAX_BYTES, newMediaAssetId, posterExtension } from '@/lib/media-shared';
import { isVideoFile, readVideoMetadata } from '@/lib/video-meta';

const CLIENT_UPLOAD_URL = '/api/media/client-upload';

export type CreateMediaOptions = {
  label?: string;
  compressWebVideo?: boolean;
  onCompressProgress?: (ratio: number) => void;
  /** When set for video upload, skips auto poster extraction at 1s. */
  posterFile?: File;
};

function assertFileSize(file: File, label: string): void {
  if (file.size > MEDIA_MAX_BYTES) {
    throw new Error(`${label} exceeds ${Math.round(MEDIA_MAX_BYTES / (1024 * 1024))} MB limit`);
  }
}

async function uploadMediaFile(
  pathname: string,
  file: File,
  onProgress?: (ratio: number) => void
): Promise<{ url: string; pathname: string }> {
  const multipart = file.size > 8 * 1024 * 1024;
  const result = await upload(pathname, file, {
    access: 'public',
    handleUploadUrl: CLIENT_UPLOAD_URL,
    multipart,
    contentType: file.type || undefined,
    onUploadProgress: onProgress
      ? ({ percentage }) => {
          if (typeof percentage === 'number') {
            onProgress(Math.min(1, Math.max(0, percentage / 100)));
          }
        }
      : undefined,
  });
  return { url: result.url, pathname: result.pathname };
}

export async function createMediaAssetFromFiles(
  file: File,
  options: CreateMediaOptions = {}
): Promise<MediaAsset> {
  const id = newMediaAssetId();
  const label = options.label?.trim();

  if (isVideoFile(file)) {
    let videoToUpload = file;
    assertFileSize(file, 'Video');

    if (options.compressWebVideo !== false) {
      const meta = await readVideoMetadata(file);
      if (shouldCompressVideo(meta.width, meta.height, file.size)) {
        try {
          videoToUpload = await compressVideoForWebPreview(file, options.onCompressProgress);
        } catch {
          videoToUpload = file;
        }
      }
    }

    assertFileSize(videoToUpload, 'Video');

    const poster =
      options.posterFile ??
      (await extractVideoPosterFile(videoToUpload));
    assertFileSize(poster, 'Poster');

    const posterPath = `media/${id}/poster${posterExtension(poster)}`;
    const videoPath = `media/${id}/preview.mp4`;

    const posterBlob = await uploadMediaFile(posterPath, poster);
    const videoBlob = await uploadMediaFile(videoPath, videoToUpload, options.onCompressProgress);

    const res = await fetch('/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        label,
        posterUrl: posterBlob.url,
        posterPathname: posterBlob.pathname,
        videoUrl: videoBlob.url,
        videoPathname: videoBlob.pathname,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(typeof data.error === 'string' ? data.error : 'Media upload failed');
    }
    return data as MediaAsset;
  }

  if (file.type.startsWith('image/')) {
    assertFileSize(file, 'Image');
    const posterPath = `media/${id}/poster${posterExtension(file)}`;
    const posterBlob = await uploadMediaFile(posterPath, file);

    const res = await fetch('/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        label,
        posterUrl: posterBlob.url,
        posterPathname: posterBlob.pathname,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(typeof data.error === 'string' ? data.error : 'Media upload failed');
    }
    return data as MediaAsset;
  }

  throw new Error('Choose a JPG/PNG screen grab or MP4 preview');
}

export async function replaceMediaAssetPoster(
  asset: MediaAsset,
  posterFile: File
): Promise<MediaAsset> {
  assertFileSize(posterFile, 'Poster');
  if (!asset.posterPathname.startsWith(`media/${asset.id}/`)) {
    throw new Error('Invalid poster path for this asset');
  }

  const posterBlob = await uploadMediaFile(asset.posterPathname, posterFile);

  const res = await fetch(`/api/media/${encodeURIComponent(asset.id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      posterUrl: posterBlob.url,
      posterPathname: posterBlob.pathname,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Could not update poster');
  }
  return data as MediaAsset;
}
