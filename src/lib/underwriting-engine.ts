/**
 * Modern IRDAI Commercial Fire Underwriting Engine
 *
 * Implements:
 * 1. Post-tariffing dynamic risk routing (BSUS <= ₹5 Cr, BLUS > ₹5 Cr to ₹50 Cr, Mega-Risk > ₹50 Cr).
 * 2. Standard claim excess rules:
 *    - BSUS: Flat ₹5,000 excess per claim.
 *    - BLUS: 5% excess per claim (minimum ₹10,000).
 * 3. BLUS 15% Underinsurance Waiver Engine (Condition of Average vs. Statutory Waiver).
 * 4. Automated in-built cover calculations (Additions 15%, Temp Removal 10%, Startup ₹5L, Fees 5%, Debris 2%).
 * 5. Asset valuation integrity rules (Reinstatement on physical assets, Plinth inclusion, Landed Cost/Input Cost for stocks).
 * 6. Carrier master directory & Broker Professional Indemnity (PI) 90/60/30-day compliance tracker.
 */

import { SumInsuredBreakdown } from '@/types/database';

export type ProductBinding = 'BSUS' | 'BLUS' | 'MEGA_RISK_SFSP';

export interface ProductRoutingResult {
  product: ProductBinding;
  productName: string;
  regulatoryFramework: string;
  totalSumInsured: number;
  claimExcessClause: string;
  excessRatePercent?: number;
  minimumExcessINR: number;
  isMegaRisk: boolean;
  canWaiveUnderinsurance: boolean;
}

/**
 * Dynamic Risk Threshold Routing as mandated by IRDAI:
 * Total Value at Risk <= ₹5 Cr: Bharat Sookshma Udyam Suraksha (BSUS)
 * Total Value at Risk > ₹5 Cr and <= ₹50 Cr: Bharat Laghu Udyam Suraksha (BLUS)
 * Total Value at Risk > ₹50 Cr: Escalate to Mega-Risk Fire Framework
 */
export function routeCommercialFireProduct(totalSumInsured: number): ProductRoutingResult {
  const CRORE = 10000000;

  if (totalSumInsured <= 5 * CRORE) {
    return {
      product: 'BSUS',
      productName: 'Bharat Sookshma Udyam Suraksha (BSUS)',
      regulatoryFramework: 'IRDAI Sookshma Commercial Fire Framework (Max ₹5 Cr)',
      totalSumInsured,
      claimExcessClause: 'Standard statutory deductible: ₹5,000 per claim across all covered perils.',
      minimumExcessINR: 5000,
      isMegaRisk: false,
      canWaiveUnderinsurance: false, // BSUS policies do not apply condition of average under standard terms
    };
  }

  if (totalSumInsured <= 50 * CRORE) {
    return {
      product: 'BLUS',
      productName: 'Bharat Laghu Udyam Suraksha (BLUS)',
      regulatoryFramework: 'IRDAI Laghu Commercial Fire Framework (>₹5 Cr up to ₹50 Cr)',
      totalSumInsured,
      claimExcessClause: '5% of claim amount subject to minimum ₹10,000 per occurrence.',
      excessRatePercent: 5,
      minimumExcessINR: 10000,
      isMegaRisk: false,
      canWaiveUnderinsurance: true, // Eligible for 15% statutory waiver
    };
  }

  return {
    product: 'MEGA_RISK_SFSP',
    productName: 'Standard Fire & Special Perils (Mega-Risk Framework)',
    regulatoryFramework: 'IRDAI Large Industrial Risk / Tariff Advisory De-notification Framework (>₹50 Cr)',
    totalSumInsured,
    claimExcessClause: 'Underwriter negotiable excess (standard 5% or minimum ₹25,000 - ₹1,00,000).',
    excessRatePercent: 5,
    minimumExcessINR: 25000,
    isMegaRisk: true,
    canWaiveUnderinsurance: false,
  };
}

export interface UnderinsuranceEvaluation {
  declaredSumInsured: number;
  actualValueAtRisk: number;
  lossAmount: number;
  underinsurancePercent: number;
  underinsurancePercentage: number;
  waiverTriggered: boolean;
  conditionOfAverageApplied: boolean;
  payableLoss: number;
  admissibleClaimINR: number;
  deductiblePenalty: number;
  netPayableBeforePolicyExcess: number;
  advisoryText: string;
  advisorySeverity: 'success' | 'warning' | 'danger';
}

