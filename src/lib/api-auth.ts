import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Shared Supabase server-side auth helper for API routes.
 * Returns the authenticated user or null.
 */
export async function getAuthenticatedUser(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl || !supabaseAnonKey ||
    supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')
  ) {
    // Only permit demo mode fallback in local non-production environments
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
    // Dev/demo mode: return a valid UUID user matching seeded Supabase profiles
    return {
      user: { id: '10000000-0000-0000-0000-000000000004', email: 'arjun.k@capitalinsurance.co.in' },
      workspace_id: '00000000-0000-0000-0000-000000000001',
      isDemoMode: true,
    };
  }

  try {
    // Extract auth token from Authorization header (Bearer token) or let SSR read cookies
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : undefined;

    // Build Supabase client with request cookie support for SSR session chunking
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
      global: bearerToken ? { headers: { Authorization: `Bearer ${bearerToken}` } } : undefined,
    });

    const { data: { user }, error } = await supabase.auth.getUser(bearerToken);

    if (error || !user) {
      return null;
    }

    // Derive workspace_id from user metadata (set during sign-up / invitation)
    const workspace_id: string =
      (user.user_metadata?.workspace_id as string) ||
      (user.app_metadata?.workspace_id as string) ||
      '00000000-0000-0000-0000-000000000001';

    return { user, workspace_id, isDemoMode: false };
  } catch {
    return null;
  }
}

/**
 * Returns a 401 Unauthorized JSON response.
 */
export function unauthorizedResponse(message = 'Authentication required. Please sign in.') {
  return NextResponse.json({ error: message }, { status: 401 });
}
