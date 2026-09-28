import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractProposal } from '@/lib/ai';

const ExtractRequestBodySchema = z.object({
  content: z.string().min(5, 'Content must contain at least 5 characters for underwriting extraction.'),
  workspace_id: z.string().optional().default('ws-capital-01'),
  user_id: z.string().optional().default('user-004'),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = ExtractRequestBodySchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid extraction request payload.',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { content, workspace_id, user_id } = parseResult.data;

    // Scoped execution with Software 1.0 boundary enforcement
    const result = await extractProposal(content, workspace_id, user_id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
