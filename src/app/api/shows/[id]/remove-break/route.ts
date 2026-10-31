import { NextResponse } from 'next/server';
import { removeBreakFromShow } from '@/lib/db/timeline-repository';
import { handleRouteError, requireDatabase } from '@/lib/api-error';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { breakNumber?: number };
    if (typeof body.breakNumber !== 'number') {
      return NextResponse.json({ error: 'breakNumber is required' }, { status: 400 });
    }
    const data = await removeBreakFromShow(id, body.breakNumber);
    return NextResponse.json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
