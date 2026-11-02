import { put, del } from '@vercel/blob';
import { MEDIA_MAX_BYTES, newMediaAssetId, posterExtension } from '@/lib/media-shared';

export { newMediaAssetId, posterExtension };

const MAX_BYTES = MEDIA_MAX_BYTES;

export function assertBlobConfigured(): void {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN is not configured. Add Vercel Blob storage to this project.'
    );
  }
}

export function assertUploadSize(bytes: number): void {
  if (bytes > MAX_BYTES) {
    throw new Error('File exceeds 80 MB limit');
  }
}

export async function uploadBlobFile(
  pathname: string,
  data: File | Blob,
  contentType?: string
): Promise<{ url: string; pathname: string }> {
  assertBlobConfigured();
  const blob = await put(pathname, data, {
    access: 'public',
    addRandomSuffix: false,
    contentType: contentType || (data instanceof File ? data.type : undefined),
  });
  return { url: blob.url, pathname: blob.pathname };
}

export async function deleteBlobPathnames(pathnames: string[]): Promise<void> {
  assertBlobConfigured();
  const unique = [
    ...new Set(pathnames.filter((p) => p && isDeletableBlobPathname(p))),
  ];
  if (unique.length === 0) return;
  await del(unique);
}

export function isPlaceholderPosterUrl(url: string): boolean {
  const t = url.trim();
  return !t || t.startsWith('/placeholder');
}

/** Public Vercel Blob URL → store pathname (e.g. spots/…-irwin.mp4). */
export function pathnameFromBlobUrl(url: string): string | null {
  if (!url || url.startsWith('/')) return null;
  try {
    const u = new URL(url);
    if (!u.hostname.includes('blob.vercel-storage.com')) return null;
    return decodeURIComponent(u.pathname.replace(/^\//, ''));
  } catch {
    return null;
  }
}

export function isDeletableBlobPathname(pathname: string): boolean {
  return pathname.startsWith('spots/') || pathname.startsWith('media/');
}
