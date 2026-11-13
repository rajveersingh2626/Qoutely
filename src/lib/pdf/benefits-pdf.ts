import { jsPDF } from 'jspdf';
import { Workspace } from '@/types/database';
import { formatNumberINR, formatINRWithDecimals } from '@/lib/calculator';

export interface BenefitsQuoteData {
  quote_number: string;
  client_name: string;
  client_gst: string;
  client_address: string;
  hypothecation_bank?: string;
  census: {
    total_lives: number;
    employee_count: number;
    dependent_count: number;
    family_structure: string;
    age_bands: {
      age_0_25: number;
      age_26_35: number;
      age_36_45: number;
      age_46_55: number;
      age_56_65: number;
      age_66_75: number;
      age_76_plus: number;
    };
  };
  ghi: {
    sum_insured: number;
    room_rent_desc: string;
    maternity_opted: boolean;
    maternity_limit_desc: string;
    ped_waiver_day_1: boolean;
    corporate_buffer_amount: number;
    tpa_network_name: string;
  };
  gtli: {
    opted: boolean;
    sum_insured_per_member: number;
    total_sum_insured: number;
    free_cover_limit: number;
    hazard_class_desc: string;
  };
  gpa: {
    opted: boolean;
    sum_insured_per_life: number;
    total_sum_insured: number;
    hazard_class_desc: string;
    ttd_opted: boolean;
    medical_extension_opted: boolean;
  };
  wc: {
    opted: boolean;
    covered_workers: number;
    annual_wage_roll: number;
    trade_hazard_rate_percent: number;
    medical_extension_opted: boolean;
    statutory_death_liability: number;
    statutory_ptd_liability: number;
  };
  calculation: {
    ghi_pure_premium: number;
    ghi_loading_amount: number;
    ghi_buffer_premium: number;
    ghi_total_premium: number;
    gtli_premium: number;
    gpa_premium: number;
    wc_premium: number;
    net_package_premium: number;
    gst_amount: number;
    total_final_premium: number;
  };
}

