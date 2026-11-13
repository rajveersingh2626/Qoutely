import { jsPDF } from 'jspdf';
import { Workspace } from '@/types/database';
import { formatNumberINR, formatINRWithDecimals } from '@/lib/calculator';

export interface EngineeringQuoteData {
  quote_number: string;
  client_name: string;
  client_gst: string;
  client_address: string;
  contractor_name?: string;
  principal_name?: string;
  hypothecation_bank?: string;
  site_location?: string;
  sub_line: 'car' | 'ear' | 'mb' | 'eei' | 'bpp' | 'package';
  project_name?: string;
  project_type?: 'car' | 'ear';
  contract_period_months?: number;
  testing_period_months?: number;
  dlp_maintenance_months?: number;
  eq_zone?: 1 | 2 | 3 | 4;
  stfi_opted?: boolean;
  civil_works_value?: number;
  plant_machinery_value?: number;
  tpl_limit?: number;
  surrounding_property_limit?: number;
  machinery_summary?: {
    total_machines: number;
    total_crv: number;
    groups_count: Record<1 | 2 | 3 | 4, number>;
  };
  eei_summary?: {
    hardware_crv: number;
    is_portable_laptop?: boolean;
    data_media_si?: number;
    icow_si?: number;
    icow_months?: number;
  };
  bpp_summary?: {
    vessel_type: 'fire_tube' | 'water_tube';
    operating_pressure_bar: number;
    heating_surface_sqm: number;
    replacement_value: number;
  };
  calculation: {
    sum_insured: number;
    base_works_premium?: number;
    testing_premium?: number;
    maintenance_premium?: number;
    perils_premium?: number;
    mb_premium?: number;
    eei_premium?: number;
    bpp_premium?: number;
    extensions_premium?: number;
    net_premium: number;
    gst_amount: number;
    total_premium: number;
  };
}

