import { NextResponse } from 'next/server';
import {
  deleteMediaAsset,
  getMediaAssetById,
  updateMediaAssetLabel,
  updateMediaAssetPoster,
} from '@/lib/db/media-repository';
import { isAllowedMediaBlobPathname } from '@/lib/media-shared';
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
    const body = (await request.json()) as {
      label?: string;
      posterUrl?: string;
      posterPathname?: string;
    };

    if (body.posterUrl != null && body.posterPathname != null) {
      const posterUrl = String(body.posterUrl).trim();
      const posterPathname = String(body.posterPathname).trim();
      if (!posterUrl || !posterPathname) {
        return NextResponse.json({ error: 'posterUrl and posterPathname are required' }, { status: 400 });
      }
      if (!isAllowedMediaBlobPathname(posterPathname)) {
        return NextResponse.json({ error: 'Invalid poster path' }, { status: 400 });
      }
      if (!posterPathname.startsWith(`media/${id}/`)) {
        return NextResponse.json({ error: 'Poster path must belong to this asset' }, { status: 400 });
      }
      const updated = await updateMediaAssetPoster(id, posterUrl, posterPathname);
      return NextResponse.json(updated);
    }

    if (typeof body.label !== 'string' || !body.label.trim()) {
      return NextResponse.json(
        { error: 'Provide label or posterUrl + posterPathname' },
        { status: 400 }
      );
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
