import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { handleRouteError } from '@/lib/api-error';

const MAX_BYTES = 80 * 1024 * 1024; // 80 MB

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'BLOB_READ_WRITE_TOKEN is not configured. Add Vercel Blob storage to this project.' },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File exceeds 80 MB limit' }, { status: 413 });
    }

    const allowed =
      file.type.startsWith('video/') ||
      file.type.startsWith('image/') ||
      file.name.toLowerCase().endsWith('.mp4');

    if (!allowed) {
      return NextResponse.json({ error: 'Only video or image uploads are allowed' }, { status: 400 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = `spots/${Date.now()}-${safeName}`;

    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
  } catch (error) {
    return handleRouteError(error);
  }
}
