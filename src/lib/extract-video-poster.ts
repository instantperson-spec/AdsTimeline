export type VideoFrameSource =
  | { type: 'file'; file: File }
  | { type: 'url'; url: string };

function clampSeekTime(timeSec: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return Math.max(0, timeSec);
  }
  return Math.min(Math.max(0, timeSec), Math.max(0.05, duration - 0.04));
}

async function waitForVideoMetadata(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 1) return;
  await new Promise<void>((resolve, reject) => {
    const onMeta = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error('Could not load video'));
    };
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('error', onErr);
    };
    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('error', onErr);
  });
}

async function seekVideoTo(video: HTMLVideoElement, timeSec: number): Promise<void> {
  const target = clampSeekTime(timeSec, video.duration);
  if (Math.abs(video.currentTime - target) < 0.02) return;
  await new Promise<void>((resolve, reject) => {
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error('Could not seek video'));
    };
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onErr);
    };
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onErr);
    video.currentTime = target;
  });
}

/** Capture the current frame from an already-loaded, seeked video element. */
export async function captureFrameFromVideoElement(video: HTMLVideoElement): Promise<Blob> {
  return videoFrameToJpegBlob(video);
}

async function videoFrameToJpegBlob(video: HTMLVideoElement): Promise<Blob> {
  const w = video.videoWidth || 1280;
  const h = video.videoHeight || 720;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');
  ctx.drawImage(video, 0, 0, w, h);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Poster encode failed'))),
      'image/jpeg',
      0.88
    );
  });
}

/** Capture a JPEG frame at `timeSec` from a local file or remote URL (needs CORS on URL). */
export async function captureVideoFrameAtTime(
  source: VideoFrameSource,
  timeSec: number
): Promise<Blob> {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  let revoke: (() => void) | undefined;
  if (source.type === 'file') {
    const objectUrl = URL.createObjectURL(source.file);
    video.src = objectUrl;
    revoke = () => URL.revokeObjectURL(objectUrl);
  } else {
    video.crossOrigin = 'anonymous';
    video.src = source.url;
  }

  try {
    await waitForVideoMetadata(video);
    await seekVideoTo(video, timeSec);
    return await videoFrameToJpegBlob(video);
  } finally {
    revoke?.();
    video.removeAttribute('src');
    video.load();
  }
}

export async function captureVideoFrameFileAtTime(
  source: VideoFrameSource,
  timeSec: number,
  filenameBase = 'poster'
): Promise<File> {
  const blob = await captureVideoFrameAtTime(source, timeSec);
  const safeBase = filenameBase.replace(/\.[^.]+$/, '') || 'poster';
  return new File([blob], `${safeBase}-poster.jpg`, { type: 'image/jpeg' });
}

/** Capture a JPEG poster frame from a local video file (browser only). */
export async function extractVideoPosterFile(
  videoFile: File,
  seekSec = 1
): Promise<File> {
  const objectUrl = URL.createObjectURL(videoFile);
  try {
    const video = document.createElement('video');
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('Could not read video for poster'));
    });

    const targetTime =
      Number.isFinite(video.duration) && video.duration > 0
        ? Math.min(seekSec, Math.max(0.05, video.duration * 0.08))
        : seekSec;

    const blob = await captureVideoFrameAtTime({ type: 'file', file: videoFile }, targetTime);
    const base = videoFile.name.replace(/\.[^.]+$/, '') || 'spot';
    return new File([blob], `${base}-poster.jpg`, { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function formatVideoTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
