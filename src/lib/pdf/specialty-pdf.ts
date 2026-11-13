import { jsPDF } from 'jspdf';
import { Workspace } from '@/types/database';
import { formatINRWithDecimals } from '@/lib/calculator';

export interface SpecialtyQuoteData {
  quote_number: string;
  client_name: string;
  client_gst: string;
  client_address: string;
  contractor_or_applicant?: string;
  pan_number: string;
  sub_line: 'surety_bond' | 'trade_credit' | 'burglary' | 'specialty_package';

  // Surety section
  surety_opted?: boolean;
  surety_bond_type?: 'bid_bond' | 'performance_bond' | 'advance_payment' | 'retention_money';
  surety_bond_value?: number;
  surety_tenure_months?: number;
  surety_contractor_grade?: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB';
  surety_contractor_net_worth?: number;
  surety_annual_rate_percent?: number;
  surety_required_collateral_margin?: number;
  surety_credit_limit_breach?: boolean;
  surety_net_premium?: number;

  // Trade Credit section
  trade_credit_opted?: boolean;
  trade_credit_insurable_turnover?: number;
  trade_credit_average_days?: 30 | 60 | 90 | 120;
  trade_credit_top_10_share_percent?: number;
  trade_credit_requested_indemnity_percent?: number;
  trade_credit_clamped_indemnity_percent?: number;
  trade_credit_base_rate_percent?: number;
  trade_credit_concentration_loading_percent?: number;
  trade_credit_net_premium?: number;

  // Burglary section
  burglary_opted?: boolean;
  burglary_property_sum_insured?: number;
  burglary_first_loss_percentage?: 25 | 50 | 75 | 100;
  burglary_first_loss_sum_insured?: number;
  burglary_has_cctv?: boolean;
  burglary_has_guards?: boolean;
  burglary_has_alarm?: boolean;
  burglary_total_security_discount_percent?: number;
  burglary_net_premium?: number;

  // Aggregated Calculation
  calculation: {
    sum_insured: number;
    surety_premium?: number;
    trade_credit_premium?: number;
    burglary_premium?: number;
    net_premium: number;
    gst_amount: number;
    total_premium: number;
  };
}

