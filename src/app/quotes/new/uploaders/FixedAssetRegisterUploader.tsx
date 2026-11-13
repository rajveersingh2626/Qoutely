'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  ShieldAlert,
  ArrowRight,
  Info,
  Building2,
  Cpu,
  Armchair,
  PackageCheck,
} from 'lucide-react';
import { formatNumberINR } from '@/lib/calculator';
import { FarItem, parseFixedAssetRegister } from '@/lib/engines/engineering-engine';

export interface ParsedFarRecord {
  id: string;
  rowNumber: number;
  assetCode: string;
  description: string;
  category: 'building' | 'plant_machinery' | 'furniture_fixtures' | 'stocks';
  bookValue: number;
  currentReplacementValue: number;
  underinsurancePercent: number; // (BV / CRV) * 100
  location?: string;
  isValid: boolean;
  validationErrors: string[];
}

export interface FarRollupSummary {
  totalAssets: number;
  validAssets: number;
  invalidAssets: number;
  buildingCrv: number;
  plantMachineryCrv: number;
  furnitureCrv: number;
  stocksCrv: number;
  totalBookValue: number;
  totalReplacementValue: number;
  underinsuranceRatio: number;
  isSeverelyUnderinsured: boolean;
}

export interface FixedAssetRegisterUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAssets: (items: FarItem[], rollup: FarRollupSummary) => void;
}

