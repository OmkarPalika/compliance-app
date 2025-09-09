import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  // Protect routes under /dashboard, /upload, and /checklist
  if (!token && (
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/upload') ||
    request.nextUrl.pathname.startsWith('/checklist')
  )) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users from auth pages to dashboard
  if (token && (
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register')
  )) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/upload/:path*',
    '/checklist/:path*',
    '/login',
    '/register',
  ],
};
