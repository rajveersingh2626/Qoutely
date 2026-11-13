import { jsPDF } from 'jspdf';
import { Workspace } from '@/types/database';
import { formatINRWithDecimals } from '@/lib/calculator';

export interface LiabilityQuoteData {
  quote_number: string;
  client_name: string;
  client_gst: string;
  client_address: string;
  corporate_name?: string;
  annual_turnover: number;
  sub_line: 'cgl' | 'pi' | 'do' | 'cyber' | 'crime' | 'liability_package';

  // CGL section
  cgl_opted?: boolean;
  cgl_aoa_limit?: number;
  cgl_aoy_limit?: number;
  cgl_ratio?: '1:1' | '1:2' | '1:3' | '1:4';
  cgl_territory?: 'india_only' | 'worldwide_ex_usa' | 'worldwide_inc_usa';
  cgl_hazard_category?: 1 | 2 | 3 | 4;
  cgl_net_premium?: number;

  // PI section
  pi_opted?: boolean;
  pi_profession?: 'tech_software' | 'consultants_ca' | 'insurance_broker' | 'medical_doctor';
  pi_annual_fee_income?: number;
  pi_limit_of_indemnity?: number;
  pi_prior_clean_years?: number;
  pi_statutory_minimum_met?: boolean;
  pi_net_premium?: number;

  // D&O section
  do_opted?: boolean;
  do_limit_of_indemnity?: number;
  do_entity_listing_status?: 'private_unlisted' | 'public_listed_india' | 'public_listed_us_adr';
  do_debt_to_equity_ratio?: number;
  do_distress_loading_percent?: number;
  do_side_a_premium?: number;
  do_side_b_premium?: number;
  do_side_c_premium?: number;
  do_net_premium?: number;

  // Cyber section
  cyber_opted?: boolean;
  cyber_limit_of_indemnity?: number;
  cyber_base_premium?: number;
  cyber_score?: number;
  cyber_posture_tier?: 'mature' | 'adequate' | 'deficient' | 'uninsurable';
  cyber_rate_adjustment_percent?: number;
  cyber_can_issue_quote?: boolean;
  cyber_answers?: {
    has_mfa_everywhere: boolean;
    has_edr_endpoints: boolean;
    has_airgapped_backups: boolean;
    has_annual_vapt: boolean;
    has_247_soc: boolean;
    has_employee_training: boolean;
  };
  cyber_net_premium?: number;

  // Commercial Crime section
  crime_opted?: boolean;
  crime_employees_with_funds_access?: number;
  crime_limit_of_liability?: number;
  crime_has_dual_authorization_above_50k?: boolean;
  crime_per_head_premium?: number;
  crime_limit_premium?: number;
  crime_control_adjustment?: number;
  crime_net_premium?: number;

  // Aggregated Calculation
  calculation: {
    sum_insured: number;
    cgl_premium?: number;
    pi_premium?: number;
    do_premium?: number;
    cyber_premium?: number;
    crime_premium?: number;
    net_premium: number;
    gst_amount: number;
    total_premium: number;
  };
}

