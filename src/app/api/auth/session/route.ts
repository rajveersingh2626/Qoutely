import { NextRequest, NextResponse } from 'next/server';
import { SEED_PROFILES, SEED_WORKSPACES } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('quotely_session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false, user: null, workspace: null });
  }

  try {
    const decoded = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));
    const fullProfile = SEED_PROFILES.find((p) => p.id === decoded.user?.id) || decoded.user;
    const workspace = SEED_WORKSPACES.find((w) => w.id === decoded.workspace_id) || SEED_WORKSPACES[0];

    return NextResponse.json({
      authenticated: true,
      user: fullProfile,
      workspace,
      role: decoded.role || 'super_admin',
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null, workspace: null });
  }
}
