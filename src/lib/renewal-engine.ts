/**
 * Omnichannel Renewal Engine & Tiered Quota Guard
 *
 * Implements:
 * 1. Automatic renewal notification schedules at 60, 30, 15, and 3 days before policy expiry.
 * 2. Multi-channel dispatch templates across WhatsApp, SMS (DLT 160-char compliant), and Email.
 * 3. Localized English and authentic professional Hinglish templates.
 * 4. Tier quota guard enforcing limits (Starter: 500, Pro: 3,000, Enterprise: Unlimited).
 * 5. Dinesh Uncle unconditional VIP bypass (zero reminder caps, rate limit bypass).
 */

import { isDineshUncle, getEffectivePlanLimits, SubscriptionTier } from './subscription';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface RenewalPolicyDetails {
  id: string;
  policyNumber: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  brokerPhone?: string;
  insurerName: string;
  productName: string;
  expiryDate: string; // YYYY-MM-DD
  sumInsuredINR: number;
  currentPremiumINR: number;
  riskLocation: string;
}

export interface OmnichannelMessageSet {
  intervalDays: 60 | 30 | 15 | 3;
  language: 'en' | 'hinglish';
  whatsAppMessage: string;
  smsMessage: string;
  emailSubject: string;
  emailBody: string;
  urgencyLevel: 'info' | 'reminder' | 'warning' | 'critical';
}

function clampSms(msg: string): string {
  if (msg.length <= 160) return msg;
  return msg.slice(0, 157) + '...';
}

