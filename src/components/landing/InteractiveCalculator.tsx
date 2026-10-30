'use client';

import React, { useState, useMemo } from 'react';
import { calculateCommercialPremium } from '@/lib/calculator';
import { Sliders, Zap, CheckCircle2 } from 'lucide-react';
import styles from './InteractiveCalculator.module.css';

export const InteractiveCalculator: React.FC = () => {
  const [occupancyCode, setOccupancyCode] = useState('4002');
  const [eqZone, setEqZone] = useState('Zone 2');
  const [sumInsuredLakhs, setSumInsuredLakhs] = useState<number>(50); // ₹50 Lakhs (0.5 Cr)
  const [floaterOpted, setFloaterOpted] = useState(false);
  const [fireHydrant, setFireHydrant] = useState(true);
  const [cctvSecurity, setCctvSecurity] = useState(true);

  // Compute breakdown using the Capital Brokers AIFT / IIB Engine
  const breakdown = useMemo(() => {
    const totalSi = sumInsuredLakhs * 100000;
    const bld = totalSi * 0.4;
    const pm = totalSi * 0.3;
    const ff = totalSi * 0.1;
    const st = totalSi * 0.15;
    const oth = totalSi * 0.05;

    return calculateCommercialPremium({
      occupancy_code: occupancyCode,
      sum_insured: {
        building: bld,
        plant_machinery: pm,
        furniture_fixtures: ff,
        stocks: st,
        others: oth,
        total: totalSi,
      },
      eq_zone: eqZone,
      floater_opted: floaterOpted,
      feature_discounts: {
        fire_hydrant_sprinkler: fireHydrant,
        high_security_cctv: cctvSecurity,
        past_claims_ratio: '<=70',
      },
      discretionary_discount_percent: 10,
    });
  }, [occupancyCode, eqZone, sumInsuredLakhs, floaterOpted, fireHydrant, cctvSecurity]);

  return (
    <div className={styles.calculatorCard}>
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Statutory Tariff Calculator</h3>
            <p className="text-[11px] text-slate-500">Based on IIB Loss Cost &amp; Capital Brokers AIFT Engine</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Deterministic
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Input Parameters */}
        <div className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Occupancy (IIB Schedule 3)
            </label>
            <select
              value={occupancyCode}
              onChange={(e) => setOccupancyCode(e.target.value)}
              className={styles.inputField}
            >
              <option value="4002">4002 - Storage of Category I Hazardous Goods</option>
              <option value="1007">1007 - Office Premises / Meeting Rooms</option>
              <option value="2001">2001 - Abrasive Manufacturing</option>
              <option value="2002">2002 - Aerated Water Factories</option>
              <option value="1005">1005 - Schools / Colleges</option>
              <option value="1006">1006 - Hospitals &amp; Diagnostic Clinics</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Earthquake Zone
              </label>
              <select
                value={eqZone}
                onChange={(e) => setEqZone(e.target.value)}
                className={styles.inputField}
              >
                <option value="Zone 1">Zone 1 (High Risk)</option>
                <option value="Zone 2">Zone 2 (Moderate-High)</option>
                <option value="Zone 3">Zone 3 (Moderate)</option>
                <option value="Zone 4">Zone 4 (Low Risk)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sum Insured (₹ Lakhs)
              </label>
              <input
                type="number"
                min="5"
                max="5000"
                step="5"
                value={sumInsuredLakhs}
                onChange={(e) => setSumInsuredLakhs(Math.max(1, Number(e.target.value)))}
                className={styles.inputField}
              />
            </div>
          </div>

          {/* Feature Discount Toggles */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className={styles.toggleLabel}>
              <span>Fire Hydrant (-10%)</span>
              <input
                type="checkbox"
                checked={fireHydrant}
                onChange={(e) => setFireHydrant(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>
            <label className={styles.toggleLabel}>
              <span>Floater (+10%)</span>
              <input
                type="checkbox"
                checked={floaterOpted}
                onChange={(e) => setFloaterOpted(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>
          </div>
        </div>

        {/* Live Statutory Calculation Result */}
        <div className={styles.resultBox}>
          <div className="flex items-center justify-between mb-3 text-xs font-semibold text-emerald-950">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              Statutory Premium Output
            </span>
            <span className="font-mono text-[11px] text-emerald-800">
              Product: {breakdown.product_type}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div className="p-2 rounded-lg bg-white/80 border border-emerald-500/15">
              <div className="text-[10px] text-slate-500">Base Policy Rate</div>
              <div className="font-mono font-bold text-slate-900">
                {breakdown.final_policy_rate_per_mille.toFixed(4)}‰
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white/80 border border-emerald-500/15">
              <div className="text-[10px] text-slate-500">Net Premium</div>
              <div className="font-mono font-bold text-slate-900">
                ₹{Math.round(breakdown.net_premium).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="border-t border-emerald-500/20 pt-2.5 flex items-baseline justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-900">Total with 18% GST</div>
              <div className="text-xl font-black text-emerald-950 font-mono">
                ₹{Math.round(breakdown.total_premium).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3" />
                IIB Schedule 3 Verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCalculator;
