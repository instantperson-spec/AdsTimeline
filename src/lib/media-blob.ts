import { put, del } from '@vercel/blob';

const MAX_BYTES = 80 * 1024 * 1024;

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
  const unique = [...new Set(pathnames.filter(Boolean))];
  if (unique.length === 0) return;
  await del(unique);
}

export function posterExtension(file: File): string {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.png')) return '.png';
  if (lower.endsWith('.webp')) return '.webp';
  if (lower.endsWith('.jpeg')) return '.jpeg';
  return '.jpg';
}

export function newMediaAssetId(): string {
  return `med-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
