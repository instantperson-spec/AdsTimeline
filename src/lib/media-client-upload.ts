import type { MediaAsset } from '@/types/media';
import { compressVideoForWebPreview, shouldCompressVideo } from '@/lib/compress-video';
import { extractVideoPosterFile } from '@/lib/extract-video-poster';
import { isVideoFile, readVideoMetadata } from '@/lib/video-meta';

export type CreateMediaOptions = {
  label?: string;
  compressWebVideo?: boolean;
  onCompressProgress?: (ratio: number) => void;
};

export async function createMediaAssetFromFiles(
  file: File,
  options: CreateMediaOptions = {}
): Promise<MediaAsset> {
  const formData = new FormData();
  if (options.label?.trim()) {
    formData.append('label', options.label.trim());
  }

  if (isVideoFile(file)) {
    let videoToUpload = file;
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
    const poster = await extractVideoPosterFile(videoToUpload);
    formData.append('poster', poster);
    formData.append('video', videoToUpload);
  } else if (file.type.startsWith('image/')) {
    formData.append('poster', file);
  } else {
    throw new Error('Choose a JPG/PNG screen grab or MP4 preview');
  }

  const res = await fetch('/api/media', { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Media upload failed');
  }
  return data as MediaAsset;
}