export const FixedAssetRegisterUploader: React.FC<FixedAssetRegisterUploaderProps> = ({
  isOpen,
  onClose,
  onApplyAssets,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedFarRecord[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'underinsured' | 'plant' | 'errors'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Header normalizer with strict compound precedence
  const normalizeHeader = (raw: string): string => {
    const clean = raw.toLowerCase().trim().replace(/[^a-z0-9_ ]/g, '').replace(/ +/g, '_');
    
    // 1. Compound replacement values (must precede generic "value" or "cost")
    if (/current_replacement_value|replacement_cost|reinstatement_value|reinstatement_cost|crv|new_replacement_value/.test(clean)) {
      return 'crv';
    }
    // 2. Compound book values / WDV
    if (/book_value|written_down_value|wdv|net_block|carrying_amount|historical_cost/.test(clean)) {
      return 'book_value';
    }
    // 3. Asset Identification
    if (/asset_code|asset_id|tag_no|asset_no|code|barcode|asset_number/.test(clean)) {
      return 'asset_code';
    }
    // 4. Description / Particulars
    if (/description|asset_description|particulars|asset_name|name|item_name/.test(clean)) {
      return 'description';
    }
    // 5. Category / Asset Class
    if (/category|asset_category|asset_type|asset_class|classification/.test(clean)) {
      return 'category';
    }
    // 6. Location / Plant / Department
    if (/location|plant|site|unit|department|cost_center/.test(clean)) {
      return 'location';
    }

    return clean;
  };

  // Category normalizer mapping to canonical FAR categories
  const normalizeCategory = (raw: string): 'building' | 'plant_machinery' | 'furniture_fixtures' | 'stocks' => {
    const val = raw.toLowerCase().trim();
    if (/build|civil|structure|shed|factory|warehouse|office|godown/.test(val)) return 'building';
    if (/furn|fixture|fitout|interior|chair|desk|table|workstation/.test(val)) return 'furniture_fixtures';
    if (/stock|inventory|raw|fg|finished|wip|goods|spares|store/.test(val)) return 'stocks';
    // Default to plant & machinery for industrial equipment
    return 'plant_machinery';
  };

  // Safe numeric parsing stripping commas, currency symbols, and spaces
  const parseCleanNumber = (val: any): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const clean = String(val).replace(/[₹$,\s]/g, '').trim();
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // Process CSV/TSV text
  const handleFileProcess = (text: string, name: string) => {
    setIsProcessing(true);
    setFileName(name);

    setTimeout(() => {
      try {
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        if (lines.length < 2) {
          alert('CSV file must have a header line and at least one data row.');
          setIsProcessing(false);
          return;
        }

        const delimiter = lines[0].includes('\t') ? '\t' : ',';
        const rawHeaders = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());
        const mappedHeaders = rawHeaders.map(normalizeHeader);

        const rows: ParsedFarRecord[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          // Handle quoted cells with commas
          const cells: string[] = [];
          let insideQuotes = false;
          let currentCell = '';

          for (let charIdx = 0; charIdx < line.length; charIdx++) {
            const char = line[charIdx];
            if (char === '"' || char === "'") {
              insideQuotes = !insideQuotes;
            } else if (char === delimiter && !insideQuotes) {
              cells.push(currentCell.replace(/^["']|["']$/g, '').trim());
              currentCell = '';
            } else {
              currentCell += char;
            }
          }
          cells.push(currentCell.replace(/^["']|["']$/g, '').trim());

          const rowData: Record<string, string> = {};
          mappedHeaders.forEach((header, idx) => {
            rowData[header] = cells[idx] || '';
          });

          const assetCode = rowData.asset_code || `AST-${String(i).padStart(4, '0')}`;
          const description = rowData.description || 'Industrial Fixed Asset';
          const category = normalizeCategory(rowData.category || '');
          const bookValue = parseCleanNumber(rowData.book_value);
          const crv = parseCleanNumber(rowData.crv);
          const location = rowData.location || 'Main Works';

          const errors: string[] = [];
          if (!assetCode) errors.push('Missing Asset Identification Code');
          if (crv <= 0 && bookValue <= 0) errors.push('Both Replacement Value and Book Value are zero');
          if (crv < 0) errors.push('Replacement value cannot be negative');

          const finalCrv = crv > 0 ? crv : bookValue * 1.5; // fallback estimation if CRV missing
          const underinsurancePercent = finalCrv > 0 ? Math.round((bookValue / finalCrv) * 100) : 100;

          rows.push({
            id: `far-${i}-${Date.now()}`,
            rowNumber: i,
            assetCode,
            description,
            category,
            bookValue,
            currentReplacementValue: finalCrv,
            underinsurancePercent,
            location,
            isValid: errors.length === 0,
            validationErrors: errors,
          });
        }

        setParsedRows(rows);
      } catch (err: any) {
        console.error('Failed to parse asset register file:', err);
        alert('Could not parse file. Please verify CSV/TSV formatting.');
      } finally {
        setIsProcessing(false);
      }
    }, 150);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleFileProcess(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleFileProcess(text, file.name);
    };
    reader.readAsText(file);
  };

  // Convert valid rows to canonical FarItem
  const canonicalItems: FarItem[] = parsedRows
    .filter((r) => r.isValid)
    .map((r) => ({
      asset_code: r.assetCode,
      category: r.category,
      book_value: r.bookValue,
      current_replacement_value: r.currentReplacementValue,
    }));

  const canonicalRollup = parseFixedAssetRegister(canonicalItems);

  const totalBookValue = parsedRows.filter((r) => r.isValid).reduce((acc, r) => acc + r.bookValue, 0);
  const totalReplacementValue = canonicalRollup.total_crv;
  const underinsuranceRatio = canonicalRollup.underinsurance_ratio;
  const isSeverelyUnderinsured = underinsuranceRatio < 0.70 && parsedRows.length > 0;

  const summary: FarRollupSummary = {
    totalAssets: parsedRows.length,
    validAssets: parsedRows.filter((r) => r.isValid).length,
    invalidAssets: parsedRows.filter((r) => !r.isValid).length,
    buildingCrv: canonicalRollup.building_crv,
    plantMachineryCrv: canonicalRollup.plant_machinery_crv,
    furnitureCrv: canonicalRollup.furniture_crv,
    stocksCrv: canonicalRollup.stocks_crv,
    totalBookValue,
    totalReplacementValue,
    underinsuranceRatio,
    isSeverelyUnderinsured,
  };

  const filteredRows = parsedRows.filter((row) => {
    if (filterMode === 'valid') return row.isValid;
    if (filterMode === 'underinsured') return row.isValid && row.underinsurancePercent < 70;
    if (filterMode === 'plant') return row.isValid && row.category === 'plant_machinery';
    if (filterMode === 'errors') return !row.isValid;
    return true;
  });

  const downloadSampleCsv = () => {
    const csvContent =
      'Asset Code,Description,Category,Location,Book Value (WDV),Current Replacement Value (CRV)\n' +
      'BLD-001,Main Factory Shed & Warehouse,Building,Unit 1 Pune,15000000,45000000\n' +
      'BLD-002,Administrative Office Building,Building,Unit 1 Pune,8000000,20000000\n' +
      'PM-101,CNC 5-Axis Milling Centre,Plant & Machinery,Shopfloor Bay A,4500000,12000000\n' +
      'PM-102,Industrial Steam Boiler 10 TPH,Plant & Machinery,Boiler House,2500000,7500000\n' +
      'PM-103,1500 kVA Substation Transformer,Plant & Machinery,Substation Yard,1800000,4500000\n' +
      'PM-104,Screw Air Compressor 250 CFM,Plant & Machinery,Compressor Room,650000,1800000\n' +
      'FF-201,Executive Office Furniture & Fixtures,Furniture & Fixtures,Admin Block,900000,2200000\n' +
      'STK-301,Raw Material Steel Plates & Billets,Stocks,Raw Material Yard,12000000,12000000\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_fixed_asset_register.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Fixed Asset Register (FAR) Schedule Ingestion
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-700/50">
                  Feature 24
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload commercial asset schedules to extract Current Replacement Values (CRV) and audit underinsurance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500/50 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.tsv,.txt"
              className="hidden"
            />
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {fileName ? fileName : 'Drop Fixed Asset Register CSV/TSV here, or click to browse'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Supports Asset Codes, Categories (Building, Plant & Machinery, Furniture, Stocks), WDV, and Replacement Values
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadSampleCsv();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 rounded-lg border border-amber-200 dark:border-amber-800/60 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Download Sample Asset Register CSV
              </button>
            </div>
          </div>

          {/* Underinsurance Warning Alert Banner */}
          {isSeverelyUnderinsured && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Severe Underinsurance Condition Detected (Ratio: {(underinsuranceRatio * 100).toFixed(0)}%)
                </h4>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-1 leading-relaxed">
                  Historical Book Value (₹{formatNumberINR(totalBookValue)}) represents only{' '}
                  {(underinsuranceRatio * 100).toFixed(0)}% of Current Replacement Value (₹
                  {formatNumberINR(totalReplacementValue)}). Insuring on depreciated book value triggers pro-rata{' '}
                  <strong>Condition of Average deductions</strong> under IRDAI Reinstatement Value policies.
                </p>
              </div>
            </div>
          )}

          {/* Asset Register Rollup Cards */}
          {parsedRows.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Building2 className="w-4 h-4 text-sky-500" />
                  Building CRV
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  ₹{formatNumberINR(summary.buildingCrv)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Cpu className="w-4 h-4 text-amber-500" />
                  Plant & Machinery
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  ₹{formatNumberINR(summary.plantMachineryCrv)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Armchair className="w-4 h-4 text-emerald-500" />
                  Furniture & Fixtures
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  ₹{formatNumberINR(summary.furnitureCrv)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <PackageCheck className="w-4 h-4 text-purple-500" />
                  Total Replacement Value
                </div>
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                  ₹{formatNumberINR(summary.totalReplacementValue)}
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          {parsedRows.length > 0 && (
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
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
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                    filterMode === 'valid'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Valid ({summary.validAssets})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('underinsured')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                    filterMode === 'underinsured'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Underinsured &lt;70%
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('plant')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                    filterMode === 'plant'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Plant &amp; Machinery
                </button>
                {summary.invalidAssets > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterMode('errors')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                      filterMode === 'errors'
                        ? 'bg-red-600 text-white'
                        : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                    }`}
                  >
                    Errors ({summary.invalidAssets})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Table Preview */}
          {parsedRows.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Asset Code</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-right">Book Value (₹)</th>
                    <th className="p-2.5 text-right">Replacement Value (₹)</th>
                    <th className="p-2.5 text-right">BV / CRV %</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                    >
                      <td className="p-2.5 text-slate-400">{row.rowNumber}</td>
                      <td className="p-2.5 font-mono font-medium text-slate-900 dark:text-white">
                        {row.assetCode}
                      </td>
                      <td className="p-2.5 max-w-[200px] truncate" title={row.description}>
                        {row.description}
                      </td>
                      <td className="p-2.5">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px]">
                          {row.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono">₹{formatNumberINR(row.bookValue)}</td>
                      <td className="p-2.5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        ₹{formatNumberINR(row.currentReplacementValue)}
                      </td>
                      <td className="p-2.5 text-right font-mono">
                        <span
                          className={`font-semibold ${
                            row.underinsurancePercent < 70
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {row.underinsurancePercent}%
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        {row.isValid ? (
                          <span className="inline-flex items-center text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-500" title={row.validationErrors.join(', ')}>
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {parsedRows.length > 0 ? (
              <span>
                Ready to apply <strong>{summary.validAssets}</strong> verified asset items (₹
                {formatNumberINR(summary.totalReplacementValue)} CRV)
              </span>
            ) : (
              'Upload CSV or use sample template to proceed'
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parsedRows.length === 0 || summary.validAssets === 0}
              onClick={() => {
                onApplyAssets(canonicalItems, summary);
                onClose();
              }}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-amber-600/20 transition"
            >
              Apply Assets to Studio
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
