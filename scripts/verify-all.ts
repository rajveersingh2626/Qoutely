/**
 * Comprehensive Mechanical Verification Suite for Qoutely Production Hardening
 * Validates all criteria from System Directive:
 * 1. Dinesh Uncle Enterprise Tier & VIP lock (zero invalidation)
 * 2. Super Admin Whitelist & Mock Purge
 * 3. Dual Gemini API Failover Circuit
 * 4. BLUS/BSUS Underwriting Engine (Routing, 15% waiver, In-builts, Broker PI)
 * 5. Omnichannel Hinglish/English Reminders & Quotas
 * 6. Algorithmic Explainability (MeitY AI Governance)
 */

import './bootstrap-env';
import {
  isDineshUncle,
  getEffectivePlanLimits,
  isWhitelistedSuperAdmin,
  TIER_DEFINITIONS,
} from '../src/lib/subscription';
import {
  routeCommercialFireProduct,
  evaluateBlusUnderinsurance,
  calculateInBuiltCovers,
  verifyValuationIntegrity,
  trackBrokerPiCompliance,
} from '../src/lib/underwriting-engine';
import {
  calculateCommercialPremium,
  OCCUPANCIES,
} from '../src/lib/calculator';
import {
  generateOmnichannelRenewalNotice,
  verifyAndIncrementReminderQuota,
} from '../src/lib/renewal-engine';
import {
  getGeminiApiKey,
  markPrimaryRateLimited,
} from '../src/lib/gemini-proxy';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('\n======================================================');
console.log('--- 1. AUTH & DINESH UNCLE ENTERPRISE VIP LOCK ---');
console.log('======================================================');

// Test Dinesh detection across all identifiers
assert(isDineshUncle('dinesh@capitalbrokers.in'), 'Identifies Dinesh by capitalbrokers.in email');
assert(isDineshUncle('dinesh.gupta@example.com'), 'Identifies Dinesh by legacy email');
assert(isDineshUncle('664e9b3c-1f0b-4fcb-ae7f-1fbb156bbc3f'), 'Identifies Dinesh by Supabase Auth UUID');
assert(isDineshUncle('10000000-0000-0000-0000-000000000002'), 'Identifies Dinesh by Mock UUID');
assert(isDineshUncle('dinesh uncle'), 'Identifies Dinesh by nickname');
assert(!isDineshUncle('other_broker@capitalbrokers.in'), 'Rejects normal user as Dinesh');

// Test Dinesh plan limits hardcoded lock
const dineshLimits = getEffectivePlanLimits('starter', 'dinesh@capitalbrokers.in');
assert(dineshLimits.tier === 'enterprise', 'Dinesh forced into enterprise tier regardless of DB subscription');
assert(dineshLimits.unlimited_quota === true, 'Dinesh has unlimited_quota = true');
assert(dineshLimits.rate_limit_bypass === true, 'Dinesh has rate_limit_bypass = true');
assert(dineshLimits.is_vip === true, 'Dinesh has is_vip = true');
assert(dineshLimits.max_reminders_per_month > 100000, 'Dinesh has unlimited reminder allowance');

// Test standard tier limits
const starterLimits = getEffectivePlanLimits('starter', 'standard_user@agency.com');
assert(starterLimits.tier === 'starter', 'Standard user retains starter tier');
assert(starterLimits.max_reminders_per_month === 500, 'Starter tier capped at 500 reminders');
assert(starterLimits.rate_limit_bypass === false, 'Starter tier does not bypass rate limit');

const proLimits = getEffectivePlanLimits('pro', 'standard_user@agency.com');
assert(proLimits.tier === 'professional', 'Pro user gets professional tier');
assert(proLimits.max_reminders_per_month === 3000, 'Pro tier capped at 3,000 reminders');

console.log('\n======================================================');
console.log('--- 2. SUPER ADMIN WHITELIST RBAC ---');
console.log('======================================================');

process.env.SUPER_ADMIN_IDS = 'admin-uuid-1,dinesh@capitalbrokers.in,superadmin@qoutely.com';
assert(isWhitelistedSuperAdmin('admin-uuid-1'), 'Whitelisted UUID 1 authorized');
assert(isWhitelistedSuperAdmin('dinesh@capitalbrokers.in'), 'Whitelisted Dinesh email authorized');
assert(isWhitelistedSuperAdmin('superadmin@qoutely.com'), 'Whitelisted Super Admin authorized');
assert(!isWhitelistedSuperAdmin('rogue_user@gmail.com'), 'Unauthorized identity rejected');

