import { NextRequest, NextResponse } from 'next/server';
import { classifyOccupancy } from '@/lib/ai';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { business_description, district } = body;

    if (!business_description || typeof business_description !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "business_description" in request body.' },
        { status: 400 }
      );
    }

    const result = await classifyOccupancy(
      business_description,
      district,
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
