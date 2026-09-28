import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
  res.cookies.set('quotely_session', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return res;
}
