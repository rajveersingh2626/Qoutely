import { NextRequest, NextResponse } from 'next/server';
import { classifyOccupancy } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { business_description, district, workspace_id, user_id } = body;

    if (!business_description || typeof business_description !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "business_description" in request body.' },
        { status: 400 }
      );
    }

    const result = await classifyOccupancy(business_description, district, workspace_id, user_id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
