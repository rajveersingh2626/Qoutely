'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  Heart,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import { formatNumberINR } from '@/lib/calculator';

export interface ParsedCensusMember {
  id: string;
  rowNumber: number;
  employeeId: string;
  name: string;
  age: number;
  dob?: string;
  gender: 'M' | 'F' | 'O';
  relationship: 'self' | 'spouse' | 'child' | 'parent';
  rawRelationship: string;
  monthlySalary?: number;
  sumInsured?: number;
  ageBand: 'age_0_25' | 'age_26_35' | 'age_36_45' | 'age_46_55' | 'age_56_65' | 'age_66_75' | 'age_76_plus';
  isValid: boolean;
  validationErrors: string[];
}

export interface CensusRollupSummary {
  totalLives: number;
  employeeCount: number;
  dependentCount: number;
  spouseCount: number;
  childCount: number;
  parentCount: number;
  invalidCount: number;
  totalMonthlyWageRoll: number;
  totalAnnualWageRoll: number;
  ageBands: {
    age_0_25: number;
    age_26_35: number;
    age_36_45: number;
    age_46_55: number;
    age_56_65: number;
    age_66_75: number;
    age_76_plus: number;
  };
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
  averageAge: number;
  inferredFamilyStructure: '1+0 (Employee Only)' | '1+3 (Spouse + 2 Children)' | '1+5 (Spouse + 2 Children + 2 Parents)' | 'Custom Floater';
}

export interface EmployeeCensusUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCensus: (members: ParsedCensusMember[], rollup: CensusRollupSummary) => void;
  initialSumInsured?: number;
}

