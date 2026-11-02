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
    video.currentTime = targetTime;

    await new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve();
      video.onerror = () => reject(new Error('Could not seek video for poster'));
    });

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not available');
    ctx.drawImage(video, 0, 0, w, h);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Poster encode failed'))),
        'image/jpeg',
        0.86
      );
    });

    const base = videoFile.name.replace(/\.[^.]+$/, '') || 'spot';
    return new File([blob], `${base}-poster.jpg`, { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
