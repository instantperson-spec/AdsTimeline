import { NextResponse } from 'next/server';
import { copyCommercialBreak, type CopyBreakTarget } from '@/lib/db/timeline-repository';
import { handleRouteError, requireDatabase } from '@/lib/api-error';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      sourceBreakNumber?: number;
      target?: CopyBreakTarget;
    };

    if (typeof body.sourceBreakNumber !== 'number') {
      return NextResponse.json({ error: 'sourceBreakNumber is required' }, { status: 400 });
    }

    const target: CopyBreakTarget =
      body.target?.mode === 'break' && typeof body.target.breakNumber === 'number'
        ? { mode: 'break', breakNumber: body.target.breakNumber }
        : { mode: 'new_break' };

    const data = await copyCommercialBreak(id, body.sourceBreakNumber, target);
    return NextResponse.json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