export const EmployeeCensusUploader: React.FC<EmployeeCensusUploaderProps> = ({
  isOpen,
  onClose,
  onApplyCensus,
  initialSumInsured = 500000,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedCensusMember[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'employees' | 'dependents' | 'errors'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Header normalization map
  const normalizeHeader = (raw: string): string => {
    const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (/^(empid|employeeid|employeecode|empcode|staffno|staffid|id|code|badgeno|srno)$/.test(clean)) return 'employee_id';
    if (/^(name|employeename|empname|membername|insuredname|beneficiaryname|fullname)$/.test(clean)) return 'name';
    if (/^(age|years|dob|dateofbirth|birthdate|birth_date|date_of_birth)$/.test(clean)) return 'age_or_dob';
    if (/^(gender|sex|gen)$/.test(clean)) return 'gender';
    if (/^(relation|relationship|rel|dependenttype|familyrelation|membertype)$/.test(clean)) return 'relationship';
    if (/^(salary|monthlysalary|grosswage|monthlywage|wage|grosssalary|wages|ctc|monthlyctc|basicwage)$/.test(clean)) return 'monthly_salary';
    if (/^(suminsured|si|coverageamount|cover|coverage|basesi|benefitsi)$/.test(clean)) return 'sum_insured';
    return clean;
  };

  // Parse age or DOB (assumes current operational underwriting year = 2026)
  const parseAgeOrDob = (raw: string, currentYear: number = 2026): { age: number; dob?: string } => {
    if (!raw) return { age: -1 };
    const cleaned = raw.trim();
    if (/^\d{1,3}$/.test(cleaned)) {
      const a = parseInt(cleaned, 10);
      return { age: a };
    }
    const yearMatch = cleaned.match(/\b(19\d{2}|20[0-2]\d)\b/);
    if (yearMatch) {
      const birthYear = parseInt(yearMatch[1], 10);
      return { age: Math.max(0, currentYear - birthYear), dob: cleaned };
    }
    const parsedDate = new Date(cleaned);
    if (!isNaN(parsedDate.getTime())) {
      const birthYear = parsedDate.getFullYear();
      if (birthYear >= 1900 && birthYear <= currentYear) {
        return { age: currentYear - birthYear, dob: cleaned };
      }
    }
    return { age: -1, dob: cleaned };
  };

  // Gender normalization
  const normalizeGender = (raw?: string): 'M' | 'F' | 'O' => {
    if (!raw) return 'M';
    const c = raw.trim().toLowerCase();
    if (/^(m|male|man|boy)$/.test(c)) return 'M';
    if (/^(f|female|woman|girl)$/.test(c)) return 'F';
    return 'O';
  };

  // Relationship normalization
  const normalizeRelationship = (raw?: string): {
    normalized: 'self' | 'spouse' | 'child' | 'parent' | 'invalid';
    raw: string;
  } => {
    if (!raw) return { normalized: 'invalid', raw: '' };
    const c = raw.trim().toLowerCase();
    if (/^(self|employee|emp|primary|staff|worker|member)$/.test(c)) {
      return { normalized: 'self', raw: c };
    }
    if (/^(spouse|wife|husband|partner)$/.test(c)) {
      return { normalized: 'spouse', raw: c };
    }
    if (/^(child|son|daughter|kid|baby|infant|children)$/.test(c)) {
      return { normalized: 'child', raw: c };
    }
    if (/^(parent|father|mother|dad|mom|fatherinlaw|motherinlaw|parentinlaw)$/.test(c)) {
      return { normalized: 'parent', raw: c };
    }
    return { normalized: 'invalid', raw: c };
  };

  // Age band assignment
  const getAgeBand = (age: number): ParsedCensusMember['ageBand'] => {
    if (age <= 25) return 'age_0_25';
    if (age <= 35) return 'age_26_35';
    if (age <= 45) return 'age_36_45';
    if (age <= 55) return 'age_46_55';
    if (age <= 65) return 'age_56_65';
    if (age <= 75) return 'age_66_75';
    return 'age_76_plus';
  };

  // Robust line parser supporting quotes and commas/tabs
  const parseCSVLine = (text: string, delimiter: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  // Process text file content
  const processCensusText = (text: string, name: string) => {
    setIsProcessing(true);
    setFileName(name);

    setTimeout(() => {
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setIsProcessing(false);
        return;
      }

      // Detect delimiter
      const firstLine = lines[0];
      const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

      const rawHeaders = parseCSVLine(lines[0], delimiter);
      const headers = rawHeaders.map(normalizeHeader);

      const rows: ParsedCensusMember[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i], delimiter);
        if (values.length < 2 || values.every((v) => !v)) continue;

        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });

        const empId = rowObj['employee_id'] || `EMP-${i.toString().padStart(4, '0')}`;
        const memberName = rowObj['name'] || `Member ${i}`;
        const ageParsed = parseAgeOrDob(rowObj['age_or_dob'] || '');
        const gender = normalizeGender(rowObj['gender']);
        const relParsed = normalizeRelationship(rowObj['relationship']);

        const salaryStr = (rowObj['monthly_salary'] || '').replace(/[^0-9.]/g, '');
        const monthlySalary = salaryStr ? parseFloat(salaryStr) : undefined;

        const siStr = (rowObj['sum_insured'] || '').replace(/[^0-9.]/g, '');
        const sumInsured = siStr ? parseFloat(siStr) : initialSumInsured;

        const validationErrors: string[] = [];

        if (ageParsed.age < 0 || ageParsed.age > 100) {
          validationErrors.push('Invalid age (must be between 0 and 100 years)');
        }
        if (relParsed.normalized === 'invalid') {
          validationErrors.push(`Invalid relationship: "${relParsed.raw}". Expected self, spouse, child, or parent`);
        }
        if (!empId.trim()) {
          validationErrors.push('Employee ID is required');
        }
        if (!memberName.trim()) {
          validationErrors.push('Member name is required');
        }

        const isValid = validationErrors.length === 0;
        const normalizedRel = relParsed.normalized === 'invalid' ? 'self' : relParsed.normalized;
        const safeAge = ageParsed.age >= 0 ? ageParsed.age : 30;

        rows.push({
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `row-${i}-${Date.now()}`,
          rowNumber: i,
          employeeId: empId,
          name: memberName,
          age: safeAge,
          dob: ageParsed.dob,
          gender,
          relationship: normalizedRel,
          rawRelationship: relParsed.raw,
          monthlySalary: normalizedRel === 'self' ? monthlySalary : undefined,
          sumInsured,
          ageBand: getAgeBand(safeAge),
          isValid,
          validationErrors,
        });
      }

      setParsedRows(rows);
      setIsProcessing(false);
    }, 150);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processCensusText(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processCensusText(content, file.name);
    };
    reader.readAsText(file);
  };

  // Rollup metrics
  const validList = parsedRows.filter((r) => r.isValid);
  const errorList = parsedRows.filter((r) => !r.isValid);
  const employeeList = validList.filter((r) => r.relationship === 'self');
  const dependentList = validList.filter((r) => r.relationship !== 'self');
  const spouseList = validList.filter((r) => r.relationship === 'spouse');
  const childList = validList.filter((r) => r.relationship === 'child');
  const parentList = validList.filter((r) => r.relationship === 'parent');

  const totalMonthlyWageRoll = employeeList.reduce((acc, cur) => acc + (cur.monthlySalary || 0), 0);
  const totalAnnualWageRoll = totalMonthlyWageRoll * 12;

  const ageBands = {
    age_0_25: validList.filter((r) => r.ageBand === 'age_0_25').length,
    age_26_35: validList.filter((r) => r.ageBand === 'age_26_35').length,
    age_36_45: validList.filter((r) => r.ageBand === 'age_36_45').length,
    age_46_55: validList.filter((r) => r.ageBand === 'age_46_55').length,
    age_56_65: validList.filter((r) => r.ageBand === 'age_56_65').length,
    age_66_75: validList.filter((r) => r.ageBand === 'age_66_75').length,
    age_76_plus: validList.filter((r) => r.ageBand === 'age_76_plus').length,
  };

  const genderDistribution = {
    male: validList.filter((r) => r.gender === 'M').length,
    female: validList.filter((r) => r.gender === 'F').length,
    other: validList.filter((r) => r.gender === 'O').length,
  };

  const averageAge =
    validList.length > 0
      ? Math.round((validList.reduce((acc, cur) => acc + cur.age, 0) / validList.length) * 10) / 10
      : 0;

  let inferredFamilyStructure: CensusRollupSummary['inferredFamilyStructure'] = '1+0 (Employee Only)';
  if (parentList.length > 0) {
    inferredFamilyStructure = '1+5 (Spouse + 2 Children + 2 Parents)';
  } else if (spouseList.length > 0 || childList.length > 0) {
    inferredFamilyStructure = '1+3 (Spouse + 2 Children)';
  } else if (dependentList.length > 0) {
    inferredFamilyStructure = 'Custom Floater';
  }

  const rollup: CensusRollupSummary = {
    totalLives: validList.length,
    employeeCount: employeeList.length,
    dependentCount: dependentList.length,
    spouseCount: spouseList.length,
    childCount: childList.length,
    parentCount: parentList.length,
    invalidCount: errorList.length,
    totalMonthlyWageRoll,
    totalAnnualWageRoll,
    ageBands,
    genderDistribution,
    averageAge,
    inferredFamilyStructure,
  };

  const handleApply = () => {
    onApplyCensus(parsedRows, rollup);
    onClose();
  };

  // Sample CSV generator
  const downloadSampleCSV = () => {
    const sample = `EmployeeID,Name,DOB_or_Age,Gender,Relationship,MonthlySalary,SumInsured
EMP001,Rajesh Sharma,1988-04-12,M,self,65000,500000
EMP001,Priya Sharma,1991-09-24,F,spouse,,500000
EMP001,Aarav Sharma,2018-02-15,M,child,,500000
EMP001,Sunita Sharma,1962-11-03,F,parent,,500000
EMP002,Sunil Verma,34,M,self,45000,300000
EMP002,Meena Verma,31,F,spouse,,300000
EMP003,Deepak Kumar,27,M,self,35000,300000
EMP004,Ananya Roy,42,F,self,85000,500000
EMP004,Debashis Roy,72,M,parent,,500000
EMP005,Vikram Singh,58,M,self,52000,500000
EMP005,Sarla Singh,56,F,spouse,,500000
EMP006,Rohit Deshmukh,29,M,self,48000,500000
EMP006,Neha Deshmukh,27,F,spouse,,500000
EMP006,Kabir Deshmukh,2,M,child,,500000
EMP007,Pooja Hegde,33,F,self,62000,500000`;

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Corporate_Employee_Census_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const displayedRows =
    filterMode === 'valid'
      ? validList
      : filterMode === 'employees'
      ? employeeList
      : filterMode === 'dependents'
      ? dependentList
      : filterMode === 'errors'
      ? errorList
      : parsedRows;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Corporate Employee Census Ingestion
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold">
                  CSV / Excel Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload corporate employee & dependent roster for demographic age-banding, family floater mapping, and WC wage roll aggregation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {parsedRows.length === 0 ? (
            /* Dropzone view */
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 scale-[0.99]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-700 bg-slate-50/50 dark:bg-slate-950/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="p-4 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mb-4 animate-bounce">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
                  Drag and drop corporate employee census spreadsheet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">
                  Supports comma-delimited (.csv) and tab-delimited (.tsv) files. Auto-detects Employee ID, Full Name, DOB/Age, Gender, Relationship (Self, Spouse, Child, Parent), and Monthly Salary.
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-3.5 py-1.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors">
                    Browse Computer
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadSampleCSV();
                    }}
                    className="text-xs px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download Sample CSV</span>
                  </button>
                </div>
              </div>

              {/* Instructions Callout */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-rose-500" />
                  <span>Required Column Formats</span>
                </div>
                <p>
                  • <strong>Relationship</strong>: <code className="text-rose-600 dark:text-rose-400 font-mono">self</code> for primary employee; <code className="text-rose-600 dark:text-rose-400 font-mono">spouse</code>, <code className="text-rose-600 dark:text-rose-400 font-mono">child</code>, or <code className="text-rose-600 dark:text-rose-400 font-mono">parent</code> for dependents.
                </p>
                <p>
                  • <strong>Age / DOB</strong>: Either completed age in years (e.g. <code className="font-mono">34</code>) or birth date formatted as <code className="font-mono">YYYY-MM-DD</code> or <code className="font-mono">DD/MM/YYYY</code>.
                </p>
                <p>
                  • <strong>Monthly Salary</strong>: Gross wages per employee used for statutory Workmen&apos;s Compensation (EC Act 1923) wage roll calculations.
                </p>
              </div>
            </div>
          ) : (
            /* Ingested View */
            <div className="space-y-5">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Insured Lives</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {validList.length}{' '}
                    <span className="text-xs font-normal text-slate-500">/ {parsedRows.length} rows</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                    <span>{employeeList.length} Employees</span>
                    <span>•</span>
                    <span>{dependentList.length} Dependents</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Family Structure</div>
                  <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                    {spouseList.length}S • {childList.length}C • {parentList.length}P
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 truncate">
                    {inferredFamilyStructure}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Monthly Wage Roll</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    ₹ {formatNumberINR(totalMonthlyWageRoll)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Annual: ₹ {formatNumberINR(totalAnnualWageRoll)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Demographic Profile</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {averageAge} yrs <span className="text-xs font-normal text-slate-500">avg age</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {genderDistribution.male}M / {genderDistribution.female}F
                  </div>
                </div>
              </div>

              {/* Demographic Age Bands Ribbon */}
              <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60">
                <div className="text-xs font-semibold text-rose-900 dark:text-rose-300 mb-2 flex items-center justify-between">
                  <span>GHI Demographic Age-Band Distribution (7 Actuarial Brackets)</span>
                  <span className="text-[11px] font-normal text-rose-700 dark:text-rose-400">
                    Pure risk scales automatically
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">0–25 yrs</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{ageBands.age_0_25}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">26–35 yrs</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{ageBands.age_26_35}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">36–45 yrs</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{ageBands.age_36_45}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">46–55 yrs</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{ageBands.age_46_55}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">56–65 yrs</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{ageBands.age_56_65}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">66–75 yrs</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{ageBands.age_66_75}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">76+ yrs</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{ageBands.age_76_plus}</div>
                  </div>
                </div>
              </div>

              {/* Table Filter Tabs */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
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
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filterMode === 'valid'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Valid ({validList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('employees')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filterMode === 'employees'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Employees ({employeeList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('dependents')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filterMode === 'dependents'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Dependents ({dependentList.length})
                  </button>
                  {errorList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterMode('errors')}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        filterMode === 'errors'
                          ? 'bg-amber-600 text-white'
                          : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
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
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Upload different file</span>
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-850 sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10 text-slate-600 dark:text-slate-400 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Emp ID</th>
                      <th className="py-2.5 px-3">Member Name</th>
                      <th className="py-2.5 px-3">Relation</th>
                      <th className="py-2.5 px-3">Gender / Age</th>
                      <th className="py-2.5 px-3">Age Band</th>
                      <th className="py-2.5 px-3">Monthly Wage</th>
                      <th className="py-2.5 px-3">Sum Insured</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                    {displayedRows.map((m) => (
                      <tr
                        key={m.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                          !m.isValid ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="py-2 px-3">
                          {m.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Valid
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium cursor-help"
                              title={m.validationErrors.join(', ')}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Error
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-medium text-slate-900 dark:text-white">
                          {m.employeeId}
                        </td>
                        <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-medium">
                          {m.name}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              m.relationship === 'self'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                : m.relationship === 'spouse'
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                : m.relationship === 'child'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                            }`}
                          >
                            {m.relationship}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                          {m.gender} • {m.age} yrs
                        </td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                          {m.ageBand.replace('age_', '').replace('_', '–')}
                        </td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-200">
                          {m.monthlySalary ? `₹ ${formatNumberINR(m.monthlySalary)}` : '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-200">
                          {m.sumInsured ? `₹ ${formatNumberINR(m.sumInsured)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 && (
              <span>
                {fileName} • {validList.length} valid / {parsedRows.length} total rows
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={validList.length === 0}
              onClick={handleApply}
              className="text-xs px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-rose-600/30"
            >
              <span>Apply {validList.length} Lives to Benefits Studio</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
