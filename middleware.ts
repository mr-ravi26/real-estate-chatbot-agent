import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const limit = 30; // 30 requests
    const window = 60000; // per minute

    const rateLimit = rateLimitMap.get(ip);
    
    if (rateLimit) {
      if (now < rateLimit.resetTime) {
        if (rateLimit.count >= limit) {
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
          );
        }
        rateLimit.count++;
      } else {
        rateLimitMap.set(ip, { count: 1, resetTime: now + window });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + window });
    }
  }

  // Simple password protection
  const APP_PASSWORD = process.env.APP_PASSWORD;
  
  // If no password is set, allow access
  if (!APP_PASSWORD) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const authCookie = request.cookies.get('app_authenticated');
  
  // Allow access to login page
  if (pathname === '/login') {
    // If already authenticated, redirect to home
    if (authCookie?.value === 'true') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Allow login API endpoint
  if (pathname === '/api/auth/login') {
    return NextResponse.next();
  }

  // Protect all other routes
  if (!authCookie || authCookie.value !== 'true') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Default export for Next.js
export default middleware;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
