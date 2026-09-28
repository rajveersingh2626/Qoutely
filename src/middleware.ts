import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Quotely Auth Middleware — Software 1.0 Route Guard
 *
 * Protects all internal SaaS routes under /app/* and /quotes, /dashboard, /clients,
 * /settings, /admin, /audit-logs, /upload, /ai-analysis, /workspaces, /team.
 *
 * - Unauthenticated users hitting a protected route → redirected to /login
 * - Authenticated users hitting /login or /forgot-password → redirected to /dashboard
 * - /api/* routes, public marketing page (/), and Supabase auth callbacks are always allowed.
 */

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/quotes',
  '/clients',
  '/settings',
  '/admin',
  '/audit-logs',
  '/upload',
  '/ai-analysis',
  '/workspaces',
  '/team',
  '/occupancies',
  '/knowledge-base',
  '/earthquake-zones',
  '/security',
  '/app',
];

const AUTH_ROUTES = ['/login', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: API routes, Next.js internals, static files, and Supabase auth callbacks
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/' ||
    // Supabase email magic link / OAuth callback
    pathname.startsWith('/auth/') ||
    pathname === '/accept-invitation'
  ) {
    return NextResponse.next();
  }

  // Create a response to carry mutated cookies from Supabase
  let response = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Graceful fallback: if Supabase is not configured, allow all routes in dev mode
  if (!supabaseUrl || !supabaseAnonKey ||
    supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
    // Dev / demo mode: no real auth enforced — seed data is active
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options ?? {})
        );
      },
    },
  });

  // Refresh session — this is the canonical Supabase SSR pattern
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect already-authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, logo files, and other public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|logo|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
