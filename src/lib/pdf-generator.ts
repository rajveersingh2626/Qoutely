import { jsPDF } from 'jspdf';
import { Quote, Workspace } from '@/types/database';
import { formatINR, formatNumberINR } from './calculator';

export function generateQuoteSlipPDF(quote: Quote, workspace: Workspace): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Header Bar with Emerald Accent
  doc.setFillColor(22, 163, 74); // Emerald 600
  doc.rect(margin, y, contentWidth, 3, 'F');
  y += 7;

  // Broker Regulatory Credentials
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `CIN NO: ${workspace.default_rules.cin_no || 'U74999DL2003PTC119576'}   |   CATEGORY: DIRECT BROKERS (GENERAL)`,
    margin,
    y
  );
  y += 4;
  doc.text(
    `IRDA LICENSE NO: ${workspace.default_rules.irda_license_no || '236'}   |   L. EXPIRY DATE: 29 DECEMBER 2027`,
    margin,
    y
  );

  const quoteDate = new Date(quote.created_at || Date.now()).toLocaleDateString('en-GB');
  doc.text(`DATE: ${quoteDate}`, pageWidth - margin, y, { align: 'right' });
  y += 6;

  // Brokerage Firm Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(workspace.name.toUpperCase(), margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(workspace.address, margin, y, { maxWidth: contentWidth });
  y += 8;

  // Proposal Title Box
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(21, 128, 61); // Emerald 700
  const policyTitle =
    quote.sum_insured <= 50000000
      ? 'PROPOSAL FOR BHARAT SOOKSHMA UDYAM SURAKSHA POLICY'
      : 'PROPOSAL FOR BHARAT LAGHU UDYAM SURAKSHA POLICY';
  doc.text(policyTitle, pageWidth / 2, y + 5.2, { align: 'center' });
  y += 12;

  // Table Helper
  const drawRow = (
    label: string,
    value: string,
    rowY: number,
    rowHeight: number = 6,
    isHeader: boolean = false
  ) => {
    if (isHeader) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, rowY, contentWidth, rowHeight, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, rowY, contentWidth, rowHeight);
    doc.line(margin + 50, rowY, margin + 50, rowY + rowHeight);

    doc.setFont('helvetica', isHeader ? 'bold' : 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(label, margin + 3, rowY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(value, margin + 53, rowY + 4.2, { maxWidth: contentWidth - 56 });
  };

  // Insured Information Table
  drawRow('QUOTE REFERENCE', quote.quote_number, y);
  y += 6;
  drawRow('INSURED NAME', quote.client_name, y);
  y += 6;
  drawRow('RISK LOCATION', quote.client_gst ? `${quote.client_name}, ${quote.eq_zone}` : quote.eq_zone, y);
  y += 6;
  drawRow('GST NUMBER', quote.client_gst || '07ALMPA9603N1ZS', y);
  y += 6;
  drawRow('PERIOD OF INSURANCE', '12 Months (from date of premium receipt)', y);
  y += 6;
  drawRow('PREVIOUS INSURER', quote.insurer_name || 'THE NEW INDIA ASSURANCE CO. LTD.', y);
  y += 6;
  drawRow('BUSINESS / OCCUPATION', quote.occupation_description, y, 7);
  y += 7;
  drawRow('RISK / OCCUPANCY CODE', `${quote.occupation_code} (Category ${quote.calculation_breakdown.category || 1}, Section ${quote.calculation_breakdown.section || 'III'})`, y);
  y += 6;
  drawRow('EARTHQUAKE ZONE', `${quote.eq_zone} (Tariff Loading Applied)`, y);
  y += 6;
  drawRow('HYPOTHECATION', 'Bank of India / Agreed Bank Clause attached', y);
  y += 6;
  drawRow('CLAIM EXPERIENCE', 'NO CLAIM IN LAST THREE YEARS (Eligible for feature discount)', y);
  y += 9;

  // Sum Insured & Premium Calculation
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('SUM INSURED BREAKDOWN & PREMIUM COMPUTATION', margin, y);
  y += 4;

  // Premium Table
  const tableY = y;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, tableY, contentWidth, 6, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, tableY, contentWidth, 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('ASSET ITEM', margin + 3, tableY + 4.2);
  doc.text('SUM INSURED (INR)', margin + 60, tableY + 4.2);
  doc.text('RATING APPLIED', margin + 105, tableY + 4.2);
  doc.text('NET PREMIUM (INR)', margin + 145, tableY + 4.2);
  y += 6;

  const rowH = 5.5;
  const assets = [
    { label: 'Building Structure', val: quote.sum_insured_breakdown.building },
    { label: 'Plant & Machinery (P&M)', val: quote.sum_insured_breakdown.plant_machinery },
    { label: 'Furniture, Fixtures & Fittings', val: quote.sum_insured_breakdown.furniture_fixtures },
    { label: 'Stocks & Inventory', val: quote.sum_insured_breakdown.stocks },
    { label: 'Other Contents', val: quote.sum_insured_breakdown.others },
  ];

  assets.forEach((a) => {
    if (a.val > 0 || (a.label.includes('Stocks') && quote.sum_insured_breakdown.total > 0)) {
      doc.rect(margin, y, contentWidth, rowH);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(a.label, margin + 3, y + 3.8);
      doc.text(formatNumberINR(a.val || quote.sum_insured), margin + 60, y + 3.8);
      doc.text(`${quote.policy_rate} per mille`, margin + 105, y + 3.8);
      doc.text(formatNumberINR(quote.premium), margin + 145, y + 3.8);
      y += rowH;
    }
  });

  // Total SI Row
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, rowH, 'F');
  doc.rect(margin, y, contentWidth, rowH);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL SUM INSURED', margin + 3, y + 3.8);
  doc.text(formatINR(quote.sum_insured), margin + 60, y + 3.8);
  y += rowH;

  // Premium summary rows
  const addSummaryRow = (label: string, val: string, isTotal: boolean = false) => {
    doc.setFillColor(isTotal ? 236 : 255, isTotal ? 253 : 255, isTotal ? 245 : 255); // emerald tint if total
    doc.rect(margin, y, contentWidth, rowH, 'F');
    doc.rect(margin, y, contentWidth, rowH);
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
    doc.setFontSize(isTotal ? 8 : 7.5);
    doc.setTextColor(isTotal ? 21 : 15, isTotal ? 128 : 23, isTotal ? 61 : 42);
    doc.text(label, margin + 80, y + 3.8);
    doc.text(val, margin + 145, y + 3.8);
    y += rowH;
  };

  addSummaryRow('Net Basic Premium (Per Tariff):', formatINR(quote.premium));
  addSummaryRow('Goods & Services Tax (GST @ 18%):', formatINR(quote.gst_amount));
  addSummaryRow('TOTAL PAYABLE PREMIUM:', formatINR(quote.total_premium), true);
  y += 7;

  // Clauses & Warranties Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('APPLICABLE TARIFF CLAUSES, WARRANTIES & ENDORSEMENTS', margin, y);
  y += 4;

  const clausesList = [
    'Agreed Bank Clause: Loss proceeds payable directly to financing Bank.',
    'Designation of Property Clause: Asset book entries admitted as insured property.',
    'Architects, Surveyors & Consulting Engineers Fees: Included up to 5% of claim amount.',
    'Removal of Debris Clause: Costs necessarily incurred covered up to 2% of claim amount.',
    'Category I Storage Warranty: Prohibits storage of Category II/III hazardous goods, coir waste, or caddies.',
    'Fire Extinguishing Appliances Warranty: Maintenance in operational condition as per tariff rules.',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  clausesList.forEach((c) => {
    doc.text(`* ${c}`, margin + 2, y, { maxWidth: contentWidth - 4 });
    y += 4;
  });
  y += 3;

  // Coverage Under Policy
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('COVERAGE UNDER POLICY (STANDARD PERILS)', margin, y);
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    '1. Fire & Explosion  2. Lightning  3. Earthquake & Convulsion of Nature (EQ)  4. Storm, Cyclone, Flood & Inundation (STFI)  5. Subsidence & Landslide  6. Impact Damage  7. Riot, Strike, Malicious Damage (RSMD)  8. Bursting of water pipes/tanks.',
    margin,
    y,
    { maxWidth: contentWidth }
  );
  y += 7;

  // Broker Mandate & Signatures
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CLIENT MANDATE & DECLARATION', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `We hereby give our exclusive mandate to M/s ${workspace.name} in respect of the above General Insurance requirements. All policy terms and conditions have been explained and accepted.`,
    margin + 3,
    y + 8.5,
    { maxWidth: contentWidth - 6 }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('For ' + quote.client_name, margin + 5, y + 20);
  doc.text('(Authorized Signatory / Insured)', margin + 5, y + 23);

  doc.text('For ' + workspace.name, margin + 110, y + 20);
  doc.text('(Licensed Insurance Broker)', margin + 110, y + 23);

  return doc;
}

export function downloadQuoteSlipPDF(quote: Quote, workspace: Workspace) {
  const doc = generateQuoteSlipPDF(quote, workspace);
  const cleanClient = quote.client_name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Quote_Slip-${cleanClient}-${quote.quote_number}.pdf`);
}
