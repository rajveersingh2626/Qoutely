'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { formatNumberINR } from '@/lib/calculator';

export interface ParsedVehicleRecord {
  id: string;
  rowNumber: number;
  regNo: string;
  makeModel: string;
  mfgYear: number;
  vehicleClass: 'gcv' | 'pcv' | 'misc';
  gvwKg?: number;
  seatingCapacity?: number;
  exShowroomPrice: number;
  calculatedIdv: number;
  zone: 'Zone A' | 'Zone B' | 'Zone C';
  ncbPercent: number;
  estimatedOd: number;
  statutoryTp: number;
  netPremium: number;
  isValid: boolean;
  validationErrors: string[];
}

export interface FleetRollupSummary {
  totalVehicles: number;
  validVehicles: number;
  invalidVehicles: number;
  totalIdv: number;
  totalEstimatedOd: number;
  totalStatutoryTp: number;
  totalNetPremium: number;
  gstAmount: number;
  totalFinalPremium: number;
}

interface BulkFleetUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFleet: (vehicles: ParsedVehicleRecord[], rollup: FleetRollupSummary) => void;
}

const INDIAN_REG_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/i;

export const BulkFleetUploader: React.FC<BulkFleetUploaderProps> = ({
  isOpen,
  onClose,
  onApplyFleet,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedVehicleRecord[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'errors'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Header normalization map
  const normalizeHeader = (raw: string): string => {
    const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (/^(reg|registration|vehicleno|rc|regn)/.test(clean)) return 'regNo';
    if (/^(make|model|vehiclemodel|makemodel)/.test(clean)) return 'makeModel';
    if (/^(year|mfgyear|manufacturingyear|mfg)/.test(clean)) return 'mfgYear';
    if (/^(class|vehicleclass|type|category)/.test(clean)) return 'vehicleClass';
    if (/^(gvw|weight|gvwkg|grossweight)/.test(clean)) return 'gvwKg';
    if (/^(seating|seats|capacity|passengers)/.test(clean)) return 'seatingCapacity';
    if (/^(exshowroom|price|invoice|cost|idv)/.test(clean)) return 'exShowroomPrice';
    if (/^(zone|rtozone)/.test(clean)) return 'zone';
    if (/^(ncb|bonus|ncbpercent)/.test(clean)) return 'ncbPercent';
    return clean;
  };

  // Deterministic Statutory IDV Depreciation (AIMT GR.8)
  const calculateQuickIdv = (exShowroom: number, mfgYear: number): number => {
    const currentYear = 2026;
    const ageYears = Math.max(0, currentYear - mfgYear);
    let depRate = 0.50;
    if (ageYears === 0) depRate = 0.05;
    else if (ageYears === 1) depRate = 0.15;
    else if (ageYears === 2) depRate = 0.20;
    else if (ageYears === 3) depRate = 0.30;
    else if (ageYears === 4) depRate = 0.40;
    else if (ageYears >= 5) depRate = 0.50;
    return Math.round(exShowroom * (1 - depRate));
  };

  // Deterministic Statutory TP Lookup for Commercial Vehicles
  const calculateQuickTp = (vClass: string, gvw?: number, seats?: number): number => {
    if (vClass === 'gcv') {
      const weight = gvw || 12000;
      if (weight <= 7500) return 16049;
      if (weight <= 12000) return 27486;
      if (weight <= 20000) return 35313;
      if (weight <= 40000) return 44242;
      return 45512;
    }
    if (vClass === 'pcv') {
      const s = seats || 20;
      if (s <= 6) return 14213;
      if (s <= 18) return 24190;
      if (s <= 36) return 36875;
      return 44242;
    }
    return 12500; // Misc Digger/Crane
  };

  // Process CSV/TSV File
  const handleFileProcess = (text: string, name: string) => {
    setIsProcessing(true);
    setFileName(name);

    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setIsProcessing(false);
      return;
    }

    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const rawHeaders = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const mappedHeaders = rawHeaders.map(normalizeHeader);

    const rows: ParsedVehicleRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const rawCols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (rawCols.length < 2) continue;

      const recordObj: Record<string, any> = {};
      mappedHeaders.forEach((key, idx) => {
        recordObj[key] = rawCols[idx];
      });

      // Raw fields
      const rawReg = (recordObj.regNo || '').replace(/[\s-]/g, '').toUpperCase();
      const makeModel = recordObj.makeModel || 'Commercial Vehicle';
      const mfgYear = parseInt(recordObj.mfgYear || '2023', 10);
      const rawClass = (recordObj.vehicleClass || 'gcv').toLowerCase();
      const vehicleClass: 'gcv' | 'pcv' | 'misc' =
        rawClass.includes('pcv') || rawClass.includes('bus') || rawClass.includes('cab')
          ? 'pcv'
          : rawClass.includes('misc') || rawClass.includes('crane') || rawClass.includes('jcb')
          ? 'misc'
          : 'gcv';

      const gvwKg = recordObj.gvwKg ? parseFloat(recordObj.gvwKg) : (vehicleClass === 'gcv' ? 16200 : undefined);
      const seatingCapacity = recordObj.seatingCapacity ? parseInt(recordObj.seatingCapacity, 10) : (vehicleClass === 'pcv' ? 32 : undefined);
      const exShowroomPrice = parseFloat(recordObj.exShowroomPrice || '2500000');
      const rawZone = (recordObj.zone || 'Zone A').trim();
      const zone: 'Zone A' | 'Zone B' | 'Zone C' =
        rawZone.toUpperCase().includes('B') ? 'Zone B' : rawZone.toUpperCase().includes('C') ? 'Zone C' : 'Zone A';
      const ncbPercent = parseFloat(recordObj.ncbPercent || '20');

      // Validation
      const errors: string[] = [];
      if (!rawReg || !INDIAN_REG_REGEX.test(rawReg)) {
        errors.push(`Invalid Reg No format ('${rawReg}'). Expected e.g. MH12AB1234.`);
      }
      if (isNaN(mfgYear) || mfgYear < 1990 || mfgYear > 2026) {
        errors.push(`Invalid Mfg Year (${mfgYear}).`);
      }
      if (isNaN(exShowroomPrice) || exShowroomPrice <= 0) {
        errors.push('Ex-showroom price must be > 0.');
      }
      if (vehicleClass === 'gcv' && (!gvwKg || gvwKg <= 0)) {
        errors.push('Gross Vehicle Weight (GVW) required for GCV.');
      }

      // Calculations
      const calculatedIdv = calculateQuickIdv(exShowroomPrice, mfgYear);
      const baseOdRate = zone === 'Zone A' ? 0.0165 : zone === 'Zone B' ? 0.0155 : 0.0145;
      const grossOd = calculatedIdv * baseOdRate;
      const ncbDiscount = grossOd * (ncbPercent / 100);
      const estimatedOd = Math.round(grossOd - ncbDiscount);
      const statutoryTp = calculateQuickTp(vehicleClass, gvwKg, seatingCapacity);
      const netPremium = estimatedOd + statutoryTp;

      rows.push({
        id: crypto.randomUUID(),
        rowNumber: i,
        regNo: rawReg || `UNKNOWN-${i}`,
        makeModel,
        mfgYear: isNaN(mfgYear) ? 2023 : mfgYear,
        vehicleClass,
        gvwKg,
        seatingCapacity,
        exShowroomPrice: isNaN(exShowroomPrice) ? 0 : exShowroomPrice,
        calculatedIdv,
        zone,
        ncbPercent: isNaN(ncbPercent) ? 0 : ncbPercent,
        estimatedOd,
        statutoryTp,
        netPremium,
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
  const totalIdv = validList.reduce((acc, r) => acc + r.calculatedIdv, 0);
  const totalEstimatedOd = validList.reduce((acc, r) => acc + r.estimatedOd, 0);
  const totalStatutoryTp = validList.reduce((acc, r) => acc + r.statutoryTp, 0);
  const totalNetPremium = totalEstimatedOd + totalStatutoryTp;
  const gstAmount = Math.round(totalNetPremium * 0.18);
  const totalFinalPremium = totalNetPremium + gstAmount;

  const fleetRollup: FleetRollupSummary = {
    totalVehicles: parsedRows.length,
    validVehicles: validList.length,
    invalidVehicles: errorList.length,
    totalIdv,
    totalEstimatedOd,
    totalStatutoryTp,
    totalNetPremium,
    gstAmount,
    totalFinalPremium,
  };

  const visibleRows =
    filterMode === 'valid' ? validList : filterMode === 'errors' ? errorList : parsedRows;

  const handleDownloadSample = () => {
    const sampleCSV = `RegNo,MakeModel,MfgYear,Class,GVW,Seating,ExShowroom,Zone,NCB
MH12AB1234,Tata Signa 4825.TK,2023,GCV,47500,,3850000,Zone A,25
DL01EA9988,Ashok Leyland 2820,2022,GCV,28000,,3200000,Zone A,35
KA05MN4321,BharatBenz 1923C,2024,GCV,18500,,2650000,Zone B,20
HR26DQ5555,Eicher Pro 3015,2021,GCV,15000,,2100000,Zone B,45
MH04JK7711,Tata Starbus Ultra,2023,PCV,,36,3400000,Zone A,20
GJ01XX9090,JCB 3DX Super,2022,Misc,8000,,3100000,Zone C,0`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qoutely_commercial_fleet_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Bulk Fleet Schedule Ingestion</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                  CSV / Excel Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Upload commercial vehicle schedule for automatic IDV depreciation and IRDAI TP rating.
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
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
              <Upload className="w-10 h-10 mx-auto text-blue-500 mb-3 animate-bounce" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Drag and drop your fleet schedule (.csv) here
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supports standard headers: RegNo, MakeModel, MfgYear, Class, GVW, Seating, ExShowroom, Zone, NCB
              </p>

              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Browse Computer
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Fleet Rollup Summary Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60">
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase">
                    Fleet Vehicles
                  </span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {validList.length}{' '}
                    <span className="text-xs font-normal text-slate-500">/ {parsedRows.length} valid</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Fleet IDV</span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    ₹ {formatNumberINR(totalIdv)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Net OD + Statutory TP</span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    ₹ {formatNumberINR(totalNetPremium)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                    Final Fleet Premium (Inc. 18% GST)
                  </span>
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                    ₹ {formatNumberINR(totalFinalPremium)}
                  </div>
                </div>
              </div>

              {/* Data Table Filter Controls */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      filterMode === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    All ({parsedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('valid')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      filterMode === 'valid'
                        ? 'bg-emerald-600 text-white'
                        : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                  >
                    Valid ({validList.length})
                  </button>
                  {errorList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterMode('errors')}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        filterMode === 'errors'
                          ? 'bg-red-600 text-white'
                          : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                      }`}
                    >
                      Action Required ({errorList.length})
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setFileName(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Upload different file</span>
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Reg No</th>
                      <th className="py-2.5 px-3">Make / Model</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Mfg Year</th>
                      <th className="py-2.5 px-3 text-right">Depreciated IDV</th>
                      <th className="py-2.5 px-3 text-right">Net Premium</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {visibleRows.map((row) => (
                      <tr
                        key={row.id}
                        className={row.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-red-50/40 dark:bg-red-950/20'}
                      >
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-sans font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Valid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 font-sans font-semibold text-[11px]" title={row.validationErrors.join(' ')}>
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Error</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                          {row.regNo}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300">
                          {row.makeModel}
                        </td>
                        <td className="py-2 px-3 font-sans uppercase text-[10px] text-slate-500">
                          {row.vehicleClass}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                          {row.mfgYear}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-900 dark:text-slate-100 font-semibold">
                          ₹ {formatNumberINR(row.calculatedIdv)}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                          ₹ {formatNumberINR(row.netPremium)}
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
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Cancel
          </button>

          {parsedRows.length > 0 && (
            <button
              type="button"
              disabled={validList.length === 0}
              onClick={() => {
                onApplyFleet(validList, fleetRollup);
                onClose();
              }}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <span>Apply {validList.length} Vehicles to Studio</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
