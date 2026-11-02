import { NextResponse } from 'next/server';
import { reorderBreakSlots } from '@/lib/db/timeline-repository';
import { handleRouteError, requireDatabase } from '@/lib/api-error';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { breakNumber?: number; orderedAdIds?: string[] };
    if (typeof body.breakNumber !== 'number') {
      return NextResponse.json({ error: 'breakNumber is required' }, { status: 400 });
    }
    if (!Array.isArray(body.orderedAdIds) || body.orderedAdIds.length === 0) {
      return NextResponse.json({ error: 'orderedAdIds is required' }, { status: 400 });
    }
    const data = await reorderBreakSlots(id, body.breakNumber, body.orderedAdIds);
    return NextResponse.json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
