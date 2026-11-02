import { NextResponse } from 'next/server';
import { listMediaAssets } from '@/lib/db/media-repository';
import { createMediaAssetFromFormData } from '@/lib/media-upload-server';
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
    const formData = await request.formData();
    const created = await createMediaAssetFromFormData(formData);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
