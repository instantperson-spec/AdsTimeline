import { CommercialAd, CommercialShow } from '@/types/timeline';
import { INITIAL_SHOWS } from '@/lib/mock-data';
import { getSql } from '@/lib/db/client';
import { ensureSchema } from '@/lib/db/schema';
import { mapAdRow, mapShowRow, type AdRow, type ShowRow } from '@/lib/db/mappers';
import { STORED_AD_CATEGORY } from '@/lib/db/stored-ad-category';
import { parseBroadcastWeekdaysFromDb, parseBroadcastWeekdays } from '@/lib/show-broadcast';
import { runLegacyMediaBackfill } from '@/lib/legacy-media-backfill';

async function backfillShowBroadcastWeekdays(sql: ReturnType<typeof getSql>): Promise<void> {
  const rows = await sql`
    SELECT id, broadcast_schedule, broadcast_weekdays FROM shows
  `;
  for (const row of rows) {
    const existing = parseBroadcastWeekdaysFromDb(
      (row as { broadcast_weekdays: unknown }).broadcast_weekdays
    );
    if (existing.length > 0) continue;
    const parsed = parseBroadcastWeekdays(
      (row as { broadcast_schedule: string }).broadcast_schedule
    );
    if (parsed.length === 0) continue;
    await sql`
      UPDATE shows
      SET broadcast_weekdays = ${JSON.stringify(parsed)}::jsonb
      WHERE id = ${(row as { id: string }).id}
    `;
  }
}