export function generateBenefitsQuoteSlipPDF(quote: BenefitsQuoteData, workspace?: Workspace): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Header Accent Bar (Corporate Rose)
  doc.setFillColor(225, 29, 72); // Rose 600
  doc.rect(margin, y, contentWidth, 3, 'F');
  y += 7;

  // Broker Credentials Header
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `CIN NO: ${workspace?.default_rules?.cin_no || 'U74999DL2003PTC119576'}   |   CATEGORY: DIRECT BROKERS (GENERAL & LIFE)`,
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

  // Title Box
  doc.setFillColor(255, 241, 242); // Rose 50
  doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(190, 18, 60); // Rose 700
  doc.text('CORPORATE EMPLOYEE BENEFITS (GHI • GTLI • GPA • WC) QUOTE SLIP', pageWidth / 2, y + 5.2, { align: 'center' });
  y += 12;

  // Helper function to draw table rows
  const drawRow = (
    label: string,
    value: string,
    rowY: number,
    rowHeight: number = 5.5,
    isHeader: boolean = false,
    labelWidth: number = 72
  ) => {
    if (isHeader) {
      doc.setFillColor(241, 245, 249); // Slate 100
      doc.rect(margin, rowY - 1, contentWidth, rowHeight, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
    }
    doc.setFontSize(7.5);
    doc.text(label, margin + 2, rowY + 3);
    doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
    doc.text(value, margin + labelWidth, rowY + 3, { maxWidth: contentWidth - labelWidth - 4 });
  };

  // Section 1: Insured Corporate Particulars
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('INSURED CORPORATE PARTICULARS', margin, y);
  y += 4;

  drawRow('QUOTE REFERENCE', `${quote.quote_number} (Status: Active Commercial Term)`, y);
  y += 5.5;
  drawRow('CORPORATE CLIENT NAME', quote.client_name, y);
  y += 5.5;
  drawRow('GSTIN / PAN', quote.client_gst || 'NOT PROVIDED / EXEMPT', y);
  y += 5.5;
  drawRow('REGISTERED OFFICE', quote.client_address || 'As per corporate commercial record', y);
  y += 5.5;
  drawRow(
    'ENROLLED LIVES SCHEDULE',
    `${quote.census.total_lives} Lives (${quote.census.employee_count} Employees + ${quote.census.dependent_count} Dependents) • Family Floater: ${quote.census.family_structure}`,
    y
  );
  y += 7.5;

  // Section 2: Demographic Age Bands & Multi-Line Terms
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DEMOGRAPHIC SCHEDULE & MULTI-LINE POLICY SPECIFICATIONS', margin, y);
  y += 4;

  const ab = quote.census.age_bands;
  drawRow(
    'ACTUARIAL AGE BRACKETS',
    `0-25: ${ab.age_0_25} | 26-35: ${ab.age_26_35} | 36-45: ${ab.age_36_45} | 46-55: ${ab.age_46_55} | 56-65: ${ab.age_56_65} | 66-75: ${ab.age_66_75} | 76+: ${ab.age_76_plus}`,
    y
  );
  y += 5.5;

  drawRow(
    'GROUP HEALTH (GHI)',
    `Sum Insured: INR ${formatNumberINR(quote.ghi.sum_insured)}/life • ${quote.ghi.room_rent_desc} • Maternity: ${quote.ghi.maternity_limit_desc} • PED: ${quote.ghi.ped_waiver_day_1 ? 'Day-1 Cover' : 'Standard'} • Buffer: INR ${formatNumberINR(quote.ghi.corporate_buffer_amount)} • TPA: ${quote.ghi.tpa_network_name}`,
    y
  );
  y += 5.5;

  drawRow(
    'GROUP TERM LIFE (GTLI)',
    quote.gtli.opted
      ? `Cover Opted • SI: INR ${formatNumberINR(quote.gtli.sum_insured_per_member)}/life (Total SI: INR ${formatNumberINR(quote.gtli.total_sum_insured)}) • FCL: INR ${formatNumberINR(quote.gtli.free_cover_limit)} • Hazard: ${quote.gtli.hazard_class_desc} (IALM 2012-14)`
      : 'Coverage Not Opted',
    y
  );
  y += 5.5;

  drawRow(
    'GROUP ACCIDENT (GPA)',
    quote.gpa.opted
      ? `24x7 Worldwide • SI: INR ${formatNumberINR(quote.gpa.sum_insured_per_life)}/life (Total SI: INR ${formatNumberINR(quote.gpa.total_sum_insured)}) • PTD 100% • TTD: ${quote.gpa.ttd_opted ? '0.15‰' : 'No'} • Med Extension: ${quote.gpa.medical_extension_opted ? '10%' : 'No'}`
      : 'Coverage Not Opted',
    y
  );
  y += 5.5;

  drawRow(
    'STATUTORY WC (EC ACT)',
    quote.wc.opted
      ? `Employees Compensation Act 1923 Sec 4 & Schedule IV • ${quote.wc.covered_workers} Workers • Annual Wage Roll: INR ${formatNumberINR(quote.wc.annual_wage_roll)} @ ${quote.wc.trade_hazard_rate_percent}% • Med Ext: ${quote.wc.medical_extension_opted ? '+25%' : 'Standard'}`
      : 'Coverage Not Opted',
    y
  );
  y += 7.5;

  // Section 3: Statutory Clauses & Warranties
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('STATUTORY WARRANTIES, TPA NETWORK & REGULATORY CLAUSES', margin, y);
  y += 4;

  const clauses = [
    'IRDAI (Health Insurance) Regulations, 2016: Cashless claims settlement via IRDAI-licensed TPA network across 12,000+ empanelled hospitals.',
    'Section 64VB Insurance Act, 1938: Premium payment warranty mandatory prior to policy commencement and risk attachment.',
    'Employees Compensation Act, 1923 (Sec 4 & Sched IV): Statutory monthly wage ceiling capped at INR 15,000 for compensation indemnity computation.',
    'Free Cover Limit (FCL) Warranty: Sum Insured exceeding the agreed FCL threshold is subject to medical underwriting declaration approval.',
  ];

  clauses.forEach((c) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text(`•  ${c}`, margin + 3, y);
    y += 3.8;
  });
  y += 3;

  // Section 4: Premium Computation Ledger
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DETERMINISTIC BENEFITS PACKAGE PREMIUM LEDGER', margin, y);
  y += 4;

  drawRow(
    '1. GHI Pure Demographic Premium (Actuarial Age-Bands)',
    `INR ${formatNumberINR(quote.calculation.ghi_pure_premium)}`,
    y,
    5,
    false,
    100
  );
  y += 5;

  drawRow(
    '2. GHI Benefit Loadings (Room Rent, Maternity, PED Waiver)',
    `INR ${formatNumberINR(quote.calculation.ghi_loading_amount)}`,
    y,
    5,
    false,
    100
  );
  y += 5;

  drawRow(
    '3. GHI Corporate Buffer Premium (Groups >= 50 lives @ 3.5%)',
    `INR ${formatNumberINR(quote.calculation.ghi_buffer_premium)}`,
    y,
    5,
    false,
    100
  );
  y += 5;

  drawRow(
    '4. Subtotal Group Health Insurance (GHI) Premium',
    `INR ${formatNumberINR(quote.calculation.ghi_total_premium)}`,
    y,
    5,
    true,
    100
  );
  y += 5;

  drawRow(
    '5. Group Term Life Insurance (GTLI) Mortality Premium',
    `INR ${formatNumberINR(quote.calculation.gtli_premium)}`,
    y,
    5,
    false,
    100
  );
  y += 5;

  drawRow(
    '6. Group Personal Accident (GPA) 24x7 Worldwide Premium',
    `INR ${formatNumberINR(quote.calculation.gpa_premium)}`,
    y,
    5,
    false,
    100
  );
  y += 5;

  drawRow(
    '7. Statutory Workmen\'s Compensation (WC EC Act) Premium',
    `INR ${formatNumberINR(quote.calculation.wc_premium)}`,
    y,
    5,
    false,
    100
  );
  y += 5;

  drawRow(
    '8. Net Corporate Benefits Package Premium',
    `INR ${formatINRWithDecimals(quote.calculation.net_package_premium)}`,
    y,
    5,
    true,
    100
  );
  y += 5;

  drawRow(
    '9. Statutory Goods & Services Tax (GST @ 18%)',
    `INR ${formatINRWithDecimals(quote.calculation.gst_amount)}`,
    y,
    5,
    false,
    100
  );
  y += 5;

  drawRow(
    'TOTAL FINAL BENEFITS PREMIUM PAYABLE',
    `INR ${formatINRWithDecimals(quote.calculation.total_final_premium)}`,
    y,
    6,
    true,
    100
  );
  y += 9;

  // Section 5: Client Mandate & Statutory Acceptance Block
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CORPORATE MANDATE & STATUTORY DECLARATION (IRDAI REGULATIONS)', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `We hereby appoint ${workspace?.name || 'Qoutely Insurance Brokers'} as our authorized broker for corporate employee benefits placement in strict adherence to Section 64VB of the Insurance Act, 1938 and IRDAI regulations.`,
    margin + 3,
    y + 8.5,
    { maxWidth: contentWidth - 6 }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('For ' + quote.client_name, margin + 5, y + 15.5);
  doc.text('(Authorized Corporate Signatory)', margin + 5, y + 18.5);

  doc.text('For ' + (workspace?.name || 'Qoutely Insurance Brokers'), margin + 110, y + 15.5);
  doc.text('(Licensed Insurance Broker)', margin + 110, y + 18.5);

  return doc;
}

export function downloadBenefitsQuotePDF(quote: BenefitsQuoteData, workspace?: Workspace) {
  const doc = generateBenefitsQuoteSlipPDF(quote, workspace);
  const cleanClient = quote.client_name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Corporate_Benefits_Quote-${cleanClient}-${quote.quote_number}.pdf`);
}
