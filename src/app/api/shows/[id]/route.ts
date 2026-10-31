import { NextResponse } from 'next/server';
import { deleteShow, updateShowBreakCount } from '@/lib/db/timeline-repository';
import { handleRouteError, requireDatabase } from '@/lib/api-error';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const { id } = await context.params;
    await deleteShow(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { breakCount?: number };
    if (typeof body.breakCount !== 'number') {
      return NextResponse.json({ error: 'breakCount is required' }, { status: 400 });
    }
    await updateShowBreakCount(id, body.breakCount);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