/**
 * BLUS 15% Underinsurance Waiver Engine:
 * If loss value / shortfall falls within 15% of declared sum insured, statutory waiver triggers:
 * Full claim payable without condition of average.
 * If underinsurance exceeds 15%, proportionate penalty is computed and advisory generated.
 */
export function evaluateBlusUnderinsurance(
  paramsOrDeclared:
    | {
        declaredSumInsured: number;
        actualValueAtRisk: number;
        lossAmount: number;
      }
    | number,
  actualValueAtRiskArg?: number,
  lossAmountArg?: number
): UnderinsuranceEvaluation {
  let declaredSumInsured = 0;
  let actualValueAtRisk = 0;
  let lossAmount = 0;

  if (typeof paramsOrDeclared === 'object' && paramsOrDeclared !== null) {
    declaredSumInsured = paramsOrDeclared.declaredSumInsured;
    actualValueAtRisk = paramsOrDeclared.actualValueAtRisk;
    lossAmount = paramsOrDeclared.lossAmount;
  } else {
    declaredSumInsured = paramsOrDeclared;
    actualValueAtRisk = actualValueAtRiskArg || 0;
    lossAmount = lossAmountArg || 0;
  }

  if (actualValueAtRisk <= 0 || lossAmount <= 0) {
    return {
      declaredSumInsured,
      actualValueAtRisk,
      lossAmount,
      underinsurancePercent: 0,
      underinsurancePercentage: 0,
      waiverTriggered: true,
      conditionOfAverageApplied: false,
      payableLoss: lossAmount,
      admissibleClaimINR: lossAmount,
      deductiblePenalty: 0,
      netPayableBeforePolicyExcess: lossAmount,
      advisoryText: 'Declared sum insured meets or exceeds estimated value at risk.',
      advisorySeverity: 'success',
    };
  }

  // Shortfall ratio
  const ratio = Math.min(1, declaredSumInsured / actualValueAtRisk);
  const underinsurancePercent = Number(((1 - ratio) * 100).toFixed(2));

  // 15% Statutory Waiver Rule
  if (underinsurancePercent <= 15) {
    return {
      declaredSumInsured,
      actualValueAtRisk,
      lossAmount,
      underinsurancePercent,
      underinsurancePercentage: underinsurancePercent,
      waiverTriggered: true,
      conditionOfAverageApplied: false,
      payableLoss: lossAmount,
      admissibleClaimINR: lossAmount,
      deductiblePenalty: 0,
      netPayableBeforePolicyExcess: lossAmount,
      advisoryText: `Statutory 15% Underinsurance Waiver applied. Shortfall is ${underinsurancePercent}% (<=15%). Claim payable in full without condition of average penalty.`,
      advisorySeverity: 'success',
    };
  }

  // Exceeds 15% -> Condition of Average is enforced proportionately
  const payableLoss = Math.round(lossAmount * ratio);
  const deductiblePenalty = lossAmount - payableLoss;

  return {
    declaredSumInsured,
    actualValueAtRisk,
    lossAmount,
    underinsurancePercent,
    underinsurancePercentage: underinsurancePercent,
    waiverTriggered: false,
    conditionOfAverageApplied: true,
    payableLoss,
    admissibleClaimINR: payableLoss,
    deductiblePenalty,
    netPayableBeforePolicyExcess: payableLoss,
    advisoryText: `CRITICAL UNDERINSURANCE WARNING: Underinsurance of ${underinsurancePercent}% exceeds the statutory 15% waiver ceiling. Condition of average enforced: Proportionate claim penalty of ₹${deductiblePenalty.toLocaleString(
      'en-IN'
    )}. Broker must advise client to immediately endorse sum insured.`,
    advisorySeverity: 'danger',
  };
}

export interface InBuiltCoversResult {
  additionsAlterationsINR: number; // 15% of Sum Insured (excluding stocks)
  temporaryRemovalOfStocksINR: number; // Up to 10% of stock SI
  temporaryRemovalStocksINR: number;
  startUpExpensesINR: number; // Up to ₹5 Lakhs
  professionalFeesINR: number; // Up to 5% of claim / SI
  debrisRemovalINR: number; // Up to 2% of claim / SI
  specificContentsINR: number; // 1% of Total SI
  totalInBuiltProtectionValueINR: number;
}

/**
 * Mandatory BLUS In-Built Cover Automation
 */
