import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/register', '/forgot-password', '/'];
const protectedPaths = ['/rides', '/wallet', '/profile', '/tracking'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-storage')?.value;
  const { pathname } = request.nextUrl;

  // Check if user is authenticated
  const isAuthenticated = !!token;
  const isPublicPath = publicPaths.includes(pathname);
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // Redirect logic
  if (!isAuthenticated && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};