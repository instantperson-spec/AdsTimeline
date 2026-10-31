import { NextResponse } from 'next/server';
import { CommercialAd } from '@/types/timeline';
import { computeAdStatus } from '@/lib/date-utils';
import { insertAd } from '@/lib/db/timeline-repository';
import { handleRouteError, requireDatabase } from '@/lib/api-error';

export async function POST(request: Request) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const ad = (await request.json()) as CommercialAd;
    const withStatus = { ...ad, status: computeAdStatus(ad) };
    const created = await insertAd(withStatus);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
