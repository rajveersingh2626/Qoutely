/**
 * Pure Deterministic Marine Cargo & Logistics Underwriting Engine
 *
 * Implements:
 * 1. Inland Transit (ITC A/B/C) Rating:
 *    - Commodity Hazard Classes 1-4: Class 1 = 0.06‰, Class 2 = 0.12‰, Class 3 = 0.25‰, Class 4 = 0.55‰.
 *    - Clause Multipliers: ITC (A) = 1.0, ITC (B) = 0.80, ITC (C) = 0.60.
 *    - Carrier Certification: Certified common carrier = 1.0, Uncertified common carrier = 1.25 (+25% surcharge).
 *    - Statutory Minimum Premium: ₹1,000.
 *    - Policy Excess: 0.5% of consignment value subject to minimum ₹2,500.
 * 2. Ocean / International Cargo (ICC A/B/C) & Incoterms:
 *    - Incoterms Shippable Markups:
 *      * CIF: 110% of Invoice (10% Imaginary Profit markup).
 *      * FOB / CFR: Invoice + 10% freight + 2% port charges, then 110%.
 *      * EXW: Invoice + 5% inland freight + 10% ocean freight, then 110%.
 *    - Base ICC Rates: ICC (A) All Risks = 0.35‰, ICC (B) = 0.26‰, ICC (C) = 0.18‰.
 *    - Customs Duty Insurance Cover: Rated at 50% of the ocean base rate on Duty Sum Insured (when opted, default 30% of CIF).
 *    - Institute War & Strikes (Cargo): Gazetted rate 0.05‰ on total cargo Sum Insured (when opted).
 *    - Statutory Minimum Premium: ₹1,000.
 * 3. Marine Open Policy (MOP) & ATPO Drawdown:
 *    - Section 64VB of Insurance Act, 1938 enforcement: Blocks declaration if Cash Deposit (CD) balance < premium to debit, emitting CD_BALANCE_EXHAUSTED.
 *    - Proactive warning if balance < ₹10,000: LOW_CD_BALANCE_WARNING.
 *    - Cumulative utilized sum insured and debited balance tracking.
 * 4. Dual-tier Function Architecture:
 *    - Canonical functions: calculateMarineInlandTransit, calculateMarineOceanCargo, processMopDeclaration, validateMarineStudioProposal.
 *    - Standard contract functions: calculateMarineInlandQuote, calculateMarineOceanQuote, calculateMarineQuote returning StandardQuoteBreakdown with 18% GST rounding and algorithmic explainability vector.
 *
 * Zero external network calls. Zero LLM arithmetic. 100% deterministic pure TypeScript.
 */

import {
  LOBCategory,
  InsuranceLine,
  StandardQuoteBreakdown,
  AlgorithmicExplainabilityStep,
} from '@/types/database';

// ============================================================================
// 1. CONSTANTS & TARIFF BENCHMARKS
// ============================================================================

export const COMMODITY_HAZARD_RATES: Record<1 | 2 | 3 | 4, number> = {
  1: 0.06, // Non-hazardous (steel, coal, textiles, grains, non-fragile machinery)
  2: 0.12, // Moderate hazard (FMCG, consumer electronics, auto parts, paper rolls)
  3: 0.25, // Fragile / Perishable (glassware, chilled foods, bulk liquids, ceramics)
  4: 0.55, // High risk / Hazardous (chemicals, paints, hazardous batteries, pharma cold-chain)
};

export const ITC_CLAUSE_MULTIPLIERS = {
  ITC_A: 1.0,  // All Risks
  ITC_B: 0.80, // Named Perils
  ITC_C: 0.60, // Fire & Collision only
} as const;

export const ICC_OCEAN_BASE_RATES = {
  ICC_A: 0.35, // All Risks (0.35‰)
  ICC_B: 0.26, // Named Perils + water damage (0.26‰)
  ICC_C: 0.18, // Major Perils (stranding, sinking, burning, collision) (0.18‰)
} as const;

export const WAR_AND_STRIKES_RATE_PER_MILLE = 0.05; // 0.05‰ on total cargo SI
export const STATUTORY_MINIMUM_PREMIUM = 1000;      // Statutory floor ₹1,000
export const STATUTORY_MINIMUM_EXCESS = 2500;       // Statutory floor ₹2,500
export const STATUTORY_EXCESS_PERCENT = 0.005;      // 0.5%
export const STATUTORY_GST_RATE = 18;               // 18% GST

