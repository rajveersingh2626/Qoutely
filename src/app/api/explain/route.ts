import { NextRequest, NextResponse } from 'next/server';
import { explainRecommendation } from '@/lib/ai';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { occupancy_code, business_description } = body;

    if (!occupancy_code) {
      return NextResponse.json(
        { error: 'Missing "occupancy_code" in request body.' },
        { status: 400 }
      );
    }

    const result = await explainRecommendation(
      occupancy_code,
      business_description || '',
      auth.workspace_id,
      auth.user.id
    );
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