export function generateRenewalNotice(
  policy: RenewalPolicyDetails,
  intervalDays: 60 | 30 | 15 | 3,
  language: 'en' | 'hinglish' = 'hinglish'
): OmnichannelMessageSet {
  const sumInsuredCr = (policy.sumInsuredINR / 10000000).toFixed(2);
  const formattedPremium = `₹${policy.currentPremiumINR.toLocaleString('en-IN')}`;
  const callback = policy.brokerPhone || '9811000000';
  const client = (policy.clientName || 'Client').trim().slice(0, 20);
  const policyNo = (policy.policyNumber || '').trim().slice(-12);
  const expiry = policy.expiryDate;

  if (language === 'hinglish') {
    switch (intervalDays) {
      case 60:
        return {
          intervalDays: 60,
          language: 'hinglish',
          urgencyLevel: 'info',
          whatsAppMessage: `Namaste ${policy.clientName} ji! 🙏 Capital Brokers se Rajveer bol raha hoon. Aapki commercial fire policy (${policy.policyNumber}) agle 60 din mein renew honi hai (Expiry: ${policy.expiryDate}). Sum Insured: ₹${sumInsuredCr} Cr. Market tariff discounts lock karne ke liye please apna updated plant & stock schedule share kar dijiye.`,
          smsMessage: clampSms(`Capital Brokers: ${client} ji, fire policy ${policyNo} 60 din me expire hogi. Renew schedule verify karne ke liye ${callback} par call karein.`),
          emailSubject: `Advance Renewal Notice: 60 Days to Expiry for ${policy.productName} [${policy.policyNumber}]`,
          emailBody: `Dear ${policy.clientName} Team,\n\nGreetings from Capital Brokers.\n\nThis is an advance notice that your commercial fire insurance policy (${policy.policyNumber}) covering premises at ${policy.riskLocation} is due for statutory annual renewal on ${policy.expiryDate} (in 60 days).\n\nCurrent Policy Sum Insured: ₹${sumInsuredCr} Crores (Reinstatement Value).\n\nTo ensure continuity of coverage and negotiate maximum discretionary loss-cost discounts with ${policy.insurerName}, please provide:\n1. Latest itemized asset schedule for Plant & Machinery.\n2. Average monthly stock declaration.\n3. Updated Fire NOC / DPCC validity copies if recently renewed.\n\nWarm regards,\nCapital Brokers Underwriting Desk`,
        };

      case 30:
        return {
          intervalDays: 30,
          language: 'hinglish',
          urgencyLevel: 'reminder',
          whatsAppMessage: `Important: ${policy.clientName} ji, aapki fire policy (${policy.policyNumber}) ko expire hone mein exactly 30 days bache hain! ⚠️ Bank loan/hypothecation mandate mein delay avoid karne ke liye, humne draft renewal quote ready kar liya hai. Kya hum revised quote slip forward karein?`,
          smsMessage: clampSms(`Capital Brokers: Urgent reminder, ${client} fire policy ${policyNo} expires in 30 days. No-claim bonus lock karne ke liye call ${callback}.`),
          emailSubject: `Action Required: 30-Day Policy Renewal Notice for ${policy.clientName} [${policy.policyNumber}]`,
          emailBody: `Dear ${policy.clientName} Team,\n\nYour commercial property insurance policy (${policy.policyNumber}) expires on ${policy.expiryDate} (30 days remaining).\n\nUnder IRDAI Bharat Laghu/Sookshma Udyam Suraksha rules, timely renewal guarantees your in-built covers (Additions 15%, Temp Stock Removal 10%, Startup Expenses ₹5L) and claims-free discounts.\n\nPlease approve the renewal terms attached so we can bind coverage with ${policy.insurerName} before the bank mandate cutoff.\n\nWarm regards,\nCapital Brokers`,
        };

      case 15:
        return {
          intervalDays: 15,
          language: 'hinglish',
          urgencyLevel: 'warning',
          whatsAppMessage: `⚠️ Critical Alert: ${policy.clientName} ji, sir 15 din bache hain policy expiry mein! Agar renewal break ho gaya toh risk inspection dobara karwani padegi aur bank penal interest charge karega. Payment link and mandate renewal slip yahan se access karein: https://qoutely.capitalbrokers.in/quotes/${policy.id}`,
          smsMessage: clampSms(`Alert: ${client} policy ${policyNo} expires in 15 days on ${expiry}. Call ${callback} to avoid inspection break.`),
          emailSubject: `URGENT: 15 Days Until Expiry — Bharat Laghu Udyam Suraksha Policy [${policy.policyNumber}]`,
          emailBody: `Dear ${policy.clientName} Leadership,\n\nWe urgently remind you that only 15 days remain before your commercial fire insurance policy (${policy.policyNumber}) expires on ${policy.expiryDate}.\n\nRisk of coverage gap:\n- Any loss during a lapse is 100% unrecoverable.\n- Break-in policy requires fresh engineering surveyor re-inspection and forfeits loyalty tariff concessions.\n\nPlease remit premium payment of ${formattedPremium} via NEFT/RTGS to ${policy.insurerName} to secure instantaneous cover-note release.\n\nWarm regards,\nCapital Brokers`,
        };

      case 3:
      default:
        return {
          intervalDays: 3,
          language: 'hinglish',
          urgencyLevel: 'critical',
          whatsAppMessage: `🚨 FINAL STATUTORY EXPIRY NOTICE: Namaste ${policy.clientName} ji, aapki fire policy (${policy.policyNumber}) agle 72 ghanton mein (sirf 3 din bache hain! Expiry: ${policy.expiryDate}) lapse ho jayegi! Plant, machine aur raw materials ka total ₹${sumInsuredCr} Cr cover discontinue ho jayega. Please urgent premium transfer confirm karein!`,
          smsMessage: clampSms(`FINAL NOTICE: ${client} policy ${policyNo} expires in 72 hours! Immediate payment required to avoid zero coverage: ${callback}.`),
          emailSubject: `FINAL STATUTORY EXPIRY NOTICE: 72 Hours to Lapse — ${policy.clientName} [${policy.policyNumber}]`,
          emailBody: `URGENT / STATUTORY NOTICE:\n\nPolicy Number: ${policy.policyNumber}\nInsured: ${policy.clientName}\nExpiry Date: ${policy.expiryDate} (In 72 Hours)\nSum Insured: ₹${sumInsuredCr} Crores\n\nUnless premium is credited into ${policy.insurerName}'s account before midnight on ${policy.expiryDate}, all fire, flood, earthquake, and STFI protections will cease immediately.\n\nCapital Brokers is on standby to issue the valid IRDAI cover-note upon receipt of UTR reference.\n\nSincerely,\nExecutive Desk, Capital Brokers`,
        };
    }
  }

  // Pure English Templates
  switch (intervalDays) {
    case 60:
      return {
        intervalDays: 60,
        language: 'en',
        urgencyLevel: 'info',
        whatsAppMessage: `Hello ${policy.clientName}. Capital Brokers wishes to inform you that your fire policy (${policy.policyNumber}) for ₹${sumInsuredCr} Cr expires in 60 days on ${policy.expiryDate}. Please share your updated asset schedules to review tariff discounts.`,
        smsMessage: clampSms(`Capital Brokers: ${client}, policy ${policyNo} expires in 60 days on ${expiry}. Contact underwriting desk at ${callback}.`),
        emailSubject: `Advance 60-Day Policy Renewal Notice: ${policy.policyNumber} — ${policy.clientName}`,
        emailBody: `Dear ${policy.clientName},\n\nYour commercial property policy ${policy.policyNumber} with ${policy.insurerName} is scheduled for renewal on ${policy.expiryDate}.\n\nPlease provide your updated asset declarations to ensure complete coverage.\n\nCapital Brokers`,
      };
    case 30:
      return {
        intervalDays: 30,
        language: 'en',
        urgencyLevel: 'reminder',
        whatsAppMessage: `Reminder: ${policy.clientName}, 30 days remain before policy (${policy.policyNumber}) expires on ${policy.expiryDate}. Our team has prepared your customized renewal slip with full in-built protections.`,
        smsMessage: clampSms(`Reminder: Policy ${policyNo} for ${client} expires in 30 days on ${expiry}. Contact Capital Brokers at ${callback}.`),
        emailSubject: `30-Day Renewal Reminder for ${policy.clientName} [${policy.policyNumber}]`,
        emailBody: `Dear ${policy.clientName},\n\nYour policy (${policy.policyNumber}) expires in 30 days. Please review and approve the draft terms.\n\nCapital Brokers`,
      };
    case 15:
      return {
        intervalDays: 15,
        language: 'en',
        urgencyLevel: 'warning',
        whatsAppMessage: `Urgent Notice: Only 15 days remain before your fire insurance (${policy.policyNumber}) expires on ${policy.expiryDate}. Complete renewal to maintain continuous financier hypothecation.`,
        smsMessage: clampSms(`Urgent: ${client} policy ${policyNo} expires in 15 days on ${expiry}. Renew now at ${callback} to avoid lapse.`),
        emailSubject: `URGENT: 15-Day Renewal Notice — ${policy.clientName} [${policy.policyNumber}]`,
        emailBody: `Dear ${policy.clientName},\n\nOnly 15 days remain before your policy expires on ${policy.expiryDate}. Immediate action required.\n\nCapital Brokers`,
      };
    case 3:
    default:
      return {
        intervalDays: 3,
        language: 'en',
        urgencyLevel: 'critical',
        whatsAppMessage: `FINAL NOTICE: ${policy.clientName}, your commercial fire policy (${policy.policyNumber}) expires in 72 hours on ${policy.expiryDate}. Immediate premium deposit is required to prevent risk exposure.`,
        smsMessage: clampSms(`FINAL 72-HOUR NOTICE: Policy ${policyNo} for ${client} lapses on ${expiry}. Call ${callback} for immediate renewal.`),
        emailSubject: `FINAL 72-HOUR NOTICE OF EXPIRY: ${policy.clientName} [${policy.policyNumber}]`,
        emailBody: `FINAL NOTICE:\n\nPolicy ${policy.policyNumber} will lapse in 72 hours. Please arrange immediate premium transfer.\n\nCapital Brokers`,
      };
  }
}

