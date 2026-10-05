import { redirect } from 'next/navigation';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server';
import SuperAdminDashboardClient from './SuperAdminDashboardClient';
import { isWhitelistedSuperAdmin } from '@/lib/subscription';

/**
 * /super-admin — Server Component route guard
 *
 * This runs on the server before rendering. It:
 * 1. Validates the Supabase session
 * 2. Checks the `super_admin` boolean flag in `profiles` (NOT a client-side check)
 * 3. Uses the service-role client to bypass RLS and fetch platform-wide stats
 * 4. Redirects non-super-admins to /app/dashboard
 */
export default async function SuperAdminPage() {
  // 1. Verify authenticated session server-side
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/super-admin');
  }

  // 2. Fetch user profile and check super_admin flag and whitelist
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, super_admin, is_super_admin, created_at')
    .eq('id', user.id)
    .single();

  const isAuthorized =
    (profile?.super_admin || profile?.is_super_admin) &&
    isWhitelistedSuperAdmin({ id: user.id, email: user.email || profile?.email });

  if (!isAuthorized) {
    // Not a whitelisted super admin — redirect to dashboard
    redirect('/dashboard?error=access_denied');
  }

  // 3. Use service-role client to bypass RLS for platform-wide stats
  const serviceClient = createSupabaseServiceClient();

  // Fetch all organizations
  const { data: organizations } = await serviceClient
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch all workspace members
  const { data: allMembers } = await serviceClient
    .from('workspace_members')
    .select('workspace_id, user_id, role, status');

  // Fetch total quotes count per workspace
  const { data: quoteStats } = await serviceClient
    .from('quotes')
    .select('workspace_id, total_premium, sum_insured, created_at')
    .order('created_at', { ascending: false });

  // Fetch system audit log
  const { data: systemAuditLog } = await serviceClient
    .from('system_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch AI request stats (all tenants)
  const { data: aiRequests } = await serviceClient
    .from('ai_requests')
    .select('workspace_id, input_tokens, output_tokens, cost_usd, latency_ms, model, endpoint, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  // Fetch total user count
  const { count: totalUsers } = await serviceClient
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  return (
    <SuperAdminDashboardClient
      currentAdmin={profile}
      organizations={organizations || []}
      allMembers={allMembers || []}
      quoteStats={quoteStats || []}
      systemAuditLog={systemAuditLog || []}
      aiRequests={aiRequests || []}
      totalUsers={totalUsers || 0}
    />
  );
}
