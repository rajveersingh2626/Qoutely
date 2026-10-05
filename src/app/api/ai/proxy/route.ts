import { NextRequest, NextResponse } from 'next/server';
import {
  callGeminiWithFailover,
  getGatewayCircuitStatus,
} from '@/lib/gemini-proxy';

export async function GET() {
  const status = getGatewayCircuitStatus();
  return NextResponse.json({
    status: 'online',
    circuit: status,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload, contents, config, model } = body;

    let requestContents = contents;

    // Handle high-level actions if raw contents not passed
    if (!requestContents && action) {
      if (action === 'generate_hinglish') {
        const clientName = payload?.clientName || 'Valued Broker Client';
        const policyNumber = payload?.policyNumber || 'POL-7829-DEL';
        const expiryDays = payload?.expiryDays || 30;
        const sumInsured = payload?.sumInsured || '₹10,00,00,000';
        const prompt = `You are an expert commercial insurance broker at Capital Brokers, New Delhi.
Generate an omnichannel policy renewal notice in warm, professional, authentic business Hinglish (mix of conversational Hindi in Roman script and professional English insurance terms).
Details:
- Client: ${clientName}
- Policy: Commercial Fire & Special Perils / Bharat Laghu Udyam Suraksha (BLUS)
- Policy Ref: ${policyNumber}
- Days Remaining to Expiry: ${expiryDays} days
- Sum Insured: ${sumInsured}
- Key mandate: Highlight statutory renewal, no disruption in coverage, and ask for updated asset schedule/stocks valuation.
Output JSON format:
{
  "whatsapp_message": "...",
  "sms_message": "...",
  "email_subject": "...",
  "email_body": "...",
  "action_required": "..."
}`;
        requestContents = prompt;
      } else if (action === 'ocr' || action === 'idp') {
        const documentText = payload?.rawText || '';
        requestContents = `Analyze and extract commercial fire insurance proposal details from this document text:
${documentText}
Return JSON with client_name, gst, address, sum_insured_breakdown, occupancy_description.`;
      } else if (action === 'payout_match') {
        const commissionData = payload?.statement || '';
        requestContents = `Analyze this insurer commission statement against policy brokerages. Identify reconciliations, TDS deductions, and revenue leakages:
${commissionData}`;
      } else {
        requestContents = String(payload?.prompt || payload?.text || 'Hello');
      }
    }

    if (!requestContents) {
      return NextResponse.json(
        { success: false, error: 'Missing prompt contents or payload' },
        { status: 400 }
      );
    }

    const result = await callGeminiWithFailover({
      contents: requestContents,
      config: config || {},
      model: model || 'gemini-2.5-flash',
      operation: action || 'generic_proxy',
    });

    return NextResponse.json({
      success: true,
      text: result.text,
      keyUsed: result.keyUsed,
      failoverTriggered: result.failoverTriggered,
      modelUsed: result.modelUsed,
      latencyMs: result.latencyMs,
      circuit: getGatewayCircuitStatus(),
    });
  } catch (err: any) {
    console.error('[/api/ai/proxy Error]', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'AI Proxy Error',
        circuit: getGatewayCircuitStatus(),
      },
      { status: 502 }
    );
  }
}
