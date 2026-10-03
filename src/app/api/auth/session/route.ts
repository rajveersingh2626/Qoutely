import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ authenticated: false, user: null, workspace: null });
    }

    // Fetch full profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Fetch first active workspace membership with workspace details
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('*, workspace:workspaces(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })
      .limit(1)
      .single();

    const userProfile = profile || {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email!,
      super_admin: false,
      created_at: user.created_at,
    };

    return NextResponse.json({
      authenticated: true,
      user: userProfile,
      workspace: membership?.workspace || null,
      role: membership?.role || 'viewer',
    });
  } catch (err: any) {
    console.error('[Session Error]', err);
    return NextResponse.json({ authenticated: false, user: null, workspace: null });
  }
}
