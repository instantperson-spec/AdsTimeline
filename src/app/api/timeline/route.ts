import { NextResponse } from 'next/server';
import { fetchTimeline } from '@/lib/db/timeline-repository';
import { handleRouteError, requireDatabase } from '@/lib/api-error';

export async function GET() {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const data = await fetchTimeline();
    return NextResponse.json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