let dbClient: SupabaseClient | null = null;
function getDbClient(): SupabaseClient | null {
  if (dbClient) return dbClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder')) {
    return null;
  }
  dbClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return dbClient;
}

export function getCurrentBillingMonth(date: Date = new Date()): string {
  return date.toISOString().slice(0, 7); // "YYYY-MM"
}

export function getMonthlyQuotaKey(workspaceId: string, date: Date = new Date()): string {
  return `${workspaceId}:${getCurrentBillingMonth(date)}`;
}

// In-memory runtime cache keyed by workspace and billing month
const reminderCounterMap = new Map<string, number>();

export async function getDbWorkspaceReminderUsage(
  workspaceId: string,
  billingMonth: string = getCurrentBillingMonth()
): Promise<number> {
  const client = getDbClient();
  const quotaKey = `${workspaceId}:${billingMonth}`;

  if (!client) {
    return reminderCounterMap.get(quotaKey) || 0;
  }

  try {
    // 1. Try dedicated workspace_reminder_usage table if available
    const { data, error } = await client
      .from('workspace_reminder_usage')
      .select('count')
      .eq('workspace_id', workspaceId)
      .eq('billing_month', billingMonth)
      .maybeSingle();

    if (!error && data && typeof data.count === 'number') {
      reminderCounterMap.set(quotaKey, data.count);
      return data.count;
    }

    // 2. Query persistent audit_logs table (keyed by workspace and billing month)
    const startDate = `${billingMonth}-01T00:00:00.000Z`;
    const [yearStr, monthStr] = billingMonth.split('-');
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const nextMonthDate = new Date(Date.UTC(year, m, 1));
    const endDate = nextMonthDate.toISOString();

    const { count, error: auditErr } = await client
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('action', 'renewal_reminder_dispatched')
      .gte('timestamp', startDate)
      .lt('timestamp', endDate);

    if (!auditErr && count !== null) {
      reminderCounterMap.set(quotaKey, count);
      return count;
    }
  } catch (err) {
    console.warn('[RenewalEngine] Failed to read reminder usage from DB, using memory cache:', err);
  }

  return reminderCounterMap.get(quotaKey) || 0;
}

