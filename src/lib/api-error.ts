import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db/client';

export function requireDatabase() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'DATABASE_URL is not configured. Add Neon Postgres to this Vercel project.' },
      { status: 503 }
    );
  }
  return null;
}

export function handleRouteError(error: unknown) {
  console.error(error);
  const message = error instanceof Error ? error.message : 'Internal server error';
  return NextResponse.json({ error: message }, { status: 500 });
}