export function generateEngineeringQuoteSlipPDF(
  quote: EngineeringQuoteData,
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

  // Header Accent Bar (Amber #D97706)
  doc.setFillColor(217, 119, 6); // Amber 600
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

  // Title Box
  doc.setFillColor(254, 243, 199); // Amber 100
  doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9); // Amber 700
  doc.text(
    'COMMERCIAL ENGINEERING & INFRASTRUCTURE PROJECT QUOTE SLIP (CAR • EAR • MB • EEI • BPP)',
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

  // Section 1: Client & Project Details
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'S');

  const halfWidth = contentWidth / 2;
  y += 5;
  drawRow('QUOTE REFERENCE:', quote.quote_number, margin + 4, margin + 42);
  drawRow('PROJECT NAME:', quote.project_name || 'Infrastructure Project Works', margin + halfWidth + 4, margin + halfWidth + 34);
  y += 5;
  drawRow('INSURED CLIENT:', quote.client_name, margin + 4, margin + 42);
  drawRow('CONTRACTOR:', quote.contractor_name || 'EPC Main Contractor', margin + halfWidth + 4, margin + halfWidth + 34);
  y += 5;
  drawRow('CLIENT GSTIN:', quote.client_gst || '27AAAAA0000A1Z5', margin + 4, margin + 42);
  drawRow('SITE LOCATION:', quote.site_location || 'Project Site, Industrial Area', margin + halfWidth + 4, margin + halfWidth + 34);
  y += 5;
  drawRow('HYPOTHECATION:', quote.hypothecation_bank || 'Consortium of Lenders / None', margin + 4, margin + 42);
  drawRow('COVERAGE LINE:', quote.sub_line.toUpperCase(), margin + halfWidth + 4, margin + halfWidth + 34);
  y += 9;

  // Section 2: Project Specifications & Asset Rollup
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9);
  doc.text('PROJECT SCOPE & ASSET VALUES', margin, y);
  y += 3;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'S');

  y += 5;
  drawRow('CIVIL WORKS VALUE:', `INR ${formatNumberINR(quote.civil_works_value || 0)}`, margin + 4, margin + 42);
  drawRow('CONTRACT PERIOD:', `${quote.contract_period_months || 12} Months`, margin + halfWidth + 4, margin + halfWidth + 40);
  y += 5;
  drawRow('PLANT & ERECTION:', `INR ${formatNumberINR(quote.plant_machinery_value || 0)}`, margin + 4, margin + 42);
  drawRow('TESTING PERIOD:', `${quote.testing_period_months || 0} Months (${quote.testing_period_months && quote.testing_period_months > 1 ? `${quote.testing_period_months - 1} loaded` : '1st free'})`, margin + halfWidth + 4, margin + halfWidth + 40);
  y += 5;
  drawRow('DLP MAINTENANCE:', `${quote.dlp_maintenance_months || 0} Months`, margin + 4, margin + 42);
  drawRow('AOG SEISMIC ZONE:', `Zone ${quote.eq_zone || 4} (${quote.eq_zone === 1 ? 'Severe 0.50‰' : quote.eq_zone === 2 ? 'High 0.35‰' : quote.eq_zone === 3 ? 'Moderate 0.25‰' : 'Low 0.10‰'})`, margin + halfWidth + 4, margin + halfWidth + 40);
  y += 5;
  drawRow('TOTAL PROJECT SI:', `INR ${formatNumberINR(quote.calculation.sum_insured)}`, margin + 4, margin + 42);
  drawRow('STFI PERILS:', quote.stfi_opted ? 'INCLUDED (0.15‰)' : 'STANDARD COVER', margin + halfWidth + 4, margin + halfWidth + 40);
  y += 9;

  // Section 3: Itemized Premium Ledger Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9);
  doc.text('ACTUARIAL & TARIFF PREMIUM COMPUTATION LEDGER', margin, y);
  y += 3;

  // Table Header
  doc.setFillColor(217, 119, 6);
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('COVER / EXTENSION DESCRIPTION', margin + 3, y + 3.8);
  doc.text('STATUTORY BASIS / TARIFF RATE', margin + 105, y + 3.8);
  doc.text('PREMIUM (INR)', pageWidth - margin - 3, y + 3.8, { align: 'right' });
  y += 5.5;

  const tableRows: Array<{ label: string; basis: string; amount: number }> = [];

  if (quote.calculation.base_works_premium && quote.calculation.base_works_premium > 0) {
    tableRows.push({
      label: 'Civil Works & Erection Base Works Cover',
      basis: 'Civil @ 1.20‰, Plant @ 1.80‰ x Duration Factor',
      amount: quote.calculation.base_works_premium,
    });
  }

  if (quote.calculation.testing_premium && quote.calculation.testing_premium > 0) {
    tableRows.push({
      label: 'EAR Plant Testing Period Extension',
      basis: '0.75‰ per month on Plant Sum Insured',
      amount: quote.calculation.testing_premium,
    });
  }

  if (quote.calculation.maintenance_premium && quote.calculation.maintenance_premium > 0) {
    tableRows.push({
      label: 'Defect Liability Period (DLP) Maintenance',
      basis: `${(quote.dlp_maintenance_months ?? 0) >= 24 ? '25%' : '15%'} loading on Base Works Premium`,
      amount: quote.calculation.maintenance_premium,
    });
  }

  if (quote.calculation.perils_premium && quote.calculation.perils_premium > 0) {
    tableRows.push({
      label: `Act of God (AOG) EQ Zone ${quote.eq_zone || 4} & STFI`,
      basis: `Seismic ${quote.eq_zone || 4} Tariff + Storm/Tempest/Flood`,
      amount: quote.calculation.perils_premium,
    });
  }

  if (quote.calculation.mb_premium && quote.calculation.mb_premium > 0) {
    tableRows.push({
      label: 'Machinery Breakdown (MB) Groups I-IV',
      basis: 'Tariff rating on Current Replacement Value (CRV)',
      amount: quote.calculation.mb_premium,
    });
  }

  if (quote.calculation.eei_premium && quote.calculation.eei_premium > 0) {
    tableRows.push({
      label: 'Electronic Equipment (Hardware, Media, ICOW)',
      basis: 'Hardware 1.25%/3.75%, Data 3.00%, ICOW 1.5-4.0%',
      amount: quote.calculation.eei_premium,
    });
  }

  if (quote.calculation.bpp_premium && quote.calculation.bpp_premium > 0) {
    tableRows.push({
      label: 'Boiler & Pressure Plant (Explosion/Collapse)',
      basis: 'Indian Boilers Act 1923 + Pressure Surcharge',
      amount: quote.calculation.bpp_premium,
    });
  }

  if (quote.calculation.extensions_premium && quote.calculation.extensions_premium > 0) {
    tableRows.push({
      label: 'Third Party Liability & Surrounding Property',
      basis: 'TPL @ 0.35‰-0.50%, Surrounding Property @ 0.25‰',
      amount: quote.calculation.extensions_premium,
    });
  }

  // Draw table rows with alternating shading
  tableRows.forEach((row, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, contentWidth, 5, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(row.label, margin + 3, y + 3.5);
    doc.setTextColor(100, 116, 139);
    doc.text(row.basis, margin + 105, y + 3.5);
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
      doc.setTextColor(180, 83, 9);
    } else {
      doc.setTextColor(51, 65, 85);
    }
    doc.text(label, margin + 105, y + 3);
    doc.text(`INR ${formatINRWithDecimals(amount)}`, pageWidth - margin - 3, y + 3, {
      align: 'right',
    });
    y += isFinal ? 5.5 : 4.5;
  };

  drawLedgerTotal('NET ENGINEERING PREMIUM:', quote.calculation.net_premium);
  drawLedgerTotal('GOODS & SERVICES TAX (GST 18%):', quote.calculation.gst_amount);

  doc.setFillColor(254, 243, 199);
  doc.rect(margin + 100, y - 1, contentWidth - 100, 6, 'F');
  drawLedgerTotal('TOTAL PREMIUM PAYABLE:', quote.calculation.total_premium, true);
  y += 5;

  // Section 4: Statutory Warranties & Conditions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9);
  doc.text('STATUTORY CLAUSES, WARRANTIES & UNDERWRITING CONDITIONS', margin, y);
  y += 3;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 32, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 32, 1.5, 1.5, 'S');
  y += 4.5;

  const warranties = [
    '1. Section 64VB of Insurance Act, 1938: Premium receipt warranty in advance of risk attachment. Cover strictly void ab initio without cleared funds.',
    '2. Reinstatement Value Clause (CRV): Plant, machinery, and electronic assets must be insured on full Current Replacement Value (not book value).',
    '3. Condition of Average: If actual replacement value at time of loss exceeds sum insured, the insurer liability is proportionately reduced.',
    '4. Indian Boilers Act, 1923 Warranty: Boilers and pressure vessels must hold a valid certificate of fitness issued by the Chief Boiler Inspector.',
    '5. Testing Period Warranty: EAR testing cover terminates immediately upon introduction of commercial feed material or commercial generation.',
    '6. 72-Hour Perils Clause: Flood, storm, or earthquake losses occurring within a consecutive 72-hour window are deemed a single occurrence.',
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
  doc.text(quote.client_name, pageWidth - margin - 60, sigY + 7.5);

  return doc;
}

export function downloadEngineeringQuotePDF(quote: EngineeringQuoteData, workspace?: Workspace) {
  const doc = generateEngineeringQuoteSlipPDF(quote, workspace);
  const cleanQuoteNo = quote.quote_number.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Engineering_Quote_${cleanQuoteNo}.pdf`);
}
