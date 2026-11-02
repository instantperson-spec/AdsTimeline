import { assertUploadSize, newMediaAssetId, posterExtension, uploadBlobFile } from '@/lib/media-blob';
import { isAllowedMediaBlobPathname } from '@/lib/media-shared';
import type { MediaAssetKind } from '@/types/media';
import { insertMediaAsset } from '@/lib/db/media-repository';
import type { MediaAsset } from '@/types/media';

function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4');
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export async function createMediaAssetFromFormData(formData: FormData): Promise<MediaAsset> {
  const label = String(formData.get('label') ?? '').trim();
  const posterEntry = formData.get('poster');
  const videoEntry = formData.get('video');

  const posterFile = posterEntry instanceof File && posterEntry.size > 0 ? posterEntry : null;
  const videoFile = videoEntry instanceof File && videoEntry.size > 0 ? videoEntry : null;

  if (!posterFile && !videoFile) {
    throw new Error('Upload a JPG/PNG screen grab and/or preview MP4');
  }
  if (posterFile && !isImageFile(posterFile)) {
    throw new Error('Poster must be an image (JPG, PNG, WebP)');
  }
  if (videoFile && !isVideoFile(videoFile)) {
    throw new Error('Preview must be a video file (MP4)');
  }
  if (videoFile && !posterFile) {
    throw new Error('Poster image is required with video (upload JPG or generate client-side)');
  }
  if (!posterFile) {
    throw new Error('Screen grab / poster image is required');
  }

  assertUploadSize(posterFile.size);
  if (videoFile) assertUploadSize(videoFile.size);

  const id = newMediaAssetId();
  const ext = posterExtension(posterFile);
  const posterPath = `media/${id}/poster${ext}`;
  const posterBlob = await uploadBlobFile(posterPath, posterFile);

  let videoUrl: string | undefined;
  let videoPathname: string | undefined;
  if (videoFile) {
    const videoPath = `media/${id}/preview.mp4`;
    const videoBlob = await uploadBlobFile(videoPath, videoFile);
    videoUrl = videoBlob.url;
    videoPathname = videoBlob.pathname;
  }

  const kind: MediaAssetKind = videoFile ? 'video_and_poster' : 'image_only';
  const defaultLabel =
    label ||
    posterFile.name.replace(/\.[^.]+$/, '') ||
    (videoFile ? videoFile.name.replace(/\.[^.]+$/, '') : 'Media');

  return insertMediaAsset({
    id,
    label: defaultLabel,
    kind,
    posterUrl: posterBlob.url,
    posterPathname: posterBlob.pathname,
    videoUrl,
    videoPathname,
  });
}

export type MediaAssetBlobRefs = {
  id: string;
  label?: string;
  posterUrl: string;
  posterPathname: string;
  videoUrl?: string;
  videoPathname?: string;
};

/** Register a media asset after files were uploaded via Vercel Blob client upload. */
export async function createMediaAssetFromBlobRefs(input: MediaAssetBlobRefs): Promise<MediaAsset> {
  const id = input.id.trim();
  if (!/^med-\d+-[a-z0-9]+$/.test(id)) {
    throw new Error('Invalid media asset id');
  }
  if (!isAllowedMediaBlobPathname(input.posterPathname)) {
    throw new Error('Invalid poster path');
  }
  if (!input.posterPathname.startsWith(`media/${id}/`)) {
    throw new Error('Poster path must match asset id');
  }
  if (input.videoPathname) {
    if (!isAllowedMediaBlobPathname(input.videoPathname)) {
      throw new Error('Invalid video path');
    }
    if (input.videoPathname !== `media/${id}/preview.mp4`) {
      throw new Error('Video path must be preview.mp4 for this asset');
    }
    if (!input.videoUrl?.trim()) {
      throw new Error('videoUrl is required with videoPathname');
    }
  }

  const kind: MediaAssetKind = input.videoPathname ? 'video_and_poster' : 'image_only';
  const defaultLabel = input.label?.trim() || 'Media';

  return insertMediaAsset({
    id,
    label: defaultLabel,
    kind,
    posterUrl: input.posterUrl.trim(),
    posterPathname: input.posterPathname,
    videoUrl: input.videoUrl?.trim(),
    videoPathname: input.videoPathname,
  });
}