export function calculateInBuiltCovers(
  breakdownOrTotal: SumInsuredBreakdown | number
): InBuiltCoversResult {
  let nonStockSI = 0;
  let stockSI = 0;
  let totalSI = 0;

  if (typeof breakdownOrTotal === 'number') {
    totalSI = breakdownOrTotal;
    nonStockSI = breakdownOrTotal;
    stockSI = 0;
  } else if (breakdownOrTotal && typeof breakdownOrTotal === 'object') {
    nonStockSI =
      (breakdownOrTotal.building || 0) +
      (breakdownOrTotal.plant_machinery || 0) +
      (breakdownOrTotal.furniture_fixtures || 0) +
      (breakdownOrTotal.others || 0);

    stockSI = breakdownOrTotal.stocks || 0;
    totalSI = nonStockSI + stockSI;

    if (totalSI === 0 && (breakdownOrTotal as any).total) {
      totalSI = (breakdownOrTotal as any).total;
      nonStockSI = totalSI;
      stockSI = 0;
    }
  }

  const additionsAlterationsINR = Math.round(nonStockSI * 0.15);
  const temporaryRemovalOfStocksINR = Math.round(stockSI * 0.10);
  const startUpExpensesINR = Math.min(500000, Math.round(totalSI * 0.02)); // Capped at ₹5 Lakhs
  const professionalFeesINR = Math.round(totalSI * 0.05);
  const debrisRemovalINR = Math.round(totalSI * 0.02);
  const specificContentsINR = Math.round(totalSI * 0.01);

  const totalInBuiltProtectionValueINR =
    additionsAlterationsINR +
    temporaryRemovalOfStocksINR +
    startUpExpensesINR +
    professionalFeesINR +
    debrisRemovalINR +
    specificContentsINR;

  return {
    additionsAlterationsINR,
    temporaryRemovalOfStocksINR,
    temporaryRemovalStocksINR: temporaryRemovalOfStocksINR,
    startUpExpensesINR,
    professionalFeesINR,
    debrisRemovalINR,
    specificContentsINR,
    totalInBuiltProtectionValueINR,
  };
}

export interface ValuationIntegrityCheck {
  isValid: boolean;
  violations: string[];
  remediationSteps: string[];
}

/**
 * Asset Valuation Integrity Rules
 * 1. Reinstatement value required on physical buildings and machinery.
 * 2. Plinth and foundations must remain included in building valuation (arbitrary exclusions prohibited).
 * 3. Stocks must follow: Landed cost for raw materials, Input cost for WIP, Contract/Manufacturing price for finished goods.
 */
export function verifyValuationIntegrity(params: {
  isBuildingReinstatement?: boolean;
  isMachineryReinstatement?: boolean;
  isPlinthAndFoundationsIncluded?: boolean;
  stockValuationBasis?: 'landed_and_input_cost' | 'market_selling_price' | 'arbitrary';
  buildingReinstatementValue?: number;
  plinthAndFoundationsIncluded?: boolean;
  plantMachineryReinstatementValue?: number;
  rawMaterialLandedCost?: number;
  wipInputCost?: number;
  finishedGoodsContractPrice?: number;
}): ValuationIntegrityCheck {
  const violations: string[] = [];
  const remediationSteps: string[] = [];

  const isBuildingReinstatement =
    params.isBuildingReinstatement ??
    (params.buildingReinstatementValue !== undefined ? params.buildingReinstatementValue > 0 : false);

  const isMachineryReinstatement =
    params.isMachineryReinstatement ??
    (params.plantMachineryReinstatementValue !== undefined ? params.plantMachineryReinstatementValue > 0 : false);

  const isPlinthAndFoundationsIncluded =
    params.isPlinthAndFoundationsIncluded ??
    (params.plinthAndFoundationsIncluded !== undefined ? params.plinthAndFoundationsIncluded : false);

  let stockValuationBasis = params.stockValuationBasis;
  if (!stockValuationBasis) {
    if (
      (params.rawMaterialLandedCost !== undefined && params.rawMaterialLandedCost > 0) ||
      (params.wipInputCost !== undefined && params.wipInputCost > 0) ||
      (params.finishedGoodsContractPrice !== undefined && params.finishedGoodsContractPrice > 0)
    ) {
      stockValuationBasis = 'landed_and_input_cost';
    } else {
      stockValuationBasis = 'arbitrary';
    }
  }

  if (!isBuildingReinstatement) {
    violations.push('Buildings valued on depreciated/book value instead of Reinstatement Value.');
    remediationSteps.push('Switch building asset schedule to Reinstatement Value (Cost of rebuilding like-for-like).');
  }

  if (!isMachineryReinstatement) {
    violations.push('Plant & Machinery valued on depreciated basis instead of Reinstatement Value.');
    remediationSteps.push('Switch Plant & Machinery schedule to Reinstatement Value.');
  }

  if (!isPlinthAndFoundationsIncluded) {
    violations.push('Arbitrary exclusion of Plinths and Foundations detected.');
    remediationSteps.push('Include plinth and foundation costs in total building sum insured as per IRDAI fire norms.');
  }

  if (stockValuationBasis !== 'landed_and_input_cost') {
    violations.push('Stocks not valued on Landed Cost (Raw Materials) / Input Cost (WIP) / Contract Price (Finished Goods).');
    remediationSteps.push('Recompute stocks according to Landed Cost for raw materials and verified Input Cost for WIP.');
  }

  return {
    isValid: violations.length === 0,
    violations,
    remediationSteps,
  };
}

