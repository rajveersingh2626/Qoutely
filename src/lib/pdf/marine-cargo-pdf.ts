import { jsPDF } from 'jspdf';
import { Workspace } from '@/types/database';
import { formatNumberINR, formatINRWithDecimals } from '@/lib/calculator';

export interface MarineQuoteData {
  quote_number: string;
  client_name: string;
  client_gst: string;
  client_address: string;
  hypothecation_bank?: string;
  policyType: 'single_voyage' | 'open_policy' | 'atpo';
  transitType: 'inland' | 'ocean';
  route: {
    origin: string;
    destination: string;
    viaTransshipment?: string;
  };
  cargoDetails: {
    commodity: string;
    hazardClass: 1 | 2 | 3 | 4;
    packagingType?: string;
    carrierName?: string;
    carrierDocNo?: string;
    isCertifiedCarrier: boolean;
  };
  clauses: {
    transitClause: string; // e.g. 'ITC (A)', 'ICC (A)'
    incoterm: string;      // 'CIF', 'FOB', 'CFR', 'EXW'
    customsDutyOpted: boolean;
    customsDutyPercent?: number;
    warAndStrikesOpted: boolean;
    policyExcessClause: string;
  };
  calculation: {
    consignmentValue: number;
    insurableSumInsured: number;
    dutySumInsured?: number;
    totalSumInsured: number;
    baseRatePerMille: number;
    baseTransitPremium: number;
    customsDutyPremium: number;
    warAndStrikesPremium: number;
    netMarinePremium: number;
    gstAmount: number;
    totalFinalPremium: number;
  };
  declarationsCount?: number;
}

