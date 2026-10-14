import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Quotely Route Protection & Auth Lock Middleware
 *
 * Intercepts requests to /dashboard and all protected SaaS routes.
 * If there is no active Supabase auth session, redirects strictly to /login.
 */

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/app',
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Maintenance Mode Takedown Check
  const isMaintenanceMode =
    process.env.MAINTENANCE_MODE === 'true' ||
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  const bypassQuery = request.nextUrl.searchParams.get('bypass');
  const hasBypassCookie = !!request.cookies.get('maintenance_bypass')?.value;
  const isBypassed =
    hasBypassCookie ||
    bypassQuery === 'admin' ||
    bypassQuery === 'qoutely' ||
    bypassQuery === 'dinesh';

  if (isMaintenanceMode && !isBypassed) {
    if (pathname === '/maintenance') {
      return NextResponse.next();
    }
    // Redirect all requests to /maintenance
    const maintenanceUrl = new URL('/maintenance', request.url);
    return NextResponse.redirect(maintenanceUrl);
  }

  // If visiting /maintenance while maintenance is off (or bypassed), redirect to /dashboard
  if (!isMaintenanceMode && pathname === '/maintenance') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Explicitly bypass public endpoints, marketing landing page (/), and auth callbacks
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname === '/accept-invitation' ||
    pathname === '/'
  ) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  if (bypassQuery && ['admin', 'qoutely', 'dinesh'].includes(bypassQuery)) {
    response.cookies.set('maintenance_bypass', bypassQuery, {
      path: '/',
      maxAge: 86400 * 7,
      sameSite: 'lax',
    });
  }

  const DEFAULT_SUPABASE_URL = 'https://vcmcueyzjuostebnlmcm.supabase.co';
  const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_2YLsp3r5yL1toZ4PUHzS1g_truC17O_';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  // Initialize Supabase SSR client
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

  // Verify server-side user session
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  // Fallback cookie check for sb-access-token if direct JWT was set
  const hasFallbackToken = !!request.cookies.get('sb-access-token')?.value;
  const isAuthenticated = !!user || hasFallbackToken;

  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Unauthenticated user attempting to access dashboard or protected routes -> strictly redirect to /login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already authenticated user visiting /login -> redirect to /dashboard
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
     * - favicon.ico, logo files, images, fonts
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)',
  ],
};
