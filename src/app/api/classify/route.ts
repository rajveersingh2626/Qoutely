import { NextRequest, NextResponse } from 'next/server';
import { classifyOccupancy } from '@/lib/ai';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth';
import { checkApiRateLimit, rateLimitExceededResponse } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const rateLimit = checkApiRateLimit(req, 'classify', 60, 60000, auth.user.id);
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.resetAt);
  }

  try {
    const body = await req.json();
    const { business_description, district, follow_up_answer } = body;

    if (!business_description || typeof business_description !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "business_description" in request body.' },
        { status: 400 }
      );
    }

    const result = await classifyOccupancy(
      business_description,
      district,
      follow_up_answer,
      auth.workspace_id,
      auth.user.id
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to classify occupancy.',
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
