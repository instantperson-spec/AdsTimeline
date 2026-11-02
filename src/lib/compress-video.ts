'use client';

import { isVideoFile } from '@/lib/video-meta';

/** Max long edge for web preview spots (traffic / client portal). */
export const WEB_PREVIEW_MAX_WIDTH = 854;
export const WEB_PREVIEW_MAX_HEIGHT = 480;

export function shouldCompressVideo(width: number, height: number, fileSizeBytes: number): boolean {
  if (width <= 0 || height <= 0) return fileSizeBytes > 8 * 1024 * 1024;
  const longEdge = Math.max(width, height);
  return longEdge > WEB_PREVIEW_MAX_HEIGHT || fileSizeBytes > 12 * 1024 * 1024;
}

type FfmpegRuntime = {
  FFmpeg: new () => {
    load: (config: { coreURL: string; wasmURL: string }) => Promise<void>;
    on: (event: 'progress', cb: (payload: { progress?: number }) => void) => void;
    writeFile: (name: string, data: Uint8Array) => Promise<void>;
    readFile: (name: string) => Promise<Uint8Array | string>;
    exec: (args: string[]) => Promise<void>;
  };
  fetchFile: (file: File) => Promise<Uint8Array>;
  toBlobURL: (url: string, mime: string) => Promise<string>;
};

let ffmpegModules: Promise<FfmpegRuntime> | null = null;

/** Runtime CDN imports — avoids bundling @ffmpeg/ffmpeg (Worker URLs break Turbopack). */
async function loadFfmpegModules(): Promise<FfmpegRuntime> {
  if (!ffmpegModules) {
    ffmpegModules = (async () => {
      const importEsm = (url: string) =>
        new Function('u', 'return import(u)')(url) as Promise<Record<string, unknown>>;
      const [ffmpeg, util] = await Promise.all([
        importEsm('https://esm.sh/@ffmpeg/ffmpeg@0.12.15'),
        importEsm('https://esm.sh/@ffmpeg/util@0.12.2'),
      ]);
      return {
        FFmpeg: ffmpeg.FFmpeg as FfmpegRuntime['FFmpeg'],
        fetchFile: util.fetchFile as FfmpegRuntime['fetchFile'],
        toBlobURL: util.toBlobURL as FfmpegRuntime['toBlobURL'],
      };
    })();
  }
  return ffmpegModules;
}

/**
 * Re-encode to H.264 ~480p in the browser (ffmpeg.wasm via CDN, single-thread core).
 */
export async function compressVideoForWebPreview(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<File> {
  if (!isVideoFile(file)) return file;
  if (typeof window === 'undefined') return file;

  const { FFmpeg, fetchFile, toBlobURL } = await loadFfmpegModules();
  const ffmpeg = new FFmpeg();

  ffmpeg.on('progress', ({ progress }: { progress?: number }) => {
    if (typeof progress === 'number' && Number.isFinite(progress)) {
      onProgress?.(Math.min(1, Math.max(0, progress)));
    }
  });

  const coreVersion = '0.12.10';
  const baseURL = `https://unpkg.com/@ffmpeg/core@${coreVersion}/dist/umd`;

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '.mp4';
  const inputName = `input${ext}`;
  const outputName = 'output.mp4';

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  const scaleFilter = `scale=w='min(${WEB_PREVIEW_MAX_WIDTH},iw)':h='min(${WEB_PREVIEW_MAX_HEIGHT},ih)':force_original_aspect_ratio=decrease`;

  await ffmpeg.exec([
    '-i',
    inputName,
    '-vf',
    scaleFilter,
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '28',
    '-movflags',
    '+faststart',
    '-c:a',
    'aac',
    '-b:a',
    '96k',
    '-ar',
    '44100',
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  if (!(data instanceof Uint8Array) || data.byteLength === 0) {
    throw new Error('Video conversion produced an empty file');
  }

  const blob = new Blob([Uint8Array.from(data)], { type: 'video/mp4' });
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'spot';
  const compressed = new File([blob], `${baseName}-480p.mp4`, { type: 'video/mp4' });

  if (compressed.size >= file.size * 0.95) {
    return file;
  }

  return compressed;
}