export interface PartnerInsurer {
  id: string;
  name: string;
  code: string;
  iibEntityCode: string;
  agencyCode: string;
  underwriterDeskEmail: string;
  underwriterDeskPhone: string;
  branchOffice: string;
  gstNumber: string;
  isDirectBindingPartner: boolean;
}

export const PARTNER_INSURERS: PartnerInsurer[] = [
  {
    id: 'ins-001',
    name: 'The New India Assurance Co. Ltd.',
    code: 'NIA',
    iibEntityCode: 'IIB-NIA-1919-HQ',
    agencyCode: 'AGY-DEL-009214',
    underwriterDeskEmail: 'commercial.delhi@newindia.co.in',
    underwriterDeskPhone: '+91 11 2332 4581',
    branchOffice: 'Connaught Place DO-1, New Delhi',
    gstNumber: '07AAACT1234A1Z1',
    isDirectBindingPartner: true,
  },
  {
    id: 'ins-002',
    name: 'ICICI Lombard General Insurance Co. Ltd.',
    code: 'ICICI-LOMBARD',
    iibEntityCode: 'IIB-ILG-2001-MUM',
    agencyCode: 'CORP-BRK-7782',
    underwriterDeskEmail: 'underwriting.fire@icicilombard.com',
    underwriterDeskPhone: '+91 11 4982 7100',
    branchOffice: 'Barakhamba Road Regional Office, New Delhi',
    gstNumber: '07AAACI7821B1Z9',
    isDirectBindingPartner: true,
  },
  {
    id: 'ins-003',
    name: 'HDFC ERGO General Insurance Co. Ltd.',
    code: 'HDFC-ERGO',
    iibEntityCode: 'IIB-HEG-2002-HQ',
    agencyCode: 'BRK-CAP-99120',
    underwriterDeskEmail: 'brokerdesk.north@hdfcergo.com',
    underwriterDeskPhone: '+91 11 4118 9000',
    branchOffice: 'Nehru Place Corporate Desk, New Delhi',
    gstNumber: '07AAACH6654C1Z3',
    isDirectBindingPartner: true,
  },
  {
    id: 'ins-004',
    name: 'Bajaj Allianz General Insurance Co. Ltd.',
    code: 'BAJAJ-ALLIANZ',
    iibEntityCode: 'IIB-BAG-2001-PUN',
    agencyCode: 'BAGIC-DEL-4412',
    underwriterDeskEmail: 'fire.underwriting@bajajallianz.co.in',
    underwriterDeskPhone: '+91 11 4055 8800',
    branchOffice: 'Janakpuri District Centre, New Delhi',
    gstNumber: '07AAACB9012D1Z7',
    isDirectBindingPartner: true,
  },
  {
    id: 'ins-005',
    name: 'Tata AIG General Insurance Co. Ltd.',
    code: 'TATA-AIG',
    iibEntityCode: 'IIB-TAG-2001-BOM',
    agencyCode: 'TAIG-CB-8831',
    underwriterDeskEmail: 'north.underwriter@tataaig.com',
    underwriterDeskPhone: '+91 11 6650 3000',
    branchOffice: 'Aerocity Hospitality District, New Delhi',
    gstNumber: '07AAACT4412E1Z5',
    isDirectBindingPartner: true,
  },
];

