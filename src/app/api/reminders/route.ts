import { NextRequest, NextResponse } from 'next/server';
import {
  generateRenewalNotice,
  verifyAndIncrementReminderQuota,
  checkReminderQuota,
  getWorkspaceReminderUsage,
  RenewalPolicyDetails,
} from '@/lib/renewal-engine';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { SubscriptionTier } from '@/lib/subscription';

async function getAuthorizedWorkspace(req: NextRequest, requestedWorkspaceId?: string | null) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 } as const;
  }

  let targetWsId = requestedWorkspaceId || user.user_metadata?.workspace_id;
  if (!targetWsId) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    targetWsId = membership?.workspace_id;
  } else if (requestedWorkspaceId && requestedWorkspaceId !== user.user_metadata?.workspace_id) {
    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .eq('workspace_id', requestedWorkspaceId)
      .eq('status', 'active')
      .maybeSingle();

    if (!member) {
      return { error: 'Forbidden: unauthorized workspace access', status: 403 } as const;
    }
  }

  if (!targetWsId) {
    return { error: 'No active workspace found for user', status: 403 } as const;
  }

  const { data: wsRecord } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', targetWsId)
    .maybeSingle();

  const authoritativeTier = (wsRecord?.plan || wsRecord?.tier || user.user_metadata?.workspace_tier || 'professional') as SubscriptionTier;

  return { user, workspaceId: targetWsId, workspaceTier: authoritativeTier, wsRecord };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const requestedWorkspaceId = url.searchParams.get('workspaceId');
  const authResult = await getAuthorizedWorkspace(req, requestedWorkspaceId);

  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const usage = await getWorkspaceReminderUsage(authResult.workspaceId);

  return NextResponse.json({
    workspaceId: authResult.workspaceId,
    monthlyReminderUsage: usage,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { policy, intervalDays, language, workspaceId } = body;

    const authResult = await getAuthorizedWorkspace(req, workspaceId);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user, workspaceId: targetWsId, workspaceTier } = authResult;

    // 1. Validate policy before consuming quota
    if (!policy || typeof policy !== 'object') {
      return NextResponse.json({ error: 'Valid policy details are required' }, { status: 400 });
    }
    if (!policy.policyNumber || !policy.clientName || !policy.expiryDate) {
      return NextResponse.json(
        { error: 'Policy must include policyNumber, clientName, and expiryDate' },
        { status: 400 }
      );
    }

    // 2. Pre-flight check quota availability using authoritative tier without consuming
    const dryRunCheck = await checkReminderQuota(targetWsId, user, workspaceTier);
    if (!dryRunCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: dryRunCheck.message,
          quota: dryRunCheck,
        },
        { status: 429 }
      );
    }

    // 3. Generate notice (if this fails, quota is not consumed)
    const validInterval = ([60, 30, 15, 3].includes(Number(intervalDays)) ? Number(intervalDays) : 30) as 60 | 30 | 15 | 3;
    const messages = generateRenewalNotice(
      policy,
      validInterval,
      language || 'hinglish'
    );

    // 4. Increment quota only after successful notice generation
    const quotaCheck = await verifyAndIncrementReminderQuota(targetWsId, user, workspaceTier, { policy });
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: quotaCheck.message,
          quota: quotaCheck,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      quota: quotaCheck,
      messages,
      policy,
    });
  } catch (err: any) {
    console.error('[/api/reminders error]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to dispatch renewal reminder' },
      { status: 500 }
    );
  }
}