// ============================================================================
// 2. TYPES & INTERFACES
// ============================================================================

export type MarineItcClause = 'ITC_A' | 'ITC_B' | 'ITC_C';
export type OceanIccClause = 'ICC_A' | 'ICC_B' | 'ICC_C';
export type OceanIncoterm = 'CIF' | 'FOB' | 'CFR' | 'EXW';
export type MarineCommodityHazard = 1 | 2 | 3 | 4;

export interface MarineInlandInput {
  invoice_value: number;
  transit_clause: MarineItcClause;
  commodity_hazard_class: MarineCommodityHazard;
  is_certified_common_carrier: boolean;
}

export interface MarineInlandResult {
  base_rate_per_mille: number;
  net_marine_premium: number;
  policy_excess: number;
  deductible_clause: string;
}

export interface MarineOceanInput {
  invoice_value_inr: number;
  incoterm: OceanIncoterm;
  icc_clause: OceanIccClause;
  ocean_freight_inr?: number;
  port_charges_inr?: number;
  customs_duty_opted?: boolean;
  customs_duty_rate_percent?: number;
  war_and_strikes_opted?: boolean;
}

export interface MarineOceanResult {
  cargo_sum_insured: number;
  duty_sum_insured: number;
  total_sum_insured: number;
  cargo_premium: number;
  duty_premium: number;
  war_premium: number;
  net_marine_premium: number;
}

export interface MopAccount {
  policy_number: string;
  deposit_premium_balance: number;
  total_sum_insured: number;
  utilized_sum_insured: number;
}

export interface MopDrawdownResult {
  updated_account: MopAccount;
  debit_amount: number;
  certificate_issued: boolean;
  warning?: string;
}

export interface MarineStudioInput {
  client_name: string;
  policy_type: 'single_voyage' | 'open_policy' | 'atpo';
  origin: string;
  destination: string;
  commodity: string;
  consignment_value: number;
  clause: MarineItcClause | OceanIccClause;
}

export interface MarineStudioValidationResult {
  is_valid: boolean;
  declaration_ready: boolean;
  error?: string;
}

export interface MarineInlandQuoteInput extends MarineInlandInput {
  client_name?: string;
  origin?: string;
  destination?: string;
  commodity_description?: string;
  carrier_name?: string;
  consignment_note_no?: string;
}

export interface MarineOceanQuoteInput extends MarineOceanInput {
  client_name?: string;
  origin?: string;
  destination?: string;
  commodity_description?: string;
  carrier_name?: string;
  vessel_name?: string;
  bill_of_lading_no?: string;
}

export interface UnifiedMarineInput {
  transit_type: 'inland' | 'ocean';
  inland_input?: MarineInlandQuoteInput;
  ocean_input?: MarineOceanQuoteInput;
}

export interface MarineDeclarationItem {
  invoice_no: string;
  consignment_value: number;
  rate_per_mille?: number;
}

export interface BatchMopResult {
  initial_account: MopAccount;
  final_account: MopAccount;
  total_declarations: number;
  successful_declarations: number;
  failed_declarations: number;
  total_premium_debited: number;
  total_utilized_si_added: number;
  declaration_results: Array<{
    invoice_no: string;
    consignment_value: number;
    debit_amount: number;
    success: boolean;
    warning?: string;
  }>;
  overall_status: 'HEALTHY' | 'LOW_CD_BALANCE_WARNING' | 'CD_BALANCE_EXHAUSTED';
  overall_warning?: string;
}

// ============================================================================
// 3. CANONICAL UNDERWRITING FUNCTIONS (100% PARITY WITH TEST HARNESS)
// ============================================================================

/**
 * Pure deterministic inland transit calculation.
 * Matches canonical_engines.ts:calculateMarineInlandTransit
 */
