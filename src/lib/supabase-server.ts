/**
 * supabase-server.ts
 * Server-side Supabase clients for use in API routes and Server Components.
 * - `createSupabaseServerClient()` — uses the anon key + cookie-based session (respects RLS)
 * - `createSupabaseServiceClient()` — uses the service-role key (bypasses RLS, super-admin only)
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Cookie-based Supabase client for use inside Next.js server components / route handlers.
 * Respects Row-Level Security — the current user's session is forwarded automatically.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component. This can be
          // ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

/**
 * Service-role Supabase client — bypasses ALL RLS policies.
 * Must ONLY be used in:
 *  1. /super-admin routes that have already verified the super_admin flag server-side
 *  2. Background jobs / migrations
 * NEVER expose this client to the browser.
 */
export function createSupabaseServiceClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured. Super-admin operations are unavailable.');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
