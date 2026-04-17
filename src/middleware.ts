import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'lega-super-secret-key-2026-fallback');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (token) {
    try {
      await jwtVerify(token, SECRET_KEY);
      return NextResponse.next();
    } catch (e) {
      const res = NextResponse.redirect(new URL('/login', request.url));
      res.cookies.delete('auth_token');
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
}
