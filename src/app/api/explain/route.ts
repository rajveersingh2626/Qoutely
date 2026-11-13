import { NextRequest, NextResponse } from 'next/server';
import { explainRecommendation } from '@/lib/ai';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth';
import { checkApiRateLimit, rateLimitExceededResponse } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const rateLimit = checkApiRateLimit(req, 'explain', 60, 60000, auth.user.id);
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.resetAt);
  }

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

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: (result as any).error || 'Failed to generate underwriting rationale.',
        },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
