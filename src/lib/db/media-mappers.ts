import type { MediaAsset, MediaAssetKind } from '@/types/media';

export type MediaAssetRow = {
  id: string;
  label: string;
  kind: string;
  poster_url: string;
  poster_pathname: string;
  video_url: string | null;
  video_pathname: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  reference_count?: number;
};

function toIsoDateTime(value: string | Date): string {
  if (typeof value === 'string') return value;
  return value.toISOString();
}

export function mapMediaAssetRow(row: MediaAssetRow): MediaAsset {
  return {
    id: row.id,
    label: row.label,
    kind: row.kind as MediaAssetKind,
    posterUrl: row.poster_url,
    posterPathname: row.poster_pathname,
    videoUrl: row.video_url ?? undefined,
    videoPathname: row.video_pathname ?? undefined,
    referenceCount: row.reference_count ?? 0,
    createdAt: toIsoDateTime(row.created_at),
    updatedAt: toIsoDateTime(row.updated_at),
  };
}
