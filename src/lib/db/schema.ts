import type { Sql } from '@/lib/db/client';

export async function ensureSchema(sql: Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS shows (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      channel TEXT NOT NULL,
      broadcast_schedule TEXT NOT NULL,
      break_count INT NOT NULL,
      color TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ads (
      id TEXT PRIMARY KEY,
      show_id TEXT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
      break_number INT NOT NULL,
      slot_index INT NOT NULL,
      title TEXT NOT NULL,
      advertiser TEXT NOT NULL,
      category TEXT NOT NULL,
      duration_sec INT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      frame_grab_url TEXT NOT NULL,
      video_url TEXT,
      is_time_sensitive BOOLEAN NOT NULL DEFAULT TRUE,
      event_date TEXT,
      replacement_action TEXT NOT NULL,
      notes TEXT,
      taken_off_at DATE,
      replacement_ad_title TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ads_show_id_idx ON ads (show_id)`;

  await sql`
    ALTER TABLE shows
    ADD COLUMN IF NOT EXISTS broadcast_weekdays JSONB NOT NULL DEFAULT '[]'::jsonb
  `;
}
