'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  Anchor,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';
import { formatNumberINR } from '@/lib/calculator';
import { COMMODITY_HAZARD_RATES } from '@/lib/engines/marine-engine';

export interface ParsedMarineDeclarationRecord {
  id: string;
  rowNumber: number;
  invoiceNo: string;
  invoiceDate: string;
  carrierDocNo: string;
  carrierName: string;
  isCertifiedCarrier: boolean;
  origin: string;
  destination: string;
  transitMode: 'road' | 'rail' | 'sea' | 'air';
  incoterm: 'CIF' | 'FOB' | 'CFR' | 'EXW';
  commodityDescription: string;
  hazardClass: 1 | 2 | 3 | 4;
  consignmentValue: number;
  insurableSumInsured: number;
  ratePerMille: number;
  estimatedPremium: number;
  isValid: boolean;
  validationErrors: string[];
}

export interface MarineDeclarationRollupSummary {
  totalShipments: number;
  validShipments: number;
  invalidShipments: number;
  totalConsignmentValue: number;
  totalInsurableValue: number;
  totalEstimatedPremium: number;
  gstAmount: number;
  totalFinalPremium: number;
  currentCdBalance?: number;
  projectedCdBalance?: number;
  cdStatus: 'HEALTHY' | 'LOW_CD_BALANCE_WARNING' | 'CD_BALANCE_EXHAUSTED';
  cdWarningMessage?: string;
}

export interface MarineDeclarationUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDeclarations: (
    declarations: ParsedMarineDeclarationRecord[],
    rollup: MarineDeclarationRollupSummary
  ) => void;
  currentCdBalance?: number;
  policyType?: 'single_voyage' | 'open_policy' | 'atpo';
}

