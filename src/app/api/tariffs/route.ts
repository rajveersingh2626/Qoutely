import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { evaluateTariffCompliance, getOccupancyByCode } from '@/lib/calculator';

import { isWhitelistedSuperAdmin } from '@/lib/subscription';

async function getAuthorizedWorkspace(req: NextRequest, requestedWorkspaceId?: string | null) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 } as const;
  }

  const isSuper = isWhitelistedSuperAdmin(user);

  let targetWsId = requestedWorkspaceId || user.user_metadata?.workspace_id;
  let userRole = isSuper ? 'super_admin' : undefined;

  const { data: members } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (members && members.length > 0) {
    const matched = targetWsId ? members.find((m) => m.workspace_id === targetWsId) : members[0];
    if (matched) {
      targetWsId = matched.workspace_id;
      if (!isSuper) userRole = matched.role;
    } else if (requestedWorkspaceId && !isSuper) {
      return { error: 'Forbidden: unauthorized workspace access', status: 403 } as const;
    } else if (!isSuper) {
      targetWsId = members[0].workspace_id;
      userRole = members[0].role;
    }
  } else if (!isSuper) {
    return { error: 'No active workspace found for user', status: 403 } as const;
  }

  return { supabase, user, workspaceId: targetWsId, role: userRole || (isSuper ? 'super_admin' : 'viewer') };
}

// GET /api/tariffs - List all custom tariff overrides for workspace
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const requestedWorkspaceId = searchParams.get('workspace_id');

    const auth = await getAuthorizedWorkspace(req, requestedWorkspaceId);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase, workspaceId } = auth;
    const { data, error } = await supabase
      .from('workspace_tariff_overrides')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) {
      console.warn('[Tariff API] Could not fetch workspace overrides:', error.message);
      return NextResponse.json({ overrides: [] }, { status: 200 });
    }

    return NextResponse.json({ overrides: data || [] });
  } catch (err: any) {
    console.error('[Tariff API GET Error]:', err);
    return NextResponse.json({ overrides: [], error: err.message }, { status: 500 });
  }
}

// POST /api/tariffs - Create or update an occupancy tariff override
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await req.json();
    const {
      workspace_id: requestedWorkspaceId,
      occupancy_code,
      custom_flexa_rate,
      custom_loss_cost,
      custom_discretionary_discount,
      custom_category,
      notes,
    } = body;

    if (!occupancy_code) {
      return NextResponse.json({ error: 'occupancy_code is required' }, { status: 400 });
    }

    const occ = getOccupancyByCode(occupancy_code);
    if (!occ) {
      return NextResponse.json({ error: `Occupancy code ${occupancy_code} not found in tariff schedules` }, { status: 404 });
    }

    const auth = await getAuthorizedWorkspace(req, requestedWorkspaceId);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (auth.role !== 'admin' && auth.role !== 'brokerage_owner' && auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: admin or brokerage owner role required' }, { status: 403 });
    }
    const { workspaceId } = auth;

    // Compliance Evaluation
    const appliedFlexa = custom_flexa_rate !== undefined ? Number(custom_flexa_rate) : occ.flexa_rate;
    const compliance = evaluateTariffCompliance(occ, appliedFlexa);

    const payload = {
      workspace_id: workspaceId,
      occupancy_code: String(occupancy_code).trim(),
      custom_flexa_rate: custom_flexa_rate !== undefined ? Number(custom_flexa_rate) : null,
      custom_loss_cost: custom_loss_cost !== undefined ? Number(custom_loss_cost) : null,
      custom_discretionary_discount: custom_discretionary_discount !== undefined ? Number(custom_discretionary_discount) : null,
      custom_category: custom_category !== undefined ? Number(custom_category) : null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('workspace_tariff_overrides')
      .upsert(payload, { onConflict: 'workspace_id,occupancy_code' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[Tariff API] DB upsert fallback:', error.message);
      // Return the payload with compliance metadata even if DB table is unmigrated in dev
      return NextResponse.json({
        success: true,
        override: payload,
        compliance,
        warning: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      override: data || payload,
      compliance,
    });
  } catch (err: any) {
    console.error('[Tariff API POST Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/tariffs - Reset tariff override back to statutory baseline
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await req.json();
    const { workspace_id: requestedWorkspaceId, occupancy_code } = body;

    if (!occupancy_code) {
      return NextResponse.json({ error: 'occupancy_code is required' }, { status: 400 });
    }

    const auth = await getAuthorizedWorkspace(req, requestedWorkspaceId);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (auth.role !== 'admin' && auth.role !== 'brokerage_owner' && auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: admin or brokerage owner role required' }, { status: 403 });
    }
    const { workspaceId } = auth;

    const { error } = await supabase
      .from('workspace_tariff_overrides')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('occupancy_code', String(occupancy_code).trim());

    if (error) {
      console.warn('[Tariff API] DB delete warning:', error.message);
    }

    return NextResponse.json({
      success: true,
      message: `Reset occupancy ${occupancy_code} to standard statutory tariff baseline`,
    });
  } catch (err: any) {
    console.error('[Tariff API DELETE Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