export function calculateMarineInlandTransit(input: MarineInlandInput): MarineInlandResult {
  if (input.invoice_value <= 0) {
    throw new Error('Invoice value must be greater than zero');
  }

  const baseRate = COMMODITY_HAZARD_RATES[input.commodity_hazard_class];
  const clauseMultiplier = ITC_CLAUSE_MULTIPLIERS[input.transit_clause];
  const carrierMultiplier = input.is_certified_common_carrier ? 1.0 : 1.25;

  const ratePerMille = baseRate * clauseMultiplier * carrierMultiplier;
  const rawPremium = (input.invoice_value * ratePerMille) / 1000;
  const netPremium = Math.max(STATUTORY_MINIMUM_PREMIUM, Math.round(rawPremium));

  // Excess: 0.5% of value, minimum ₹2,500
  const excess = Math.max(STATUTORY_MINIMUM_EXCESS, Math.round(input.invoice_value * STATUTORY_EXCESS_PERCENT));

  return {
    base_rate_per_mille: ratePerMille,
    net_marine_premium: netPremium,
    policy_excess: excess,
    deductible_clause: '0.5% of consignment value subject to minimum of ₹2,500 each and every loss',
  };
}

/**
 * Pure deterministic ocean cargo & Incoterms calculation.
 * Matches canonical_engines.ts:calculateMarineOceanCargo
 */
export function calculateMarineOceanCargo(input: MarineOceanInput): MarineOceanResult {
  if (input.invoice_value_inr <= 0) {
    throw new Error('Invoice value must be greater than zero');
  }

  let baseShippableValue = input.invoice_value_inr;
  if (input.incoterm === 'FOB' || input.incoterm === 'CFR') {
    const freight = input.ocean_freight_inr || (input.invoice_value_inr * 0.10);
    const port = input.port_charges_inr || (input.invoice_value_inr * 0.02);
    baseShippableValue = input.invoice_value_inr + freight + port;
  } else if (input.incoterm === 'EXW') {
    const inland = input.invoice_value_inr * 0.05;
    const freight = input.ocean_freight_inr || (input.invoice_value_inr * 0.10);
    baseShippableValue = input.invoice_value_inr + inland + freight;
  }

  // 10% Imaginary Profit Markup
  const cargoSi = Math.round(baseShippableValue * 1.10);

  let dutySi = 0;
  if (input.customs_duty_opted) {
    const dutyRate = (input.customs_duty_rate_percent ?? 30) / 100;
    dutySi = Math.round(cargoSi * dutyRate);
  }

  const baseRate = ICC_OCEAN_BASE_RATES[input.icc_clause];
  const cargoPremium = Math.round((cargoSi * baseRate) / 1000);

  // Duty rate is 50% of ocean base rate
  const dutyPremium = dutySi > 0 ? Math.round((dutySi * (baseRate * 0.50)) / 1000) : 0;

  // Institute War & Strikes Clauses: 0.05‰ on total cargo SI
  let warPremium = 0;
  if (input.war_and_strikes_opted) {
    warPremium = Math.round((cargoSi * WAR_AND_STRIKES_RATE_PER_MILLE) / 1000);
  }

  const netPremium = Math.max(STATUTORY_MINIMUM_PREMIUM, cargoPremium + dutyPremium + warPremium);

  return {
    cargo_sum_insured: cargoSi,
    duty_sum_insured: dutySi,
    total_sum_insured: cargoSi + dutySi,
    cargo_premium: cargoPremium,
    duty_premium: dutyPremium,
    war_premium: warPremium,
    net_marine_premium: netPremium,
  };
}

/**
 * Pure deterministic Marine Open Policy (MOP) Cash Deposit (CD) Drawdown accounting.
 * Enforces Section 64VB of the Insurance Act, 1938.
 * Matches canonical_engines.ts:processMopDeclaration
 */
export function processMopDeclaration(
  account: MopAccount,
  consignment_value: number,
  rate_per_mille: number
): MopDrawdownResult {
  const premiumToDebit = Math.round((consignment_value * rate_per_mille) / 1000);

  if (account.deposit_premium_balance < premiumToDebit) {
    return {
      updated_account: account,
      debit_amount: 0,
      certificate_issued: false,
      warning: `CD_BALANCE_EXHAUSTED: Balance of ₹${account.deposit_premium_balance} is insufficient for debit ₹${premiumToDebit}. Top-up required under Sec 64VB.`,
    };
  }

  const updated: MopAccount = {
    ...account,
    deposit_premium_balance: account.deposit_premium_balance - premiumToDebit,
    utilized_sum_insured: account.utilized_sum_insured + consignment_value,
  };

  let warning: string | undefined;
  if (updated.deposit_premium_balance < 10000) {
    warning = 'LOW_CD_BALANCE_WARNING: Remaining balance is less than ₹10,000.';
  }

  return {
    updated_account: updated,
    debit_amount: premiumToDebit,
    certificate_issued: true,
    warning,
  };
}

