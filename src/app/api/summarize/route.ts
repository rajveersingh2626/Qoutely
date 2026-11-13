import { NextRequest, NextResponse } from 'next/server';
import { summarizeProposal } from '@/lib/ai';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth';
import { checkApiRateLimit, rateLimitExceededResponse } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const rateLimit = checkApiRateLimit(req, 'summarize', 60, 60000, auth.user.id);
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.resetAt);
  }

  try {
    const body = await req.json();
    const { proposal_data } = body;

    if (!proposal_data) {
      return NextResponse.json(
        { error: 'Missing "proposal_data" in request body.' },
        { status: 400 }
      );
    }

    const result = await summarizeProposal(proposal_data, auth.workspace_id, auth.user.id);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to summarize proposal.',
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