export async function recordReminderDispatchInDb(
  workspaceId: string,
  user?: any,
  policy?: any,
  newCount?: number
): Promise<void> {
  const client = getDbClient();
  const month = getCurrentBillingMonth();
  const quotaKey = `${workspaceId}:${month}`;

  if (typeof newCount === 'number') {
    reminderCounterMap.set(quotaKey, newCount);
  }

  if (!client) {
    return;
  }

  try {
    const userId =
      (typeof user === 'object' ? user?.id : null) || '10000000-0000-0000-0000-000000000004';

    // 1. Record immutable audit log entry in PostgreSQL (atomic append)
    const { error: auditErr } = await client.from('audit_logs').insert({
      workspace_id: workspaceId,
      user_id: userId,
      action: 'renewal_reminder_dispatched',
      resource_type: 'reminder',
      resource_id: policy?.policyNumber || `${workspaceId}-${month}-${Date.now()}`,
      details: {
        billing_month: month,
        policy_number: policy?.policyNumber,
        client_name: policy?.clientName,
        channel: 'omnichannel',
      },
      timestamp: new Date().toISOString(),
    });
    if (auditErr) {
      console.warn('[RenewalEngine] Failed to insert audit log entry:', auditErr);
    }

    // 2. Upsert into workspace_reminder_usage if table exists
    if (typeof newCount === 'number') {
      const { error: upsertErr } = await client.from('workspace_reminder_usage').upsert(
        {
          workspace_id: workspaceId,
          billing_month: month,
          count: newCount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id,billing_month' }
      );
      if (upsertErr) {
        console.warn('[RenewalEngine] Failed to upsert workspace_reminder_usage:', upsertErr);
      }
    }
  } catch (err) {
    console.warn('[RenewalEngine] Failed to persist reminder usage to DB:', err);
  }
}

export async function atomicIncrementReminderUsage(
  workspaceId: string,
  billingMonth: string = getCurrentBillingMonth(),
  maxLimit: number = Infinity
): Promise<{ allowed: boolean; newCount: number }> {
  const client = getDbClient();
  const quotaKey = `${workspaceId}:${billingMonth}`;

  const handleFallback = () => {
    const fallbackCount = reminderCounterMap.get(quotaKey) || 0;
    if (Number.isFinite(maxLimit) && fallbackCount >= maxLimit) {
      return { allowed: false, newCount: fallbackCount };
    }
    const next = fallbackCount + 1;
    reminderCounterMap.set(quotaKey, next);
    return { allowed: true, newCount: next };
  };

  if (!client) {
    return handleFallback();
  }

  try {
    // 1. Ensure initial row exists for this workspace & billing month
    const { error: seedErr } = await client.from('workspace_reminder_usage').upsert(
      {
        workspace_id: workspaceId,
        billing_month: billingMonth,
        count: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'workspace_id,billing_month', ignoreDuplicates: true }
    );
    if (seedErr) {
      console.warn('[RenewalEngine] Note on ensuring usage row:', seedErr);
    }

    const MAX_RETRIES = 3;
    let currentCount: number | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // 2. Fetch current count if not refreshed from previous attempt
      if (currentCount === null) {
        const { data: row, error: fetchErr } = await client
          .from('workspace_reminder_usage')
          .select('count')
          .eq('workspace_id', workspaceId)
          .eq('billing_month', billingMonth)
          .maybeSingle();

        if (fetchErr) {
          console.warn('[RenewalEngine] Error fetching current reminder usage, using fallback:', fetchErr);
          return handleFallback();
        }

        currentCount = row?.count ?? 0;
      }

      // Fast-path denial if currentCount already reaches or exceeds maxLimit
      if (Number.isFinite(maxLimit) && currentCount >= maxLimit) {
        reminderCounterMap.set(quotaKey, currentCount);
        return { allowed: false, newCount: currentCount };
      }

      // 3. Atomically increment only when quota permits
      let updateQuery = client
        .from('workspace_reminder_usage')
        .update({
          count: currentCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('workspace_id', workspaceId)
        .eq('billing_month', billingMonth)
        .eq('count', currentCount);

      if (Number.isFinite(maxLimit)) {
        updateQuery = updateQuery.lt('count', maxLimit);
      }

      const { data: updatedRows, error: updateErr } = await updateQuery.select('count');

      // Database error during update -> handle via fallback
      if (updateErr) {
        console.warn('[RenewalEngine] Atomic increment update error, using fallback:', updateErr);
        return handleFallback();
      }

      // Successful update returning updated row
      if (updatedRows && updatedRows.length > 0) {
        const newCount = updatedRows[0].count;
        reminderCounterMap.set(quotaKey, newCount);
        return { allowed: true, newCount };
      }

      // Zero-row match (successful conditional update that matched 0 rows)
      // Read fresh count from database
      const freshCount = await getDbWorkspaceReminderUsage(workspaceId, billingMonth);
      reminderCounterMap.set(quotaKey, freshCount);

      // Deny only when the fresh count is at or above maxLimit
      if (Number.isFinite(maxLimit) && freshCount >= maxLimit) {
        return { allowed: false, newCount: freshCount };
      }

      // Bounded retry with refreshed count
      currentCount = freshCount;
    }

    // Keep denial for a successful conditional update that returns no rows after bounded limit
    const finalCount = reminderCounterMap.get(quotaKey) ?? (await getDbWorkspaceReminderUsage(workspaceId, billingMonth));
    return { allowed: false, newCount: finalCount };
  } catch (err) {
    console.warn('[RenewalEngine] atomicIncrementReminderUsage exception, using memory fallback:', err);
    return handleFallback();
  }
}

export interface ReminderQuotaStatus {
  allowed: boolean;
  tier: SubscriptionTier;
  planName: string;
  currentCount: number;
  maxLimit: number;
  isUnlimited: boolean;
  isVipBypass: boolean;
  message: string;
}

/**
 * Enforces Tier Quota for automated reminders
 * Starter: 500 max
 * Pro: 3,000 max
 * Enterprise / Dinesh Uncle: Unlimited
 */
export function verifyAndIncrementReminderQuota(
  workspaceId: string,
  userOrCount: number,
  workspaceTierOrUser?: any,
  options?: { isTierOnly?: boolean; currentCount?: number; dryRun?: boolean; policy?: any }
): ReminderQuotaStatus;
export function verifyAndIncrementReminderQuota(
  workspaceId: string,
  userOrCount?: any,
  workspaceTierOrUser?: any,
  options?: { isTierOnly?: boolean; currentCount?: number; dryRun?: boolean; policy?: any }
): Promise<ReminderQuotaStatus> | ReminderQuotaStatus;
export function verifyAndIncrementReminderQuota(
  workspaceId: string,
  userOrCount?: any,
  workspaceTierOrUser?: any,
  options?: { isTierOnly?: boolean; currentCount?: number; dryRun?: boolean; policy?: any }
): Promise<ReminderQuotaStatus> | ReminderQuotaStatus {
  // Explicit tier-only evaluation mode: selected explicitly via options.isTierOnly or testing signature where userOrCount is a count
  const isTierOnly = options?.isTierOnly === true || typeof userOrCount === 'number';
  if (isTierOnly) {
    const tier = (['starter', 'pro', 'professional', 'enterprise'].includes(workspaceId)
      ? (workspaceId === 'pro' ? 'professional' : workspaceId)
      : (workspaceTierOrUser || 'professional')) as SubscriptionTier;
    const currentCount =
      typeof options?.currentCount === 'number'
        ? options.currentCount
        : typeof userOrCount === 'number'
        ? userOrCount
        : 0;
    const user =
      typeof workspaceTierOrUser === 'string' &&
      (workspaceTierOrUser.includes('@') || workspaceTierOrUser.includes('-'))
        ? workspaceTierOrUser
        : typeof userOrCount === 'object'
        ? userOrCount
        : undefined;
    const isVip =
      isDineshUncle(user) || (typeof workspaceTierOrUser === 'string' && isDineshUncle(workspaceTierOrUser));
    const planLimits = getEffectivePlanLimits(tier, user || workspaceTierOrUser);

    if (isVip || planLimits.unlimitedQuota) {
      return {
        allowed: true,
        tier: 'enterprise',
        planName: isVip ? 'Enterprise VIP (Dinesh Uncle Lock)' : 'Enterprise Tier',
        currentCount: options?.dryRun ? currentCount : currentCount + 1,
        maxLimit: Infinity,
        isUnlimited: true,
        isVipBypass: true,
        message: 'Unlimited automated reminders authorized under VIP Enterprise override.',
      };
    }

    if (currentCount >= planLimits.maxReminders) {
      return {
        allowed: false,
        tier: planLimits.tier,
        planName: planLimits.planName,
        currentCount,
        maxLimit: planLimits.maxReminders,
        isUnlimited: false,
        isVipBypass: false,
        message: `Automated reminder monthly quota exceeded (${currentCount}/${planLimits.maxReminders}). Upgrade tier.`,
      };
    }

    return {
      allowed: true,
      tier: planLimits.tier,
      planName: planLimits.planName,
      currentCount: options?.dryRun ? currentCount : currentCount + 1,
      maxLimit: planLimits.maxReminders,
      isUnlimited: false,
      isVipBypass: false,
      message: `Reminder recorded (${options?.dryRun ? currentCount : currentCount + 1}/${planLimits.maxReminders}).`,
    };
  }

  // Runtime signature: verifyAndIncrementReminderQuota(workspaceId, user, workspaceTier)
  return (async (): Promise<ReminderQuotaStatus> => {
    const user = userOrCount;
    const workspaceTier = (workspaceTierOrUser || 'professional') as SubscriptionTier;
    const month = getCurrentBillingMonth();
    const quotaKey = getMonthlyQuotaKey(workspaceId);

    const isVip = isDineshUncle(user);
    const planLimits = getEffectivePlanLimits(user, workspaceTier);

    if (isVip || planLimits.unlimitedQuota) {
      let count = reminderCounterMap.get(quotaKey) || 0;
      if (!options?.dryRun) {
        const incResult = await atomicIncrementReminderUsage(workspaceId, month, Infinity);
        count = incResult.newCount;
        await recordReminderDispatchInDb(workspaceId, user, options?.policy);
      } else {
        count = await getDbWorkspaceReminderUsage(workspaceId, month);
      }

      return {
        allowed: true,
        tier: 'enterprise',
        planName: isVip ? 'Enterprise VIP (Dinesh Uncle Lock)' : 'Enterprise Tier',
        currentCount: count,
        maxLimit: Infinity,
        isUnlimited: true,
        isVipBypass: true,
        message: 'Unlimited automated reminders authorized under VIP Enterprise override.',
      };
    }

    if (options?.dryRun) {
      const current = await getDbWorkspaceReminderUsage(workspaceId, month);
      if (current >= planLimits.maxReminders) {
        return {
          allowed: false,
          tier: planLimits.tier,
          planName: planLimits.planName,
          currentCount: current,
          maxLimit: planLimits.maxReminders,
          isUnlimited: false,
          isVipBypass: false,
          message: `Automated reminder monthly quota exceeded (${current}/${planLimits.maxReminders}). Upgrade to Professional or Enterprise tier to unlock additional reminder volume.`,
        };
      }
      return {
        allowed: true,
        tier: planLimits.tier,
        planName: planLimits.planName,
        currentCount: current,
        maxLimit: planLimits.maxReminders,
        isUnlimited: false,
        isVipBypass: false,
        message: `Reminder recorded (${current}/${planLimits.maxReminders}).`,
      };
    }

    // Atomically increment with database check: increment only when count < maxLimit, treating no returned row as denial
    const incResult = await atomicIncrementReminderUsage(workspaceId, month, planLimits.maxReminders);

    if (!incResult.allowed) {
      return {
        allowed: false,
        tier: planLimits.tier,
        planName: planLimits.planName,
        currentCount: incResult.newCount,
        maxLimit: planLimits.maxReminders,
        isUnlimited: false,
        isVipBypass: false,
        message: `Automated reminder monthly quota exceeded (${incResult.newCount}/${planLimits.maxReminders}). Upgrade to Professional or Enterprise tier to unlock additional reminder volume.`,
      };
    }

    await recordReminderDispatchInDb(workspaceId, user, options?.policy);

    return {
      allowed: true,
      tier: planLimits.tier,
      planName: planLimits.planName,
      currentCount: incResult.newCount,
      maxLimit: planLimits.maxReminders,
      isUnlimited: false,
      isVipBypass: false,
      message: `Reminder recorded (${incResult.newCount}/${planLimits.maxReminders}).`,
    };
  })();
}

export function checkReminderQuota(
  workspaceId: string,
  userOrCount: number,
  workspaceTierOrUser?: any
): ReminderQuotaStatus;
export function checkReminderQuota(
  workspaceId: string,
  user?: any,
  workspaceTier?: SubscriptionTier
): Promise<ReminderQuotaStatus> | ReminderQuotaStatus;
export function checkReminderQuota(
  workspaceId: string,
  user?: any,
  workspaceTier: SubscriptionTier = 'professional'
): Promise<ReminderQuotaStatus> | ReminderQuotaStatus {
  return verifyAndIncrementReminderQuota(workspaceId, user, workspaceTier, { dryRun: true });
}

export async function getWorkspaceReminderUsage(workspaceId: string): Promise<number> {
  return await getDbWorkspaceReminderUsage(workspaceId);
}

/**
 * Universal Omnichannel Renewal Notice Generator
 * Provides WhatsApp, SMS (160-char compliant), and Email messages in English & Hinglish
 */
export function generateOmnichannelRenewalNotice(params: {
  clientName: string;
  firmName?: string;
  policyNumber: string;
  expiryDate: string;
  stage: 60 | 30 | 15 | 3 | number;
  sumInsuredINR: number;
  estimatedRenewalPremiumINR?: number;
  brokerName?: string;
  brokerFirm?: string;
  brokerPhone?: string;
}) {
  const interval = (
    params.stage === 60 || params.stage === 30 || params.stage === 15 || params.stage === 3
      ? params.stage
      : 3
  ) as 60 | 30 | 15 | 3;

  const policy: RenewalPolicyDetails = {
    id: params.policyNumber,
    policyNumber: params.policyNumber,
    clientName: params.clientName,
    brokerPhone: params.brokerPhone,
    insurerName: 'Partner Insurer',
    productName: 'Commercial Fire Policy',
    expiryDate: params.expiryDate,
    sumInsuredINR: params.sumInsuredINR,
    currentPremiumINR: params.estimatedRenewalPremiumINR || 0,
    riskLocation: params.firmName || 'Delhi NCR Premises',
  };

  const hinglish = generateRenewalNotice(policy, interval, 'hinglish');
  const english = generateRenewalNotice(policy, interval, 'en');

  return {
    whatsappHinglish: hinglish.whatsAppMessage,
    smsHinglish: hinglish.smsMessage,
    emailHinglish: hinglish.emailBody,
    whatsappEnglish: english.whatsAppMessage,
    smsEnglish: english.smsMessage,
    emailEnglish: english.emailBody,
    stage: interval,
  };
}
