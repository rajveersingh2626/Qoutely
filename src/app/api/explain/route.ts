import { NextRequest, NextResponse } from 'next/server';
import { explainRecommendation } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { occupancy_code, business_description, workspace_id, user_id } = body;

    if (!occupancy_code) {
      return NextResponse.json(
        { error: 'Missing "occupancy_code" in request body.' },
        { status: 400 }
      );
    }

    const result = await explainRecommendation(
      occupancy_code,
      business_description || '',
      workspace_id,
      user_id
    );
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
