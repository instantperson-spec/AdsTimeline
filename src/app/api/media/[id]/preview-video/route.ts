import { NextResponse } from 'next/server';
import { getMediaAssetById } from '@/lib/db/media-repository';
import { handleRouteError, requireDatabase } from '@/lib/api-error';

type RouteContext = { params: Promise<{ id: string }> };

/** Same-origin video stream so the frame picker can seek and capture frames (no CORS/taint). */
export async function GET(request: Request, context: RouteContext) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const { id } = await context.params;
    const asset = await getMediaAssetById(id);
    if (!asset?.videoUrl) {
      return NextResponse.json({ error: 'This media has no preview video' }, { status: 404 });
    }

    const range = request.headers.get('range');
    const upstream = await fetch(asset.videoUrl, {
      headers: range ? { Range: range } : undefined,
    });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json({ error: 'Could not read video from storage' }, { status: 502 });
    }

    const headers = new Headers();
    const contentType = upstream.headers.get('Content-Type') || 'video/mp4';
    headers.set('Content-Type', contentType);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'private, max-age=3600');

    for (const name of ['Content-Length', 'Content-Range'] as const) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
