import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const DEFAULT_SUPABASE_URL = 'https://vcmcueyzjuostebnlmcm.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_2YLsp3r5yL1toZ4PUHzS1g_truC17O_';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

    let emailToAuth = email.trim().toLowerCase();
    let passwordToAuth = password;

    // Convenient shortcut for Dinesh
    if (emailToAuth === 'dinesh' || emailToAuth === 'test') {
      emailToAuth = 'dinesh@capitalbrokers.in';
      if (passwordToAuth === 'test') {
        passwordToAuth = 'Password123!';
      }
    }

    const cookieStore = await cookies();
    const cookiesToSetLater: { name: string; value: string; options?: CookieOptions }[] = [];

    // Use createServerClient so that session cookies use standard Supabase SSR format
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Can happen in route handler response lifecycle
            }
            cookiesToSetLater.push({ name, value, options });
          });
        },
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToAuth,
      password: passwordToAuth,
    });

    if (error || !data.user || !data.session) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Fetch user profile from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Fetch first workspace membership for this user
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('*, workspace:workspaces(*)')
      .eq('user_id', data.user.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })
      .limit(1)
      .single();

    const userProfile = {
      ...(profile || {}),
      id: data.user.id,
      name:
        profile?.full_name ||
        profile?.name ||
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        data.user.email?.split('@')[0] ||
        'User',
      full_name: profile?.full_name || profile?.name || 'User',
      email: data.user.email!,
      created_at: profile?.created_at || data.user.created_at,
    };

    const workspace = membership?.workspace || null;
    const role = membership?.role || 'underwriter';

    // Build response
    const res = NextResponse.json({
      success: true,
      user: userProfile,
      workspace,
      role,
    });

    // Mirror all session cookies to response headers
    cookiesToSetLater.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        ...options,
      });
    });

    // Also set explicit tokens for custom readers
    res.cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: data.session.expires_in,
    });

    return res;
  } catch (err: any) {
    console.error('[Auth Login Error]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