export function generateMarineCargoPDF(quote: MarineQuoteData, workspace?: Workspace): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Header Accent Bar (Marine Cyan / Deep Teal)
  doc.setFillColor(8, 145, 178); // Cyan 600
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
  doc.setFillColor(236, 254, 255); // Cyan 50
  doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(14, 116, 144); // Cyan 700

  const policyTitle =
    quote.policyType === 'open_policy' || quote.policyType === 'atpo'
      ? 'MARINE OPEN POLICY (MOP / ATPO) QUOTE SLIP & DECLARATION SCHEDULE'
      : quote.transitType === 'ocean'
      ? 'INTERNATIONAL OCEAN CARGO INSURANCE QUOTE SLIP (ICC SPECIFICATION)'
      : 'DOMESTIC INLAND TRANSIT INSURANCE QUOTE SLIP (ITC SPECIFICATION)';

  doc.text(policyTitle, pageWidth / 2, y + 5.2, { align: 'center' });
  y += 12;

  // Helper function to draw table rows
  const drawRow = (
    label: string,
    value: string,
    rowY: number,
    rowHeight: number = 6,
    isHeader: boolean = false,
    labelWidth: number = 70
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

  // Section 1: Insured & Voyage Route Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('INSURED & VOYAGE ROUTE PARTICULARS', margin, y);
  y += 4;

  drawRow('QUOTE REFERENCE', `${quote.quote_number} (Status: Active Commercial Term)`, y);
  y += 6;
  drawRow('NAME OF INSURED', quote.client_name, y);
  y += 6;
  drawRow('GSTIN / UIN', quote.client_gst || 'NOT PROVIDED / EXEMPT', y);
  y += 6;
  drawRow('REGISTERED ADDRESS', quote.client_address || 'As per client commercial record', y);
  y += 6;
  if (quote.hypothecation_bank) {
    drawRow('BANK / CONSIGNEE', `Under LC / Hypothecation to ${quote.hypothecation_bank}`, y);
    y += 6;
  }
  drawRow(
    'VOYAGE ROUTE',
    `${quote.route.origin} TO ${quote.route.destination}${quote.route.viaTransshipment ? ` (VIA ${quote.route.viaTransshipment})` : ''}`,
    y
  );
  y += 8;

  // Section 2: Cargo Specifications & Valuation Basis
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CARGO RISK DIMENSIONS & VALUATION BASIS', margin, y);
  y += 4;

  drawRow(
    'COMMODITY & HAZARD',
    `${quote.cargoDetails.commodity} (Hazard Class ${quote.cargoDetails.hazardClass})`,
    y
  );
  y += 6;
  drawRow(
    'PACKAGING & CARRIER',
    `${quote.cargoDetails.packagingType || 'Containerized FCL'} • ${quote.cargoDetails.carrierName || 'Classed Common Carrier'} (${quote.cargoDetails.isCertifiedCarrier ? 'IBA Approved' : 'Uncertified Carrier'})`,
    y
  );
  y += 6;
  drawRow(
    'INCOTERMS BASIS',
    `${quote.clauses.incoterm} (Shippable Valuation + statutory markup)`,
    y
  );
  y += 6;
  drawRow(
    'TOTAL SUM INSURED',
    `INR ${formatNumberINR(quote.calculation.totalSumInsured)} (Invoice: INR ${formatNumberINR(quote.calculation.consignmentValue)})`,
    y
  );
  y += 8;

  // Section 3: Statutory Marine Clauses & Institute Warranties
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('STATUTORY TRANSIT CLAUSES & INSTITUTE WARRANTIES', margin, y);
  y += 4;

  const clauses = [
    `Primary Transit Clause: ${quote.clauses.transitClause} (Accidental loss/damage as per statutory Institute / Inland conditions).`,
    `Section 64VB Compliance: Premium must be remitted in advance or debited from active Cash Deposit (CD) account prior to dispatch.`,
    quote.transitType === 'ocean'
      ? 'Institute Replacement Clause & Institute Classification Clause apply to ocean liner conveyance.'
      : 'Carriage by Road Act, 2007: Mandatory monetary claim notice to carrier within statutory period.',
    quote.clauses.customsDutyOpted
      ? `Customs Duty Insurance: Endorsement active @ ${quote.clauses.customsDutyPercent || 30}% of CIF on duty sum insured INR ${formatNumberINR(quote.calculation.dutySumInsured || 0)}.`
      : 'Customs Duty Insurance: Not Opted.',
    quote.clauses.warAndStrikesOpted
      ? 'Institute War & Strikes Clauses (Cargo): Active at gazetted rate of 0.05‰ on total cargo sum insured.'
      : 'War & Strikes Perils: Excluded.',
    `Policy Excess: ${quote.clauses.policyExcessClause}.`,
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
  doc.text('DETERMINISTIC MARINE CARGO PREMIUM LEDGER', margin, y);
  y += 4;

  drawRow(
    '1. Commercial Consignment Value (Invoice INR)',
    `INR ${formatNumberINR(quote.calculation.consignmentValue)}`,
    y,
    5.5,
    false,
    95
  );
  y += 5.5;
  drawRow(
    '2. Incoterm Shippable Valuation & Markups',
    `INR ${formatNumberINR(quote.calculation.insurableSumInsured)}`,
    y,
    5.5,
    false,
    95
  );
  y += 5.5;
  drawRow(
    `3. Base Transit Peril Premium (${quote.calculation.baseRatePerMille.toFixed(4)}‰)`,
    `INR ${formatNumberINR(quote.calculation.baseTransitPremium)}`,
    y,
    5.5,
    false,
    95
  );
  y += 5.5;
  drawRow(
    '4. Customs Duty Insurance Cover Premium',
    `INR ${formatNumberINR(quote.calculation.customsDutyPremium)}`,
    y,
    5.5,
    false,
    95
  );
  y += 5.5;
  drawRow(
    '5. Institute War & Strikes (Cargo) Premium',
    `INR ${formatNumberINR(quote.calculation.warAndStrikesPremium)}`,
    y,
    5.5,
    false,
    95
  );
  y += 5.5;
  drawRow(
    '6. Net Marine Cargo Premium (Min Floor: INR 1,000)',
    `INR ${formatINRWithDecimals(quote.calculation.netMarinePremium)}`,
    y,
    5.5,
    true,
    95
  );
  y += 5.5;
  drawRow(
    '7. Statutory Goods & Services Tax (GST @ 18%)',
    `INR ${formatINRWithDecimals(quote.calculation.gstAmount)}`,
    y,
    5.5,
    false,
    95
  );
  y += 5.5;
  drawRow(
    'TOTAL FINAL MARINE PREMIUM PAYABLE',
    `INR ${formatINRWithDecimals(quote.calculation.totalFinalPremium)}`,
    y,
    6.5,
    true,
    95
  );
  y += 10;

  // Section 5: Client Mandate & Statutory Acceptance Block
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CLIENT MANDATE & STATUTORY DECLARATION (IRDAI REGULATIONS)', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `We hereby appoint ${workspace?.name || 'Qoutely Insurance Brokers'} as our exclusive broker for the placement of our commercial marine transit insurance requirements in strict compliance with Section 64VB of the Insurance Act, 1938 and IRDAI regulations.`,
    margin + 3,
    y + 8.5,
    { maxWidth: contentWidth - 6 }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('For ' + quote.client_name, margin + 5, y + 17);
  doc.text('(Authorized Signatory / Insured)', margin + 5, y + 20);

  doc.text('For ' + (workspace?.name || 'Qoutely Insurance Brokers'), margin + 110, y + 17);
  doc.text('(Licensed Insurance Broker)', margin + 110, y + 20);

  return doc;
}

export function downloadMarineCargoQuotePDF(quote: MarineQuoteData, workspace?: Workspace) {
  const doc = generateMarineCargoPDF(quote, workspace);
  const cleanClient = quote.client_name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Marine_Cargo_Quote-${cleanClient}-${quote.quote_number}.pdf`);
}
