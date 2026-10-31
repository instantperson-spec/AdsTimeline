import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionSecret, SESSION_COOKIE, isAdminAuthConfigured } from '@/lib/auth/config';
import { verifySessionToken } from '@/lib/auth/token';

function isPublicApi(pathname: string, method: string): boolean {
  if (pathname.startsWith('/api/auth/')) return true;
  if (pathname === '/api/timeline' && method === 'GET') return true;
  return false;
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const secret = getSessionSecret();
  if (!secret) return false;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, secret);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  if (pathname.startsWith('/client')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/login')) {
    if (await hasValidSession(request)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    if (isPublicApi(pathname, method)) {
      return NextResponse.next();
    }
    if (!(await hasValidSession(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname === '/') {
    if (!isAdminAuthConfigured()) {
      return NextResponse.next();
    }
    if (!(await hasValidSession(request))) {
      const login = new URL('/login', request.url);
      login.searchParams.set('next', '/');
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/api/:path*'],
};
