import { NextResponse } from 'next/server';
import {
  deleteShow,
  updateShow,
  updateShowBreakCount,
  type ShowUpdateFields,
} from '@/lib/db/timeline-repository';
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
    const body = (await request.json()) as ShowUpdateFields & { breakCount?: number };

    const keys = Object.keys(body).filter((k) => body[k as keyof typeof body] !== undefined);
    if (keys.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    if (keys.length === 1 && keys[0] === 'breakCount') {
      if (typeof body.breakCount !== 'number') {
        return NextResponse.json({ error: 'breakCount is required' }, { status: 400 });
      }
      await updateShowBreakCount(id, body.breakCount);
      return NextResponse.json({ ok: true });
    }

    const updated = await updateShow(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}
