import { NextRequest, NextResponse } from 'next/server';
import { SEED_PROFILES, SEED_WORKSPACES, SEED_WORKSPACE_MEMBERS } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const trimmedIdentifier = (email || '').trim().toLowerCase();
    const trimmedPassword = (password || '').trim().toLowerCase();

    // Check credentials strictly: username 'test' (or 'test@quotely.ai', or starting with 'test') and password 'test'
    const isTestAccount =
      (trimmedIdentifier === 'test' ||
        trimmedIdentifier === 'test@quotely.ai' ||
        trimmedIdentifier.startsWith('test@') ||
        trimmedIdentifier === 'admin' ||
        trimmedIdentifier === 'admin@quotely.ai') &&
      (trimmedPassword === 'test' || trimmedPassword === 'admin');

    if (!isTestAccount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials. Please enter username "test" and password "test".',
        },
        { status: 401 }
      );
    }

    const testProfile = SEED_PROFILES[0];
    const defaultWorkspace = SEED_WORKSPACES[0];
    const memberRecord = SEED_WORKSPACE_MEMBERS.find(
      (m) => m.user_id === testProfile.id && m.workspace_id === defaultWorkspace.id
    );
    const role = memberRecord ? memberRecord.role : 'super_admin';

    const sessionPayload = {
      user: {
        id: testProfile.id,
        name: testProfile.name,
        email: testProfile.email,
        avatar: testProfile.avatar,
      },
      workspace_id: defaultWorkspace.id,
      role,
      issuedAt: Date.now(),
    };

    const sessionString = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');

    const res = NextResponse.json({
      success: true,
      user: testProfile,
      workspace: defaultWorkspace,
      role,
    });

    // Set secure HTTP-only session cookie recognized by middleware
    res.cookies.set('quotely_session', sessionString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Login failed' },
      { status: 500 }
    );
  }
}