export interface BrokerPiPolicy {
  policyNumber: string;
  insurer: string;
  sumInsuredINR: number;
  effectiveDate: string;
  expiryDate: string;
  irdaLicenseNo: string;
}

export interface PiAlert {
  daysRemaining: number;
  alertLevel: '90_day' | '60_day' | '30_day' | 'critical' | 'compliant';
  title: string;
  description: string;
  actionRequired: string;
}

/**
 * Broker Professional Indemnity (PI) Compliance Tracker
 * Schedules mandatory alert notifications at 90, 60, and 30 days prior to policy expiration.
 */
export function trackBrokerPiCompliance(
  policyOrExpiry: BrokerPiPolicy | string = {
    policyNumber: 'PI-NIA-2026-CB8819',
    insurer: 'The New India Assurance Co. Ltd.',
    sumInsuredINR: 50000000, // ₹5 Cr IRDAI mandatory coverage for registered direct brokers
    effectiveDate: '2025-11-01',
    expiryDate: '2026-10-31',
    irdaLicenseNo: '236',
  },
  referenceDate?: Date | number
): {
  policy: BrokerPiPolicy;
  alert: PiAlert;
  daysRemaining: number;
  alertTriggered: boolean;
  alertTier: string;
  isCompliant: boolean;
} {
  let policy: BrokerPiPolicy;
  if (typeof policyOrExpiry === 'string') {
    policy = {
      policyNumber: 'PI-NIA-2026-CB8819',
      insurer: 'The New India Assurance Co. Ltd.',
      sumInsuredINR: 50000000,
      effectiveDate: '2025-11-01',
      expiryDate: policyOrExpiry,
      irdaLicenseNo: '236',
    };
  } else {
    policy = policyOrExpiry;
  }

  const expiry = new Date(policy.expiryDate).getTime();
  const now = referenceDate ? new Date(referenceDate).getTime() : Date.now();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.max(0, Math.round((expiry - now) / msPerDay));

  let alertLevel: PiAlert['alertLevel'] = 'compliant';
  let alertTier = 'COMPLIANT';
  let title = 'IRDAI Professional Indemnity (E&O) Compliant';
  let description = `Broker Errors & Omissions policy is active with ${policy.insurer}. Expiry in ${daysRemaining} days.`;
  let actionRequired = 'No immediate action required.';

  if (daysRemaining <= 15) {
    alertLevel = 'critical';
    alertTier = 'CRITICAL_IMMOBILIZED';
    title = 'CRITICAL: Broker PI Expiry Imminent';
    description = `IRDAI-mandated Broker E&O policy expires in ${daysRemaining} days. Immediate renewal required to prevent statutory license suspension.`;
    actionRequired = 'Execute renewal endorsement immediately with insurer underwriter desk.';
  } else if (daysRemaining <= 30) {
    alertLevel = '30_day';
    alertTier = '30_DAY_CRITICAL';
    title = 'URGENT: Broker PI Policy Expires in 30 Days';
    description = `Your IRDAI Broker PI policy (${policy.policyNumber}) expires on ${policy.expiryDate} (${daysRemaining} days).`;
    actionRequired = 'Request renewal proposal quote from insurer desk.';
  } else if (daysRemaining <= 60) {
    alertLevel = '60_day';
    alertTier = '60_DAY_WARNING';
    title = 'COMPLIANCE NOTICE: 60-Day Broker PI Renewal Window Open';
    description = `Underwriting license compliance requires PI renewal filing. ${daysRemaining} days remaining.`;
    actionRequired = 'Review firm annual brokerage turnover and prepare proposal form.';
  } else if (daysRemaining <= 90) {
    alertLevel = '90_day';
    alertTier = '90_DAY_NOTICE';
    title = 'STATUTORY TRACKER: 90 Days Until Broker PI Policy Expiration';
    description = `Advance notice for IRDAI license compliance. Policy expires ${policy.expiryDate}.`;
    actionRequired = 'Schedule renewal timeline on operational calendar.';
  }

  const alertTriggered = alertLevel !== 'compliant';

  return {
    policy,
    alert: {
      daysRemaining,
      alertLevel,
      title,
      description,
      actionRequired,
    },
    daysRemaining,
    alertTriggered,
    alertTier,
    isCompliant: expiry > now,
  };
}
