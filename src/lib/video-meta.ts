export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4');
}

export function readVideoMetadata(file: File): Promise<{ durationSec: number | null; width: number; height: number }> {
  if (!isVideoFile(file)) {
    return Promise.resolve({ durationSec: null, width: 0, height: 0 });
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    const finish = (result: { durationSec: number | null; width: number; height: number }) => {
      URL.revokeObjectURL(url);
      resolve(result);
    };

    video.onloadedmetadata = () => {
      const durationSec =
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.max(1, Math.round(video.duration))
          : null;
      finish({
        durationSec,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => finish({ durationSec: null, width: 0, height: 0 });
    video.src = url;
  });
}
