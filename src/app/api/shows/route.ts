import { NextResponse } from 'next/server';
import { CommercialShow } from '@/types/timeline';
import { insertShow } from '@/lib/db/timeline-repository';
import { handleRouteError, requireDatabase } from '@/lib/api-error';

export async function POST(request: Request) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const show = (await request.json()) as CommercialShow;
    const created = await insertShow(show);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
