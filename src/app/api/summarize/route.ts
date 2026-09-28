import { NextRequest, NextResponse } from 'next/server';
import { summarizeProposal } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { proposal_data, workspace_id, user_id } = body;

    if (!proposal_data) {
      return NextResponse.json(
        { error: 'Missing "proposal_data" in request body.' },
        { status: 400 }
      );
    }

    const result = await summarizeProposal(proposal_data, workspace_id, user_id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
