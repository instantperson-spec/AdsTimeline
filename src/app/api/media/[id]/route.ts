import { NextResponse } from 'next/server';
import {
  deleteMediaAsset,
  getMediaAssetById,
  updateMediaAssetLabel,
} from '@/lib/db/media-repository';
import { handleRouteError, requireDatabase } from '@/lib/api-error';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const { id } = await context.params;
    const asset = await getMediaAssetById(id);
    if (!asset) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }
    return NextResponse.json(asset);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { label?: string };
    if (typeof body.label !== 'string' || !body.label.trim()) {
      return NextResponse.json({ error: 'label is required' }, { status: 400 });
    }
    const updated = await updateMediaAssetLabel(id, body.label.trim());
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
    await deleteMediaAsset(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    if (message.includes('Cannot delete')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return handleRouteError(error);
  }
}
