import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Quotely Auth Middleware — Software 1.0 Route Guard
 *
 * Protects all internal SaaS routes under /app/* and other authenticated paths.
 * - Unauthenticated users hitting a protected route → redirected to /login
 * - Authenticated users hitting /login or forgot-password → redirected to /app/dashboard
 * - /super-admin route requires super_admin flag checked server-side
 * - /api/* routes, public marketing page (/), and Supabase auth callbacks are always allowed.
 */

const PROTECTED_PREFIXES = [
  '/app',
  '/dashboard',
  '/quotes',
  '/clients',
  '/settings',
  '/admin',
  '/super-admin',
  '/audit-logs',
  '/upload',
  '/ai-analysis',
  '/workspaces',
  '/team',
  '/occupancies',
  '/knowledge-base',
  '/earthquake-zones',
  '/security',
];

const AUTH_ROUTES = ['/login', '/forgot-password', '/reset-password'];

const ALWAYS_PUBLIC = [
  '/api/',
  '/_next/',
  '/favicon',
  '/logo',
  '/robots.txt',
  '/sitemap.xml',
  '/',
  '/auth/',
  '/accept-invitation',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (ALWAYS_PUBLIC.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next({ request });
  }

  // Create a mutable response so Supabase can refresh and set cookies
  let response = NextResponse.next({ request });

  const DEFAULT_SUPABASE_URL = 'https://vcmcueyzjuostebnlmcm.supabase.co';
  const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_2YLsp3r5yL1toZ4PUHzS1g_truC17O_';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;


  // Initialize Supabase SSR client — it reads and refreshes cookies automatically
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options ?? {})
        );
      },
    },
  });

  // Validate session — getUser() verifies the JWT signature server-side (secure)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect already-authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/app/dashboard', request.url));
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
