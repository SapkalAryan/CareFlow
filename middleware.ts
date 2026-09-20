import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public static assets and auth API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register'
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || 'careflow_fallback_secret_for_development_mode_only_123',
  });

  // Redirect unauthenticated users to login
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;

  // Doctor routes protection
  if (pathname.startsWith('/doctor') && role !== 'doctor') {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  }

  // Patient routes protection
  if (pathname.startsWith('/patient') && role !== 'patient') {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  }

  // Pharmacy routes protection
  if (pathname.startsWith('/pharmacy') && role !== 'pharmacy') {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/doctor/:path*',
    '/patient/:path*',
    '/pharmacy/:path*',
    '/api/patients/:path*',
    '/api/prescriptions/:path*',
    '/api/orders/:path*',
    '/api/refills/:path*',
    '/api/timeline/:path*',
    '/api/pharmacies/:path*',
    '/api/ai/:path*',
  ],
};