export function generateSpecialtyQuoteSlipPDF(
  quote: SpecialtyQuoteData,
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

  // Header Accent Bar (Emerald 600: #059669 / rgb: 5, 150, 105)
  doc.setFillColor(5, 150, 105);
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

  // Title Box (Emerald 50 bg / Emerald 900 text)
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 78, 59); // Emerald 900
  doc.text(
    'FINANCIAL GUARANTEES & SPECIALTY LINES QUOTE SLIP / SURETY NOTE',
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

  // Section 1: Contractor / Applicant Details Box
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'S');

  const halfWidth = contentWidth / 2;
  y += 5;
  drawRow('QUOTE REFERENCE:', quote.quote_number, margin + 4, margin + 42);
  drawRow(
    'CONTRACTOR / APPLICANT:',
    quote.contractor_or_applicant || quote.client_name,
    margin + halfWidth + 4,
    margin + halfWidth + 44
  );
  y += 5;
  drawRow('APPLICANT PAN:', (quote.pan_number || 'AAACA1234F').toUpperCase(), margin + 4, margin + 42);
  drawRow('CLIENT GSTIN:', quote.client_gst || '27AAAAA0000A1Z5', margin + halfWidth + 4, margin + halfWidth + 44);
  y += 5;
  drawRow('SUB-LINE:', quote.sub_line.replace(/_/g, ' ').toUpperCase(), margin + 4, margin + 42);
  drawRow('COVERAGE TERRITORY:', 'INDIA JURISDICTION', margin + halfWidth + 4, margin + halfWidth + 44);
  y += 9;

  // Section 2: Underwriting Risk & Collateral Profile Schedule
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text('FINANCIAL COLLATERAL, CREDIT RATING & UNDERWRITING PROFILE', margin, y);
  y += 3;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 28, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 28, 1.5, 1.5, 'S');

  y += 5;
  const suretyBondText = quote.surety_opted && quote.surety_bond_value
    ? `${(quote.surety_bond_type || 'performance_bond').replace(/_/g, ' ').toUpperCase()} (INR ${formatINRWithDecimals(quote.surety_bond_value)})`
    : 'Not Opted';
  drawRow('SURETY BOND PRINCIPAL:', suretyBondText, margin + 4, margin + 48, 7);

  const gradeText = quote.surety_opted && quote.surety_contractor_grade
    ? `Grade ${quote.surety_contractor_grade} (Margin: ${quote.surety_required_collateral_margin ?? 5}%)`
    : 'N/A';
  drawRow('CONTRACTOR GRADE / MARGIN:', gradeText, margin + halfWidth + 4, margin + halfWidth + 46, 7);

  y += 5;
  const netWorthText = quote.surety_opted && quote.surety_contractor_net_worth
    ? `INR ${formatINRWithDecimals(quote.surety_contractor_net_worth)} (${quote.surety_credit_limit_breach ? 'BREACH: +25% SURCHARGE' : 'CAPACITY OK'})`
    : 'N/A';
  drawRow('CONTRACTOR NET WORTH:', netWorthText, margin + 4, margin + 48, 7);

  const tenureText = quote.surety_opted && quote.surety_tenure_months
    ? `${quote.surety_tenure_months} Months (${(quote.surety_tenure_months / 12).toFixed(2)}x Pro-Rata)`
    : 'N/A';
  drawRow('BOND TENURE / DURATION:', tenureText, margin + halfWidth + 4, margin + halfWidth + 46, 7);

  y += 5;
  const tciTurnoverText = quote.trade_credit_opted && quote.trade_credit_insurable_turnover
    ? `INR ${formatINRWithDecimals(quote.trade_credit_insurable_turnover)} (${quote.trade_credit_average_days || 30} Days Terms)`
    : 'Not Opted';
  drawRow('TCI INSURABLE TURNOVER:', tciTurnoverText, margin + 4, margin + 48, 7);

  const tciIndemnityText = quote.trade_credit_opted
    ? `Indemnity: ${quote.trade_credit_clamped_indemnity_percent ?? 90}% (IRDAI Cap) | Top 10: ${quote.trade_credit_top_10_share_percent ?? 40}% (${(quote.trade_credit_top_10_share_percent ?? 0) > 60 ? '+20% Loading' : 'Par'})`
    : 'N/A';
  drawRow('TCI INDEMNITY & CONC:', tciIndemnityText, margin + halfWidth + 4, margin + halfWidth + 46, 7);

  y += 5;
  const burglaryText = quote.burglary_opted && quote.burglary_property_sum_insured
    ? `SI: INR ${formatINRWithDecimals(quote.burglary_property_sum_insured)} (${quote.burglary_first_loss_percentage || 50}% First Loss)`
    : 'Not Opted';
  drawRow('BURGLARY FIRST LOSS:', burglaryText, margin + 4, margin + 48, 7);

  const burglarySecurityText = quote.burglary_opted
    ? `Security Disc: -${quote.burglary_total_security_discount_percent ?? 0}% (CCTV: ${quote.burglary_has_cctv ? 'Y' : 'N'}, Guards: ${quote.burglary_has_guards ? 'Y' : 'N'}, Alarm: ${quote.burglary_has_alarm ? 'Y' : 'N'})`
    : 'N/A';
  drawRow('BURGLARY SECURITY POSTURE:', burglarySecurityText, margin + halfWidth + 4, margin + halfWidth + 46, 7);
  y += 8;

  // Section 3: Financial Premium Ledger Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(5, 150, 105);
  doc.text('ITEMIZED FINANCIAL PREMIUM LEDGER', margin, y);
  y += 3;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('LINE ITEM / DESCRIPTION', margin + 3, y + 4.2);
  doc.text('RATING BASIS & UNDERWRITING MULTIPLIER', margin + 70, y + 4.2);
  doc.text('NET PREMIUM (INR)', pageWidth - margin - 3, y + 4.2, { align: 'right' });
  y += 6;

  // Table Rows Helper
  const drawTableRow = (desc: string, basis: string, amount: number, isAlt = false) => {
    if (isAlt) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 5.5, 'F');
    }
    doc.setDrawColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 5.5, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    doc.text(desc, margin + 3, y + 3.8);
    doc.text(basis, margin + 70, y + 3.8);
    doc.text(formatINRWithDecimals(amount), pageWidth - margin - 3, y + 3.8, { align: 'right' });
    y += 5.5;
  };

  let rowIdx = 0;

  if (quote.surety_opted && quote.surety_bond_value) {
    const bondRate = quote.surety_annual_rate_percent ?? 1.5;
    const tenureFac = (quote.surety_tenure_months || 12) / 12;
    drawTableRow(
      `Surety Bond: ${(quote.surety_bond_type || 'performance_bond').replace(/_/g, ' ').toUpperCase()}`,
      `Principal INR ${formatINRWithDecimals(quote.surety_bond_value)} @ ${bondRate}% p.a. x ${tenureFac.toFixed(2)}x tenure`,
      quote.surety_net_premium || quote.calculation.surety_premium || 0,
      rowIdx % 2 === 1
    );
    rowIdx++;
  }

  if (quote.trade_credit_opted && quote.trade_credit_insurable_turnover) {
    const tciRate = quote.trade_credit_base_rate_percent ?? 0.35;
    const loading = quote.trade_credit_concentration_loading_percent ? ` (+${quote.trade_credit_concentration_loading_percent}% Loading)` : '';
    drawTableRow(
      'Trade Credit Insurance: Whole Turnover Receivables',
      `Turnover INR ${formatINRWithDecimals(quote.trade_credit_insurable_turnover)} @ ${tciRate}%${loading} (${quote.trade_credit_clamped_indemnity_percent ?? 90}% Indemnity)`,
      quote.trade_credit_net_premium || quote.calculation.trade_credit_premium || 0,
      rowIdx % 2 === 1
    );
    rowIdx++;
  }

  if (quote.burglary_opted && quote.burglary_property_sum_insured) {
    const fLSi = (quote.burglary_property_sum_insured * (quote.burglary_first_loss_percentage || 50)) / 100;
    const disc = quote.burglary_total_security_discount_percent ? ` (-${quote.burglary_total_security_discount_percent}% Disc)` : '';
    drawTableRow(
      `Commercial Burglary: ${quote.burglary_first_loss_percentage || 50}% First Loss Scale`,
      `First Loss SI INR ${formatINRWithDecimals(fLSi)} @ 2.50‰${disc}`,
      quote.burglary_net_premium || quote.calculation.burglary_premium || 0,
      rowIdx % 2 === 1
    );
    rowIdx++;
  }

  // Net, GST, Total Block
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 2;

  const drawLedgerTotal = (label: string, amount: number, isFinal = false) => {
    doc.setFont('helvetica', isFinal ? 'bold' : 'normal');
    doc.setFontSize(isFinal ? 8.5 : 7.5);
    if (isFinal) {
      doc.setTextColor(6, 78, 59); // Emerald 900
    } else {
      doc.setTextColor(51, 65, 85);
    }
    doc.text(label, margin + 95, y + 3);
    doc.text(`INR ${formatINRWithDecimals(amount)}`, pageWidth - margin - 3, y + 3, {
      align: 'right',
    });
    y += isFinal ? 5.5 : 4.5;
  };

  drawLedgerTotal('NET FINANCIAL & SPECIALTY PREMIUM:', quote.calculation.net_premium);
  drawLedgerTotal('GOODS & SERVICES TAX (GST 18%):', quote.calculation.gst_amount);

  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.rect(margin + 90, y - 1, contentWidth - 90, 6, 'F');
  drawLedgerTotal('TOTAL PREMIUM PAYABLE:', quote.calculation.total_premium, true);
  y += 5;

  // Section 4: Statutory Warranties & Conditions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(5, 150, 105);
  doc.text('STATUTORY CLAUSES, WARRANTIES & GFR 2017 UNDERWRITING CONDITIONS', margin, y);
  y += 3;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 32, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 32, 1.5, 1.5, 'S');
  y += 4.5;

  const warranties = [
    '1. General Financial Rules (GFR) 2017 Rule 170: Bid Security / Earnest Money Deposit (EMD) Surety Bond accepted in lieu of Bank Guarantee for Central Government and CPSE procurements.',
    '2. General Financial Rules (GFR) 2017 Rule 171: Performance Security Surety Bond guarantee accepted up to 3% to 10% of contract value, unconditional and irrevocable.',
    '3. IRDAI (Trade Credit Insurance) Guidelines, 2021: Statutory maximum indemnity capped at 90% of gross invoice turnover (Ref: IRDAI/NL/GDL/CRE/207/09/2021).',
    '4. Whole Turnover & Non-Payment Default Warranty: Insured must declare whole eligible turnover with mandatory notification of buyer insolvency or default exceeding 60 days.',
    '5. Burglary First Loss Warranty: Cover restricted to agreed first loss percentage; Condition of Average applies if full replacement value at loss date exceeds declared sum insured.',
    '6. Section 64VB of Insurance Act, 1938: Premium receipt warranty in advance of risk attachment. Cover strictly void ab initio without cleared funds.',
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
  doc.text(quote.contractor_or_applicant || quote.client_name, pageWidth - margin - 60, sigY + 7.5);

  return doc;
}

export function downloadSpecialtyQuotePDF(quote: SpecialtyQuoteData, workspace?: Workspace) {
  const doc = generateSpecialtyQuoteSlipPDF(quote, workspace);
  const cleanQuoteNo = quote.quote_number.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Specialty_Quote_${cleanQuoteNo}.pdf`);
}
