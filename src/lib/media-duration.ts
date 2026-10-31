/** Read duration in whole seconds from a local video file (browser). */
export function readVideoDurationSec(file: File): Promise<number | null> {
  if (!file.type.startsWith('video/') && !file.name.toLowerCase().endsWith('.mp4')) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    const finish = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };

    video.onloadedmetadata = () => {
      const raw = video.duration;
      if (!Number.isFinite(raw) || raw <= 0) {
        finish(null);
        return;
      }
      finish(Math.max(1, Math.round(raw)));
    };

    video.onerror = () => finish(null);
    video.src = url;
  });
}
