import { list } from '@vercel/blob';
import type { MediaAssetKind } from '@/types/media';
import { getSql } from '@/lib/db/client';
import { ensureSchema } from '@/lib/db/schema';
import { insertMediaAsset } from '@/lib/db/media-repository';
import { pathnameFromBlobUrl, isPlaceholderPosterUrl } from '@/lib/media-blob';

let backfillInFlight: Promise<void> | null = null;

export function runLegacyMediaBackfill(): Promise<void> {
  if (!backfillInFlight) {
    backfillInFlight = backfillLegacyMediaAssets().finally(() => {
      backfillInFlight = null;
    });
  }
  return backfillInFlight;
}

function labelFromPathname(pathname: string): string {
  const base = pathname.split('/').pop() ?? pathname;
  const stripped = base.replace(/^\d+-/, '');
  return stripped || base;
}

function legacyAssetIdFromPathname(pathname: string): string {
  const slug = pathname
    .replace(/^spots\//, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `med-legacy-${slug || 'file'}`.slice(0, 120);
}

function isVideoPathname(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.m4v');
}

async function assetExistsForPathname(
  sql: ReturnType<typeof getSql>,
  pathname: string
): Promise<boolean> {
  const rows = await sql`
    SELECT id FROM media_assets
    WHERE poster_pathname = ${pathname} OR video_pathname = ${pathname}
    LIMIT 1
  `;
  return rows.length > 0;
}

async function findAssetIdByUrl(
  sql: ReturnType<typeof getSql>,
  url: string | null | undefined
): Promise<string | null> {
  if (!url || isPlaceholderPosterUrl(url)) return null;
  const rows = await sql`
    SELECT id FROM media_assets
    WHERE poster_url = ${url} OR video_url = ${url}
    LIMIT 1
  `;
  return (rows[0]?.id as string | undefined) ?? null;
}

async function registerBlobPath(
  sql: ReturnType<typeof getSql>,
  url: string,
  pathname: string
): Promise<string> {
  if (await assetExistsForPathname(sql, pathname)) {
    const rows = await sql`
      SELECT id FROM media_assets
      WHERE poster_pathname = ${pathname} OR video_pathname = ${pathname}
      LIMIT 1
    `;
    return rows[0].id as string;
  }

  const id = legacyAssetIdFromPathname(pathname);
  const label = labelFromPathname(pathname);

  try {
    if (isVideoPathname(pathname)) {
      await insertMediaAsset({
        id,
        label,
        kind: 'video_and_poster',
        posterUrl: url,
        posterPathname: pathname,
        videoUrl: url,
        videoPathname: pathname,
      });
      return id;
    }

    await insertMediaAsset({
      id,
      label,
      kind: 'image_only',
      posterUrl: url,
      posterPathname: pathname,
    });
    return id;
  } catch {
    const rows = await sql`
      SELECT id FROM media_assets
      WHERE poster_pathname = ${pathname} OR video_pathname = ${pathname}
      LIMIT 1
    `;
    if (rows.length) return rows[0].id as string;
    throw new Error(`Failed to register legacy blob ${pathname}`);
  }
}

async function ensureAssetFromAdUrls(
  sql: ReturnType<typeof getSql>,
  frameGrabUrl: string,
  videoUrl: string | null,
  labelHint: string
): Promise<string | null> {
  const existingVideo = videoUrl ? await findAssetIdByUrl(sql, videoUrl) : null;
  const existingPoster =
    !isPlaceholderPosterUrl(frameGrabUrl) ? await findAssetIdByUrl(sql, frameGrabUrl) : null;
  if (existingVideo) return existingVideo;
  if (existingPoster) return existingPoster;

  const videoPath = videoUrl ? pathnameFromBlobUrl(videoUrl) : null;
  const posterPath = !isPlaceholderPosterUrl(frameGrabUrl)
    ? pathnameFromBlobUrl(frameGrabUrl)
    : null;

  if (videoPath) {
    return registerBlobPath(sql, videoUrl!, videoPath);
  }
  if (posterPath) {
    return registerBlobPath(sql, frameGrabUrl, posterPath);
  }

  if (!videoUrl && isPlaceholderPosterUrl(frameGrabUrl)) {
    return null;
  }

  const kind: MediaAssetKind = videoUrl ? 'video_and_poster' : 'image_only';
  const id = `med-legacy-ad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const posterUrl = isPlaceholderPosterUrl(frameGrabUrl)
    ? videoUrl ?? frameGrabUrl
    : frameGrabUrl;
  const posterPathname =
    posterPath ??
    (videoPath && videoUrl === posterUrl ? videoPath : `legacy-ref/${id}/poster`);

  await insertMediaAsset({
    id,
    label: labelHint.trim() || labelFromPathname(posterPathname),
    kind,
    posterUrl,
    posterPathname,
    videoUrl: videoUrl ?? undefined,
    videoPathname: videoPath ?? undefined,
  });
  return id;
}

async function importSpotsFromBlobStore(sql: ReturnType<typeof getSql>): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;

  let cursor: string | undefined;
  for (;;) {
    const page = await list({ prefix: 'spots/', cursor, limit: 1000 });
    for (const blob of page.blobs) {
      if (await assetExistsForPathname(sql, blob.pathname)) continue;
      try {
        await registerBlobPath(sql, blob.url, blob.pathname);
      } catch (err) {
        console.warn('[media backfill] skip blob', blob.pathname, err);
      }
    }
    if (!page.hasMore) break;
    cursor = page.cursor;
  }
}

async function linkAdsToMediaAssets(sql: ReturnType<typeof getSql>): Promise<void> {
  const ads = await sql`
    SELECT id, title, frame_grab_url, video_url, media_asset_id
    FROM ads
    WHERE media_asset_id IS NULL
      AND (
        (video_url IS NOT NULL AND TRIM(video_url) <> '')
        OR (
          frame_grab_url IS NOT NULL
          AND TRIM(frame_grab_url) <> ''
          AND frame_grab_url NOT LIKE '/placeholder%'
        )
      )
  `;

  for (const row of ads) {
    const ad = row as {
      id: string;
      title: string;
      frame_grab_url: string;
      video_url: string | null;
    };
    try {
      const assetId = await ensureAssetFromAdUrls(
        sql,
        ad.frame_grab_url,
        ad.video_url,
        ad.title
      );
      if (!assetId) continue;
      await sql`
        UPDATE ads SET media_asset_id = ${assetId}, updated_at = NOW()
        WHERE id = ${ad.id}
      `;
    } catch (err) {
      console.warn('[media backfill] skip ad', ad.id, err);
    }
  }
}

async function backfillLegacyMediaAssets(): Promise<void> {
  const sql = getSql();
  await ensureSchema(sql);
  await importSpotsFromBlobStore(sql);
  await linkAdsToMediaAssets(sql);
}
