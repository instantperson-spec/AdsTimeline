import { NextResponse } from 'next/server';
import {
  getAdminPassword,
  getSessionSecret,
  isAdminAuthConfigured,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
} from '@/lib/auth/config';
import { createSessionToken, verifyAdminPassword } from '@/lib/auth/token';

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { error: 'Admin login is not configured on the server.' },
      { status: 503 }
    );
  }

  const adminPassword = getAdminPassword()!;
  const sessionSecret = getSessionSecret()!;

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const password = body.password?.trim() ?? '';
  if (!password || !(await verifyAdminPassword(password, adminPassword))) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = await createSessionToken(sessionSecret);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  });
  return response;
}
