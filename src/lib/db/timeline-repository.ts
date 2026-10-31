import { CommercialAd, CommercialShow } from '@/types/timeline';
import { INITIAL_SHOWS } from '@/lib/mock-data';
import { getSql } from '@/lib/db/client';
import { ensureSchema } from '@/lib/db/schema';
import { mapAdRow, mapShowRow, type AdRow, type ShowRow } from '@/lib/db/mappers';

export async function initTimelineData(): Promise<void> {
  const sql = getSql();
  await ensureSchema(sql);

  const countRows = await sql`SELECT COUNT(*)::int AS count FROM shows`;
  const count = (countRows[0]?.count as number | undefined) ?? 0;
  if (count > 0) return;

  for (const show of INITIAL_SHOWS) {
    await sql`
      INSERT INTO shows (
        id, title, code, channel, broadcast_schedule, break_count, color, description, created_at
      ) VALUES (
        ${show.id},
        ${show.title},
        ${show.code},
        ${show.channel},
        ${show.broadcastSchedule},
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

  const sql = getSql();
  const showRows = await sql`SELECT * FROM shows ORDER BY created_at ASC`;
  const adRows = await sql`
    SELECT a.*, s.title AS show_title
    FROM ads a
    JOIN shows s ON s.id = a.show_id
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
  await sql`
    INSERT INTO shows (
      id, title, code, channel, broadcast_schedule, break_count, color, description, created_at
    ) VALUES (
      ${show.id},
      ${show.title},
      ${show.code},
      ${show.channel},
      ${show.broadcastSchedule},
      ${show.breakCount},
      ${show.color},
      ${show.description ?? null},
      ${show.createdAt}
    )
  `;
  return show;
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

export async function insertAd(ad: CommercialAd): Promise<CommercialAd> {
  await initTimelineData();
  const sql = getSql();
  await sql`
    INSERT INTO ads (
      id, show_id, break_number, slot_index, title, advertiser, category,
      duration_sec, start_date, end_date, frame_grab_url, video_url,
      is_time_sensitive, event_date, replacement_action, notes,
      taken_off_at, replacement_ad_title, created_at, updated_at
    ) VALUES (
      ${ad.id},
      ${ad.showId},
      ${ad.breakNumber},
      ${ad.slotIndex},
      ${ad.title},
      ${ad.advertiser},
      ${ad.category},
      ${ad.durationSec},
      ${ad.startDate},
      ${ad.endDate},
      ${ad.frameGrabUrl},
      ${ad.videoUrl ?? null},
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
    SELECT a.*, s.title AS show_title FROM ads a
    JOIN shows s ON s.id = a.show_id WHERE a.id = ${ad.id}
  `;
  return mapAdRow(rows[0] as AdRow);
}

export async function updateAd(ad: CommercialAd): Promise<CommercialAd> {
  const sql = getSql();
  await sql`
    UPDATE ads SET
      show_id = ${ad.showId},
      break_number = ${ad.breakNumber},
      slot_index = ${ad.slotIndex},
      title = ${ad.title},
      advertiser = ${ad.advertiser},
      category = ${ad.category},
      duration_sec = ${ad.durationSec},
      start_date = ${ad.startDate},
      end_date = ${ad.endDate},
      frame_grab_url = ${ad.frameGrabUrl},
      video_url = ${ad.videoUrl ?? null},
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
    SELECT a.*, s.title AS show_title FROM ads a
    JOIN shows s ON s.id = a.show_id WHERE a.id = ${ad.id}
  `;
  return mapAdRow(rows[0] as AdRow);
}

export async function deleteAd(adId: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM ads WHERE id = ${adId}`;
}
