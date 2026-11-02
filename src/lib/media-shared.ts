export const MEDIA_MAX_BYTES = 80 * 1024 * 1024;

export function newMediaAssetId(): string {
  return `med-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function posterExtension(file: File): string {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.png')) return '.png';
  if (lower.endsWith('.webp')) return '.webp';
  if (lower.endsWith('.jpeg')) return '.jpeg';
  return '.jpg';
}

/** Allowed client upload paths under `media/{id}/`. */
export function isAllowedMediaBlobPathname(pathname: string): boolean {
  return /^media\/med-\d+-[a-z0-9]+\/(poster\.(jpg|jpeg|png|webp)|preview\.mp4)$/.test(pathname);
}
