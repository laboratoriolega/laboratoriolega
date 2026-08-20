import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'lega-super-secret-key-2026-fallback');

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Set pathname header for layout logic
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Allow public access to these paths
  if (
    pathname.startsWith('/resultado') ||
    pathname.startsWith('/totem') ||
    pathname.startsWith('/api/medical-result/file') ||
    pathname.startsWith('/login')
  ) {
    // If logged in and trying to go to login, redirect to home
    if (token && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (!token) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/resultado', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const BIOQUIMICO_ALLOWED = ['/ingresos', '/pacientes', '/perfil', '/resumen-medico'];

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const role = (payload as any).role;

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (e) {
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete('auth_token');
    return res;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png|logoB.png|logofavicon.png).*)'],
}
