import { NextRequest, NextResponse } from 'next/server';
import { testAIConnection, getAIRequestLogs, calculateAICost } from '@/lib/ai';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();
  const health = await testAIConnection();
  const logs = getAIRequestLogs();

  const totalRequests = logs.length;
  const totalInputTokens = logs.reduce((sum, r) => sum + (r.input_tokens || 0), 0);
  const totalOutputTokens = logs.reduce((sum, r) => sum + (r.output_tokens || 0), 0);
  const totalCost = logs.reduce((sum, r) => sum + (r.cost_usd || 0), 0);
  const avgLatency = totalRequests > 0 
    ? Math.round(logs.reduce((sum, r) => sum + (r.latency_ms || 0), 0) / totalRequests)
    : 0;

  return NextResponse.json({
    health,
    stats: {
      total_requests_today: totalRequests,
      total_input_tokens: totalInputTokens,
      total_output_tokens: totalOutputTokens,
      total_cost_usd: totalCost,
      avg_latency_ms: avgLatency,
      projected_monthly_spend_usd: Number((totalCost * 30).toFixed(4)),
      avg_cost_per_quote_usd: totalRequests > 0 ? Number((totalCost / totalRequests).toFixed(5)) : 0
    },
    recent_requests: logs.slice(0, 50)
  });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  // Test connection trigger
  const testResult = await testAIConnection();
  return NextResponse.json(testResult);
}