export const MarineDeclarationUploader: React.FC<MarineDeclarationUploaderProps> = ({
  isOpen,
  onClose,
  onApplyDeclarations,
  currentCdBalance,
  policyType = 'open_policy',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedMarineDeclarationRecord[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'errors'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Header Normalization
  const normalizeHeader = (raw: string): string => {
    const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (/^(invoicedate|invdate|date|dispatchdate|shipmentdate)/.test(clean)) return 'invoiceDate';
    if (/^(invoicevalue|consignmentvalue|declaredvalue|invoiceamount|value|amount|inr)/.test(clean)) return 'consignmentValue';
    if (/^(invoiceno|billno|invno|documentno|invoice|inv|bill)/.test(clean)) return 'invoiceNo';
    if (/^(lr|bl|awb|rr|carrierdoc|consignmentnote|tracking|waybill|docket)/.test(clean)) return 'carrierDocNo';
    if (/^(carrier|transporter|shippingline|airline|transportername|carriername)/.test(clean)) return 'carrierName';
    if (/^(certified|commoncarrier|iba|ibacertified)/.test(clean)) return 'isCertifiedCarrier';
    if (/^(origin|from|dispatchfrom|source|loadingport|portofloading|pol)/.test(clean)) return 'origin';
    if (/^(destination|to|dispatchto|deliverylocation|dischargeport|portofdischarge|pod)/.test(clean)) return 'destination';
    if (/^(mode|transitmode|conveyance|transportmode|shipmentmode)/.test(clean)) return 'transitMode';
    if (/^(incoterm|terms|tradeterms)/.test(clean)) return 'incoterm';
    if (/^(commodity|goods|description|item|material|cargodescription)/.test(clean)) return 'commodityDescription';
    if (/^(hazard|hazardclass|class|riskclass)/.test(clean)) return 'hazardClass';
    return clean;
  };

  // Inline Valuation & Rate Estimation
  const calculateInsurableValue = (value: number, incoterm: 'CIF' | 'FOB' | 'CFR' | 'EXW'): number => {
    if (incoterm === 'CIF') {
      return Math.round(value * 1.10);
    } else if (incoterm === 'FOB' || incoterm === 'CFR') {
      // 10% freight + 2% port = 1.12, then 110%
      return Math.round(value * 1.12 * 1.10);
    } else if (incoterm === 'EXW') {
      // 5% inland + 10% freight = 1.15, then 110%
      return Math.round(value * 1.15 * 1.10);
    }
    return Math.round(value * 1.10);
  };

  const calculateQuickRate = (
    hazardClass: 1 | 2 | 3 | 4,
    transitMode: 'road' | 'rail' | 'sea' | 'air',
    isCertified: boolean
  ): number => {
    if (transitMode === 'sea') {
      return 0.35; // Default ICC (A) ocean rate
    }
    const base = COMMODITY_HAZARD_RATES[hazardClass] || 0.12;
    return isCertified ? base : base * 1.25;
  };

  const handleFileProcess = (content: string, name: string) => {
    setIsProcessing(true);
    setFileName(name);

    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setIsProcessing(false);
      return;
    }

    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headerRow = lines[0]
      .split(delimiter)
      .map((c) => normalizeHeader(c.trim().replace(/^["']|["']$/g, '')));

    const rows: ParsedMarineDeclarationRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]
        .split(delimiter)
        .map((c) => c.trim().replace(/^["']|["']$/g, ''));

      if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

      const record: Record<string, string> = {};
      headerRow.forEach((hdr, idx) => {
        if (cols[idx] !== undefined) {
          record[hdr] = cols[idx];
        }
      });

      const invoiceNo = record.invoiceNo || `INV-2026-${String(i).padStart(3, '0')}`;
      const invoiceDate = record.invoiceDate || new Date().toISOString().split('T')[0];
      const carrierDocNo = record.carrierDocNo || `LR-${String(1000 + i)}`;
      const carrierName = record.carrierName || 'VRL Logistics Ltd';

      const rawCertified = (record.isCertifiedCarrier || 'yes').toLowerCase();
      const isCertifiedCarrier = !(rawCertified === 'false' || rawCertified === 'no' || rawCertified === '0');

      const origin = record.origin || '';
      const destination = record.destination || '';

      const rawMode = (record.transitMode || 'road').toLowerCase();
      const transitMode: 'road' | 'rail' | 'sea' | 'air' =
        rawMode.includes('sea') || rawMode.includes('ocean') || rawMode.includes('vessel')
          ? 'sea'
          : rawMode.includes('rail') || rawMode.includes('train') || rawMode.includes('concor')
          ? 'rail'
          : rawMode.includes('air') || rawMode.includes('flight')
          ? 'air'
          : 'road';

      const rawIncoterm = (record.incoterm || 'CIF').toUpperCase();
      const incoterm: 'CIF' | 'FOB' | 'CFR' | 'EXW' =
        rawIncoterm.includes('FOB')
          ? 'FOB'
          : rawIncoterm.includes('CFR')
          ? 'CFR'
          : rawIncoterm.includes('EXW')
          ? 'EXW'
          : 'CIF';

      const commodityDescription = record.commodityDescription || 'Commercial Manufactured Goods';

      const rawHazard = parseInt(record.hazardClass || '2', 10);
      const hazardClass: 1 | 2 | 3 | 4 =
        rawHazard >= 1 && rawHazard <= 4 ? (rawHazard as 1 | 2 | 3 | 4) : 2;

      const isNegative = /^\s*-/.test(record.consignmentValue || '');
      const cleanVal = record.consignmentValue?.replace(/[^0-9.]/g, '') || '0';
      const rawVal = parseFloat(cleanVal) * (isNegative ? -1 : 1);
      const consignmentValue = isNaN(rawVal) ? 0 : rawVal;

      // Validation
      const errors: string[] = [];
      if (!invoiceNo || invoiceNo.trim().length === 0) {
        errors.push('Invoice Number is required.');
      }
      if (!origin || origin.trim().length === 0) {
        errors.push('Origin location required.');
      }
      if (!destination || destination.trim().length === 0) {
        errors.push('Destination location required.');
      }
      if (consignmentValue <= 0) {
        errors.push('Consignment value must be greater than zero.');
      }

      // Financials
      const insurableSumInsured = calculateInsurableValue(consignmentValue, incoterm);
      const ratePerMille = calculateQuickRate(hazardClass, transitMode, isCertifiedCarrier);
      const rawPrem = (insurableSumInsured * ratePerMille) / 1000;
      const estimatedPremium = consignmentValue > 0 ? Math.max(1000, Math.round(rawPrem)) : 0;

      rows.push({
        id: crypto.randomUUID(),
        rowNumber: i,
        invoiceNo,
        invoiceDate,
        carrierDocNo,
        carrierName,
        isCertifiedCarrier,
        origin,
        destination,
        transitMode,
        incoterm,
        commodityDescription,
        hazardClass,
        consignmentValue,
        insurableSumInsured,
        ratePerMille,
        estimatedPremium,
        isValid: errors.length === 0,
        validationErrors: errors,
      });
    }

    setParsedRows(rows);
    setIsProcessing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        handleFileProcess(content, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        handleFileProcess(content, file.name);
      };
      reader.readAsText(file);
    }
  };

  // Rollup Metrics
  const validList = parsedRows.filter((r) => r.isValid);
  const errorList = parsedRows.filter((r) => !r.isValid);
  const totalConsignmentValue = validList.reduce((acc, r) => acc + r.consignmentValue, 0);
  const totalInsurableValue = validList.reduce((acc, r) => acc + r.insurableSumInsured, 0);
  const totalEstimatedPremium = validList.reduce((acc, r) => acc + r.estimatedPremium, 0);
  const gstAmount = Math.round(totalEstimatedPremium * 0.18);
  const totalFinalPremium = totalEstimatedPremium + gstAmount;

  let cdStatus: MarineDeclarationRollupSummary['cdStatus'] = 'HEALTHY';
  let cdWarningMessage: string | undefined;
  let projectedCdBalance: number | undefined;

  if (currentCdBalance !== undefined) {
    projectedCdBalance = currentCdBalance - totalEstimatedPremium;
    if (projectedCdBalance < 0) {
      cdStatus = 'CD_BALANCE_EXHAUSTED';
      cdWarningMessage = `Sec 64VB Block: Current CD balance of ₹${currentCdBalance.toLocaleString(
        'en-IN'
      )} is insufficient for batch premium debit of ₹${totalEstimatedPremium.toLocaleString(
        'en-IN'
      )}. Deficit: ₹${Math.abs(projectedCdBalance).toLocaleString('en-IN')}. Top-up required immediately.`;
    } else if (projectedCdBalance < 10000) {
      cdStatus = 'LOW_CD_BALANCE_WARNING';
      cdWarningMessage = `LOW_CD_BALANCE_WARNING: Projected CD balance will drop to ₹${projectedCdBalance.toLocaleString(
        'en-IN'
      )} (< ₹10,000 threshold).`;
    }
  }

  const rollup: MarineDeclarationRollupSummary = {
    totalShipments: parsedRows.length,
    validShipments: validList.length,
    invalidShipments: errorList.length,
    totalConsignmentValue,
    totalInsurableValue,
    totalEstimatedPremium,
    gstAmount,
    totalFinalPremium,
    currentCdBalance,
    projectedCdBalance,
    cdStatus,
    cdWarningMessage,
  };

  const visibleRows =
    filterMode === 'valid' ? validList : filterMode === 'errors' ? errorList : parsedRows;

  const handleDownloadSample = () => {
    const sampleCSV = `InvoiceNo,Date,CarrierDocNo,CarrierName,Origin,Destination,TransitMode,ConsignmentValue,Incoterm,Commodity,HazardClass,Certified
INV-2026-001,2026-11-10,LR-998811,VRL Logistics,Bhiwandi Hub,Bangalore DC,Road,3500000,CIF,Consumer Electronics,2,Yes
INV-2026-002,2026-11-11,BL-MAEU8819,Maersk Line,Nhava Sheva Port,Rotterdam Port,Sea,12000000,CIF,Pharmaceutical Formulations,4,Yes
INV-2026-003,2026-11-12,LR-445522,TCI Freight,Jamshedpur Works,Faridabad Warehouse,Rail,4800000,FOB,Industrial Steel Rods,1,Yes
INV-2026-004,2026-11-12,AWB-098-7711,Air India Cargo,Delhi Cargo Terminal,Heathrow Airport,Air,2500000,EXW,Precision Instruments,3,Yes
INV-2026-005,2026-11-13,LR-110022,Local Transporter,Surat Textile Market,Kolkata Central,Road,1500000,CIF,Cotton Fabric Bales,1,No`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'download-marine-declarations-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Marine Declaration Schedule Ingestion</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 font-semibold">
                  MOP / ATPO Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Upload monthly dispatches for automatic Incoterm valuation, per-mille rating, and Sec 64VB CD drawdown.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Dropzone */}
          {parsedRows.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-cyan-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
              <Upload className="w-10 h-10 mx-auto text-cyan-500 mb-3 animate-bounce" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Drag and drop your marine declarations (.csv) here
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supports standard columns: InvoiceNo, Date, CarrierDocNo, CarrierName, Origin, Destination, TransitMode, ConsignmentValue, Incoterm, Commodity, HazardClass
              </p>

              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Browse Computer
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 4-Card KPI Metric Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-900/60">
                  <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase">
                    Total Shipments
                  </span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {validList.length}{' '}
                    <span className="text-xs font-normal text-slate-500">/ {parsedRows.length} valid</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Declared Consignment Value</span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    ₹ {formatNumberINR(totalConsignmentValue)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Insurable Sum Insured</span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    ₹ {formatNumberINR(totalInsurableValue)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                    Est. Marine Premium (Inc. 18% GST)
                  </span>
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                    ₹ {formatNumberINR(totalFinalPremium)}
                  </div>
                </div>
              </div>

              {/* Section 64VB Cash Deposit Warning / Exhaustion Banner */}
              {cdStatus === 'CD_BALANCE_EXHAUSTED' && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-xs flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-red-700 dark:text-red-300">
                      Section 64VB Blocking Alert — Cash Deposit Exhausted
                    </h4>
                    <p className="mt-1">{cdWarningMessage}</p>
                  </div>
                </div>
              )}

              {cdStatus === 'LOW_CD_BALANCE_WARNING' && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{cdWarningMessage}</span>
                </div>
              )}

              {/* Filter Tabs & Re-upload */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      filterMode === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    All Shipments ({parsedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('valid')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      filterMode === 'valid'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                  >
                    Valid ({validList.length})
                  </button>
                  {errorList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterMode('errors')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        filterMode === 'errors'
                          ? 'bg-red-500 text-white shadow-xs'
                          : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                      }`}
                    >
                      Errors ({errorList.length})
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setFileName(null);
                  }}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                >
                  Upload different file
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto max-h-72">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">Invoice / Date</th>
                      <th className="px-3 py-2.5">Carrier / Doc</th>
                      <th className="px-3 py-2.5">Route</th>
                      <th className="px-3 py-2.5">Mode</th>
                      <th className="px-3 py-2.5">Terms</th>
                      <th className="px-3 py-2.5">Commodity</th>
                      <th className="px-3 py-2.5 text-right">Declared Value</th>
                      <th className="px-3 py-2.5 text-right">Insurable SI</th>
                      <th className="px-3 py-2.5 text-right">Est. Premium</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {visibleRows.map((row) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                          !row.isValid ? 'bg-red-50/30 dark:bg-red-950/20' : ''
                        }`}
                      >
                        <td className="px-3 py-2 text-slate-400 font-mono">{row.rowNumber}</td>
                        <td className="px-3 py-2 font-mono">
                          <div className="font-semibold text-slate-900 dark:text-white">{row.invoiceNo}</div>
                          <div className="text-[10px] text-slate-400">{row.invoiceDate}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{row.carrierName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{row.carrierDocNo}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <span>{row.origin || '—'}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span>{row.destination || '—'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 capitalize font-mono text-[11px]">{row.transitMode}</td>
                        <td className="px-3 py-2 font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                          {row.incoterm}
                        </td>
                        <td className="px-3 py-2">
                          <div className="truncate max-w-[140px] text-slate-700 dark:text-slate-300">
                            {row.commodityDescription}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">Hazard Class {row.hazardClass}</div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">
                          ₹{formatNumberINR(row.consignmentValue)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-cyan-700 dark:text-cyan-300">
                          ₹{formatNumberINR(row.insurableSumInsured)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-700 dark:text-emerald-300 font-semibold">
                          ₹{formatNumberINR(row.estimatedPremium)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Valid
                            </span>
                          ) : (
                            <span
                              title={row.validationErrors.join(', ')}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 cursor-help"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {parsedRows.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{validList.length}</span> shipments
              ready to apply (₹{formatNumberINR(totalConsignmentValue)} declared).
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={validList.length === 0}
                onClick={() => {
                  onApplyDeclarations(validList, rollup);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center gap-2"
              >
                <span>Apply Valid Declarations to Studio</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
