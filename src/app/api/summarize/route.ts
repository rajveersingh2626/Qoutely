import { NextRequest, NextResponse } from 'next/server';
import { summarizeProposal } from '@/lib/ai';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

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
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
