import { jsPDF } from 'jspdf';
import { Workspace } from '@/types/database';
import { formatNumberINR, formatINRWithDecimals } from '@/lib/calculator';

export interface MotorQuoteData {
  quote_number: string;
  client_name: string;
  client_gst: string;
  client_address: string;
  hypothecation_bank?: string;
  quoteMode: 'single' | 'fleet';
  singleVehicle?: {
    regNo: string;
    makeModel: string;
    vehicleClass: string;
    mfgYear: number;
    gvwKg?: number;
    seatingCapacity?: number;
    totalIdv: number;
    zone: string;
  };
  fleetCount?: number;
  calculation: {
    totalIdv: number;
    chassisIdv: number;
    accessoriesIdv: number;
    grossOd: number;
    imtAddons: number;
    ncbDiscount: number;
    fleetDiscountAmount: number;
    netOd: number;
    statutoryTp: number;
    cpaAndDrivers: number;
    netPremium: number;
    gst: number;
    totalFinalPremium: number;
  };
}

export function generateMotorFleetPDF(quote: MotorQuoteData, workspace?: Workspace): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Header Bar with Corporate Blue Accent
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.rect(margin, y, contentWidth, 3, 'F');
  y += 7;

  // Broker Credentials
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
  doc.text(workspace?.address || 'Level 8, Express Towers, Nariman Point, Mumbai 400021', margin, y, { maxWidth: contentWidth });
  y += 8;

  // Title Box
  doc.setFillColor(239, 246, 255); // Blue 50
  doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(29, 78, 216); // Blue 700
  const policyTitle = quote.quoteMode === 'fleet'
    ? 'COMMERCIAL MOTOR FLEET INSURANCE QUOTE SLIP & SCHEDULE'
    : 'COMMERCIAL VEHICLE PACKAGE POLICY QUOTE SLIP';
  doc.text(policyTitle, pageWidth / 2, y + 5.2, { align: 'center' });
  y += 12;

  // Table Drawing Helper
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
    doc.line(margin + 52, rowY, margin + 52, rowY + rowHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(label, margin + 3, rowY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(value, margin + 55, rowY + 4.2, { maxWidth: contentWidth - 58 });
  };

  // Section 1: Insured Information
  drawRow('QUOTE REFERENCE', quote.quote_number, y);
  y += 6;
  drawRow('INSURED NAME', quote.client_name, y);
  y += 6;
  drawRow('CLIENT GSTIN', quote.client_gst, y);
  y += 6;
  drawRow('RISK / OPERATING BASE', quote.client_address, y, 7);
  y += 7;
  drawRow('PERIOD OF INSURANCE', '12 Months (From date of premium receipt)', y);
  y += 6;
  drawRow('FINANCIER / HYPOTHECATION', quote.hypothecation_bank || 'Agreed Bank Clause Attached', y);
  y += 9;

  // Section 2: Vehicle & Fleet Specifications
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SCHEDULE OF VEHICLES & VALUATION (IDV)', margin, y);
  y += 4;

  if (quote.quoteMode === 'single' && quote.singleVehicle) {
    drawRow('REGISTRATION NUMBER', quote.singleVehicle.regNo, y);
    y += 6;
    drawRow('MAKE & MODEL', quote.singleVehicle.makeModel, y);
    y += 6;
    drawRow('TARIFF CLASS / ZONE', `${quote.singleVehicle.vehicleClass.toUpperCase()} • ${quote.singleVehicle.zone}`, y);
    y += 6;
    drawRow('TOTAL IDV (SUM INSURED)', `INR ${formatNumberINR(quote.calculation.totalIdv)} (Chassis: INR ${formatNumberINR(quote.calculation.chassisIdv)})`, y);
    y += 8;
  } else {
    drawRow('FLEET CAPACITY', `${quote.fleetCount || 1} Commercial Goods & Passenger Carrying Vehicles`, y);
    y += 6;
    drawRow('TOTAL FLEET IDV', `INR ${formatNumberINR(quote.calculation.totalIdv)}`, y);
    y += 8;
  }

  // Section 3: Commercial IMT Endorsements Schedule
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SPECIAL IMT ENDORSEMENTS & CLAUSES ATTACHED', margin, y);
  y += 4;

  const clauses = [
    'IMT 23: Cover for Lamps, Tyres, Mudguards, and Bonnet/Side parts without deduction.',
    'IMT 28: Legal Liability to Paid Drivers, Cleaners and Coolies employed in operation.',
    'Zero Depreciation Cover: Disallows statutory wear-and-tear deductions on parts during claims.',
    'Statutory Motor Third Party (TP) Compliance: Charged strictly as per IRDAI Gazetted Tariff.',
  ];

  clauses.forEach((c) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text(`•  ${c}`, margin + 3, y);
    y += 4;
  });
  y += 4;

  // Section 4: Premium Computation Ledger
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('COMMERCIAL MOTOR PREMIUM COMPUTATION', margin, y);
  y += 4;

  drawRow('1. Gross Base Own Damage (OD) Premium', `INR ${formatNumberINR(quote.calculation.grossOd)}`, y);
  y += 6;
  drawRow('2. Add: Commercial IMT Add-on Suite', `INR ${formatNumberINR(quote.calculation.imtAddons)}`, y);
  y += 6;
  drawRow('3. Less: No Claim Bonus (NCB) Discount', `- INR ${formatNumberINR(quote.calculation.ncbDiscount)}`, y);
  y += 6;
  drawRow('4. Net Own Damage (OD) Premium', `INR ${formatNumberINR(quote.calculation.netOd)}`, y, 6, true);
  y += 6;
  drawRow('5. Statutory Third Party (TP) Premium', `INR ${formatNumberINR(quote.calculation.statutoryTp)}`, y);
  y += 6;
  drawRow('6. Compulsory PA & Paid Driver Liability', `INR ${formatNumberINR(quote.calculation.cpaAndDrivers)}`, y);
  y += 6;
  drawRow('7. Subtotal Net Commercial Premium', `INR ${formatINRWithDecimals(quote.calculation.netPremium)}`, y, 6, true);
  y += 6;
  drawRow('8. Goods & Services Tax (GST @ 18%)', `INR ${formatINRWithDecimals(quote.calculation.gst)}`, y);
  y += 6;
  drawRow('TOTAL FINAL COMMERCIAL MOTOR PREMIUM', `INR ${formatINRWithDecimals(quote.calculation.totalFinalPremium)}`, y, 7, true);
  y += 12;

  // Client Mandate & Acceptance Block
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CLIENT MANDATE & STATUTORY DECLARATION', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `We hereby appoint ${workspace?.name || 'Qoutely Insurance Brokers'} as our exclusive broker for the placement of our commercial motor & fleet insurance requirements in compliance with IRDAI regulations.`,
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

export function downloadMotorFleetQuotePDF(quote: MotorQuoteData, workspace?: Workspace) {
  const doc = generateMotorFleetPDF(quote, workspace);
  const cleanClient = quote.client_name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Commercial_Motor_Quote-${cleanClient}-${quote.quote_number}.pdf`);
}
