import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractProposal } from '@/lib/ai';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ExtractJsonSchema = z.object({
  content: z.string().optional(),
  base64: z.string().optional(),
  mimeType: z.string().optional(),
  fileName: z.string().optional(),
  workspace_id: z.string().optional(),
  user_id: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Auth guard — validates Supabase session (with demo fallback)
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  try {
    const contentType = req.headers.get('content-type') || '';
    let content: string | undefined;
    let base64: string | undefined;
    let mimeType: string | undefined;
    let fileName: string | undefined;
    const workspace_id = auth.workspace_id;
    const user_id = auth.user.id;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const textContent = formData.get('content') as string | null;

      if (textContent) {
        content = textContent;
      }

      if (file && file.size > 0) {
        fileName = file.name;
        mimeType = file.type || 'application/pdf';

        if (file.name.endsWith('.txt') || mimeType.startsWith('text/')) {
          content = await file.text();
        } else {
          const buffer = Buffer.from(await file.arrayBuffer());
          base64 = buffer.toString('base64');
        }
      }
    } else {
      const rawBody = await req.json().catch(() => ({}));
      const parsed = ExtractJsonSchema.safeParse(rawBody);
      if (parsed.success) {
        content = parsed.data.content;
        base64 = parsed.data.base64;
        mimeType = parsed.data.mimeType;
        fileName = parsed.data.fileName;
      }
    }

    if (!content && !base64) {
      return NextResponse.json(
        {
          error: 'Please provide either document file data or text content for underwriting extraction.',
        },
        { status: 400 }
      );
    }

    // Scoped execution with Karpathy Software 1.0 boundary enforcement
    const result = await extractProposal(
      {
        content,
        base64,
        mimeType: mimeType || 'application/pdf',
        fileName: fileName || 'proposal_document.pdf',
      },
      workspace_id,
      user_id
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          is_valid_proposal: false,
          error: result.error || 'Failed to extract proposal from input.',
          meta: result.meta,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Extract API handler error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
