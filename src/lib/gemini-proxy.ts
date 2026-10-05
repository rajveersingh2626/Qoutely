/**
 * Dual Gemini API Failover Circuit Breaker & Gateway
 *
 * Dispatches to GEMINI_API_KEY_PRIMARY (Free Tier) by default.
 * Catches HTTP 429 (RESOURCE_EXHAUSTED / Quota Exceeded / Rate Limit) immediately.
 * Seamlessly and transparently retries with GEMINI_API_KEY_FALLBACK (Paid Tier)
 * without state loss or client UI disruption.
 * Implements an internal cooldown timer before primary key retries.
 */

import { GoogleGenAI } from '@google/genai';

export const GEMINI_API_KEY_PRIMARY =
  process.env.GEMINI_API_KEY_PRIMARY ||
  process.env.GEMINI_API_KEY ||
  '';

export const GEMINI_API_KEY_FALLBACK =
  process.env.GEMINI_API_KEY_FALLBACK ||
  '';

interface CircuitBreakerState {
  primaryCooldownUntil: number;
  circuitState: 'PRIMARY_ACTIVE' | 'FALLBACK_COOLDOWN_ACTIVE';
  totalFailovers: number;
  lastFailoverTime: string | null;
  lastFailoverReason: string | null;
}

// Persistent in-memory circuit state across requests
const circuitState: CircuitBreakerState = {
  primaryCooldownUntil: 0,
  circuitState: 'PRIMARY_ACTIVE',
  totalFailovers: 0,
  lastFailoverTime: null,
  lastFailoverReason: null,
};

// Default cooldown after a 429 quota exhaustion: 60 seconds
const COOLDOWN_DURATION_MS = 60 * 1000;

let primaryClient: GoogleGenAI | null = null;
let fallbackClient: GoogleGenAI | null = null;

function getPrimaryClient(): GoogleGenAI {
  if (!primaryClient) {
    primaryClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY_PRIMARY });
  }
  return primaryClient;
}

function getFallbackClient(): GoogleGenAI {
  if (!GEMINI_API_KEY_FALLBACK) {
    throw new Error('GEMINI_API_KEY_FALLBACK is not configured');
  }
  if (!fallbackClient) {
    fallbackClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY_FALLBACK });
  }
  return fallbackClient;
}

export function isRateLimitOrQuotaError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.statusCode || err.response?.status;
  if (status === 429) return true;

  const msg = String(err.message || err.error || err).toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota exceeded') ||
    msg.includes('too many requests') ||
    msg.includes('rate limit')
  );
}

export interface ProxyCallParams {
  contents: any;
  config?: any;
  model?: string;
  operation?: string;
  client?: GoogleGenAI;
}

export interface ProxyCallResult {
  text: string;
  keyUsed: 'primary' | 'fallback';
  failoverTriggered: boolean;
  modelUsed: string;
  latencyMs: number;
}

/**
 * Dispatches Gemini content generation with automated failover circuit logic.
 */
