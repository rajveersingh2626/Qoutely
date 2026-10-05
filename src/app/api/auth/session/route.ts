import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getEffectivePlanLimits, isDineshUncle, isWhitelistedSuperAdmin } from '@/lib/subscription';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ authenticated: false, user: null, workspace: null, plan: null });
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

    const isDinesh = isDineshUncle({
      id: user.id,
      email: user.email,
      name: profile?.full_name || profile?.name || user.user_metadata?.full_name,
    });

    const isSuperAdmin = isWhitelistedSuperAdmin({ id: user.id, email: user.email }) && (profile?.is_super_admin || profile?.super_admin);

    const userProfile = {
      ...(profile || {}),
      id: user.id,
      name: profile?.full_name || profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email!,
      super_admin: isSuperAdmin,
      is_super_admin: isSuperAdmin,
      is_dinesh_vip: isDinesh,
      created_at: profile?.created_at || user.created_at,
    };

    const planLimits = getEffectivePlanLimits(userProfile, (membership?.workspace?.plan as any) || 'professional');

    return NextResponse.json({
      authenticated: true,
      user: userProfile,
      workspace: membership?.workspace || null,
      role: isDinesh ? 'admin' : (membership?.role || 'viewer'),
      plan: planLimits,
      limits: {
        unlimited_quota: planLimits.unlimitedQuota,
        rate_limit_bypass: planLimits.rateLimitBypass,
        max_reminders: planLimits.maxReminders,
      },
    });
  } catch (err: any) {
    console.error('[Session Error]', err);
    return NextResponse.json({ authenticated: false, user: null, workspace: null, plan: null });
  }
}

