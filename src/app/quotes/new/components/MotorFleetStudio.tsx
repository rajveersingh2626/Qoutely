'use client';

import React, { useState, useMemo } from 'react';
import {
  Car,
  Truck,
  Bus,
  ShieldCheck,
  FileSpreadsheet,
  Coins,
  Check,
  Download,
  Save,
} from 'lucide-react';
import { formatNumberINR, formatINRWithDecimals } from '@/lib/calculator';
import { BulkFleetUploader, ParsedVehicleRecord, FleetRollupSummary } from '../uploaders/BulkFleetUploader';
import { downloadMotorFleetQuotePDF } from '@/lib/pdf/motor-fleet-pdf';
import { useWorkspace } from '@/context/WorkspaceContext';

interface MotorFleetStudioProps {
  clientInfo: {
    clientName: string;
    clientGst: string;
    clientAddress: string;
    hypothecationBank?: string;
  };
  onClientInfoChange: (field: string, value: string) => void;
  onSaveQuote: (quoteData: any) => Promise<void>;
  isSubmitting?: boolean;
}

export const MotorFleetStudio: React.FC<MotorFleetStudioProps> = ({
  clientInfo,
  onClientInfoChange,
  onSaveQuote,
  isSubmitting = false,
}) => {
  const { currentWorkspace } = useWorkspace();

  // Mode: Single Vehicle vs Fleet Roster
  const [quoteMode, setQuoteMode] = useState<'single' | 'fleet'>('single');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [fleetVehicles, setFleetVehicles] = useState<ParsedVehicleRecord[]>([]);
  const [fleetSummary, setFleetSummary] = useState<FleetRollupSummary | null>(null);

  // Single Vehicle State
  const [regNo, setRegNo] = useState('MH12AB1234');
  const [makeModel, setMakeModel] = useState('Tata Signa 4825.TK Heavy Truck');
  const [vehicleClass, setVehicleClass] = useState<'gcv' | 'pcv' | 'misc'>('gcv');
  const [mfgYear, setMfgYear] = useState(2023);
  const [exShowroomPrice, setExShowroomPrice] = useState(3850000);
  const [accessoriesIdv, setAccessoriesIdv] = useState(50000);
  const [cngKitIdv, setCngKitIdv] = useState(0);
  const [zone, setZone] = useState<'Zone A' | 'Zone B' | 'Zone C'>('Zone A');
  const [gvwKg, setGvwKg] = useState(47500);
  const [seatingCapacity, setSeatingCapacity] = useState(2);

  // Underwriting Adjustments & Add-ons (Column 2)
  const [ncbPercent, setNcbPercent] = useState<number>(25);
  const [pastClaimsRatio, setPastClaimsRatio] = useState<'<30' | '30-70' | '70-100' | '>100'>('<30');
  const [fleetDiscountPercent] = useState<number>(0);

  // Commercial IMT Add-on Suite
  const [imt23Opted, setImt23Opted] = useState(true); // Lamps, tyres, mudguards (15% on Gross OD)
  const [zeroDepOpted, setZeroDepOpted] = useState(true); // 0.65% on IDV
  const [engineProtectOpted, setEngineProtectOpted] = useState(true); // 0.35% on IDV
  const [consumablesOpted, setConsumablesOpted] = useState(true); // 0.25% on IDV
  const [rtiOpted, setRtiOpted] = useState(false); // Return to invoice (0.40% on IDV)
  const [rsaOpted, setRsaOpted] = useState(true); // Roadside assistance (Flat ₹1,200)

  // Statutory TP Options
  const [paOwnerDriverOpted] = useState(true); // ₹275
  const [paidDriversCount] = useState(1); // IMT 28 (₹50 per driver)

  // --------------------------------------------------------------------------
  // DETERMINISTIC UNDERWRITING MATH
  // --------------------------------------------------------------------------
  const calculation = useMemo(() => {
    if (quoteMode === 'fleet' && fleetSummary) {
      return {
        mode: 'fleet' as const,
        totalIdv: fleetSummary.totalIdv,
        chassisIdv: fleetSummary.totalIdv,
        accessoriesIdv: 0,
        grossOd: fleetSummary.totalEstimatedOd,
        imtAddons: 0,
        ncbDiscount: 0,
        fleetDiscountAmount: 0,
        netOd: fleetSummary.totalEstimatedOd,
        statutoryTp: fleetSummary.totalStatutoryTp,
        cpaAndDrivers: 0,
        netPremium: fleetSummary.totalNetPremium,
        gst: fleetSummary.gstAmount,
        totalFinalPremium: fleetSummary.totalFinalPremium,
      };
    }

    // 1. AIMT GR.8 Age Depreciation
    const currentYear = 2026;
    const ageYears = Math.max(0, currentYear - mfgYear);
    let depFactor = 0.50;
    if (ageYears === 0) depFactor = 0.05;
    else if (ageYears === 1) depFactor = 0.15;
    else if (ageYears === 2) depFactor = 0.20;
    else if (ageYears === 3) depFactor = 0.30;
    else if (ageYears === 4) depFactor = 0.40;
    else if (ageYears >= 5) depFactor = 0.50;

    const chassisIdv = Math.round(exShowroomPrice * (1 - depFactor));
    const totalIdv = chassisIdv + accessoriesIdv + cngKitIdv;

    // 2. Base OD Rate
    const baseOdRate = zone === 'Zone A' ? 0.0165 : zone === 'Zone B' ? 0.0155 : 0.0145;
    const grossOd = Math.round(totalIdv * baseOdRate);

    // 3. IMT Commercial Add-on Endorsements
    const imt23Premium = imt23Opted ? Math.round(grossOd * 0.15) : 0;
    const zeroDepRate = ageYears <= 2 ? 0.0065 : ageYears <= 5 ? 0.0095 : 0.0125;
    const zeroDepPremium = zeroDepOpted ? Math.round(totalIdv * zeroDepRate) : 0;
    const engineProtectPremium = engineProtectOpted ? Math.round(totalIdv * 0.0035) : 0;
    const consumablesPremium = consumablesOpted ? Math.round(totalIdv * 0.0025) : 0;
    const rtiPremium = rtiOpted ? Math.round(totalIdv * 0.0040) : 0;
    const rsaPremium = rsaOpted ? 1200 : 0;

    const totalImtAddons =
      imt23Premium +
      zeroDepPremium +
      engineProtectPremium +
      consumablesPremium +
      rtiPremium +
      rsaPremium;

    // 4. Discounts & Experience Rating
    const ncbDiscount = Math.round(grossOd * (ncbPercent / 100));

    // Past Claims Ratio loading or discount
    let claimsAdjustmentPercent = 0;
    if (pastClaimsRatio === '<30') claimsAdjustmentPercent = -5;
    else if (pastClaimsRatio === '70-100') claimsAdjustmentPercent = 10;
    else if (pastClaimsRatio === '>100') claimsAdjustmentPercent = 25;

    const fleetAdjustment = Math.round(grossOd * ((fleetDiscountPercent - claimsAdjustmentPercent) / 100));
    const netOd = Math.max(1000, grossOd + totalImtAddons - ncbDiscount - fleetAdjustment);

    // 5. Statutory Third-Party (TP) Tariff (Fixed IRDAI Schedule)
    let statutoryTp = 16049;
    if (vehicleClass === 'gcv') {
      if (gvwKg <= 7500) statutoryTp = 16049;
      else if (gvwKg <= 12000) statutoryTp = 27486;
      else if (gvwKg <= 20000) statutoryTp = 35313;
      else if (gvwKg <= 40000) statutoryTp = 44242;
      else statutoryTp = 45512;
    } else if (vehicleClass === 'pcv') {
      if (seatingCapacity <= 6) statutoryTp = 14213;
      else if (seatingCapacity <= 18) statutoryTp = 24190;
      else if (seatingCapacity <= 36) statutoryTp = 36875;
      else statutoryTp = 44242;
    } else {
      statutoryTp = 12500;
    }

    const cpaPremium = paOwnerDriverOpted ? 275 : 0;
    const paidDriverPremium = paidDriversCount * 50;
    const totalTp = statutoryTp + cpaPremium + paidDriverPremium;

    // 6. Net Total & GST
    const netPremium = netOd + totalTp;
    const gst = Math.round(netPremium * 0.18);
    const totalFinalPremium = netPremium + gst;

    return {
      mode: 'single' as const,
      totalIdv,
      chassisIdv,
      accessoriesIdv: accessoriesIdv + cngKitIdv,
      grossOd,
      imtAddons: totalImtAddons,
      imt23Premium,
      zeroDepPremium,
      engineProtectPremium,
      consumablesPremium,
      rtiPremium,
      rsaPremium,
      ncbDiscount,
      fleetDiscountAmount: fleetAdjustment,
      netOd,
      statutoryTp,
      cpaAndDrivers: cpaPremium + paidDriverPremium,
      netPremium,
      gst,
      totalFinalPremium,
    };
  }, [
    quoteMode,
    fleetSummary,
    mfgYear,
    exShowroomPrice,
    accessoriesIdv,
    cngKitIdv,
    zone,
    vehicleClass,
    gvwKg,
    seatingCapacity,
    imt23Opted,
    zeroDepOpted,
    engineProtectOpted,
    consumablesOpted,
    rtiOpted,
    rsaOpted,
    ncbPercent,
    pastClaimsRatio,
    fleetDiscountPercent,
    paOwnerDriverOpted,
    paidDriversCount,
  ]);

  const handleApplyFleetFromUploader = (vehicles: ParsedVehicleRecord[], rollup: FleetRollupSummary) => {
    setFleetVehicles(vehicles);
    setFleetSummary(rollup);
    setQuoteMode('fleet');
  };

  const handleDownloadPDF = () => {
    const motorQuoteData = {
      quote_number: `QTL-MTR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      client_name: clientInfo.clientName || 'Krishna & Company Logistics LLP',
      client_gst: clientInfo.clientGst || '07ALMPA9603N1ZS',
      client_address: clientInfo.clientAddress || 'Shed 12, Transport Nagar, New Delhi',
      hypothecation_bank: clientInfo.hypothecationBank || 'Bank of India',
      quoteMode,
      singleVehicle: {
        regNo,
        makeModel,
        vehicleClass,
        mfgYear,
        gvwKg,
        seatingCapacity,
        totalIdv: calculation.totalIdv,
        zone,
      },
      fleetCount: fleetVehicles.length,
      calculation,
    };

    downloadMotorFleetQuotePDF(motorQuoteData, currentWorkspace);
  };

  const handleSave = async () => {
    const quotePayload = {
      client_name: clientInfo.clientName,
      client_gst: clientInfo.clientGst,
      client_id: 'pending-client',
      lob_category: 'motor' as const,
      insurance_line: 'motor_fleet' as const,
      sum_insured: calculation.totalIdv,
      sum_insured_breakdown: {
        building: 0,
        plant_machinery: 0,
        furniture_fixtures: 0,
        stocks: 0,
        others: calculation.totalIdv,
        total: calculation.totalIdv,
      },
      premium: calculation.netPremium,
      gst_amount: calculation.gst,
      total_premium: calculation.totalFinalPremium,
      policy_rate: calculation.totalIdv > 0 ? (calculation.netPremium / calculation.totalIdv) * 1000 : 0,
      status: 'draft' as const,
      ai_confidence: 0.98,
      calculation_breakdown: {
        lob_category: 'motor' as const,
        insurance_line: 'motor_fleet' as const,
        sum_insured: calculation.totalIdv,
        net_premium: calculation.netPremium,
        gst_rate_percent: 18,
        gst_amount: calculation.gst,
        total_premium: calculation.totalFinalPremium,
        statutory_clauses: [
          'AIMT GR.8 IDV Schedule',
          'IRDAI Gazetted Fixed TP Tariff',
          'IMT 23 Commercial Endorsement',
        ],
        line_specific_breakdown: calculation,
        algorithmic_explainability: [
          { step: 'IDV Calculation', description: 'AIMT GR.8 Statutory Depreciation', value: calculation.totalIdv },
          { step: 'Net OD', description: 'Base OD + IMT Add-ons - NCB', value: calculation.netOd },
          { step: 'Statutory TP', description: 'Gazetted IRDAI TP Tariff', value: calculation.statutoryTp },
          { step: 'Total Final Premium', description: 'Net Premium + 18% GST', value: calculation.totalFinalPremium },
        ],
      },
      risk_details: {
        fleet_mode: quoteMode,
        fleet_size: quoteMode === 'fleet' ? fleetVehicles.length : 1,
        primary_zone: zone,
        vehicle_categories: [vehicleClass === 'misc' ? 'misc_construction' : vehicleClass],
        reg_number: regNo,
        make_model: makeModel,
        manufacturing_year: mfgYear,
        vehicle_class: vehicleClass === 'misc' ? 'misc_construction' : vehicleClass,
        gvw_kg: gvwKg,
        seating_capacity: seatingCapacity,
        ex_showroom_price: exShowroomPrice,
        total_idv: calculation.totalIdv,
        ncb_percentage: ncbPercent,
        selected_imt_endorsements: [
          ...(imt23Opted ? ['IMT 23'] : []),
          ...(zeroDepOpted ? ['Zero Dep'] : []),
          ...(engineProtectOpted ? ['Engine Protect'] : []),
          ...(consumablesOpted ? ['Consumables'] : []),
          ...(rtiOpted ? ['RTI'] : []),
          ...(rsaOpted ? ['RSA'] : []),
        ],
      },
    };

    await onSaveQuote(quotePayload);
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* ====================================================================== */}
      {/* COLUMN 1: Fleet Metadata or Single Vehicle Input (4 Cols) */}
      {/* ====================================================================== */}
      <div className="lg:col-span-4 border-r border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-slate-900 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5" />
              01. Vehicle & Fleet Scope
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
              Commercial Motor Schedule
            </h2>
          </div>

          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setQuoteMode('single')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                quoteMode === 'single'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Single
            </button>
            <button
              type="button"
              onClick={() => setQuoteMode('fleet')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                quoteMode === 'fleet'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Fleet Roster
            </button>
          </div>
        </div>

        {/* Bulk Uploader Trigger Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {fleetVehicles.length > 0 ? `${fleetVehicles.length} Vehicles Ingested` : 'Bulk Fleet Schedule?'}
              </div>
              <div className="text-[11px] text-slate-500">
                {fleetVehicles.length > 0 ? 'Click to replace or view schedule' : 'Import Excel/CSV roster in 1-click'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-800 hover:bg-blue-50 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-2xs transition-colors"
          >
            {fleetVehicles.length > 0 ? 'Edit Fleet' : 'Upload CSV'}
          </button>
        </div>

        {quoteMode === 'single' ? (
          <div className="space-y-4">
            {/* Registration Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Indian Registration Number (RC)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value.toUpperCase().replace(/\s/g, ''))}
                  placeholder="e.g. MH12AB1234"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold tracking-wider uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 font-sans">
                  <Check className="w-3 h-3" />
                  VAHAN Match
                </span>
              </div>
            </div>

            {/* Vehicle Class Tabs */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle Tariff Classification
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'gcv', label: 'GCV (Goods)', icon: Truck },
                  { key: 'pcv', label: 'PCV (Bus/Cab)', icon: Bus },
                  { key: 'misc', label: 'Misc (Cranes)', icon: Car },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = vehicleClass === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setVehicleClass(item.key as any)}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 border transition-colors ${
                        isSel
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Make / Model */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Make & Commercial Model Variant
              </label>
              <input
                type="text"
                value={makeModel}
                onChange={(e) => setMakeModel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Mfg Year & Ex-Showroom Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mfg Year
                </label>
                <select
                  value={mfgYear}
                  onChange={(e) => setMfgYear(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                >
                  {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map((yr) => (
                    <option key={yr} value={yr}>
                      {yr} {yr === 2026 ? '(New)' : `(${2026 - yr}y old)`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ex-Showroom Invoice (₹)
                </label>
                <input
                  type="number"
                  value={exShowroomPrice}
                  onChange={(e) => setExShowroomPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
                />
              </div>
            </div>

            {/* Weight / Seating & Geographic Zone */}
            <div className="grid grid-cols-2 gap-3">
              {vehicleClass === 'gcv' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GVW (kg)
                  </label>
                  <input
                    type="number"
                    value={gvwKg}
                    onChange={(e) => setGvwKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Licensed Seating
                  </label>
                  <input
                    type="number"
                    value={seatingCapacity}
                    onChange={(e) => setSeatingCapacity(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Geographic Zone
                </label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                >
                  <option value="Zone A">Zone A (Metro Cities)</option>
                  <option value="Zone B">Zone B (Urban / Tier-2)</option>
                  <option value="Zone C">Zone C (Rest of India)</option>
                </select>
              </div>
            </div>

            {/* Accessories & Bi-fuel IDV */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Electrical Accessories (₹)
                </label>
                <input
                  type="number"
                  value={accessoriesIdv}
                  onChange={(e) => setAccessoriesIdv(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Bi-Fuel CNG Kit (₹)
                </label>
                <input
                  type="number"
                  value={cngKitIdv}
                  onChange={(e) => setCngKitIdv(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Fleet Mode Summary Info */
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="text-xs font-bold text-slate-900 dark:text-white uppercase mb-2">
                Active Fleet Roster
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {fleetVehicles.length} Vehicles
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Aggregated commercial goods & passenger carriers loaded from bulk schedule.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-blue-400 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
            >
              + Ingest Additional Vehicles / Edit Schedule
            </button>
          </div>
        )}
      </div>

      {/* ====================================================================== */}
      {/* COLUMN 2: IMT Commercial Add-on Selector & Underwriting (4 Cols) */}
      {/* ====================================================================== */}
      <div className="lg:col-span-4 border-r border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-slate-900 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              02. Endorsements & Discounts
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
              IMT Add-on Suite
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 font-semibold">
            AIMT 2002 Compliant
          </span>
        </div>

        {/* Commercial IMT Endorsement Toggles */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Commercial Endorsements
          </label>

          {[
            {
              id: 'imt23',
              label: 'IMT 23: Lamps, Tyres & Mudguards',
              desc: 'Essential for commercial trucks. Covers lamps, tyres, tubes, headlights, mudguards (15% OD loading).',
              checked: imt23Opted,
              setter: setImt23Opted,
            },
            {
              id: 'zeroDep',
              label: 'Zero Depreciation (Bumper to Bumper)',
              desc: 'Waives statutory 50% rubber/plastic and glass wear-and-tear deductions in claims.',
              checked: zeroDepOpted,
              setter: setZeroDepOpted,
            },
            {
              id: 'engineProtect',
              label: 'Engine & Gearbox Protector',
              desc: 'Covers water ingression, hydrostatic lock, and engine seizure due to oil leakage.',
              checked: engineProtectOpted,
              setter: setEngineProtectOpted,
            },
            {
              id: 'consumables',
              label: 'Consumable Expenses Cover',
              desc: 'Covers engine oil, coolant, nuts, bolts, bearings, and grease replaced during accident repairs.',
              checked: consumablesOpted,
              setter: setConsumablesOpted,
            },
            {
              id: 'rti',
              label: 'Return to Invoice (RTI)',
              desc: 'Bridges gap between depreciated IDV and original on-road purchase invoice.',
              checked: rtiOpted,
              setter: setRtiOpted,
            },
            {
              id: 'rsa',
              label: 'Roadside Assistance (RSA 24x7)',
              desc: 'Commercial highway breakdown assistance, battery jumpstart, and flat ₹1,200 commercial towing.',
              checked: rsaOpted,
              setter: setRsaOpted,
            },
          ].map((addon) => (
            <div
              key={addon.id}
              onClick={() => addon.setter(!addon.checked)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                addon.checked
                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={addon.checked}
                  onChange={() => {}}
                  className="mt-0.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    {addon.label}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {addon.desc}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Experience Rating: NCB Ladder */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No Claim Bonus (NCB)
              </label>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                {ncbPercent}%
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {[0, 20, 25, 35, 45, 50].map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setNcbPercent(tier)}
                  className={`py-1.5 rounded-md text-xs font-mono font-semibold transition-colors ${
                    ncbPercent === tier
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {tier}%
                </button>
              ))}
            </div>
          </div>

          {/* Past 3-Year Claim Ratio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Past 3-Year Incurred Claim Ratio (ICR)
            </label>
            <select
              value={pastClaimsRatio}
              onChange={(e) => setPastClaimsRatio(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            >
              <option value="<30">&lt; 30% (Favorable - 5% Feature Discount)</option>
              <option value="30-70">30% to 70% (Standard - Neutral)</option>
              <option value="70-100">70% to 100% (Elevated - +10% Loading)</option>
              <option value=">100">&gt; 100% (Severe Loss - +25% Adverse Loading)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* COLUMN 3: Live Reactive 9-Row Calculation Ledger (4 Cols) */}
      {/* ====================================================================== */}
      <div className="lg:col-span-4 p-4 sm:p-6 overflow-y-auto bg-slate-50/70 dark:bg-slate-950/70 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" />
                03. Slip Ledger
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                Tariff Premium Computation
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-900">
              IRDAI Fixed TP
            </span>
          </div>

          {/* 9-Row Calculation Ledger Card */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3 font-mono text-xs">
            {/* 1. Chassis IDV */}
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="font-sans">1. Vehicle Chassis IDV</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                ₹ {formatNumberINR(calculation.chassisIdv)}
              </span>
            </div>

            {/* 2. Accessories IDV */}
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="font-sans">2. Accessories & Bi-Fuel</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                ₹ {formatNumberINR(calculation.accessoriesIdv)}
              </span>
            </div>

            {/* 3. Total IDV */}
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="font-sans">3. Total Insured Value (IDV)</span>
              <span className="text-blue-600 dark:text-blue-400">
                ₹ {formatNumberINR(calculation.totalIdv)}
              </span>
            </div>

            {/* 4. Gross Base OD */}
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-sans">4. Gross Base OD Premium</span>
              <span>₹ {formatNumberINR(calculation.grossOd)}</span>
            </div>

            {/* 5. IMT Add-on Suite */}
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
              <span className="font-sans">5. IMT Commercial Add-ons</span>
              <span>+ ₹ {formatNumberINR(calculation.imtAddons)}</span>
            </div>

            {/* 6. NCB Discount */}
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="font-sans">6. Less: No Claim Bonus ({ncbPercent}%)</span>
              <span>- ₹ {formatNumberINR(calculation.ncbDiscount)}</span>
            </div>

            {/* 7. Net OD Premium */}
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="font-sans">7. Net Own Damage (OD)</span>
              <span>₹ {formatNumberINR(calculation.netOd)}</span>
            </div>

            {/* 8. Statutory Third Party (TP) */}
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-sans">8. Statutory IRDAI TP Tariff</span>
              <span>₹ {formatNumberINR(calculation.statutoryTp)}</span>
            </div>

            {/* 9. CPA & Paid Drivers */}
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="font-sans">9. Mandatory CPA & Drivers</span>
              <span>₹ {formatNumberINR(calculation.cpaAndDrivers)}</span>
            </div>

            {/* Net Motor Total */}
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="font-sans">Subtotal Net Premium</span>
              <span>₹ {formatINRWithDecimals(calculation.netPremium)}</span>
            </div>

            {/* GST @ 18% */}
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="font-sans">Goods & Services Tax (18%)</span>
              <span>₹ {formatINRWithDecimals(calculation.gst)}</span>
            </div>

            {/* TOTAL PAYABLE */}
            <div className="flex items-center justify-between font-black text-sm text-emerald-600 dark:text-emerald-400 pt-2 border-t-2 border-slate-900 dark:border-slate-700">
              <span className="font-sans uppercase">Total Final Premium</span>
              <span className="text-base">₹ {formatINRWithDecimals(calculation.totalFinalPremium)}</span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Generate Commercial Motor Quote Slip (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving Quote...' : 'Save Quote to Workspace'}</span>
          </button>
        </div>
      </div>

      {/* Bulk Uploader Modal */}
      <BulkFleetUploader
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onApplyFleet={handleApplyFleetFromUploader}
      />
    </div>
  );
};
