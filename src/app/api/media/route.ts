import { NextResponse } from 'next/server';
import { listMediaAssets } from '@/lib/db/media-repository';
import {
  createMediaAssetFromBlobRefs,
  createMediaAssetFromFormData,
} from '@/lib/media-upload-server';
import { handleRouteError, requireDatabase } from '@/lib/api-error';

export async function GET() {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const items = await listMediaAssets();
    return NextResponse.json({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const body = (await request.json()) as Record<string, unknown>;
      const created = await createMediaAssetFromBlobRefs({
        id: String(body.id ?? ''),
        label: body.label != null ? String(body.label) : undefined,
        posterUrl: String(body.posterUrl ?? ''),
        posterPathname: String(body.posterPathname ?? ''),
        videoUrl: body.videoUrl != null ? String(body.videoUrl) : undefined,
        videoPathname:
          body.videoPathname != null ? String(body.videoPathname) : undefined,
      });
      return NextResponse.json(created, { status: 201 });
    }

    const formData = await request.formData();
    const created = await createMediaAssetFromFormData(formData);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