export async function callGeminiWithFailover(
  params: ProxyCallParams
): Promise<ProxyCallResult> {
  const model = params.model || 'gemini-2.5-flash';
  const startTime = Date.now();
  const now = Date.now();

  const isPrimaryCoolingDown = Boolean(
    GEMINI_API_KEY_FALLBACK && now < circuitState.primaryCooldownUntil
  );

  // Case 1: Primary is currently in cooldown period -> route directly to Fallback
  if (isPrimaryCoolingDown) {
    try {
      const client = getFallbackClient();
      const res = await client.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return {
        text: res.text || '',
        keyUsed: 'fallback',
        failoverTriggered: true,
        modelUsed: model,
        latencyMs: Date.now() - startTime,
      };
    } catch (fallbackErr: any) {
      console.error('[Gemini Gateway] Fallback key also encountered error:', fallbackErr);
      throw fallbackErr;
    }
  }

  // Case 2: Attempt with Primary Key
  try {
    const client = params.client || getPrimaryClient();
    const res = await client.models.generateContent({
      model,
      contents: params.contents,
      config: params.config,
    });

    circuitState.circuitState = 'PRIMARY_ACTIVE';

    return {
      text: res.text || '',
      keyUsed: 'primary',
      failoverTriggered: false,
      modelUsed: model,
      latencyMs: Date.now() - startTime,
    };
  } catch (err: any) {
    // Check if error is 429 Rate Limit / Quota Exceeded
    const isQuotaErr = isRateLimitOrQuotaError(err);

    if (isQuotaErr) {
      if (!GEMINI_API_KEY_FALLBACK) {
        // Without fallback configured, keep using primary client and fail explicitly before starting cooldown
        throw err;
      }

      circuitState.primaryCooldownUntil = Date.now() + COOLDOWN_DURATION_MS;
      circuitState.circuitState = 'FALLBACK_COOLDOWN_ACTIVE';
      circuitState.totalFailovers += 1;
      circuitState.lastFailoverTime = new Date().toISOString();
      circuitState.lastFailoverReason = err.message || 'HTTP 429 Quota Exceeded';

      console.warn(
        `[Gemini Gateway Failover] 429 Quota Exceeded on Primary Key. Seamlessly switching to Fallback Key. Cooldown until ${new Date(
          circuitState.primaryCooldownUntil
        ).toLocaleTimeString()}`
      );

      // Re-dispatch exact payload transparently to Fallback
      try {
        const fallback = getFallbackClient();
        const fallbackRes = await fallback.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });

        return {
          text: fallbackRes.text || '',
          keyUsed: 'fallback',
          failoverTriggered: true,
          modelUsed: model,
          latencyMs: Date.now() - startTime,
        };
      } catch (fallbackErr: any) {
        console.error('[Gemini Gateway] Fallback key execution failed:', fallbackErr);
        throw fallbackErr;
      }
    }

    // Restrict fallback attempt to 5xx or network errors; do not retry 400 invalid-argument or invalid-model errors
    const status = err?.status || err?.statusCode || err?.response?.status;
    const is5xxOrNetwork = !status || status >= 500 || status === 0;

    if (!is5xxOrNetwork || !GEMINI_API_KEY_FALLBACK) {
      throw err;
    }

    try {
      const fallback = getFallbackClient();
      const fallbackRes = await fallback.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });

      return {
        text: fallbackRes.text || '',
        keyUsed: 'fallback',
        failoverTriggered: true,
        modelUsed: model,
        latencyMs: Date.now() - startTime,
      };
    } catch {
      throw err;
    }
  }
}

export function getGatewayCircuitStatus() {
  const isCoolingDown = Boolean(
    GEMINI_API_KEY_FALLBACK && Date.now() < circuitState.primaryCooldownUntil
  );
  return {
    ...circuitState,
    isPrimaryCoolingDown: isCoolingDown,
    cooldownRemainingSeconds: isCoolingDown
      ? Math.max(0, Math.round((circuitState.primaryCooldownUntil - Date.now()) / 1000))
      : 0,
    primaryKeyMasked: GEMINI_API_KEY_PRIMARY ? `${GEMINI_API_KEY_PRIMARY.slice(0, 10)}...${GEMINI_API_KEY_PRIMARY.slice(-6)}` : 'NOT_CONFIGURED',
    fallbackKeyMasked: GEMINI_API_KEY_FALLBACK ? `${GEMINI_API_KEY_FALLBACK.slice(0, 10)}...${GEMINI_API_KEY_FALLBACK.slice(-6)}` : 'NOT_CONFIGURED',
  };
}

export function getGeminiApiKey(): { key: string; tier: 'primary_free' | 'fallback_paid' } {
  const isPrimaryCoolingDown = Boolean(
    GEMINI_API_KEY_FALLBACK && Date.now() < circuitState.primaryCooldownUntil
  );
  if (isPrimaryCoolingDown) {
    return { key: GEMINI_API_KEY_FALLBACK, tier: 'fallback_paid' };
  }
  return { key: GEMINI_API_KEY_PRIMARY, tier: 'primary_free' };
}

export function markPrimaryRateLimited(durationMs = 60000) {
  if (!GEMINI_API_KEY_FALLBACK) {
    return;
  }
  circuitState.primaryCooldownUntil = Date.now() + durationMs;
  circuitState.circuitState = 'FALLBACK_COOLDOWN_ACTIVE';
  circuitState.totalFailovers += 1;
  circuitState.lastFailoverTime = new Date().toISOString();
  circuitState.lastFailoverReason = 'HTTP 429 Quota Exceeded';
}