console.log('\n======================================================');
console.log('--- 3. DUAL GEMINI API FAILOVER GATEWAY ---');
console.log('======================================================');

const initialKey = getGeminiApiKey();
assert(initialKey.tier === 'primary_free', 'Default API key dispatched to primary free tier');
assert(initialKey.key.startsWith('AQ.Ab8RN6JqxEu7'), 'Primary key matches GEMINI_API_KEY_PRIMARY');

// Simulate HTTP 429 quota exhaustion
markPrimaryRateLimited();
const fallbackKey = getGeminiApiKey();
assert(fallbackKey.tier === 'fallback_paid', 'After 429, circuit switches seamlessly to fallback paid tier');
assert(fallbackKey.key.startsWith('AQ.Ab8RN6Kv5eiM'), 'Fallback key matches GEMINI_API_KEY_FALLBACK');

console.log('\n======================================================');
console.log('--- 4. MODERN UNDERWRITING (BSUS / BLUS / SFSP) ---');
console.log('======================================================');

// 4.1 Routing Thresholds
const bsusRoute = routeCommercialFireProduct(45000000); // ₹4.5 Crore
assert(bsusRoute.product === 'BSUS', 'Total Sum Insured <= ₹5 Cr routes to BSUS');
assert(bsusRoute.minimumExcessINR === 5000, 'BSUS enforces statutory claim excess of ₹5,000');

const blusRoute = routeCommercialFireProduct(150000000); // ₹15 Crore
assert(blusRoute.product === 'BLUS', 'Total Sum Insured > ₹5 Cr and <= ₹50 Cr routes to BLUS');
assert(blusRoute.excessRatePercent === 5, 'BLUS enforces 5% claim excess');
assert(blusRoute.minimumExcessINR === 10000, 'BLUS enforces minimum claim excess of ₹10,000');

const megaRoute = routeCommercialFireProduct(600000000); // ₹60 Crore
assert(megaRoute.product === 'MEGA_RISK_SFSP', 'Total Sum Insured > ₹50 Cr routes to Mega-Risk Fire / SFSP');

// 4.2 BLUS 15% Underinsurance Waiver Engine
// Scenario A: Underinsured by 10% (Within 15% waiver limit)
const waiverApplied = evaluateBlusUnderinsurance(90000000, 100000000, 2000000);
assert(waiverApplied.waiverTriggered === true, '10% underinsurance triggers BLUS 15% waiver');
assert(waiverApplied.admissibleClaimINR === 2000000, 'Full loss paid without condition of average penalty');

// Scenario B: Underinsured by 30% (Exceeds 15% waiver limit)
const waiverRejected = evaluateBlusUnderinsurance(70000000, 100000000, 2000000);
assert(waiverRejected.waiverTriggered === false, '30% underinsurance rejects waiver');
assert(waiverRejected.underinsurancePercentage === 30, 'Underinsurance percentage calculated at 30%');
assert(waiverRejected.admissibleClaimINR === 1400000, 'Proportionate penalty applied (70% paid)');

// 4.3 Mandatory In-Built Covers
const inBuilt = calculateInBuiltCovers({
  building: 100000000,
  plant_machinery: 0,
  furniture_fixtures: 0,
  stocks: 100000000,
  others: 0,
  total: 200000000,
});
assert(inBuilt.additionsAlterationsINR === 15000000, 'In-built Additions/Alterations = 15% of Sum Insured');
assert(inBuilt.temporaryRemovalStocksINR === 10000000, 'In-built Temporary Removal of Stocks = 10%');
assert(inBuilt.startUpExpensesINR === 500000, 'In-built Start-Up Expenses = ₹5,00,000 cap');
assert(inBuilt.professionalFeesINR === 10000000, 'In-built Professional Fees = 5%');
assert(inBuilt.debrisRemovalINR === 4000000, 'In-built Debris Removal = 2%');

// 4.4 Valuation Integrity
const validValuation = verifyValuationIntegrity({
  buildingReinstatementValue: 50000000,
  plinthAndFoundationsIncluded: true,
  plantMachineryReinstatementValue: 30000000,
  rawMaterialLandedCost: 10000000,
  wipInputCost: 5000000,
  finishedGoodsContractPrice: 10000000,
});
assert(validValuation.isValid === true, 'Valuation with reinstatement, plinth inclusion & landed cost is valid');

