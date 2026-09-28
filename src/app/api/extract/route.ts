import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractProposal } from '@/lib/ai';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth';

const ExtractRequestBodySchema = z
  .object({
    content: z.string().optional(),
    base64: z.string().optional(),
    mimeType: z.string().optional(),
    fileName: z.string().optional(),
    workspace_id: z.string().optional(),
    user_id: z.string().optional(),
  })
  .refine((data) => (data.content && data.content.length >= 3) || (data.base64 && data.base64.length > 10), {
    message: 'Either content (min 3 chars) or base64 file data must be provided for underwriting extraction.',
  });

export async function POST(req: NextRequest) {
  // Auth guard — validates Supabase session (with demo fallback)
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

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

    // Use session-derived workspace/user IDs, falling back to request body for demo mode
    const workspace_id = parseResult.data.workspace_id || auth.workspace_id;
    const user_id = parseResult.data.user_id || auth.user.id;

    // Scoped execution with Software 1.0 boundary enforcement
    const result = await extractProposal(
      {
        content: parseResult.data.content,
        base64: parseResult.data.base64,
        mimeType: parseResult.data.mimeType,
        fileName: parseResult.data.fileName,
      },
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