export async function initTimelineData(): Promise<void> {
  const sql = getSql();
  await ensureSchema(sql);
  await backfillShowBroadcastWeekdays(sql);

  const countRows = await sql`SELECT COUNT(*)::int AS count FROM shows`;
  const count = (countRows[0]?.count as number | undefined) ?? 0;
  if (count > 0) return;

  for (const show of INITIAL_SHOWS) {
    const seedWeekdays =
      show.broadcastWeekdays?.length > 0
        ? show.broadcastWeekdays
        : parseBroadcastWeekdays(show.broadcastSchedule);
    await sql`
      INSERT INTO shows (
        id, title, code, channel, broadcast_schedule, broadcast_weekdays,
        break_count, color, description, created_at
      ) VALUES (
        ${show.id},
        ${show.title},
        ${show.code},
        ${show.channel},
        ${show.broadcastSchedule},
        ${JSON.stringify(seedWeekdays)}::jsonb,
        ${show.breakCount},
        ${show.color},
        ${show.description ?? null},
        ${show.createdAt}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

export async function fetchTimeline(): Promise<{ shows: CommercialShow[]; ads: CommercialAd[] }> {
  await initTimelineData();
  await runLegacyMediaBackfill();

  const sql = getSql();
  const showRows = await sql`SELECT * FROM shows ORDER BY created_at ASC`;
  const adRows = await sql`
    SELECT
      a.*,
      s.title AS show_title,
      m.kind AS media_kind,
      m.poster_url AS media_poster_url,
      m.video_url AS media_video_url
    FROM ads a
    JOIN shows s ON s.id = a.show_id
    LEFT JOIN media_assets m ON m.id = a.media_asset_id
    ORDER BY a.show_id, a.break_number, a.slot_index
  `;

  return {
    shows: showRows.map((r) => mapShowRow(r as ShowRow)),
    ads: adRows.map((r) => mapAdRow(r as AdRow)),
  };
}

export async function insertShow(show: CommercialShow): Promise<CommercialShow> {
  await initTimelineData();
  const sql = getSql();
  const weekdays =
    show.broadcastWeekdays?.length > 0
      ? show.broadcastWeekdays
      : parseBroadcastWeekdays(show.broadcastSchedule);
  await sql`
    INSERT INTO shows (
      id, title, code, channel, broadcast_schedule, broadcast_weekdays,
      break_count, color, description, created_at
    ) VALUES (
      ${show.id},
      ${show.title},
      ${show.code},
      ${show.channel},
      ${show.broadcastSchedule},
      ${JSON.stringify(weekdays)}::jsonb,
      ${show.breakCount},
      ${show.color},
      ${show.description ?? null},
      ${show.createdAt}
    )
  `;
  return { ...show, broadcastWeekdays: weekdays };
}

export type ShowUpdateFields = Partial<
  Pick<
    CommercialShow,
    | 'title'
    | 'code'
    | 'channel'
    | 'broadcastSchedule'
    | 'broadcastWeekdays'
    | 'color'
    | 'description'
    | 'breakCount'
  >
>;

export async function updateShow(showId: string, patch: ShowUpdateFields): Promise<CommercialShow> {
  await initTimelineData();
  const sql = getSql();
  const rows = await sql`SELECT * FROM shows WHERE id = ${showId}`;
  if (!rows.length) {
    throw new Error('Show not found');
  }
  const current = mapShowRow(rows[0] as ShowRow);
  const next: CommercialShow = {
    ...current,
    ...patch,
    broadcastWeekdays:
      patch.broadcastWeekdays !== undefined
        ? patch.broadcastWeekdays
        : current.broadcastWeekdays,
  };
  if (next.broadcastWeekdays.length === 0) {
    next.broadcastWeekdays = parseBroadcastWeekdays(next.broadcastSchedule);
  }

  await sql`
    UPDATE shows SET
      title = ${next.title},
      code = ${next.code},
      channel = ${next.channel},
      broadcast_schedule = ${next.broadcastSchedule},
      broadcast_weekdays = ${JSON.stringify(next.broadcastWeekdays)}::jsonb,
      break_count = ${next.breakCount},
      color = ${next.color},
      description = ${next.description ?? null}
    WHERE id = ${showId}
  `;
  return next;
}

export async function deleteShow(showId: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM shows WHERE id = ${showId}`;
}

export async function updateShowBreakCount(showId: string, breakCount: number): Promise<void> {
  const sql = getSql();
  await sql`UPDATE shows SET break_count = ${breakCount} WHERE id = ${showId}`;
}

export async function removeBreakFromShow(
  showId: string,
  breakNumber: number
): Promise<{ shows: CommercialShow[]; ads: CommercialAd[] }> {
  const sql = getSql();

  await sql`DELETE FROM ads WHERE show_id = ${showId} AND break_number = ${breakNumber}`;
  await sql`
    UPDATE ads
    SET break_number = break_number - 1, updated_at = NOW()
    WHERE show_id = ${showId} AND break_number > ${breakNumber}
  `;

  const showRows = await sql`SELECT break_count FROM shows WHERE id = ${showId}`;
  const current = (showRows[0]?.break_count as number | undefined) ?? 1;
  if (current > 1) {
    await sql`UPDATE shows SET break_count = ${current - 1} WHERE id = ${showId}`;
  }

  return fetchTimeline();
}

async function denormalizedMediaFields(
  sql: ReturnType<typeof getSql>,
  ad: CommercialAd
): Promise<{ frameGrabUrl: string; videoUrl: string | null }> {
  if (ad.mediaAssetId) {
    const rows = await sql`
      SELECT poster_url, video_url FROM media_assets WHERE id = ${ad.mediaAssetId}
    `;
    if (rows.length) {
      const row = rows[0] as { poster_url: string; video_url: string | null };
      return {
        frameGrabUrl: row.poster_url,
        videoUrl: row.video_url,
      };
    }
  }
  return {
    frameGrabUrl: ad.frameGrabUrl,
    videoUrl: ad.videoUrl ?? null,
  };
}

export async function insertAd(ad: CommercialAd): Promise<CommercialAd> {
  await initTimelineData();
  const sql = getSql();
  const mediaFields = await denormalizedMediaFields(sql, ad);
  await sql`
    INSERT INTO ads (
      id, show_id, break_number, slot_index, title, advertiser, category,
      duration_sec, start_date, end_date, frame_grab_url, video_url, media_asset_id,
      is_time_sensitive, event_date, replacement_action, notes,
      taken_off_at, replacement_ad_title, created_at, updated_at
    ) VALUES (
      ${ad.id},
      ${ad.showId},
      ${ad.breakNumber},
      ${ad.slotIndex},
      ${ad.title},
      ${ad.advertiser},
      ${STORED_AD_CATEGORY},
      ${ad.durationSec},
      ${ad.startDate},
      ${ad.endDate},
      ${mediaFields.frameGrabUrl},
      ${mediaFields.videoUrl},
      ${ad.mediaAssetId ?? null},
      ${ad.isTimeSensitive},
      ${ad.eventDate ?? null},
      ${ad.replacementAction},
      ${ad.notes ?? null},
      ${ad.takenOffAt ?? null},
      ${ad.replacementAdTitle ?? null},
      ${ad.createdAt},
      ${ad.updatedAt}
    )
  `;
  const rows = await sql`
    SELECT
      a.*,
      s.title AS show_title,
      m.kind AS media_kind,
      m.poster_url AS media_poster_url,
      m.video_url AS media_video_url
    FROM ads a
    JOIN shows s ON s.id = a.show_id
    LEFT JOIN media_assets m ON m.id = a.media_asset_id
    WHERE a.id = ${ad.id}
  `;
  return mapAdRow(rows[0] as AdRow);
}

export async function updateAd(ad: CommercialAd): Promise<CommercialAd> {
  const sql = getSql();
  const mediaFields = await denormalizedMediaFields(sql, ad);
  await sql`
    UPDATE ads SET
      show_id = ${ad.showId},
      break_number = ${ad.breakNumber},
      slot_index = ${ad.slotIndex},
      title = ${ad.title},
      advertiser = ${ad.advertiser},
      category = ${STORED_AD_CATEGORY},
      duration_sec = ${ad.durationSec},
      start_date = ${ad.startDate},
      end_date = ${ad.endDate},
      frame_grab_url = ${mediaFields.frameGrabUrl},
      video_url = ${mediaFields.videoUrl},
      media_asset_id = ${ad.mediaAssetId ?? null},
      is_time_sensitive = ${ad.isTimeSensitive},
      event_date = ${ad.eventDate ?? null},
      replacement_action = ${ad.replacementAction},
      notes = ${ad.notes ?? null},
      taken_off_at = ${ad.takenOffAt ?? null},
      replacement_ad_title = ${ad.replacementAdTitle ?? null},
      updated_at = ${ad.updatedAt}
    WHERE id = ${ad.id}
  `;
  const rows = await sql`
    SELECT
      a.*,
      s.title AS show_title,
      m.kind AS media_kind,
      m.poster_url AS media_poster_url,
      m.video_url AS media_video_url
    FROM ads a
    JOIN shows s ON s.id = a.show_id
    LEFT JOIN media_assets m ON m.id = a.media_asset_id
    WHERE a.id = ${ad.id}
  `;
  return mapAdRow(rows[0] as AdRow);
}

export async function deleteAd(adId: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM ads WHERE id = ${adId}`;
}
