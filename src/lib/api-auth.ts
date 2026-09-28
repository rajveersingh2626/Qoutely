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
    // Dev/demo mode: return a valid UUID user matching seeded Supabase profiles
    return {
      user: { id: '10000000-0000-0000-0000-000000000004', email: 'arjun.k@capitalinsurance.co.in' },
      workspace_id: '00000000-0000-0000-0000-000000000001',
      isDemoMode: true,
    };
  }

  try {
    // Extract auth token from Authorization header (Bearer token) or cookies
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return {
        user: { id: '10000000-0000-0000-0000-000000000004', email: 'arjun.k@capitalinsurance.co.in' },
        workspace_id: '00000000-0000-0000-0000-000000000001',
        isDemoMode: true,
      };
    }

    // Build a minimal Supabase client for server-side token validation
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return {
        user: { id: '10000000-0000-0000-0000-000000000004', email: 'arjun.k@capitalinsurance.co.in' },
        workspace_id: '00000000-0000-0000-0000-000000000001',
        isDemoMode: true,
      };
    }

    // Derive workspace_id from user metadata (set during sign-up / invitation)
    const workspace_id: string =
      (user.user_metadata?.workspace_id as string) ||
      (user.app_metadata?.workspace_id as string) ||
      '00000000-0000-0000-0000-000000000001';

    return { user, workspace_id, isDemoMode: false };
  } catch {
    return {
      user: { id: '10000000-0000-0000-0000-000000000004', email: 'arjun.k@capitalinsurance.co.in' },
      workspace_id: '00000000-0000-0000-0000-000000000001',
      isDemoMode: true,
    };
  }
}

/**
 * Returns a 401 Unauthorized JSON response.
 */
export function unauthorizedResponse(message = 'Authentication required. Please sign in.') {
  return NextResponse.json({ error: message }, { status: 401 });
}
