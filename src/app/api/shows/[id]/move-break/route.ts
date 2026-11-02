import { NextResponse } from 'next/server';
import { moveBreakToProgramme } from '@/lib/db/timeline-repository';
import { handleRouteError, requireDatabase } from '@/lib/api-error';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const { id: sourceShowId } = await context.params;
    const body = (await request.json()) as {
      sourceBreakNumber?: number;
      targetShowId?: string;
      targetBreakNumber?: number;
    };

    if (typeof body.sourceBreakNumber !== 'number') {
      return NextResponse.json({ error: 'sourceBreakNumber is required' }, { status: 400 });
    }
    if (typeof body.targetShowId !== 'string' || !body.targetShowId.trim()) {
      return NextResponse.json({ error: 'targetShowId is required' }, { status: 400 });
    }
    if (typeof body.targetBreakNumber !== 'number') {
      return NextResponse.json({ error: 'targetBreakNumber is required' }, { status: 400 });
    }

    const data = await moveBreakToProgramme(
      sourceShowId,
      body.sourceBreakNumber,
      body.targetShowId.trim(),
      body.targetBreakNumber
    );
    return NextResponse.json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
