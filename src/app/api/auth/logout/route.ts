import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();

    const res = NextResponse.json({ success: true });
    // Clear all Supabase session cookies
    res.cookies.delete('sb-access-token');
    res.cookies.delete('sb-refresh-token');
    return res;
  } catch (err: any) {
    console.error('[Auth Logout Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
