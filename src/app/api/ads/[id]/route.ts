import { NextResponse } from 'next/server';
import { CommercialAd } from '@/types/timeline';
import { computeAdStatus } from '@/lib/date-utils';
import { deleteAd, updateAd } from '@/lib/db/timeline-repository';
import { handleRouteError, requireDatabase } from '@/lib/api-error';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const { id } = await context.params;
    const ad = (await request.json()) as CommercialAd;
    if (ad.id !== id) {
      return NextResponse.json({ error: 'Ad id mismatch' }, { status: 400 });
    }
    const withStatus = { ...ad, status: computeAdStatus(ad) };
    const updated = await updateAd(withStatus);
    return NextResponse.json(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const { id } = await context.params;
    await deleteAd(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
