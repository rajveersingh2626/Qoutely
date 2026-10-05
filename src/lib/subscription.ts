/**
 * Subscription Tier & RBAC Governance Engine
 * Implements:
 * 1. Hardcoded permanent Enterprise Tier lock for Dinesh Uncle (unconditional VIP bypass).
 * 2. Super Admin Whitelist verification against SUPER_ADMIN_IDS.
 * 3. Tiered quota enforcement (Starter: 500, Pro: 3,000, Enterprise: Unlimited).
 */

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';

export interface PlanLimits {
  tier: SubscriptionTier;
  planName: string;
  monthlyFeeINR: number;
  maxReminders: number; // -1 or Infinity for unlimited
  max_reminders_per_month: number;
  unlimitedQuota: boolean;
  unlimited_quota: boolean;
  rateLimitBypass: boolean;
  rate_limit_bypass: boolean;
  is_vip?: boolean;
  canUseBlusBsus: boolean;
  canUseComplianceMonitors: boolean;
  canUseCorporatePayouts: boolean;
  canAccessApi: boolean;
  hasAuditLogs: boolean;
  hasWhiteLabeling: boolean;
}

export const TIER_DEFINITIONS: Record<SubscriptionTier, PlanLimits> = {
  starter: {
    tier: 'starter',
    planName: 'Starter Tier',
    monthlyFeeINR: 899,
    maxReminders: 500,
    max_reminders_per_month: 500,
    unlimitedQuota: false,
    unlimited_quota: false,
    rateLimitBypass: false,
    rate_limit_bypass: false,
    is_vip: false,
    canUseBlusBsus: false,
    canUseComplianceMonitors: false,
    canUseCorporatePayouts: false,
    canAccessApi: false,
    hasAuditLogs: false,
    hasWhiteLabeling: false,
  },
  professional: {
    tier: 'professional',
    planName: 'Professional Tier',
    monthlyFeeINR: 1999,
    maxReminders: 3000,
    max_reminders_per_month: 3000,
    unlimitedQuota: false,
    unlimited_quota: false,
    rateLimitBypass: false,
    rate_limit_bypass: false,
    is_vip: false,
    canUseBlusBsus: true,
    canUseComplianceMonitors: true,
    canUseCorporatePayouts: true,
    canAccessApi: false,
    hasAuditLogs: true,
    hasWhiteLabeling: false,
  },
  enterprise: {
    tier: 'enterprise',
    planName: 'Enterprise Tier',
    monthlyFeeINR: 4999,
    maxReminders: 999999,
    max_reminders_per_month: 999999,
    unlimitedQuota: true,
    unlimited_quota: true,
    rateLimitBypass: true,
    rate_limit_bypass: true,
    is_vip: false,
    canUseBlusBsus: true,
    canUseComplianceMonitors: true,
    canUseCorporatePayouts: true,
    canAccessApi: true,
    hasAuditLogs: true,
    hasWhiteLabeling: true,
  },
};

export const DINESH_UNCLE_IDENTIFIERS = {
  emails: ['dinesh@capitalbrokers.in', 'dinesh.gupta@example.com'],
  ids: [
    '664e9b3c-1f0b-4fcb-ae7f-1fbb156bbc3f', // Supabase primary seed ID
    '10000000-0000-0000-0000-000000000002', // Seed workspace member ID
  ],
  nameFragments: ['dinesh gupta', 'dinesh uncle', 'dinesh'],
};

/**
 * Checks if a given user or string identifier is Dinesh Uncle
 */
export function isDineshUncle(
  user?:
    | {
        id?: string;
        email?: string;
        name?: string;
        full_name?: string;
      }
    | string
    | null
): boolean {
  if (!user) return false;

  if (typeof user === 'string') {
    const raw = user.trim().toLowerCase();
    if (DINESH_UNCLE_IDENTIFIERS.emails.includes(raw)) return true;
    if (DINESH_UNCLE_IDENTIFIERS.ids.includes(raw)) return true;
    if (DINESH_UNCLE_IDENTIFIERS.nameFragments.some((frag) => raw.includes(frag))) return true;
    return false;
  }

  const emailLower = (user.email || '').trim().toLowerCase();
  if (DINESH_UNCLE_IDENTIFIERS.emails.includes(emailLower)) {
    return true;
  }

  const idLower = (user.id || '').trim().toLowerCase();
  if (DINESH_UNCLE_IDENTIFIERS.ids.includes(idLower)) {
    return true;
  }

  const nameLower = (user.full_name || user.name || '').trim().toLowerCase();
  if (DINESH_UNCLE_IDENTIFIERS.nameFragments.some((frag) => nameLower.includes(frag))) {
    return true;
  }

  return false;
}

/**
 * Returns effective plan limits for a user and workspace.
 * Permanently locks Dinesh Uncle into Enterprise with zero caps and rate limit bypass.
 */
export function getEffectivePlanLimits(
  workspaceTierOrUser?: SubscriptionTier | { id?: string; email?: string; name?: string; full_name?: string } | string | null,
  userOrTier?: SubscriptionTier | { id?: string; email?: string; name?: string; full_name?: string } | string | null
): PlanLimits {
  // Normalize arguments if passed as (tier, user) or (user, tier)
  let tier: SubscriptionTier = 'professional';
  let userTarget: any = null;

  if (typeof workspaceTierOrUser === 'string' && (workspaceTierOrUser === 'starter' || workspaceTierOrUser === 'professional' || workspaceTierOrUser === 'enterprise' || workspaceTierOrUser === 'pro')) {
    tier = workspaceTierOrUser === 'pro' ? 'professional' : workspaceTierOrUser;
    userTarget = userOrTier;
  } else {
    userTarget = workspaceTierOrUser;
    if (typeof userOrTier === 'string' && (userOrTier === 'starter' || userOrTier === 'professional' || userOrTier === 'enterprise' || userOrTier === 'pro')) {
      tier = userOrTier === 'pro' ? 'professional' : userOrTier;
    }
  }

  // Hardcoded permanent VIP override for Dinesh Uncle
  if (isDineshUncle(userTarget)) {
    return {
      ...TIER_DEFINITIONS.enterprise,
      planName: 'Enterprise VIP (Dinesh Uncle Lock)',
      unlimitedQuota: true,
      unlimited_quota: true,
      rateLimitBypass: true,
      rate_limit_bypass: true,
      maxReminders: 999999,
      max_reminders_per_month: 999999,
      is_vip: true,
    };
  }

  return TIER_DEFINITIONS[tier] || TIER_DEFINITIONS.professional;
}

/**
 * Verifies whether a user is an authorized Super Admin based on the SUPER_ADMIN_IDS whitelist.
 */
export function isWhitelistedSuperAdmin(
  user?:
    | {
        id?: string;
        email?: string;
      }
    | string
    | null
): boolean {
  if (!user) return false;

  const defaultWhitelist = 'cd01d968-c52e-4809-9a45-0ddd62026e73,rajveer@capitalbrokers.in';
  const rawList = process.env.SUPER_ADMIN_IDS || defaultWhitelist;
  const entries = rawList
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (typeof user === 'string') {
    return entries.includes(user.trim().toLowerCase());
  }

  const userId = (user.id || '').trim().toLowerCase();
  const userEmail = (user.email || '').trim().toLowerCase();

  return entries.includes(userId) || entries.includes(userEmail);
}
