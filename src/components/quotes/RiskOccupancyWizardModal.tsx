'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Building,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Factory,
  FileCheck,
  Flame,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  Package,
  Shield,
  ShieldAlert,
  Sparkles,
  Store,
  Warehouse,
  X,
} from 'lucide-react';
import {
  routeCommercialFireProduct,
  calculateInBuiltCovers,
  ProductRoutingResult,
  InBuiltCoversResult,
} from '@/lib/underwriting-engine';
import { SumInsuredBreakdown } from '@/types/database';

export interface WizardCompletionData {
  operationalClassification: string;
  hasHazardousMaterials: boolean;
  hazardTypes: string[];
  fireLoadAssessment: 'Low' | 'Moderate' | 'High' | 'Severe (Category III)';
  suggestedOccupancyCode: string;
  suggestedOccupancyDescription: string;
  ncrHub: 'okhla' | 'bawana' | 'other';
  dpccConsentNo?: string;
  isFarCompliant?: boolean;
  dfsFireNocNo?: string;
  dfsNocValidityDate?: string;
  hazardousWastePermitExpiry?: string;
  sumInsuredBreakdown: SumInsuredBreakdown;
  routing: ProductRoutingResult;
  inBuiltCovers: InBuiltCoversResult;
}

interface RiskOccupancyWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: WizardCompletionData) => void;
  initialSumInsured?: Partial<SumInsuredBreakdown>;
}