export function generateLiabilityQuoteSlipPDF(
  quote: LiabilityQuoteData,
  workspace?: Workspace
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Header Accent Bar (Indigo 600: #4F46E5 / rgb: 79, 70, 229)
  doc.setFillColor(79, 70, 229);
  doc.rect(margin, y, contentWidth, 3, 'F');
  y += 7;

  // Broker Credentials Header
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `CIN NO: ${workspace?.default_rules?.cin_no || 'U74999DL2003PTC119576'}   |   CATEGORY: DIRECT BROKERS (GENERAL)`,
    margin,
    y
  );
  y += 4;
  doc.text(
    `IRDA LICENSE NO: ${workspace?.default_rules?.irda_license_no || '236'}   |   L. EXPIRY DATE: 29 DECEMBER 2027`,
    margin,
    y
  );

  const quoteDate = new Date().toLocaleDateString('en-GB');
  doc.text(`DATE: ${quoteDate}`, pageWidth - margin, y, { align: 'right' });
  y += 6;

  // Brokerage Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text((workspace?.name || 'Qoutely Insurance Brokers Pvt. Ltd.').toUpperCase(), margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    workspace?.address || 'Level 8, Express Towers, Nariman Point, Mumbai 400021',
    margin,
    y,
    { maxWidth: contentWidth }
  );
  y += 8;

  // Title Box (Indigo 50 bg / Indigo 900 text)
  doc.setFillColor(238, 242, 255); // Indigo 50
  doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(49, 46, 129); // Indigo 900
  doc.text(
    'CORPORATE LIABILITY & EXECUTIVE PROTECTION QUOTE SLIP (CGL • PI • D&O • CYBER • CRIME)',
    pageWidth / 2,
    y + 5.2,
    { align: 'center' }
  );
  y += 12;

  // Helper row drawer
  const drawRow = (
    label: string,
    value: string,
    xOffset: number,
    valOffset: number,
    fontSize = 7.5
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fontSize);
    doc.setTextColor(71, 85, 105);
    doc.text(label, xOffset, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(value, valOffset, y);
  };

  // Section 1: Insured Client & Corporate Details Box
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'S');

  const halfWidth = contentWidth / 2;
  y += 5;
  drawRow('QUOTE REFERENCE:', quote.quote_number, margin + 4, margin + 42);
  drawRow('CORPORATE ENTITY:', quote.corporate_name || quote.client_name, margin + halfWidth + 4, margin + halfWidth + 38);
  y += 5;
  drawRow('CLIENT GSTIN:', quote.client_gst || '27AAAAA0000A1Z5', margin + 4, margin + 42);
  drawRow('ANNUAL TURNOVER:', `INR ${formatINRWithDecimals(quote.annual_turnover)}`, margin + halfWidth + 4, margin + halfWidth + 38);
  y += 5;
  drawRow('PRIMARY SUB-LINE:', quote.sub_line.replace(/_/g, ' ').toUpperCase(), margin + 4, margin + 42);
  drawRow('TERRITORY JURISDICTION:', (quote.cgl_territory || 'india_only').replace(/_/g, ' ').toUpperCase(), margin + halfWidth + 4, margin + halfWidth + 38);
  y += 9;

  // Section 2: Coverage Schedule & Limits Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text('COVERAGE SPECIFICATIONS & LIMITS SCHEDULE', margin, y);
  y += 3;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 28, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 28, 1.5, 1.5, 'S');

  y += 5;
  const cglLimitText = quote.cgl_aoy_limit ? `AOA INR ${formatINRWithDecimals(quote.cgl_aoa_limit || 0)} / AOY INR ${formatINRWithDecimals(quote.cgl_aoy_limit)} (${quote.cgl_ratio || '1:1'})` : 'Not Opted';
  drawRow('CGL LIMIT OF LIABILITY:', cglLimitText, margin + 4, margin + 48, 7);

  const piLimitText = quote.pi_limit_of_indemnity ? `INR ${formatINRWithDecimals(quote.pi_limit_of_indemnity)} (${(quote.pi_profession || 'tech_software').replace(/_/g, ' ')})` : 'Not Opted';
  drawRow('PI / E&O LIMIT (LOI):', piLimitText, margin + halfWidth + 4, margin + halfWidth + 40, 7);

  y += 5;
  const doLimitText = quote.do_limit_of_indemnity ? `INR ${formatINRWithDecimals(quote.do_limit_of_indemnity)} (${(quote.do_entity_listing_status || 'private').replace(/_/g, ' ')})` : 'Not Opted';
  drawRow('D&O EXECUTIVE LIMIT:', doLimitText, margin + 4, margin + 48, 7);

  const deRatioText = quote.do_debt_to_equity_ratio !== undefined ? `D/E Ratio: ${quote.do_debt_to_equity_ratio.toFixed(2)} (${quote.do_debt_to_equity_ratio > 3.0 ? '+25% Distress Loading' : 'Par'})` : 'N/A';
  drawRow('D&O LEVERAGE PROFILE:', deRatioText, margin + halfWidth + 4, margin + halfWidth + 40, 7);

  y += 5;
  const cyberLimitText = quote.cyber_limit_of_indemnity ? `INR ${formatINRWithDecimals(quote.cyber_limit_of_indemnity)} (Score: ${quote.cyber_score ?? 'N/A'}/100, Tier: ${(quote.cyber_posture_tier || 'N/A').toUpperCase()})` : 'Not Opted';
  drawRow('CYBER LIMIT OF INDEMNITY:', cyberLimitText, margin + 4, margin + 48, 7);

  const crimeLimitText = quote.crime_limit_of_liability ? `INR ${formatINRWithDecimals(quote.crime_limit_of_liability)} (${quote.crime_employees_with_funds_access || 0} Staff, Dual Auth: ${quote.crime_has_dual_authorization_above_50k ? 'YES -15%' : 'NO +25%'})` : 'Not Opted';
  drawRow('COMMERCIAL CRIME LIMIT:', crimeLimitText, margin + halfWidth + 4, margin + halfWidth + 40, 7);

  y += 5;
  const brokerMetText = quote.pi_opted && quote.pi_profession === 'insurance_broker'
    ? (quote.pi_statutory_minimum_met ? 'COMPLIANT WITH IRDAI 2018 (3x Fee or ₹50L)' : 'NON-COMPLIANT: LOI BELOW IRDAI STATUTORY MINIMUM')
    : 'STANDARD CORPORATE COVERAGE';
  drawRow('STATUTORY BROKER CHECK:', brokerMetText, margin + 4, margin + 48, 7);
  drawRow('TOTAL AGGREGATE LIMIT:', `INR ${formatINRWithDecimals(quote.calculation.sum_insured)}`, margin + halfWidth + 4, margin + halfWidth + 40, 7);
  y += 8;

  // Section 3: Cyber Security Posture Disclosure Box (if Cyber opted)
  if (quote.cyber_opted && quote.cyber_answers) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(79, 70, 229);
    doc.text(`CYBER SECURITY CONTROLS ASSESSMENT — SCORE: ${quote.cyber_score ?? 0}/100 [TIER: ${(quote.cyber_posture_tier || 'N/A').toUpperCase()}]`, margin, y);
    y += 2.5;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'S');

    y += 4;
    const ans = quote.cyber_answers;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);

    const c1 = `[${ans.has_mfa_everywhere ? 'X' : ' '}] MFA Everywhere (25)`;
    const c2 = `[${ans.has_edr_endpoints ? 'X' : ' '}] EDR Endpoints (20)`;
    const c3 = `[${ans.has_airgapped_backups ? 'X' : ' '}] Airgapped Backups (20)`;
    const c4 = `[${ans.has_annual_vapt ? 'X' : ' '}] Annual VAPT (15)`;
    const c5 = `[${ans.has_247_soc ? 'X' : ' '}] 24/7 SOC (10)`;
    const c6 = `[${ans.has_employee_training ? 'X' : ' '}] Security Training (10)`;

    doc.text(`${c1}   |   ${c2}   |   ${c3}`, margin + 4, y);
    y += 4.5;
    doc.text(`${c4}   |   ${c5}   |   ${c6}`, margin + 4, y);
    y += 7.5;
  }

  // Section 4: Actuarial & Tariff Premium Computation Ledger Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(79, 70, 229);
  doc.text('ACTUARIAL & TARIFF PREMIUM COMPUTATION LEDGER', margin, y);
  y += 3;

  // Table Header
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('COVERAGE SECTION / COMPONENT', margin + 3, y + 3.8);
  doc.text('STATUTORY UNDERWRITING BASIS / RATE MULTIPLIER', margin + 95, y + 3.8);
  doc.text('PREMIUM (INR)', pageWidth - margin - 3, y + 3.8, { align: 'right' });
  y += 5.5;

  // Build itemized table rows
  interface LedgerRow {
    label: string;
    basis: string;
    amount: number;
  }
  const tableRows: LedgerRow[] = [];

  if (quote.cgl_opted || (quote.calculation.cgl_premium && quote.calculation.cgl_premium > 0)) {
    tableRows.push({
      label: `Commercial General Liability (Cat ${quote.cgl_hazard_category || 1})`,
      basis: `Turnover INR ${formatINRWithDecimals(quote.annual_turnover)} | Ratio ${quote.cgl_ratio || '1:1'} | ${quote.cgl_territory || 'India'}`,
      amount: quote.cgl_net_premium || quote.calculation.cgl_premium || 0,
    });
  }

  if (quote.pi_opted || (quote.calculation.pi_premium && quote.calculation.pi_premium > 0)) {
    tableRows.push({
      label: `Professional Indemnity / E&O (${(quote.pi_profession || 'tech_software').replace(/_/g, ' ')})`,
      basis: `LOI INR ${formatINRWithDecimals(quote.pi_limit_of_indemnity || 0)} | Clean Yrs: ${quote.pi_prior_clean_years || 0}`,
      amount: quote.pi_net_premium || quote.calculation.pi_premium || 0,
    });
  }

  if (quote.do_opted || (quote.calculation.do_premium && quote.calculation.do_premium > 0)) {
    tableRows.push({
      label: `Directors & Officers Liability (Side A + B + C)`,
      basis: `Listing: ${(quote.do_entity_listing_status || 'private').replace(/_/g, ' ')} | D/E: ${quote.do_debt_to_equity_ratio ?? 1.0}`,
      amount: quote.do_net_premium || quote.calculation.do_premium || 0,
    });
  }

  if (quote.cyber_opted || (quote.calculation.cyber_premium && quote.calculation.cyber_premium > 0)) {
    tableRows.push({
      label: `Corporate Cyber Risk & Data Protection`,
      basis: `Posture Tier: ${(quote.cyber_posture_tier || 'N/A').toUpperCase()} | Score: ${quote.cyber_score ?? 0}/100`,
      amount: quote.cyber_net_premium || quote.calculation.cyber_premium || 0,
    });
  }

  if (quote.crime_opted || (quote.calculation.crime_premium && quote.calculation.crime_premium > 0)) {
    tableRows.push({
      label: `Commercial Crime & Employee Dishonesty`,
      basis: `${quote.crime_employees_with_funds_access || 0} Staff @ ₹250 + 0.50% Limit | Dual Auth: ${quote.crime_has_dual_authorization_above_50k ? '-15%' : '+25%'}`,
      amount: quote.crime_net_premium || quote.calculation.crime_premium || 0,
    });
  }

  // Draw table rows with alternating shading
  tableRows.forEach((row, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 5, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(row.label, margin + 3, y + 3.5);
    doc.setTextColor(100, 116, 139);
    doc.text(row.basis, margin + 95, y + 3.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`INR ${formatINRWithDecimals(row.amount)}`, pageWidth - margin - 3, y + 3.5, {
      align: 'right',
    });
    y += 5;
  });

  // Net, GST, Total Block
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 2;

  const drawLedgerTotal = (label: string, amount: number, isFinal = false) => {
    doc.setFont('helvetica', isFinal ? 'bold' : 'normal');
    doc.setFontSize(isFinal ? 8.5 : 7.5);
    if (isFinal) {
      doc.setTextColor(49, 46, 129); // Indigo 900
    } else {
      doc.setTextColor(51, 65, 85);
    }
    doc.text(label, margin + 95, y + 3);
    doc.text(`INR ${formatINRWithDecimals(amount)}`, pageWidth - margin - 3, y + 3, {
      align: 'right',
    });
    y += isFinal ? 5.5 : 4.5;
  };

  drawLedgerTotal('NET CORPORATE LIABILITY PREMIUM:', quote.calculation.net_premium);
  drawLedgerTotal('GOODS & SERVICES TAX (GST 18%):', quote.calculation.gst_amount);

  doc.setFillColor(238, 242, 255); // Indigo 50
  doc.rect(margin + 90, y - 1, contentWidth - 90, 6, 'F');
  drawLedgerTotal('TOTAL PREMIUM PAYABLE:', quote.calculation.total_premium, true);
  y += 5;

  // Section 5: Statutory Warranties & Conditions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(79, 70, 229);
  doc.text('STATUTORY CLAUSES, WARRANTIES & UNDERWRITING CONDITIONS', margin, y);
  y += 3;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 32, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 32, 1.5, 1.5, 'S');
  y += 4.5;

  const warranties = [
    '1. Section 64VB of Insurance Act, 1938: Premium receipt warranty in advance of risk attachment. Cover strictly void ab initio without cleared funds.',
    '2. Claims-Made Basis & Retroactive Date Warranty: Policy covers only claims first made in writing during the policy period arising from acts after retroactive date.',
    '3. Defense Costs & Legal Expenses Clause: Defense expenses are payable within and subject to the aggregate Limit of Indemnity specified in Schedule.',
    '4. Digital Personal Data Protection Act (DPDPA), 2023 Warranty: Compliance with reasonable security safeguards and prompt data breach notifications.',
    '5. IRDAI (Insurance Brokers) Regulations, 2018: Statutory professional indemnity minimum limit maintained per Schedule I Form B (3x brokerage or ₹50 Lakhs).',
    '6. Dual Authorization Internal Financial Controls: Mandatory segregation of duties and dual signatory authorization for funds transfers exceeding ₹50,000.',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  warranties.forEach((clause) => {
    doc.text(clause, margin + 3, y, { maxWidth: contentWidth - 6 });
    y += 4.2;
  });
  y += 6;

  // Signatures Block
  const sigY = 270;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, sigY, margin + 60, sigY);
  doc.line(pageWidth - margin - 60, sigY, pageWidth - margin, sigY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signatory', margin, sigY + 4);
  doc.text(
    workspace?.name || 'Qoutely Insurance Brokers Pvt. Ltd.',
    margin,
    sigY + 7.5
  );

  doc.text('Accepted & Confirmed', pageWidth - margin - 60, sigY + 4);
  doc.text(quote.corporate_name || quote.client_name, pageWidth - margin - 60, sigY + 7.5);

  return doc;
}

export function downloadLiabilityQuotePDF(quote: LiabilityQuoteData, workspace?: Workspace) {
  const doc = generateLiabilityQuoteSlipPDF(quote, workspace);
  const cleanQuoteNo = quote.quote_number.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Liability_Quote_${cleanQuoteNo}.pdf`);
}
