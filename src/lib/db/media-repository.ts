import type { MediaAsset, MediaAssetKind } from '@/types/media';
import { getSql } from '@/lib/db/client';
import { ensureSchema } from '@/lib/db/schema';
import { mapMediaAssetRow, type MediaAssetRow } from '@/lib/db/media-mappers';
import { deleteBlobPathnames } from '@/lib/media-blob';
import { runLegacyMediaBackfill } from '@/lib/legacy-media-backfill';

async function ensureDbReady(): Promise<void> {
  const sql = getSql();
  await ensureSchema(sql);
}

export async function listMediaAssets(): Promise<MediaAsset[]> {
  await ensureDbReady();
  await runLegacyMediaBackfill();
  const sql = getSql();
  const rows = await sql`
    SELECT
      m.*,
      COUNT(a.id)::int AS reference_count
    FROM media_assets m
    LEFT JOIN ads a ON a.media_asset_id = m.id
    GROUP BY m.id
    ORDER BY m.created_at DESC
  `;
  return rows.map((r) => mapMediaAssetRow(r as MediaAssetRow));
}

export async function getMediaAssetById(id: string): Promise<MediaAsset | null> {
  await ensureDbReady();
  const sql = getSql();
  const rows = await sql`
    SELECT
      m.*,
      COUNT(a.id)::int AS reference_count
    FROM media_assets m
    LEFT JOIN ads a ON a.media_asset_id = m.id
    WHERE m.id = ${id}
    GROUP BY m.id
  `;
  if (!rows.length) return null;
  return mapMediaAssetRow(rows[0] as MediaAssetRow);
}

export type CreateMediaAssetInput = {
  id: string;
  label: string;
  kind: MediaAssetKind;
  posterUrl: string;
  posterPathname: string;
  videoUrl?: string;
  videoPathname?: string;
};

export async function insertMediaAsset(input: CreateMediaAssetInput): Promise<MediaAsset> {
  await ensureDbReady();
  const sql = getSql();
  const now = new Date().toISOString();
  await sql`
    INSERT INTO media_assets (
      id, label, kind, poster_url, poster_pathname, video_url, video_pathname,
      created_at, updated_at
    ) VALUES (
      ${input.id},
      ${input.label},
      ${input.kind},
      ${input.posterUrl},
      ${input.posterPathname},
      ${input.videoUrl ?? null},
      ${input.videoPathname ?? null},
      ${now},
      ${now}
    )
  `;
  const created = await getMediaAssetById(input.id);
  if (!created) throw new Error('Failed to load created media asset');
  return created;
}

export async function updateMediaAssetLabel(id: string, label: string): Promise<MediaAsset> {
  const sql = getSql();
  await sql`
    UPDATE media_assets SET label = ${label}, updated_at = NOW() WHERE id = ${id}
  `;
  const updated = await getMediaAssetById(id);
  if (!updated) throw new Error('Media asset not found');
  return updated;
}

export async function deleteMediaAsset(id: string): Promise<void> {
  const asset = await getMediaAssetById(id);
  if (!asset) throw new Error('Media asset not found');
  if (asset.referenceCount > 0) {
    throw new Error(
      `Cannot delete: ${asset.referenceCount} spot(s) still use this media. Unlink or reassign them first.`
    );
  }

  const pathnames = [asset.posterPathname, asset.videoPathname].filter(
    (p): p is string => Boolean(p)
  );
  await deleteBlobPathnames(pathnames);

  const sql = getSql();
  await sql`DELETE FROM media_assets WHERE id = ${id}`;
}

export async function countAdsUsingMedia(mediaAssetId: string): Promise<number> {
  const sql = getSql();
  const rows = await sql`
    SELECT COUNT(*)::int AS count FROM ads WHERE media_asset_id = ${mediaAssetId}
  `;
  return (rows[0]?.count as number | undefined) ?? 0;
}