/**
 * Validates marine proposal for studio workflow.
 * Matches canonical_engines.ts:validateMarineStudioProposal
 */
export function validateMarineStudioProposal(input: MarineStudioInput): MarineStudioValidationResult {
  if (!input.client_name) {
    return { is_valid: false, declaration_ready: false, error: 'Client name is required' };
  }
  if (!input.origin || !input.destination) {
    return { is_valid: false, declaration_ready: false, error: 'Origin and Destination required' };
  }
  if (input.consignment_value <= 0) {
    return { is_valid: false, declaration_ready: false, error: 'Consignment value must be positive' };
  }
  return { is_valid: true, declaration_ready: true };
}

// ============================================================================
// 4. STANDARD CONTRACT ADAPTERS (STANDARD QUOTE BREAKDOWN WITH 18% GST)
// ============================================================================

/**
 * Computes complete StandardQuoteBreakdown for Inland Transit with 18% GST and full explainability vector.
 */
export function calculateMarineInlandQuote(input: MarineInlandQuoteInput): StandardQuoteBreakdown {
  const res = calculateMarineInlandTransit(input);
  const netPremium = res.net_marine_premium;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const statutoryClauses = [
    'Section 64VB of the Insurance Act, 1938: No risk is assumed until premium has been received in advance or debited from an active Cash Deposit (CD) account.',
    'Carriage by Road Act, 2007: Consignor must lodge written monetary loss notice on the road transport carrier within the statutory limit of 180 days.',
    'Inland Transit (Rail/Road) Clauses (A): Comprehensive All Risks transit protection subject to non-delivery and accidental overturn warranties.',
    `Policy Excess: ${res.deductible_clause}.`,
  ];
  if (!input.is_certified_common_carrier) {
    statutoryClauses.push(
      'Carrier Warranty: Consignment carried via Uncertified Carrier. A 25% underwriting surcharge has been loaded per tariff guidelines.'
    );
  }

  const lineBreakdown: Record<string, any> = {
    transit_type: 'inland',
    transit_clause: input.transit_clause,
    commodity_hazard_class: input.commodity_hazard_class,
    is_certified_common_carrier: input.is_certified_common_carrier,
    invoice_value: input.invoice_value,
    base_rate_per_mille: res.base_rate_per_mille,
    net_marine_premium: netPremium,
    policy_excess: res.policy_excess,
    deductible_clause: res.deductible_clause,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    origin: input.origin,
    destination: input.destination,
    commodity_description: input.commodity_description,
    carrier_name: input.carrier_name,
  };

  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Consignment Valuation',
      description: `Inland commercial invoice value declared for single transit`,
      value: `Invoice Value = ₹${input.invoice_value.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: Commodity Hazard & Clause Rating',
      description: `Hazard Class ${input.commodity_hazard_class} base rate ${COMMODITY_HAZARD_RATES[input.commodity_hazard_class]}‰ scaled by ${input.transit_clause} multiplier (${ITC_CLAUSE_MULTIPLIERS[input.transit_clause]}x) and carrier factor (${input.is_certified_common_carrier ? '1.0x Certified' : '1.25x Uncertified'})`,
      value: `Base Rate = ${res.base_rate_per_mille}‰`,
    },
    {
      step: 'Step 3: Raw Transit Premium Computation',
      description: `(Consignment Value ₹${input.invoice_value.toLocaleString('en-IN')} × ${res.base_rate_per_mille}‰) / 1000`,
      value: `Raw Premium = ₹${((input.invoice_value * res.base_rate_per_mille) / 1000).toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 4: Statutory Minimum Premium Floor',
      description: `Enforces statutory minimum premium clamp of ₹${STATUTORY_MINIMUM_PREMIUM.toLocaleString('en-IN')}`,
      value: `Net Premium = ₹${netPremium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 5: Policy Excess / Deductible Floor',
      description: `0.5% of consignment value (₹${Math.round(input.invoice_value * STATUTORY_EXCESS_PERCENT).toLocaleString('en-IN')}) subject to statutory floor of ₹${STATUTORY_MINIMUM_EXCESS.toLocaleString('en-IN')}`,
      value: `Deductible Excess = ₹${res.policy_excess.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 6: Statutory GST & Total Payable',
      description: `Net Premium ₹${netPremium.toLocaleString('en-IN')} + 18% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Premium = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'marine',
    insurance_line: 'marine_cargo_inland',
    sum_insured: input.invoice_value,
    base_rate_per_mille: res.base_rate_per_mille,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: statutoryClauses,
    line_specific_breakdown: lineBreakdown,
    algorithmic_explainability: algorithmicExplainability,
  };
}

/**
 * Computes complete StandardQuoteBreakdown for Ocean Cargo with 18% GST and full explainability vector.
 */
export function calculateMarineOceanQuote(input: MarineOceanQuoteInput): StandardQuoteBreakdown {
  const res = calculateMarineOceanCargo(input);
  const netPremium = res.net_marine_premium;
  const gstAmount = Math.round(netPremium * (STATUTORY_GST_RATE / 100));
  const totalPremium = netPremium + gstAmount;

  const statutoryClauses = [
    'Section 64VB of the Insurance Act, 1938: Advance premium remittance mandatory prior to risk inception.',
    `Institute Cargo Clauses (${input.icc_clause}): Maritime cargo cover subject to Institute Warranties and Cargo Termination of Transit Clause.`,
    'Incoterm Insurable Interest Warranty: Policy valid only if insurable interest adheres to the stated Incoterm at the time of loss.',
  ];

  if (input.customs_duty_opted) {
    statutoryClauses.push(
      'Customs Duty Insurance Endorsement: Operates on indemnity basis against loss of customs duty paid or payable on landed goods.'
    );
  }
  if (input.war_and_strikes_opted) {
    statutoryClauses.push(
      'Institute War & Strikes Clauses (Cargo): Endorsement active at gazetted rate of 0.05‰.'
    );
  }

  const lineBreakdown: Record<string, any> = {
    transit_type: 'ocean',
    incoterm: input.incoterm,
    icc_clause: input.icc_clause,
    invoice_value_inr: input.invoice_value_inr,
    cargo_sum_insured: res.cargo_sum_insured,
    duty_sum_insured: res.duty_sum_insured,
    total_sum_insured: res.total_sum_insured,
    cargo_premium: res.cargo_premium,
    duty_premium: res.duty_premium,
    war_premium: res.war_premium,
    net_marine_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    customs_duty_opted: input.customs_duty_opted,
    customs_duty_rate_percent: input.customs_duty_rate_percent,
    war_and_strikes_opted: input.war_and_strikes_opted,
    origin: input.origin,
    destination: input.destination,
    commodity_description: input.commodity_description,
    carrier_name: input.carrier_name,
    vessel_name: input.vessel_name,
  };

  const baseRate = ICC_OCEAN_BASE_RATES[input.icc_clause];
  const algorithmicExplainability: AlgorithmicExplainabilityStep[] = [
    {
      step: 'Step 1: Incoterm Shippable Valuation',
      description: `Invoice INR ₹${input.invoice_value_inr.toLocaleString('en-IN')} adjusted for ${input.incoterm} terms plus 10% statutory imaginary profit markup`,
      value: `Cargo SI = ₹${res.cargo_sum_insured.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 2: Base Ocean Peril Rating',
      description: `${input.icc_clause} tariff rate of ${baseRate}‰ applied to Cargo SI ₹${res.cargo_sum_insured.toLocaleString('en-IN')}`,
      value: `Cargo Premium = ₹${res.cargo_premium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 3: Ancillary Marine Endorsements',
      description: `Customs Duty (${input.customs_duty_opted ? `${input.customs_duty_rate_percent ?? 30}% of CIF @ 50% rate = ₹${res.duty_premium.toLocaleString('en-IN')}` : 'Not Opted'}) + War & Strikes (${input.war_and_strikes_opted ? `0.05‰ on Cargo SI = ₹${res.war_premium.toLocaleString('en-IN')}` : 'Not Opted'})`,
      value: `Endorsements Total = ₹${(res.duty_premium + res.war_premium).toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 4: Net Ocean Cargo Premium Floor',
      description: `Sum of Cargo, Duty, and War premiums subject to statutory floor of ₹${STATUTORY_MINIMUM_PREMIUM.toLocaleString('en-IN')}`,
      value: `Net Ocean Premium = ₹${netPremium.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 5: Total Insurable Exposure',
      description: `Cargo Sum Insured (₹${res.cargo_sum_insured.toLocaleString('en-IN')}) + Duty Sum Insured (₹${res.duty_sum_insured.toLocaleString('en-IN')})`,
      value: `Total SI = ₹${res.total_sum_insured.toLocaleString('en-IN')}`,
    },
    {
      step: 'Step 6: Statutory GST & Total Payable',
      description: `Net Ocean Premium ₹${netPremium.toLocaleString('en-IN')} + 18% GST (₹${gstAmount.toLocaleString('en-IN')})`,
      value: `Total Premium = ₹${totalPremium.toLocaleString('en-IN')}`,
    },
  ];

  return {
    lob_category: 'marine',
    insurance_line: 'marine_cargo_ocean',
    sum_insured: res.total_sum_insured,
    base_rate_per_mille: baseRate,
    net_premium: netPremium,
    gst_rate_percent: STATUTORY_GST_RATE,
    gst_amount: gstAmount,
    total_premium: totalPremium,
    statutory_clauses: statutoryClauses,
    line_specific_breakdown: lineBreakdown,
    algorithmic_explainability: algorithmicExplainability,
  };
}

/**
 * Unified marine quote calculation entrypoint for polymorphic dispatch.
 */
export function calculateMarineQuote(input: UnifiedMarineInput): StandardQuoteBreakdown {
  if (input.transit_type === 'inland') {
    if (!input.inland_input) {
      throw new Error('Inland transit input parameters are required when transit_type is inland');
    }
    return calculateMarineInlandQuote(input.inland_input);
  }

  if (input.transit_type === 'ocean') {
    if (!input.ocean_input) {
      throw new Error('Ocean cargo input parameters are required when transit_type is ocean');
    }
    return calculateMarineOceanQuote(input.ocean_input);
  }

  throw new Error(`Unsupported marine transit type: ${String(input.transit_type)}`);
}

/**
 * Batch processes an array of marine declaration items against an active MOP Cash Deposit account.
 */
export function processBatchDeclarations(
  account: MopAccount,
  declarations: MarineDeclarationItem[]
): BatchMopResult {
  let currentAccount = { ...account };
  let successful = 0;
  let failed = 0;
  let totalDebited = 0;
  let totalSiAdded = 0;
  const results: BatchMopResult['declaration_results'] = [];

  for (const item of declarations) {
    const rate = item.rate_per_mille ?? 0.12; // default Class 2 ITC A rate if omitted
    const drawdown = processMopDeclaration(currentAccount, item.consignment_value, rate);

    if (drawdown.certificate_issued) {
      successful++;
      totalDebited += drawdown.debit_amount;
      totalSiAdded += item.consignment_value;
      currentAccount = drawdown.updated_account;
      results.push({
        invoice_no: item.invoice_no,
        consignment_value: item.consignment_value,
        debit_amount: drawdown.debit_amount,
        success: true,
        warning: drawdown.warning,
      });
    } else {
      failed++;
      results.push({
        invoice_no: item.invoice_no,
        consignment_value: item.consignment_value,
        debit_amount: 0,
        success: false,
        warning: drawdown.warning,
      });
    }
  }

  let overallStatus: BatchMopResult['overall_status'] = 'HEALTHY';
  let overallWarning: string | undefined;

  if (failed > 0) {
    overallStatus = 'CD_BALANCE_EXHAUSTED';
    overallWarning = `Sec 64VB Block: ${failed} declaration(s) could not be debited due to insufficient CD balance. Top-up required immediately.`;
  } else if (currentAccount.deposit_premium_balance < 10000) {
    overallStatus = 'LOW_CD_BALANCE_WARNING';
    overallWarning = `LOW_CD_BALANCE_WARNING: Remaining CD balance is ₹${currentAccount.deposit_premium_balance.toLocaleString('en-IN')} (< ₹10,000 threshold).`;
  }

  return {
    initial_account: account,
    final_account: currentAccount,
    total_declarations: declarations.length,
    successful_declarations: successful,
    failed_declarations: failed,
    total_premium_debited: totalDebited,
    total_utilized_si_added: totalSiAdded,
    declaration_results: results,
    overall_status: overallStatus,
    overall_warning: overallWarning,
  };
}
