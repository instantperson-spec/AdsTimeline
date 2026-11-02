import { NextResponse } from 'next/server';
import { duplicateSpotToBreak } from '@/lib/db/timeline-repository';
import { handleRouteError, requireDatabase } from '@/lib/api-error';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const { id: adId } = await context.params;
    const body = (await request.json()) as {
      targetShowId?: string;
      targetBreakNumber?: number;
    };

    if (typeof body.targetShowId !== 'string' || !body.targetShowId.trim()) {
      return NextResponse.json({ error: 'targetShowId is required' }, { status: 400 });
    }
    if (typeof body.targetBreakNumber !== 'number') {
      return NextResponse.json({ error: 'targetBreakNumber is required' }, { status: 400 });
    }

    const data = await duplicateSpotToBreak(
      adId,
      body.targetShowId.trim(),
      body.targetBreakNumber
    );
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