export const RiskOccupancyWizardModal: React.FC<RiskOccupancyWizardModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialSumInsured,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Operational Classification
  const [classification, setClassification] = useState<string>('Manufacturing');

  // Step 2: Hazard & Fire-Load Assessment
  const [hasHazardousMaterials, setHasHazardousMaterials] = useState<boolean>(false);
  const [hazardTypes, setHazardTypes] = useState<string[]>([]);

  // Step 3: NCR Municipal & Environmental Compliance
  const [ncrHub, setNcrHub] = useState<'okhla' | 'bawana' | 'other'>('okhla');
  const [dpccConsentNo, setDpccConsentNo] = useState<string>('DPCC/CTO/2026/8912');
  const [isFarCompliant, setIsFarCompliant] = useState<boolean>(true);
  const [dfsFireNocNo, setDfsFireNocNo] = useState<string>('DFS/HQ/2025/NOC-4419');
  const [dfsNocValidityDate, setDfsNocValidityDate] = useState<string>('2027-03-31');
  const [hazardousWastePermitExpiry, setHazardousWastePermitExpiry] = useState<string>('2026-12-31');

  // Step 4: Asset Valuation Breakdown
  const [buildingVal, setBuildingVal] = useState<number>(initialSumInsured?.building || 15000000);
  const [machineryVal, setMachineryVal] = useState<number>(initialSumInsured?.plant_machinery || 15000000);
  const [furnitureVal, setFurnitureVal] = useState<number>(initialSumInsured?.furniture_fixtures || 2000000);
  const [rawMaterialsVal, setRawMaterialsVal] = useState<number>(
    initialSumInsured?.stocks !== undefined ? Math.round(initialSumInsured.stocks * 0.3) : 3000000
  );
  const [wipVal, setWipVal] = useState<number>(
    initialSumInsured?.stocks !== undefined ? Math.round(initialSumInsured.stocks * 0.2) : 2000000
  );
  const [finishedGoodsVal, setFinishedGoodsVal] = useState<number>(
    initialSumInsured?.stocks !== undefined ? Math.round(initialSumInsured.stocks * 0.5) : 5000000
  );
  const [otherVal, setOtherVal] = useState<number>(initialSumInsured?.others || 0);

  useEffect(() => {
    if (isOpen && initialSumInsured) {
      if (initialSumInsured.building !== undefined) {
        setBuildingVal(initialSumInsured.building);
      }
      if (initialSumInsured.plant_machinery !== undefined) {
        setMachineryVal(initialSumInsured.plant_machinery);
      }
      if (initialSumInsured.furniture_fixtures !== undefined) {
        setFurnitureVal(initialSumInsured.furniture_fixtures);
      }
      if (initialSumInsured.stocks !== undefined) {
        setRawMaterialsVal(Math.round(initialSumInsured.stocks * 0.3));
        setWipVal(Math.round(initialSumInsured.stocks * 0.2));
        setFinishedGoodsVal(Math.round(initialSumInsured.stocks * 0.5));
      }
      if (initialSumInsured.others !== undefined) {
        setOtherVal(initialSumInsured.others);
      }
    }
  }, [isOpen, initialSumInsured]);

  if (!isOpen) return null;

  // Derived Values
  const totalStocksVal = rawMaterialsVal + wipVal + finishedGoodsVal;
  const totalSumInsured = buildingVal + machineryVal + furnitureVal + totalStocksVal + otherVal;

  const currentBreakdown: SumInsuredBreakdown = {
    building: buildingVal,
    plant_machinery: machineryVal,
    furniture_fixtures: furnitureVal,
    stocks: totalStocksVal,
    others: otherVal,
    total: totalSumInsured,
  };

  const routing = routeCommercialFireProduct(totalSumInsured);
  const inBuiltCovers = calculateInBuiltCovers(currentBreakdown);

  // Derive Fire Load
  let fireLoadAssessment: WizardCompletionData['fireLoadAssessment'] = 'Low';
  if (hasHazardousMaterials) {
    if (hazardTypes.length >= 3) {
      fireLoadAssessment = 'Severe (Category III)';
    } else if (hazardTypes.length >= 1) {
      fireLoadAssessment = 'High';
    } else {
      fireLoadAssessment = 'Moderate';
    }
  } else if (classification === 'Storage & Warehousing') {
    fireLoadAssessment = 'Moderate';
  }

  // Derive Suggested Occupancy Code
  let suggestedCode = '1001';
  let suggestedDesc = 'Engineering Workshop & CNC Machine Parts Fabrication';
  if (classification === 'Storage & Warehousing') {
    suggestedCode = hasHazardousMaterials ? '4005' : '4002';
    suggestedDesc = hasHazardousMaterials
      ? 'Godowns / Warehouses storing Hazardous Goods (Cat I/II)'
      : 'General Merchandise & Non-Hazardous Food Goods Godown';
  } else if (classification === 'Commercial Office') {
    suggestedCode = '3001';
    suggestedDesc = 'Offices, IT Suites & Administrative Premises';
  } else if (classification === 'Retail Trade') {
    suggestedCode = '3010';
    suggestedDesc = 'Retail Showrooms & Departmental Merchandise Stores';
  } else if (classification === 'Flatted Factory Complex') {
    suggestedCode = '1088';
    suggestedDesc = 'Flatted Industrial Estate / Multi-Storey Garment Units';
  }

  const handleFinish = () => {
    onComplete({
      operationalClassification: classification,
      hasHazardousMaterials,
      hazardTypes,
      fireLoadAssessment,
      suggestedOccupancyCode: suggestedCode,
      suggestedOccupancyDescription: suggestedDesc,
      ncrHub,
      dpccConsentNo: ncrHub === 'okhla' ? dpccConsentNo : undefined,
      isFarCompliant: ncrHub === 'okhla' ? isFarCompliant : undefined,
      dfsFireNocNo: ncrHub === 'bawana' ? dfsFireNocNo : undefined,
      dfsNocValidityDate: ncrHub === 'bawana' ? dfsNocValidityDate : undefined,
      hazardousWastePermitExpiry: ncrHub === 'bawana' ? hazardousWastePermitExpiry : undefined,
      sumInsuredBreakdown: currentBreakdown,
      routing,
      inBuiltCovers,
    });
    onClose();
  };

  const toggleHazard = (item: string) => {
    setHazardTypes((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* High-Contrast Frosted Glass Surface */}
      <div
        className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all"
        style={{
          background: 'rgba(18, 24, 38, 0.94)',
          backdropFilter: 'blur(20px) saturate(190%)',
          WebkitBackdropFilter: 'blur(20px) saturate(190%)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 20px 50px 0 rgba(0, 0, 0, 0.75)',
          color: '#f4f4f5',
        }}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Intelligent Risk & Occupancy Wizard
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  Step {step} of 4
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic IRDAI underwriting classification (No blind dropdowns)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="px-6 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between text-xs font-medium">
          <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
            <span>Classification</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
            <span>Hazard Assessment</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
            <span>NCR Compliance</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div className={`flex items-center gap-1.5 ${step === 4 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">4</span>
            <span>Valuation</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: Operational Classification */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  What is the primary activity carried out at this risk location?
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Select the closest core operations. This anchors the statutory loss cost and tariff schedule.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'Manufacturing',
                    label: 'Manufacturing & Processing',
                    desc: 'Assembly, machine tooling, automotive components, fabrication, chemical formulation',
                    icon: Factory,
                  },
                  {
                    id: 'Storage & Warehousing',
                    label: 'Storage & Warehousing',
                    desc: 'Goods godowns, FMCG distribution centers, logistics hubs, bulk stock storage',
                    icon: Warehouse,
                  },
                  {
                    id: 'Commercial Office',
                    label: 'Commercial Office',
                    desc: 'IT/ITES software units, corporate headquarters, consulting suites, bank branches',
                    icon: Building2,
                  },
                  {
                    id: 'Retail Trade',
                    label: 'Retail Trade',
                    desc: 'Departmental showrooms, retail outlets, textile bazaars, electronics displays',
                    icon: Store,
                  },
                  {
                    id: 'Flatted Factory Complex',
                    label: 'Flatted Factory Complex',
                    desc: 'Multi-storey industrial units, cluster garment manufacturers, shared industrial sheds',
                    icon: Layers,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = classification === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setClassification(item.id)}
                      className={`min-h-[58px] p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-500/50'
                          : 'border-white/10 bg-white/5 hover:border-white/20 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-white">{item.label}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Hazard & Fire-Load Assessment */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Are hazardous chemicals, solvents, paints, plastics, or flammable materials stored or used on site?
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Answers automatically adjust the statutory fire load classification and risk loadings.
                </p>
              </div>

              {/* Yes / No Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setHasHazardousMaterials(false)}
                  className={`flex-1 py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all min-h-[48px] ${
                    !hasHazardousMaterials
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200 ring-2 ring-emerald-500/40'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>No Flammables / Standard Risk</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHasHazardousMaterials(true)}
                  className={`flex-1 py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all min-h-[48px] ${
                    hasHazardousMaterials
                      ? 'border-amber-500 bg-amber-500/20 text-amber-200 ring-2 ring-amber-500/40'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Yes, Hazardous Materials Present</span>
                </button>
              </div>

              {/* Specific Hazards Checklist */}
              {hasHazardousMaterials && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 animate-fadeIn">
                  <div className="text-xs font-semibold text-amber-300">
                    Select all stored hazardous substances:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      'Paints, Thinners & Industrial Solvents',
                      'Polyurethane Foam & Bulk Plastic Pellets',
                      'Compressed Gas Cylinders (LPG, Acetylene)',
                      'Petroleum Distillates & Fuel Storage',
                      'Corrosive Acids / Chemical Precursors',
                      'Rubber Scrap & Vulcanization Materials',
                    ].map((hazard) => {
                      const isChecked = hazardTypes.includes(hazard);
                      return (
                        <button
                          key={hazard}
                          type="button"
                          onClick={() => toggleHazard(hazard)}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 min-h-[48px] transition-all ${
                            isChecked
                              ? 'border-amber-500 bg-amber-500/20 text-amber-100'
                              : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-[11px] leading-tight">{hazard}</span>
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isChecked ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold' : 'border-slate-500'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Computed Fire Load Display */}
              <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Assessed Statutory Fire Load</div>
                  <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                    {fireLoadAssessment}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        fireLoadAssessment === 'Low'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : fireLoadAssessment === 'Moderate'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {fireLoadAssessment === 'Low' ? 'Category I' : 'Category II/III'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Suggested Tariff Code</div>
                  <div className="text-sm font-mono font-bold text-emerald-400">{suggestedCode}</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: NCR Municipal & Environmental Compliance */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  NCR Industrial Estate & Statutory Compliance Verification
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Enforces municipal DPCC and Delhi Fire Service (DFS) regulations for key industrial clusters.
                </p>
              </div>

              {/* Hub Selector */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'okhla', label: 'Okhla Industrial Area', sub: 'Phases I, II, III' },
                  { id: 'bawana', label: 'Bawana Estate', sub: 'Industrial Relocation' },
                  { id: 'other', label: 'Other NCR Hub', sub: 'Noida / GGN / Mayapuri' },
                ].map((hub) => (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => setNcrHub(hub.id as any)}
                    className={`p-3 rounded-2xl border text-center transition-all min-h-[50px] ${
                      ncrHub === hub.id
                        ? 'border-emerald-500 bg-emerald-500/20 text-white ring-2 ring-emerald-500/40'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-xs font-semibold">{hub.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{hub.sub}</div>
                  </button>
                ))}
              </div>

              {/* Okhla Specific Compliance */}
              {ncrHub === 'okhla' && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <FileCheck className="w-4 h-4" />
                    <span>Okhla DPCC Environmental & FAR Validation</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      DPCC Consent to Operate (CTO) Certificate No.
                    </label>
                    <input
                      type="text"
                      value={dpccConsentNo}
                      onChange={(e) => setDpccConsentNo(e.target.value)}
                      placeholder="e.g. DPCC/CTO/2026/..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/15 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-slate-300 block">
                        Floor Area Ratio (FAR) Compliance
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Building structures conform to DDA/MCD Master Plan limits
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFarCompliant(!isFarCompliant)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border min-h-[48px] flex items-center gap-1.5 ${
                        isFarCompliant
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-red-500/20 border-red-500/40 text-red-300'
                      }`}
                    >
                      {isFarCompliant ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{isFarCompliant ? 'FAR Compliant' : 'Exceeds FAR Limit'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Bawana Specific Compliance */}
              {ncrHub === 'bawana' && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Bawana Delhi Fire Service (DFS) & Waste Permit Verification</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        DFS Fire NOC Registration Number
                      </label>
                      <input
                        type="text"
                        value={dfsFireNocNo}
                        onChange={(e) => setDfsFireNocNo(e.target.value)}
                        placeholder="DFS/HQ/..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/15 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        DFS Fire NOC Expiry Date
                      </label>
                      <input
                        type="date"
                        value={dfsNocValidityDate}
                        onChange={(e) => setDfsNocValidityDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      Hazardous Waste Management Authorization Expiration
                    </label>
                    <input
                      type="date"
                      value={hazardousWastePermitExpiry}
                      onChange={(e) => setHazardousWastePermitExpiry(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {ncrHub === 'other' && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300">
                  Standard municipal trade license and fire safety self-declaration will be attached to the final proposal schedule.
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Asset Valuation Breakdown */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center justify-between">
                  <span>Itemized Asset Valuation (Reinstatement Basis)</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    Total SI: ₹{(totalSumInsured / 10000000).toFixed(2)} Cr
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Enforces Reinstatement Value on structures & machinery; Landed Cost for raw materials, Input Cost for WIP.
                </p>
              </div>

              {/* Dynamic IRDAI Binding Banner */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  routing.product === 'BSUS'
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                    : routing.product === 'BLUS'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                }`}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Auto-Bound Product: {routing.productName}</span>
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">{routing.claimExcessClause}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-white/10 border border-white/20">
                    {routing.product}
                  </span>
                </div>
              </div>

              {/* Asset Valuation Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Building Reinstatement (Incl. Plinth & Foundations)
                  </label>
                  <input
                    type="number"
                    value={buildingVal}
                    onChange={(e) => setBuildingVal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/15 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Plant & Machinery (Reinstatement Value)
                  </label>
                  <input
                    type="number"
                    value={machineryVal}
                    onChange={(e) => setMachineryVal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/15 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Furniture, Fixtures & Electrical Fittings
                  </label>
                  <input
                    type="number"
                    value={furnitureVal}
                    onChange={(e) => setFurnitureVal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/15 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Raw Materials Inventory (Landed Cost)
                  </label>
                  <input
                    type="number"
                    value={rawMaterialsVal}
                    onChange={(e) => setRawMaterialsVal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/15 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Work-in-Progress (Verified Input Cost)
                  </label>
                  <input
                    type="number"
                    value={wipVal}
                    onChange={(e) => setWipVal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/15 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Finished Goods (Contract/Mfg Price)
                  </label>
                  <input
                    type="number"
                    value={finishedGoodsVal}
                    onChange={(e) => setFinishedGoodsVal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/15 text-white font-mono font-bold"
                  />
                </div>
              </div>

              {/* In-Built Cover Automated Summary */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                <div className="font-semibold text-emerald-300 flex items-center justify-between">
                  <span>Automated In-Built BLUS Protections</span>
                  <span className="font-mono">
                    Total: ₹{(inBuiltCovers.totalInBuiltProtectionValueINR / 100000).toFixed(1)} Lakhs
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div>• Additions/Alterations (15%): ₹{(inBuiltCovers.additionsAlterationsINR / 100000).toFixed(1)}L</div>
                  <div>• Temp Removal of Stocks (10%): ₹{(inBuiltCovers.temporaryRemovalOfStocksINR / 100000).toFixed(1)}L</div>
                  <div>• Start-Up Expenses: ₹{(inBuiltCovers.startUpExpensesINR / 100000).toFixed(1)}L</div>
                  <div>• Professional Fees (5%): ₹{(inBuiltCovers.professionalFeesINR / 100000).toFixed(1)}L</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Controls */}
        <div className="p-4 sm:p-5 border-t border-white/10 flex items-center justify-between gap-3 shrink-0 bg-slate-900/60 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2.5 rounded-xl border border-white/15 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all min-h-[48px]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-all min-h-[48px]"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all min-h-[48px]"
            >
              <Check className="w-4 h-4" />
              <span>Apply Classification & Bind Product</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
