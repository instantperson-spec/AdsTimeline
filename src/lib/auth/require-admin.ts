import { NextResponse } from 'next/server';
import { getSessionSecret, SESSION_COOKIE, isAdminAuthConfigured } from '@/lib/auth/config';
import { verifySessionToken } from '@/lib/auth/token';

function readSessionCookie(request: Request): string | undefined {
  const header = request.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [rawName, ...rest] = part.trim().split('=');
    if (rawName === SESSION_COOKIE) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return undefined;
}

export async function requireAdminSession(request: Request): Promise<NextResponse | null> {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { error: 'Admin login is not configured. Set ADMIN_PASSWORD and SESSION_SECRET.' },
      { status: 503 }
    );
  }

  const secret = getSessionSecret();
  if (!secret) {
    return NextResponse.json({ error: 'Session secret missing' }, { status: 503 });
  }

  const token = readSessionCookie(request);
  const ok = await verifySessionToken(token, secret);
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