const invalidValuation = verifyValuationIntegrity({
  buildingReinstatementValue: 50000000,
  plinthAndFoundationsIncluded: false, // Arbitrary exclusion!
  plantMachineryReinstatementValue: 30000000,
  rawMaterialLandedCost: 10000000,
  wipInputCost: 5000000,
  finishedGoodsContractPrice: 10000000,
});
assert(invalidValuation.isValid === false, 'Arbitrary exclusion of plinth and foundations is prohibited');

// 4.5 Broker Professional Indemnity Compliance Tracker
const piAlert60 = trackBrokerPiCompliance('2026-12-04T00:00:00Z', new Date('2026-10-05T00:00:00Z'));
assert(piAlert60.daysRemaining === 60, 'PI days remaining correctly computed as 60');
assert(piAlert60.alertTriggered === true, '60-day PI alert triggered');
assert(piAlert60.alertTier === '60_DAY_WARNING', 'Correct 60-day warning tier generated');

console.log('\n======================================================');
console.log('--- 5. OMNICHANNEL RENEWAL ENGINE (HINGLISH & ENGLISH) ---');
console.log('======================================================');

const notice3Days = generateOmnichannelRenewalNotice({
  clientName: 'Rajesh Mehra',
  firmName: 'Mehra Plastics Pvt Ltd',
  policyNumber: 'BLUS-2025-0981',
  expiryDate: '08-Oct-2026',
  stage: 3,
  sumInsuredINR: 85000000,
  estimatedRenewalPremiumINR: 94500,
  brokerName: 'Dinesh Gupta',
  brokerFirm: 'Capital Insurance Brokers',
  brokerPhone: '+91 98110 12345',
});

// Check WhatsApp Hinglish template
assert(notice3Days.whatsappHinglish.includes('Namaste Rajesh Mehra ji'), 'WhatsApp greeting in polite Hinglish');
assert(notice3Days.whatsappHinglish.includes('sirf 3 din bache hain'), 'WhatsApp 3-day urgency phrased in business Hinglish');
assert(notice3Days.whatsappHinglish.includes('BLUS-2025-0981'), 'WhatsApp mentions exact policy number');

// Check SMS (160 character boundary)
assert(notice3Days.smsHinglish.length <= 160, `SMS Hinglish within 160 chars (length: ${notice3Days.smsHinglish.length})`);
assert(notice3Days.smsEnglish.length <= 160, `SMS English within 160 chars (length: ${notice3Days.smsEnglish.length})`);

// Check Quota enforcement
const starterQuotaCheck = verifyAndIncrementReminderQuota('starter', 500, 'regular_user');
assert(starterQuotaCheck.allowed === false, 'Starter tier blocks dispatch at 500 reminder cap');

const dineshQuotaCheck = verifyAndIncrementReminderQuota('starter', 500, 'dinesh@capitalbrokers.in');
assert(dineshQuotaCheck.allowed === true, 'Dinesh bypasses quota caps unconditionally');

console.log('\n======================================================');
console.log('--- 6. ALGORITHMIC EXPLAINABILITY (MeitY AI Standards) ---');
console.log('======================================================');

const sampleOccupancy = OCCUPANCIES[0];
const calcResult = calculateCommercialPremium({
  occupancy_code: sampleOccupancy.code,
  sum_insured: {
    building: 50000000,
    plant_machinery: 40000000,
    furniture_fixtures: 10000000,
    stocks: 20000000,
    others: 0,
    total: 120000000, // ₹12 Crore (BLUS)
  },
  stfi_opted: true,
  eq_opted: true,
  terrorism_opted: true,
  eq_zone: 'Zone 4',
  discretionary_discount_percent: 10,
});

assert(calcResult.algorithmic_explainability !== undefined, 'Calculation includes algorithmic_explainability');
assert(
  calcResult.algorithmic_explainability?.governance_standard ===
    'MeitY India AI Governance / IRDAI Tariff De-notification 2001',
  'MeitY India AI Governance standard cited'
);
assert(
  Boolean(calcResult.algorithmic_explainability?.applied_rules.length! >= 5),
  'All contributing variables and statutory rules itemized'
);
assert(
  Boolean(calcResult.claim_excess?.includes('5%')),
  'Claim excess properly bound to BLUS framework'
);

console.log('\n======================================================');
console.log('🎉 ALL PRODUCTION HARDENING GATES PASSED WITH ZERO ERRORS');
console.log('======================================================\n');
